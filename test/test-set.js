/*
 * Tests
 */

load("lib/assert.js");
load("syllables.js");
load("set-syllables.js");

test.suite = {

    can_set_non_vowel: function() {
	var tuneEntry = "m {D 100; P 103.1:0 104.4:50}";
	tuneEntry = Sing.Split.parseTuneEntry(tuneEntry);
	Sing.Set.setNonVowel(tuneEntry, 133.33, 0.5);
	actual = tuneEntry.toString()
	var expected = "m {D 50; P 133.3:0}";
	assertEquals(expected, actual, "can set nonvowel");
    },

    can_set_vowel_to_single_note: function() {
	var tuneEntry = "2AO {D 95; P 97.8:0 98.6:53}";
	tuneEntry = Sing.Split.parseTuneEntry(tuneEntry);
	Sing.Set.setVowel(tuneEntry, [[80, 190]]);
	var expected = "2AO {D 190; P 80:0}";
	var actual = tuneEntry.toString()
	assertEquals(expected, actual, "can set vowel to single note");
    },

    can_set_vowel_to_three_notes: function() {
	var tuneEntry = "2AO {D 95; P 97.8:0 98.6:53}";
	tuneEntry = Sing.Split.parseTuneEntry(tuneEntry);
	var pitchFactors = Sing.Set.setVowel(tuneEntry, 
					     [[80, 40], [60, 100], [90, 60]]);
	var expected = "2AO {D 200; P 80:0 60:20 90:70}";
	var actual = tuneEntry.toString();
	assertEquals(expected, actual, "can set vowel to three notes");
	assertIsClose(80/97.8, pitchFactors[0], 0.01, "in factor should be 80/97.8");
	assertIsClose(90/98.6, pitchFactors[1], 0.01, "out factor should be 90/98.6");
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
	    "s {D 34.1; P 258.2:0}\n" +
	    "t {D 21.8; P 258.2:0}\n" +
	    "r {D 19.1; P 258.2:0}\n" +
	    "1EH {D 516.3; P 258.2:0 100:43.6 46.7:51.3}\n" +
	    "N {D 20; P 46.7:0}\n" +
	    "k {D 22.5; P 46.7:0}\n" +
	    "T {D 38.8; P 46.7:0}\n" +
	    ". {D 2.5}\n";
	var syllables = Sing.Split.getSyllables(syl)
	Sing.Set.setSyllable(syllables[0], notes);
	var actual = syllables[0].join("\n")
	assertEquals(expected, actual, "can set syllable to 3 notes");
    },

    consonants_should_share: function() {
	var syl =
 	    "t {D 70; P 150:0 136:50 130:70}\n" +
 	    "r {D 70; P 150:0 136:50 130:70}\n" +
	    "1EH {D 135; P 120:0 110:20 94:50}\n" +
	    "N {D 150; P 80:0}\n";
	var notes = [[180, 100], [120, 50], [188, 100]];
	var syllables = Sing.Split.getSyllables(syl)
	Sing.Set.setSyllable(syllables[0], notes)
	var expected = 
	    "t {D 12.5; P 180:0}\n" +
	    "r {D 12.5; P 180:0}\n" +
	    "1EH {D 200; P 180:0 120:37.5 188:62.5}\n" +
	    "N {D 25; P 188:0}\n";
	var actual = syllables[0].join("\n")
	assertEquals(expected, actual, "consonants should share");	
    },

    vowels_should_share_on_both_sides_if_one_note: function() {
	var syl =
 	    "t {D 75; P 150:0 136:50 130:70}\n" +
 	    "r {D 75; P 150:0 136:50 130:70}\n" +
	    "1EH {D 135; P 120:0 110:20 60:50}\n" +
	    "N {D 150; P 80:0}\n";
	var notes = [[120, 100]];
	var syllables = Sing.Split.getSyllables(syl)
	Sing.Set.setSyllable(syllables[0], notes)
	var expected = 
	    "t {D 6.3; P 120:0}\n" +
	    "r {D 6.3; P 120:0}\n" +
	    "1EH {D 75; P 120:0}\n" +
	    "N {D 12.5; P 120:0}\n";
	var actual = syllables[0].join("\n")
	assertEquals(expected, actual, "vowel shares single note on both sides");	
    },

    set_syllable_should_not_mutate_parameter_notes: function() {
	var origSetting = [[493.883, 300]]
	var setting = [[493.883, 300]]
	var syl = 
	    "~ {W \"MY\" Undef !Emphatic !CitFunc}\n" +
		"m {D 100; P 98.7:0 100.1:50}\n" +
		"AY {D 175; P 103.7:0 102.8:71 99.7:86}\n"
	var syllables = Sing.Split.getSyllables(syl)
	Sing.Set.setSyllable(syllables[0], setting)
	assertArraysEqual(origSetting, setting)
    },

    should_set_equal_number_of_syllables_and_settings: function() {
	// GCE
	var settings = [[[493.883, 300]], [[329.627, 300]], [[415.304, 300]]]
	var syl = 
	    "~ {W \"MY\" Undef !Emphatic !CitFunc}\n" +
	    "m {D 100; P 98.7:0 100.1:50}\n" +
	    "AY {D 175; P 103.7:0 102.8:71 99.7:86}\n" +
	    "_ {W \"DOG\" Noun}\n" +
	    "d {D 70; P 93:0 96.6:43}\n" +
	    "1AO {D 170; P 111.6:0 119.8:29 142.6:62 145.3:68 143.3:79}\n" +
	    "g {D 60; P 127.1:0 118.5:42 107.6:83}\n" +
	    "_ {W \"HAS\" Undef Emphatic CitFunc}\n" +
	    "h {D 80; P 105.8:0 112.2:25 121:50 132.2:75}\n" +
	    "1AE {D 235; P 145.8:0 148:6 145.9:15 91.3:68 85:87}\n" +
	    "z {D 170; P 77:0 73:56 73.4:88 75:100}\n"

	var syllables = Sing.Split.getSyllables(syl)
	var syllables2 = Sing.Split.getSyllables(syl)
	Sing.Set.setSyllables(syllables, settings)

	Sing.Set.setSyllable(syllables2[0], settings[0])
	Sing.Set.setSyllable(syllables2[1], settings[1])
	Sing.Set.setSyllable(syllables2[2], settings[2])
 
	var expected = syllables2.join(" ")
	var actual = syllables.join(" ")
	assertEquals(expected, actual, "can set 3 syllables to 3 notes")
   },

    should_cut_music_short_if_not_enough_syllables: function() {
	// GCE
	var settings = [[[493.883, 300]], [[329.627, 300]], [[415.304, 300]]]
	var syl = 
	    "~ {W \"MY\" Undef !Emphatic !CitFunc}\n" +
	    "m {D 100; P 98.7:0 100.1:50}\n" +
	    "AY {D 175; P 103.7:0 102.8:71 99.7:86}\n" +
	    "_ {W \"DOG\" Noun}\n" +
	    "d {D 70; P 93:0 96.6:43}\n" +
	    "1AO {D 170; P 111.6:0 119.8:29 142.6:62 145.3:68 143.3:79}\n" +
	    "g {D 60; P 127.1:0 118.5:42 107.6:83}\n"

	var syllables = Sing.Split.getSyllables(syl)
	var syllables2 = Sing.Split.getSyllables(syl)
	Sing.Set.setSyllables(syllables, settings)

	Sing.Set.setSyllable(syllables2[0], settings[0])
	Sing.Set.setSyllable(syllables2[1], settings[1])

	var expected = syllables2.join(" ")
	var actual = syllables.join(" ")
	assertEquals(expected, actual, "can set 2 syllables to 3 notes")
    },

    should_loop_music_if_excess_syllables: function() {
	// GCE
	var settings = [[[493.883, 300]], [[329.627, 300]]]
	var syl = 
	    "~ {W \"MY\" Undef !Emphatic !CitFunc}\n" +
	    "m {D 100; P 98.7:0 100.1:50}\n" +
	    "AY {D 175; P 103.7:0 102.8:71 99.7:86}\n" +
	    "_ {W \"DOG\" Noun}\n" +
	    "d {D 70; P 93:0 96.6:43}\n" +
	    "1AO {D 170; P 111.6:0 119.8:29 142.6:62 145.3:68 143.3:79}\n" +
	    "g {D 60; P 127.1:0 118.5:42 107.6:83}\n" +
	    "_ {W \"HAS\" Undef Emphatic CitFunc}\n" +
	    "h {D 80; P 105.8:0 112.2:25 121:50 132.2:75}\n" +
	    "1AE {D 235; P 145.8:0 148:6 145.9:15 91.3:68 85:87}\n" +
	    "z {D 170; P 77:0 73:56 73.4:88 75:100}\n"

	var syllables = Sing.Split.getSyllables(syl)
	var syllables2 = Sing.Split.getSyllables(syl)
	Sing.Set.setSyllables(syllables, settings)

	Sing.Set.setSyllable(syllables2[0], settings[0])
	Sing.Set.setSyllable(syllables2[1], settings[1])
	Sing.Set.setSyllable(syllables2[2], settings[0])

	var expected = syllables2.join(" ")
	var actual = syllables.join(" ")
	assertEquals(expected, actual, "can set 3 syllables to 2 notes")
     },

};


test();
