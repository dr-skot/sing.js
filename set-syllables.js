regex = {
  vowels: 'AE|EY|AO|AX|IY|EH|IH|AY|IX|AA|UW|UH|UX|OW|AW|OY',
  consonants: 'b|C|d|D|f|g|h|J|k|l|m|n|N|p|r|s|S|t|T|v|w|y|z|Z',
  punctuation: '\\.|!|\\?|,|:',
  stress: '~|_|\\+|=',
};

re = {
    vowels: new RegExp(regex.vowels),
    consonants: new RegExp(regex.consonants),
    stress: new RegExp(regex.stress),
};

shaveDecimals = function(value, numDecimals) {
    var multiplier = Math.pow(10, numDecimals);
    return Math.round(multiplier * value) / multiplier;
}

SetSyllables = {
    VOWEL_SHARE: 0.75, // consonants will cede this much of a crowded note

    parseTuneEntry: function(tuneEntry) {
	var result = {};
	var matches = tuneEntry.match(/([^ ]+) {D ([0-9.]+); P ([^}]+)}/);
	if (!matches || matches.length < 4) return tuneEntry;
	result.phoneme = matches[1];
	result.duration = matches[2];
	result.pitches = matches[3].split(" ");
	for (var i = 0; i < result.pitches.length; i++) {
	    result.pitches[i] = result.pitches[i].split(":");
	}
	return result;
    },

    isParsedPhoneme: function(tuneEntry) {
	return typeof(tuneEntry) == 'object' && 'pitches' in tuneEntry;
    },

    tuneEntryToString: function(tuneEntry) {
	if (!this.isParsedPhoneme(tuneEntry)) return tuneEntry;
	result = tuneEntry.phoneme +
	    " {D " + tuneEntry.duration + "; P";
	for (var i = 0; i < tuneEntry.pitches.length; i++) {
	    result += " " + tuneEntry.pitches[i][0] + ":" + tuneEntry.pitches[i][1];
	}
	result += "}";
	return result;
    },

    setConsonant: function(tuneEntry, pitchFactor, timeFactor) {
	if (typeof(timeFactor) === 'undefined') timeFactor = 1;
	tuneEntry.duration = shaveDecimals(tuneEntry.duration * timeFactor, 1);
	p = tuneEntry.pitches;
	for (var i = 0; i < tuneEntry.pitches.length; i++) {
	    p[i][0] *= pitchFactor;
	    p[i][0] = shaveDecimals(p[i][0], 1);
	}
    },

    setFlatConsonant: function(tuneEntry, pitch, timeFactor) {
	if (typeof(timeFactor) === 'undefined') timeFactor = 1;
	tuneEntry.duration = shaveDecimals(tuneEntry.duration * timeFactor, 1);
	tuneEntry.pitches = [[pitch, 0]];
    },

    setVowel: function(tuneEntry, notes) {
	// get total duration of notes
	var totalDuration = 0;
	for (var i = 0; i < notes.length; i++) {
	    totalDuration += notes[i][1];
	}
	// danger div by zero
	durationFactor = 100.0 / totalDuration;
	p = tuneEntry.pitches;
	orig = [p[0][0], p[p.length-1][0]];
	changed = [notes[0][0], notes[notes.length-1][0]];
	// danger div by zero
	pitchFactors = [changed[0]/orig[0], changed[1]/orig[1]];
	duration = 0;
	p = [];
	for (i = 0; i < notes.length; i++) {
	    var d = duration * durationFactor
	    p.push([notes[i][0], shaveDecimals(d, 1)]);
	    duration += notes[i][1];
	}
	tuneEntry.pitches = p;
	tuneEntry.duration = totalDuration;
	return pitchFactors;
    },

    setPhoneme: function(entry, notes) {
	// get total duration of notes
	var totalDuration = 0;
	for (var i = 0; i < notes.length; i++) {
	    totalDuration += notes[i][1];
	}
	// danger div by zero
	durationFactor = 100.0 / totalDuration;
	p = tuneEntry.pitches;
	duration = 0;
	p = [];
	for (i = 0; i < notes.length; i++) {
	    var d = duration * durationFactor
	    p.push([notes[i][0], shaveDecimals(d, 1)]);
	    duration += notes[i][1];
	}
	tuneEntry.pitches = p;
	tuneEntry.duration = totalDuration;
    },

    getLongestPitch: function(tuneEntry) {
	var longest = 0;
	var pitch = 0;
	var p = tuneEntry.pitches;
	for (var i = 0; i < p.length; i++) {
	    duration = (i == p.length-1 ? tuneEntry.duration : p[i+1][1]) - p[i][1];
	    if (duration > longest) {
		longest = duration;
		pitch = p[i][0];
	    }
	}
	return pitch;
    },

    parseTune: function(tune) {
	tune = tune.split("\n");
	for (var i = 0; i < tune.length; i++) {
	    tune[i] = this.parseTuneEntry(tune[i]); 
	}
	return tune;
    },

    tuneToString: function(tune) {
	for (var i = 0; i < tune.length; i++) {
	    tune[i] = this.tuneEntryToString(tune[i]);
	}
	return tune.join("\n");
    },

    isVowel: function(tuneEntry) {
	if (!this.isParsedPhoneme(tuneEntry)) return false;
	return re.vowels.test(tuneEntry.phoneme);
    },
    
    isConsonant: function(tuneEntry) {
	if (!this.isParsedPhoneme(tuneEntry)) return false;
	return re.consonants.test(tuneEntry.phoneme);
    },

    shareNote: function(note, duration) {
	// duration is total duration of consonants in this note.
	// adjust note to vowel length,
	// return factor by which to multiply consonant durations
	var durationFactor = 1;
	// is vowel getting enough of note?
	if (note[1] - duration < note[1] * this.VOWEL_SHARE) {
	    var vowelShare = note[1] * this.VOWEL_SHARE;
	    var consonantShare = note[1] - vowelShare;
	    note[1] = shaveDecimals(vowelShare, 1); // set vowel duration
	    durationFactor = consonantShare / duration;
	} else {
	    note[1] -= duration;
	}
	return durationFactor;
    },

    setSyllable: function(syl, notes) {
	// make a copy of the notes array
	notes = notes.slice(0)
	for (var i = 0; i < notes.length; i++) {
	    notes[i] = notes[i].slice(0); // copies the array
	}
	var tune = this.parseTune(syl);

	// first pass: find vowel and get consonant durations
	var durations = [0, 0]; // [before vowel, after vowel]
	var beforeVowel = true;
	for (var i = 0; i < tune.length; i++) {
	    if (this.isVowel(tune[i])) {
		vowel = tune[i];
		beforeVowel = false;
	    }
	    else if (this.isConsonant(tune[i])) {
		d = parseFloat(tune[i].duration);
		durations[beforeVowel?0:1] += d;
	    }
	}

	// print("before vowel " + durations[0] + "(" + notes[0][1] + ")");
	// print("after vowel " + durations[1] + "(" + notes[notes.length-1][1] + ")");
 
	// share first and last notes with consonants (and get time factors)
	var timeFactors = [1, 1];
	if (notes.length == 1) {
	    // share same note with both consonant clusters
	    var f = this.shareNote(notes[0], durations[0] + durations[1]);
	    timeFactors = [f, f];
	} else {
	    timeFactors = [
		this.shareNote(notes[0], durations[0]),
		this.shareNote(notes[notes.length-1], durations[1])
	    ];
	}
	// print("time factors " + timeFactors);

	// set vowel and get pitch factors for consonants
	pitchFactors = this.setVowel(vowel, notes);
	// print("pitch factors " + timeFactors);

	 // start with before-vowel factors (will switch at vowel)
	pitchFactor = pitchFactors[0];
	timeFactor = timeFactors[0];
	pitch = notes[0][0];

	// second pass: set consonants
	for (var i = 0; i < tune.length; i++) {
	    if (this.isVowel(tune[i])) {
		// switch to after-vowel factors
		pitchFactor = pitchFactors[1];
		timeFactor = timeFactors[1];
		pitch = notes[notes.length-1][0];
	    }
	    else if (this.isConsonant(tune[i])) {
		//this.setConsonant(tune[i], pitchFactor, timeFactor);
		this.setFlatConsonant(tune[i], pitch, timeFactor);
	    }
	}
	return this.tuneToString(tune);
    },
    
    setSyllables: function(syllables, settings) {
	var result = []
	for (var i = 0; i < syllables.length; i++) {
	    result[i] = this.setSyllable(syllables[i], settings[i % settings.length])
	}
	return result;
    },
};

// TODO deal with punctuation duration

