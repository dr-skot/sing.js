if (typeof(Sing) === "undefined") Sing = {}

Sing.re = {
    vowels: /AE|EY|AO|AX|IY|EH|IH|AY|IX|AA|UW|UH|UX|OW|AW|OY/,
    consonants: /b|C|d|D|f|g|h|J|k|l|m|n|N|p|r|s|S|t|T|v|w|y|z|Z/,
    punctuation: /\\.|!|\\?|,|:/,
    divider: /~|_|\\+|=/,
};

shaveDecimals = function(value, numDecimals) {
    var multiplier = Math.pow(10, numDecimals);
    return Math.round(multiplier * value) / multiplier;
}

Sing.Split = {

    parseTuneEntries: function(tune) {
	var entries = tune.split("\n")
	for (var i = 0; i < entries.length; i++) {
	    entries[i] = this.parseTuneEntry(entries[i])
	}
	return entries
    },

    parseTuneEntry: function(tuneEntry) {
	var entry = { raw: tuneEntry, duration: 0, pitches: [], sylBreak: false }
	
	// symbol
	entry.symbol = tuneEntry.split(" ")[0]
	
	// duration
	var matches = tuneEntry.match(/{D ([0-9.-]+)/)
	if (matches) entry.duration = parseFloat(matches[1])
	
	// pitches
	matches = tuneEntry.match(/P ([^}]+)}/)
	if (matches) {
	    var pitches = matches[1].split(" ")	
	    for (var i = 0; i < pitches.length; i++) {
		pitches[i] = pitches[i].split(":");
		pitches[i][0] = parseFloat(pitches[i][0])
		pitches[i][1] = parseFloat(pitches[i][1])
	    }
	    entry.pitches = pitches
	}

	// type
	if (Sing.re.vowels.test(entry.symbol))
	    entry.type = "vowel"
	else if (entry.pitches.length > 0)
	    entry.type = "consonant" // any non-vowel with pitch
	else if (entry.duration > 0)
	    entry.type = "pause" // anything with time but no pitch
	else
	    entry.type = "meta" // non-vocal data
	
	entry.toString = function() {
	    if (this.type === "meta") return this.raw
	    var s = this.symbol + " {D " + shaveDecimals(this.duration, 1)
	    if (this.pitches.length > 0) {
		s += "; P"
		for (var i = 0; i < this.pitches.length; i++) {
		    s += " " + shaveDecimals(this.pitches[i][0], 1) + 
			":" + shaveDecimals(this.pitches[i][1], 1)
		}
	    }
	    s += "}"
	    return s
	}

	return entry
    },

    getBreaks: function(symbols) {
	var breaks = [];
	var lastWasConsonant = false;
	var vowelHasBeenSeen = false;
	
	for (var i = 0; i < symbols.length; i++) {
	    breaks[i] = false; // innocent until proven guilty
	    
	    phoneme = symbols[i].split(" ")[0]; // phoneme is 1st token
	    //print("PHONEME: " + phoneme);
	    var isVowel = Sing.re.vowels.test(phoneme);
	    
	    if (vowelHasBeenSeen) { // don't break before we see a vowel
		//print("vowel has been seen")
	
		if (Sing.re.divider.test(phoneme)) {
		    //print("stress: break")
		    breaks[i] = true; // split here
		    vowelHasBeenSeen = false;
		}
		
		else if (isVowel) {
		    //print("is vowel: " + phoneme)
		    if (lastWasConsonant) {
			//print("last was consonant: break at -1")
			breaks[i-1] = true; // keep prior consonant if any
		    }
		    else {
			//print("break on vowel")
			breaks[i] = true; // otherwise break at the vowel
		    }
		}
	    }
	    
	    vowelHasBeenSeen = vowelHasBeenSeen || isVowel;
	    lastWasConsonant = Sing.re.consonants.test(phoneme);
	}
	
	return breaks;
    },
    
    markBreaks: function(entries) {
	var lastWasConsonant = false;
	var vowelHasBeenSeen = false;
	
	for (var i = 0; i < entries.length; i++) {
	    var entry = entries[i]

	    // don't break until we've seen a vowel
	    if (vowelHasBeenSeen) { 
		
		// if the synthesizer marked a syllable break, go with that
		if (Sing.re.divider.test(entry.symbol)) { 
		    entry.sylBreak = true;
		    vowelHasBeenSeen = false;
		}

		// if we hit a vowel break one phoneme back if that was a consonant
		// otherwise break here
		else if (entry.type == "vowel") {
		    if (lastWasConsonant) {
			entries[i-1].sylBreak = true; // keep prior consonant if any
		    }
		    else {
			entry.sylBreak = true; // otherwise break at the vowel
		    }
		}
	    }
	    
	    vowelHasBeenSeen = vowelHasBeenSeen || entry.type == "vowel";
	    lastWasConsonant = entry.type == "consonant"
	}
    },
    
    splitSyllables: function(tune) {
	var symbols = tune.split("\n");
	breaks = this.getBreaks(symbols);
	var syllables = [""];
	var k = 0;
	for (var i = 0; i < symbols.length; i++) {
	    if (breaks[i]) syllables[++k] = "";
	    if (symbols[i] != "") syllables[k] += symbols[i] + "\n";
	}
	return syllables;
    },

    getSyllables: function(tune) {
	var entries = this.parseTuneEntries(tune)
	this.markBreaks(entries)
	var syllables = [[]]
	var k = 0
	for (var i = 0; i < entries.length; i++) {
	    if (entries[i].sylBreak) syllables[++k] = []
	    syllables[k].push(entries[i])
	}
	syllables.toString = function() {
	    var s = []
	    for (var i = 0; i < this.length; i++) {
		s.push(this[i].join("\n"))
	    }
	    return s.join("\n")
	}

	return syllables
    }
}