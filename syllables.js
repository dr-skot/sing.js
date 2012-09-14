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

function getBreaks(symbols) {
    var breaks = [];
    var lastWasConsonant = false;
    var vowelHasBeenSeen = false;

    for (var i = 0; i < symbols.length; i++) {
	breaks[i] = false; // innocent until proven guilty

	phoneme = symbols[i].split(" ")[0]; // phoneme is 1st token
	//print("PHONEME: " + phoneme);
	var isVowel = re.vowels.test(phoneme);

	if (vowelHasBeenSeen) { // don't break before we see a vowel
	    //print("vowel has been seen")
	
	    if (re.stress.test(phoneme)) {
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
	lastWasConsonant = re.consonants.test(phoneme);
    }

    return breaks;
}

function splitSyllables(tune) {
    var symbols = tune.split("\n");
    breaks = getBreaks(symbols);
    var syllables = [""];
    var k = 0;
    for (var i = 0; i < symbols.length; i++) {
	if (breaks[i]) syllables[++k] = "";
	if (symbols[i] != "") syllables[k] += symbols[i] + "\n";
    }
    return syllables;
}

function test() {
    print("Running tests:");
    for (f in test.suite) {
	print(" - " + f);
	(test.suite[f])();
    }
    print("tests done\n");
}

test.suite = {
    can_identify_vowels: function() {
	assert(!re.vowels.test("~"), "can identify vowels");
	assert(!re.vowels.test("w"), "can identify vowels");
	assert(re.vowels.test("1UX"), "can identify vowels");
    },
    can_identify_consonants: function() {
	assert(!re.consonants.test("~"), "can identify consonants");
	assert(re.consonants.test("w"), "can identify consonants");
	assert(!re.consonants.test("1UX"), "can identify consonants");
    },
    can_identify_stress: function() {
	assert(re.stress.test("~"), "can identify stress");
	assert(!re.stress.test("w"), "can identify stress");
	assert(!re.stress.test("1UX"), "can identify stress");
    },
    single_syllable_should_go_unchanged: function() {
	var tune = "_ {W \"WHAT\" Undef}\n" +
	    "w {D 130; P 100.5:0 106.3:27 110.4:38 143:85}\n" +
	    "1UX {D 165; P 148.5:0 92.9:73 76.1:91}\n" +
	    "t {D 150; P 72.3:0 74.4:17 81.4:47 99.9:100}\n" +
	    ". {D 10}\n";
	var actual = splitSyllables(tune);
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
	var actual = splitSyllables(tune);
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
	var actual = splitSyllables(tune);
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
	var actual = splitSyllables(tune);
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
	var actual = splitSyllables(tune);
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
	var actual = splitSyllables(tune);
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

function assert(condition, message) {
    if (!message) message = "";
    if (!condition) {
	message = "Assertion Failed! " + message;
	print(message);
    }
    return;
}

function assertEquals(expected, actual, message) {
    message = message ? "" : message + ": ";
    message += "expected |" + expected + "|, got |" + actual + "|";
    assert(expected == actual ? true : false, message);
}

function assertArraysEqual(expected, actual, message) {
    message = message ? "" : message + ": ";
    assertIsArray(expected);
    assertIsArray(actual);
    assertEquals(expected.length, actual.length, message + "array lengths don't match");
    for (var i = 0; i < actual.length; i++) {
	assertEquals(expected[i], actual[i], message + "element " + i + " doesn't match");
    }
}

function assertIsArray(value) {
    assert(isArray(value), "not an array: " + value);
}

function isArray(value) {
    return Object.prototype.toString.apply(value)==='[object Array]';
}

test();
