load("lib/assert.js");
load("parse-syllables.js");

test.suite = {

    can_identify_vowels: function() {
	assertTrue(!Syllables.re.vowels.test("~"), "can identify vowels");
	assertTrue(!Syllables.re.vowels.test("w"), "can identify vowels");
	assertTrue(Syllables.re.vowels.test("1UX"), "can identify vowels");
    },

    can_identify_consonants: function() {
	assert(!Syllables.re.consonants.test("~"), "can identify consonants");
	assert(Syllables.re.consonants.test("w"), "can identify consonants");
	assert(!Syllables.re.consonants.test("1UX"), "can identify consonants");
    },

    can_identify_divider: function() {
	assert(Syllables.re.divider.test("~"), "can identify divider");
	assert(!Syllables.re.divider.test("w"), "can identify divider");
	assert(!Syllables.re.divider.test("1UX"), "can identify divider");
    },

    mark_breaks_should_split_words: function() {
	var tune = "~ {W \"WHAT\" Undef}\n" +
	    "w {D 100; P 96.8:0 99.9:50}\n" +
	    "2UX {D 100; P 108.4:0}\n" +
	    "t {D 40; P 105:0 107.4:50}\n" +
	    "~ {W \"THE\" Undef  CitFunc }\n" +
	    "D {D 115; P 113.6:0 114.6:26 125.1:48 143.9:78 148.2:91}\n" +
	    "1IY {D 260; P 148.7:0 94:48 77.2:88 75:100}\n" +
	    ". {D 10}\n";
	var entries = Syllables.parseTuneEntries(tune);
	Syllables.markBreaks(entries)
	assertTrue(entries[4].sylBreak)
	for (var i = 0; i < entries.length; i++) {
	    if (i != 4) assertFalse(entries[i].sylBreak)
	}
    },

    get_syllables_should_split_words: function() {
	var tune = "~ {W \"WHAT\" Undef}\n" +
	    "w {D 100; P 96.8:0 99.9:50}\n" +
	    "2UX {D 100; P 108.4:0}\n" +
	    "t {D 40; P 105:0 107.4:50}\n" +
	    "~ {W \"THE\" Undef  CitFunc }\n" +
	    "D {D 115; P 113.6:0 114.6:26 125.1:48 143.9:78 148.2:91}\n" +
	    "1IY {D 260; P 148.7:0 94:48 77.2:88 75:100}\n" +
	    ". {D 10}\n";
	var syllables = Syllables.getSyllables(tune);
	assertEquals(2, syllables.length)
	assertEquals("~", syllables[1][0].symbol)
    },

}

test();