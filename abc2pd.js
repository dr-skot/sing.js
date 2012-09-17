/**
 * abc2pd.js
 * Converts music in ABC notation into a series of pitch/duration pairs
 */

load("lib/abc_parse.js");

var tools = {
    letterForPitch : function(pitch) {
	return "CDEFGAB".charAt((pitch + 700) % 7);
    },
    symbolForAcc : function(acc) {
	if (acc == 'dbl_flat') return 'bb';
	if (acc == 'flat') return 'b';
	if (acc == 'natural') return '=';
	if (acc == 'sharp') return '#';
	if (acc == 'dbl_sharp') return '##';
	return '';
    },
    accidentalForKey : function(pitch, key) {
	var acc = null;
	var note = this.letterForPitch(pitch).toLowerCase();
	key.accidentals.each(function(value) {
	    if (value.note == note) acc = value.acc;
	});
	return acc;
    },
    accidentalForNote : function(note, key) {
	var pitch = note.pitch;
	var acc = note.accidental;
	if (null == key) acc || null;
	return (acc && acc != "none") ? acc : this.accidentalForKey(pitch, key); 
    },
    // converts name-indexed pitch (C=0 D=1 etc) to halfstep-indexed height (C=0 D=2 E=4 F=5)
    heightForPitch : function(pitch) {
	pitch += 700; // get rid of negative numbers
	var quotient = Math.floor(pitch/7);
	var remainder = pitch % 7;
	var strictHeight = [0, 2, 4, 5, 7, 9, 11][remainder];
	return (quotient * 12 + strictHeight) - 1200;
    },
    frequency : function(height, acc) {
	n = height - 5; // half steps up from A 440
	if ('dbl_flat' == acc) n -= 2;
	if ('flat' == acc) n -= 1;
	if ('sharp' == acc) n += 1;
	if ('dbl_flat' == acc) n += 2;
	return Math.pow(2, n/12) * 440;
    },
    frequencyForNote : function(note, key) {
	var height = this.heightForPitch(note.pitch);
	var acc = this.accidentalForNote(note, key);
	return this.frequency(height, acc);
    },
    millisecondsForNote : function(note, tempo) {
	var bpm = tempo.bpm;
	var beatLength = tempo.duration[0]; // why is this an array?
	var beats = note.duration / beatLength;
	return 60000 * beats/bpm;
    },
    round : function(num) {
	return Math.floor(num * 1000)/1000;
    },
    isCompound : function(meter) {
	return (meter && meter.num && meter.num % 3 == 0);
    },
    printTune : function(abc) {
	var parser = new AbcParse();
	parser.parse(abc);
	var tune = parser.getTune();
	print(JSON.stringify(tune));
    },
};

function abc2pd(abc) {
    var parser = new AbcParse();
    parser.parse(abc);
    var tune = parser.getTune();
    //print(JSON.stringify(tune));
    var key = tune.lines[0].staff[0].key;
    var meter = tune.lines[0].staff[0].meter;
    var tempo = tune.metaText.tempo || { bpm:100, duration:[0.25] };
    var elements = tune.lines[0].staff[0].voices[0];
    var results = [];
    var tying = 0;
    var slurDepth = 0;
    var tupletRatio = 1;
    tune.lines.each(function(line) {
	meter = line.staff[0].meter || meter;
	key = line.staff[0].key || key
        line.staff[0].voices[0].each(function(elem) {
            //console.log(elem);
            if (elem.el_type == "key") key = elem;
            if (elem.el_type == "meter") meter = elem;
            if (elem.el_type == "note") {
		var ms = tools.millisecondsForNote(elem, tempo);
		var freq;
		var symbol;
		
		// adjust length for tuplets
		if (elem.startTriplet) {
                    //print('startTriplet: ' + elem.startTriplet);
                    var n = tools.isCompound(meter) ? 2 : 3;
		    tupletRatios = [1, 1, 3/2, 2/3, 3/4, n/5, 2/6, n/7, 3/8, n/9];
                    tupletRatio = tupletRatios[elem.startTriplet];
                    // (tuplet interpretation according to 
		    // http://www.lesession.co.uk/abc/abc_notation_part2.htm#ets)
		}
		ms *= tupletRatio;
		if (elem.endTriplet) {
                    //print('endTriplet');
                    tupletRatio = 1;
		}
		
		if (elem.rest) {
                    freq = 0;
                    symbol = '%';
		} else {
                    freq = tools.frequencyForNote(elem.pitches[0], key);
                    var letter = tools.letterForPitch(elem.pitches[0].pitch);
                    var acc = tools.accidentalForNote(elem.pitches[0], key);
                    var accSymbol = tools.symbolForAcc(acc);
                    symbol = letter + accSymbol;
                    if (elem.pitches[0].endTie) tying = false;
                    if (elem.pitches[0].startTie) tying = true;
                    if (elem.pitches[0].endSlur) slurDepth -= 1;
                    if (elem.pitches[0].startSlur) slurDepth += 1;
		}
		results.push(tools.round(freq), tools.round(ms));
		if (tying || slurDepth > 0) results.push("TIE");
            }
        });
    });
    if (results[results.length-1] == "TIE") results.pop();
    return results.join(" ");
}

// returns an array of settings
// each setting is an array of notes
// each note is an array like so: [pitch, duration]
function abc2array(abc, tempoFactor, octaveShift, halfStepShift) {
    var tokens = abc2pd(abc).split(" ")
    var result = []
    var i = 0
    var k = -1
    while (i < tokens.length) {
	if (tokens[i] == "TIE") i++
	else k++
	if (!result[k]) result[k] = []
	var note = [tokens[i++], tokens[i++]]
	result[k].push(note)
    }
    if (tempoFactor !== undefined) multiplyTempo(result, tempoFactor)
    if (octaveShift !== undefined) shiftPitch(result, octaveShift, halfStepShift)
    return result
}

// operates on the array of note-settings returned by abc2array
function multiplyTempo(music, factor) {
    music.each(function(setting) { setting.each(function(note) {
	note[1] *= factor
    }) })
}

function shiftPitch(music, octaves, halfSteps) {
    if (halfSteps !== undefined) octaves += halfSteps/12.0
    var factor = Math.pow(2, octaves)
    music.each(function(setting) { setting.each(function(note) {
	note[0] *= factor
    }) })
}


if (arguments.length > 0) {
    var abc = arguments[0];
    print(abc2pd(abc));
}

