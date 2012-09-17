if (typeof(Sing) === "undefined") Sing = {}

Sing.Set = {

    VOWEL_SHARE: 0.75, // consonants will cede this much of a crowded note

    // sets pitch to pitch if phoneme has pitch
    // multiplies duration if phoneme has duration
    setNonVowel: function(tuneEntry, pitch, timeFactor) {
	if (typeof(timeFactor) === 'undefined') timeFactor = 1
	tuneEntry.duration = tuneEntry.duration * timeFactor
	if (tuneEntry.pitches.length > 0) tuneEntry.pitches = [[pitch, 0]]
    },

    // sets duration and pitches to match notes
    setVowel: function(tuneEntry, notes) {
	// get total duration of notes
	var totalDuration = 0
	for (var i = 0; i < notes.length; i++) {
	    totalDuration += notes[i][1]
	}
	durationFactor = 100.0 / totalDuration // danger div by zero

	// get change factor for first and last pitches
	p = tuneEntry.pitches
	orig = [p[0][0], p[p.length-1][0]]
	changed = [notes[0][0], notes[notes.length-1][0]]
	pitchFactors = [changed[0]/orig[0], changed[1]/orig[1]]; // danger div by zero

	// set the vowel to the notes
	duration = 0
	p = []
	for (i = 0; i < notes.length; i++) {
	    p.push([notes[i][0], duration * durationFactor])
	    duration += notes[i][1]
	}
	tuneEntry.pitches = p
	tuneEntry.duration = totalDuration
	return pitchFactors
    },

    // adjusts note to vowel length,
    // returns factor by which to multiply nonvowel durations
    shareNote: function(note, nonVowelTime) {
	
	// is vowel getting enough of note?
	if (note[1] - nonVowelTime < note[1] * this.VOWEL_SHARE) {
	    var vowelShare = note[1] * this.VOWEL_SHARE
	    var consonantShare = note[1] - vowelShare
	    note[1] = vowelShare // set vowel duration
	    return consonantShare / nonVowelTime
	} else {
	    note[1] -= nonVowelTime
	    var timeFactor = 1
	}
	return timeFactor
    },

    setSyllable: function(entries, notes) {
	// make a copy of the notes array
	notes = notes.slice(0)
	for (var i = 0; i < notes.length; i++) {
	    notes[i] = notes[i].slice(0); // copies the array
	}

	// first pass: find vowel and get consonant durations
	var durations = [0, 0]; // [before vowel, after vowel]
	var beforeVowel = true
	var vowel
	for (var i = 0; i < entries.length; i++) {
	    if (entries[i].type == "vowel") {
		vowel = entries[i]
		beforeVowel = false
	    } else {
		durations[beforeVowel ? 0 : 1] += entries[i].duration
	    }
	}

	// print("before vowel " + durations[0] + "(" + notes[0][1] + ")")
	// print("after vowel " + durations[1] + "(" + notes[notes.length-1][1] + ")")
 
	// share first and last notes with consonants (and get time factors)
	var timeFactors = [1, 1]
	if (notes.length == 1) {
	    // share same note with both consonant clusters
	    var f = this.shareNote(notes[0], durations[0] + durations[1])
	    timeFactors = [f, f]
	} else {
	    timeFactors = [
		this.shareNote(notes[0], durations[0]),
		this.shareNote(notes[notes.length-1], durations[1])
	    ]
	}
	// print("time factors " + timeFactors)

	// set vowel and get pitch factors for consonants
	pitchFactors = this.setVowel(vowel, notes)
	// print("pitch factors " + timeFactors)

	 // start with before-vowel factors (will switch at vowel)
	pitchFactor = pitchFactors[0]
	timeFactor = timeFactors[0]
	pitch = notes[0][0]

	// second pass: set consonants
	for (var i = 0; i < entries.length; i++) {
	    if (entries[i] == vowel) {
		// switch to after-vowel factors
		pitchFactor = pitchFactors[1]
		timeFactor = timeFactors[1]
		pitch = notes[notes.length-1][0]
	    }
	    else {
		this.setNonVowel(entries[i], pitch, timeFactor)
	    }
	}
    },
    
    setSyllables: function(syllables, settings) {
	var result = []
	for (var i = 0; i < syllables.length; i++) {
	    this.setSyllable(syllables[i], settings[i % settings.length])
	}
	return result
    },
}

