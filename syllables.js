if (typeof(Sing) === "undefined") Sing = {}

Sing.regex = {
  vowels: 'AE|EY|AO|AX|IY|EH|IH|AY|IX|AA|UW|UH|UX|OW|AW|OY',
  consonants: 'b|C|d|D|f|g|h|J|k|l|m|n|N|p|r|s|S|t|T|v|w|y|z|Z',
  punctuation: '\\.|!|\\?|,|:',
  stress: '~|_|\\+|=',
};

Sing.re = {
    vowels: new RegExp(Sing.regex.vowels),
    consonants: new RegExp(Sing.regex.consonants),
    stress: new RegExp(Sing.regex.stress),
};

Sing.Split = {

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
	
		if (Sing.re.stress.test(phoneme)) {
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
}