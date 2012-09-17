load("lib/assert.js");
load("syllables.js");

test.suite = {
    can_identify_vowels: function() {
	assertTrue(!Sing.re.vowels.test("~"), "can identify vowels");
	assertTrue(!Sing.re.vowels.test("w"), "can identify vowels");
	assertTrue(Sing.re.vowels.test("1UX"), "can identify vowels");
    },
    can_identify_consonants: function() {
	assert(!Sing.re.consonants.test("~"), "can identify consonants");
	assert(Sing.re.consonants.test("w"), "can identify consonants");
	assert(!Sing.re.consonants.test("1UX"), "can identify consonants");
    },
    can_identify_stress: function() {
	assert(Sing.re.stress.test("~"), "can identify stress");
	assert(!Sing.re.stress.test("w"), "can identify stress");
	assert(!Sing.re.stress.test("1UX"), "can identify stress");
    },
    single_syllable_should_go_unchanged: function() {
	var tune = "_ {W \"WHAT\" Undef}\n" +
	    "w {D 130; P 100.5:0 106.3:27 110.4:38 143:85}\n" +
	    "1UX {D 165; P 148.5:0 92.9:73 76.1:91}\n" +
	    "t {D 150; P 72.3:0 74.4:17 81.4:47 99.9:100}\n" +
	    ". {D 10}\n";
	var actual = Sing.Split.splitSyllables(tune);
	var expected = [tune];
	assertArraysEqual(expected, actual);
    },
    should_split_words: function() {
	var tune = "~ {W \"WHAT\" Undef}\n" +
	    "w {D 100; P 96.8:0 99.9:50}\n" +
	    "2UX {D 100; P 108.4:0}\n" +
	    "t {D 40; P 105:0 107.4:50}\n" +
	    "~ {W \"THE\" Undef  CitFunc }\n" +
	    "D {D 115; P 113.6:0 114.6:26 125.1:48 143.9:78 148.2:91}\n" +
	    "1IY {D 260; P 148.7:0 94:48 77.2:88 75:100}\n" +
	    ". {D 10}\n";
	var actual = Sing.Split.splitSyllables(tune);
	var expected = [
	    "~ {W \"WHAT\" Undef}\n" +
		"w {D 100; P 96.8:0 99.9:50}\n" +
		"2UX {D 100; P 108.4:0}\n" +
		"t {D 40; P 105:0 107.4:50}\n",
	    "~ {W \"THE\" Undef  CitFunc }\n" +
		"D {D 115; P 113.6:0 114.6:26 125.1:48 143.9:78 148.2:91}\n" +
		"1IY {D 260; P 148.7:0 94:48 77.2:88 75:100}\n" +
		". {D 10}\n",
	];
	assertArraysEqual(expected, actual);
    },
    should_split_vowels: function() {
	var tune = "_ {W \"GOING\" Undef !Name}\n" +
	    "g {D 95; P 96.3:0 102.9:37 111.5:68 116:79}\n" +
	    "1OW {D 185; P 129.3:0 147.9:22 149.6:32 142.6:43}\n" +
	    "IH {D 110; P 94.8:0 90.9:14 87.3:64}\n" +
	    "N {D 170; P 81.7:0 76.2:59 76.1:100}\n" +
	    ". {D 10}\n";
	var actual = Sing.Split.splitSyllables(tune);
	var expected = [
	    "_ {W \"GOING\" Undef !Name}\n" +
		"g {D 95; P 96.3:0 102.9:37 111.5:68 116:79}\n" +
		"1OW {D 185; P 129.3:0 147.9:22 149.6:32 142.6:43}\n",
	    "IH {D 110; P 94.8:0 90.9:14 87.3:64}\n" +
		"N {D 170; P 81.7:0 76.2:59 76.1:100}\n" +
		". {D 10}\n",
	];
	assertArraysEqual(expected, actual);
    },
    should_split_on_synthesizers_syllable_break: function() {
	var tune = "_ {W \"BACKSTREET\" Noun Name}\n" +
	    "b {D 100; P 93.6:0 94.6:20 98.7:40 106.9:70}\n" +
	    "1AE {D 185; P 117.3:0 120.8:8 146.6:41 148.1:49 146.6:54 133.7:70}\n" +
	    "k {D 65; P 105.2:0 91.1:62 91:77}\n" +
	    "=s {D 85; P 93.6:0 90.3:18 88.3:41}\n" +
	    "t {D 50; P 90.3:0 86.6:50}\n" +
	    "r {D 45; P 90:0 85.3:44}\n" +
	    "IY {D 135; P 85.1:0 78:70}\n" +
	    "t {D 125; P 72.6:0 74.3:16 81.6:48 99.6:100}\n" +
	    ". {D 10}\n";
	var actual = Sing.Split.splitSyllables(tune);
	var expected = [
	    "_ {W \"BACKSTREET\" Noun Name}\n" +
		"b {D 100; P 93.6:0 94.6:20 98.7:40 106.9:70}\n" +
		"1AE {D 185; P 117.3:0 120.8:8 146.6:41 148.1:49 146.6:54 133.7:70}\n" +
		"k {D 65; P 105.2:0 91.1:62 91:77}\n",
	    "=s {D 85; P 93.6:0 90.3:18 88.3:41}\n" +
		"t {D 50; P 90.3:0 86.6:50}\n" +
		"r {D 45; P 90:0 85.3:44}\n" +
		"IY {D 135; P 85.1:0 78:70}\n" +
		"t {D 125; P 72.6:0 74.3:16 81.6:48 99.6:100}\n" +
		". {D 10}\n"
	];
	assertArraysEqual(expected, actual);
    },
    should_keep_preceeding_consonant_with_vowel: function() {
	var tune = "_ {W \"BACKSTREET\" Noun Name}\n" +
	    "b {D 100; P 93.6:0 94.6:20 98.7:40 106.9:70}\n" +
	    "1AE {D 185; P 117.3:0 120.8:8 146.6:41 148.1:49 146.6:54 133.7:70}\n" +
	    "k {D 65; P 105.2:0 91.1:62 91:77}\n" +
	    "s {D 85; P 93.6:0 90.3:18 88.3:41}\n" +
	    "t {D 50; P 90.3:0 86.6:50}\n" +
	    "r {D 45; P 90:0 85.3:44}\n" +
	    "IY {D 135; P 85.1:0 78:70}\n" +
	    "t {D 125; P 72.6:0 74.3:16 81.6:48 99.6:100}\n" +
	    ". {D 10}\n";
	var actual = Sing.Split.splitSyllables(tune);
	var expected = [
	    "_ {W \"BACKSTREET\" Noun Name}\n" +
		"b {D 100; P 93.6:0 94.6:20 98.7:40 106.9:70}\n" +
		"1AE {D 185; P 117.3:0 120.8:8 146.6:41 148.1:49 146.6:54 133.7:70}\n" +
		"k {D 65; P 105.2:0 91.1:62 91:77}\n" +
		"s {D 85; P 93.6:0 90.3:18 88.3:41}\n" +
		"t {D 50; P 90.3:0 86.6:50}\n",
	    "r {D 45; P 90:0 85.3:44}\n" +
		"IY {D 135; P 85.1:0 78:70}\n" +
		"t {D 125; P 72.6:0 74.3:16 81.6:48 99.6:100}\n" +
		". {D 10}\n"
	];
	assertArraysEqual(expected, actual);
    },
    should_not_keep_preceeding_consonant_if_synthesizer_mark_says_otherwise: function() {
	var tune = "_ {W \"PERFECTING\" Undef}\n" +
	    "p {D 75; P 141.5:0 142.4:53}\n" +
	    "AX {D 65; P 149:0 150.4:8 144.5:46}\n" +
	    "r {D 45; P 139.8:0 135.6:56}\n" +
	    "f {D 100; P 130.4:0 127:10 128.9:45 134.1:70}\n" +
	    "1EH {D 100; P 144.1:0 148.4:10 142:25 135.9:45}\n" +
	    "k {D 45; P 126.9:0 130.5:44}\n" +
	    "t {D 55; P 141.6:0 147.8:18 150.5:55}\n" +
	    "=IH {D 55; P 159.9:0 163.4:18}\n" +
	    "N {D 70; P 145.4:0 141.5:14}\n";
	var actual = Sing.Split.splitSyllables(tune);
	var expected = [
	    "_ {W \"PERFECTING\" Undef}\n" +
		"p {D 75; P 141.5:0 142.4:53}\n" +
		"AX {D 65; P 149:0 150.4:8 144.5:46}\n" +
		"r {D 45; P 139.8:0 135.6:56}\n",
	    "f {D 100; P 130.4:0 127:10 128.9:45 134.1:70}\n" +
		"1EH {D 100; P 144.1:0 148.4:10 142:25 135.9:45}\n" +
		"k {D 45; P 126.9:0 130.5:44}\n" +
		"t {D 55; P 141.6:0 147.8:18 150.5:55}\n",
	    "=IH {D 55; P 159.9:0 163.4:18}\n" +
		"N {D 70; P 145.4:0 141.5:14}\n",
	];
	assertArraysEqual(expected, actual);
    },
}

test();