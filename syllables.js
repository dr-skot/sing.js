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
