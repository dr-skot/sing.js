load("lib/assert.js")
load("parse-syllables.js")

test.suite = {
    
    can_parse_vowel: function() {
	var line = "1AO {D 165; P 329.6:0}"
	entry = Syllables.parseTuneEntry(line)
	assertEquals("vowel", entry.type)
	assertEquals("1AO", entry.symbol)
	assertEquals(165, entry.duration)
	assertArraysEqual([[329.6, 0]], entry.pitches)
    },

    can_parse_consonant: function() {
	line = "d {D 65; P 103.7:0 109.6:38 116.7:69 122.1:85}"
	entry = Syllables.parseTuneEntry(line)
	assertEquals("consonant", entry.type)
	assertEquals("d", entry.symbol)
	assertEquals(65, entry.duration)
	assertArraysEqual([[103.7, 0], [109.6, 38], [116.7, 69], [122.1, 85]], 
			  entry.pitches);
    },

    can_parse_pause: function() {
	line = ". {D 10}"
	entry = Syllables.parseTuneEntry(line)
	assertEquals("pause", entry.type)
	assertEquals(".", entry.symbol)
	assertEquals(10, entry.duration)
	assertArraysEqual([], entry.pitches)
    },

    can_parse_meta: function() {
	line = "~ {W \"MY\" Undef !Emphatic !CitFunc}"
	entry = Syllables.parseTuneEntry(line)
	assertEquals("meta", entry.type)
	assertEquals("~", entry.symbol)
	assertEquals(0, entry.duration)
	assertArraysEqual([], entry.pitches)
    },

    can_convert_to_string: function() {
	var line = "1AO {D 165; P 329.6:0}"
	entry = Syllables.parseTuneEntry(line)
	assertEquals(line, entry.toString())
    },

    can_change_duration: function() {
	var line = ". {D 10}"
	entry = Syllables.parseTuneEntry(line)
	entry.duration = 20
	assertEquals(". {D 20}", entry.toString())
    },

    can_change_pitches: function() {
	line = "d {D 65; P 103.7:0 109.6:38 116.7:69 122.1:85}"
	entry = Syllables.parseTuneEntry(line)
	entry.pitches = [[200, 0]]
	assertEquals("d {D 65; P 200:0}", entry.toString())
    },

    shaves_decimals: function() {
	line = "d {D 65; P 103.7:0 109.6:38 116.7:69 122.1:85}"
	entry = Syllables.parseTuneEntry(line)
	entry.duration = 63.8999994324
	entry.pitches = [[200.1323453, 0.0034235]]
	assertEquals("d {D 63.9; P 200.1:0}", entry.toString())
    },
}

test()


