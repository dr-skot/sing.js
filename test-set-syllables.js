/*
 * Tests
 */

load("assert.js");
load("set-syllables.js");

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
	assertArraysEqual([103.1, 0], tuneEntry.pitches[0], 
			  "pitch 0 should be 103.1:0");
	assertArraysEqual([104.4, 50], tuneEntry.pitches[1], 
			  "pitch 1 should be 104.4:50");
    },

    should_only_parse_vowels_and_consonants: function() {
	var line = "_ {W \"STRENGTH\" Noun !Name}";
	var actual = SetSyllables.parseTuneEntry(line);
	assertEquals(line, actual, "should only parse vowels and consonants");
    },

    tune_entry_to_string_reverses_parse: function() {
	var line = "m {D 100; P 103.1:0 104.4:50}";
	var tuneEntry = SetSyllables.parseTuneEntry(line);
	var actual = SetSyllables.tuneEntryToString(tuneEntry);
	assertEquals(line, actual, "tuneEntryToString should reverse parse");
    },

    tune_entry_to_string_on_string_is_string: function() {
	var line = "_ {W \"STRENGTH\" Noun !Name}";
	var actual = SetSyllables.tuneEntryToString(line);
	assertEquals(line, actual, "tuneEntryToString on string should be string");
    },

    can_set_consonant: function() {
	var tuneEntry = "m {D 100; P 103.1:0 104.4:50}";
	tuneEntry = SetSyllables.parseTuneEntry(tuneEntry);
	SetSyllables.setConsonant(tuneEntry, 2.0);
	actual = SetSyllables.tuneEntryToString(tuneEntry);
	var expected = "m {D 100; P 206.2:0 208.8:50}";
	assertEquals(expected, actual, "can set consonant to 2x pitch");
    },

    can_get_longest_pitch: function() {
	var tuneEntry = "2AO {D 95; P 97.8:0 98.6:53}";
	tuneEntry = SetSyllables.parseTuneEntry(tuneEntry);
	assertEquals(97.8, SetSyllables.getLongestPitch(tuneEntry),
		    "longest pitch should be 97.8");
    },

    can_set_vowel_to_single_note: function() {
	var tuneEntry = "2AO {D 95; P 97.8:0 98.6:53}";
	tuneEntry = SetSyllables.parseTuneEntry(tuneEntry);
	var pitchFactors = SetSyllables.setVowel(tuneEntry, [[80, 190]]);
	var expected = "2AO {D 190; P 80:0}";
	var actual = SetSyllables.tuneEntryToString(tuneEntry);
	assertEquals(expected, actual, "can set vowel to single note");
	assertIsClose(80/97.8, pitchFactors[0], 0.01, "in factor should be 80/97.8");
	assertIsClose(80/98.6, pitchFactors[1], 0.01, "out factor should be 80/98.6");
    },

    can_set_vowel_to_three_notes: function() {
	var tuneEntry = "2AO {D 95; P 97.8:0 98.6:53}";
	tuneEntry = SetSyllables.parseTuneEntry(tuneEntry);
	var pitchFactors = SetSyllables.setVowel(tuneEntry, 
						 [[80, 40], [60, 100], [90, 60]]);
	var expected = "2AO {D 200; P 80:0 60:20 90:70}";
	var actual = SetSyllables.tuneEntryToString(tuneEntry);
	assertEquals(expected, actual, "can set vowel to three notes");
	assertIsClose(80/97.8, pitchFactors[0], 0.01, "in factor should be 80/97.8");
	assertIsClose(90/98.6, pitchFactors[1], 0.01, "out factor should be 90/98.6");
    },

    can_identify_vowel: function() {
	var entries = [
	    "_ {W \"STRENGTH\" Noun !Name}",
	    "s {D 125; P 93.3:0 96.6:32 113.7:76}",
	    "1EH {D 135; P 129.1:0 112.2:22 93.4:52}",
	    ". {D 10}"
	];
	for (var i = 0; i < entries.length; i++) {
	    var entry = SetSyllables.parseTuneEntry(entries[i]);
	    actual = SetSyllables.isVowel(entry);
	    if (entries[i] == "1EH {D 135; P 129.1:0 112.2:22 93.4:52}") {
		assertTrue(actual, "can identify vowel");
	    } else {
		assertFalse(actual, "can identify vowel");
	    }
	}	
    },

    can_identify_consonant: function() {
	var entries = [
	    "_ {W \"STRENGTH\" Noun !Name}",
	    "s {D 125; P 93.3:0 96.6:32 113.7:76}",
	    "1EH {D 135; P 129.1:0 112.2:22 93.4:52}",
	    ". {D 10}"
	];
	for (var i = 0; i < entries.length; i++) {
	    var entry = SetSyllables.parseTuneEntry(entries[i]);
	    actual = SetSyllables.isConsonant(entry);
	    if (entries[i] == "s {D 125; P 93.3:0 96.6:32 113.7:76}") {
		assertTrue(actual, "should be consonant " + entries[i]);
	    } else {
		assertFalse(actual, "should not be consonant " + entries[i]);
	    }
	}	
    },

    can_set_syllable_to_three_notes: function() {
	var syl = "_ {W \"STRENGTH\" Noun !Name}\n" +
	    "s {D 125; P 93.3:0 96.6:32 113.7:76}\n" +
	    "t {D 80; P 121.5:0 121.1:19 125.9:38 133.1:56 148.7:88}\n" +
	    "r {D 70; P 153.4:0 135.3:57 131.1:79}\n" +
	    "1EH {D 135; P 129.1:0 112.2:22 93.4:52}\n" +
	    "N {D 80; P 81.4:0}\n" +
	    "k {D 90; P 74.2:0 76.2:33}\n" +
	    "T {D 155; P 86:0 82.8:19 83.8:39 90:68 100.2:100}\n" +
	    ". {D 10}\n";
	var notes = [[258.2, 300], [100, 40], [46.7, 335]];
	var expected = "_ {W \"STRENGTH\" Noun !Name}\n" +
	    "s {D 125; P 186.6:0 193.2:32 227.4:76}\n" +
	    "t {D 80; P 243:0 242.2:19 251.8:38 266.2:56 297.4:88}\n" +
	    "r {D 70; P 306.8:0 270.6:57 262.2:79}\n" +
	    "1EH {D 75; P 258.2:0 100:33.3 46.7:86.7}\n" +
	    "N {D 80; P 40.7:0}\n" +
	    "k {D 90; P 37.1:0 38.1:33}\n" +
	    "T {D 155; P 43:0 41.4:19 41.9:39 45:68 50.1:100}\n" +
	    ". {D 10}\n";
	var actual = SetSyllables.setSyllable(syl, notes);
	//var actual = expected;
	assertEquals(expected, actual, "can set syllable to 3 notes");
    },

    can_shave_decimals: function() {
	assertEquals(10.5, shaveDecimals(10.5343, 1));
	assertEquals(10.5, shaveDecimals(10.45, 1));
	assertEquals(10, shaveDecimals(10, 1));
    },

    consonants_should_share: function() {
	var syl =
 	    "t {D 70; P 150:0 136:50 130:70}\n" +
 	    "r {D 70; P 150:0 136:50 130:70}\n" +
	    "1EH {D 135; P 120:0 110:20 94:50}\n" +
	    "N {D 150; P 80:0}\n";
	var notes = [[180, 100], [120, 50], [188, 100]];
	var actual = SetSyllables.setSyllable(syl, notes);
	var expected = 
 	    "t {D 37.5; P 225:0 204:50 195:70}\n" +
 	    "r {D 37.5; P 225:0 204:50 195:70}\n" +
	    "1EH {D 100; P 180:0 120:25 188:75}\n" +
	    "N {D 75; P 160:0}\n";
	assertEquals(expected, actual, "consonants should share");	
    },

    vowels_share_on_both_sides_if_one_note: function() {
	var syl =
 	    "t {D 75; P 150:0 136:50 130:70}\n" +
 	    "r {D 75; P 150:0 136:50 130:70}\n" +
	    "1EH {D 135; P 120:0 110:20 60:50}\n" +
	    "N {D 150; P 80:0}\n";
	var notes = [[120, 100]];
	var actual = SetSyllables.setSyllable(syl, notes);
	var expected = 
 	    "t {D 18.8; P 150:0 136:50 130:70}\n" +
 	    "r {D 18.8; P 150:0 136:50 130:70}\n" +
	    "1EH {D 25; P 120:0}\n" +
	    "N {D 37.5; P 160:0}\n";
	assertEquals(expected, actual, "vowel shares single note on both sides");	
    },

};


test();
