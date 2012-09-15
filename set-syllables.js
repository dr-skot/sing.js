SetSyllables = {
    parseTuneEntry: function(tuneEntry) {
	var result = {};
	var re = new RegExp("([^ ]+) {D [0-9.]+; P( [0-9.]+;[0-9.]+)+}");
	var matches = tuneEntry.match(/([^ ]+) {D ([0-9.]+); P ([^}]+)}/);
	result.phoneme = matches[1];
	result.duration = matches[2];
	result.pitches = matches[3].split(" ");
	for (var i = 0; i < result.pitches.length; i++) {
	    result.pitches[i] = result.pitches[i].split(":");
	}
	return result;
    },

    tuneEntryToString: function(tuneEntry) {
	result = tuneEntry.phoneme +
	    " {D " + tuneEntry.duration + "; P";
	for (var i = 0; i < tuneEntry.pitches.length; i++) {
	    result += " " + tuneEntry.pitches[i][0] + ":" + tuneEntry.pitches[i][1];
	}
	result += "}";
	return result;
    },

    setConsonant: function(tuneEntry, pitchFactor) {
	tuneEntry = this.parseTuneEntry(tuneEntry);
	for (var i = 0; i < tuneEntry.pitches.length; i++) {
	    tuneEntry.pitches[i][0] *= pitchFactor;
	}
	return this.tuneEntryToString(tuneEntry);
    },
};

/*
 * Tests
 */

load("assert.js");

test.suite = {

    can_assert: function() {
	assert(true, "can assert");
	assertEquals(1, 1, "can assertEquals");
    },

    can_parse_tune_entry: function() {
	var line = "m {D 100; P 103.1:0 104.4:50}";
	var tuneEntry = SetSyllables.parseTuneEntry(line);
	assertEquals("m", tuneEntry.phoneme, "phoneme should be 'm'");
	assertEquals(100, tuneEntry.duration, "duration should be 100");
	assertArraysEqual([103.1, 0], tuneEntry.pitches[0], "pitch 0 should be 103.1:0");
	assertArraysEqual([104.4, 50], tuneEntry.pitches[1], 
			  "pitch 1 should be 104.4:50");
    },

    tune_entry_to_string_reverses_parse: function() {
	var line = "m {D 100; P 103.1:0 104.4:50}";
	var tuneEntry = SetSyllables.parseTuneEntry(line);
	assertEquals(line, SetSyllables.tuneEntryToString(tuneEntry),
		     "tuneEntryToString should reverse parseTuneEntry");
    },

    can_set_consonant: function() {
	var phoneme = "m {D 100; P 103.1:0 104.4:50}";
	var expected = "m {D 100; P 206.2:0 208.8:50}";
	var actual = SetSyllables.setConsonant(phoneme, 2.0);
	assertEquals(expected, actual, "can set consonant to 2x pitch");
    },

};


test();



