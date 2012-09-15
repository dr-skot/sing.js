load("abc2pd.js")
load("syllables.js")
load("set-syllables.js")

function getTune(text) {
    opt = { output: '' }
    runCommand('phonemes', '-t', text, opt)
    return opt.output;
}

function setWords(abcMusic, lyrics) {
    return setTune(abcMusic, getTune(lyrics))
}

function setTune(abcMusic, tune) {
    var settings = abc2array(abcMusic)
    var syllables = splitSyllables(tune)
    return SetSyllables.setSyllables(syllables, settings).join("")
}

function tagTune(tune) {
    return "[[inpt TUNE]]\n" + tune + "[[inpt TEXT]]\n"
}

if (arguments.length > 0) {
    var checkingOpts = true
    while (checkingOpts) {
	checkingOpts = false
    }
    var music = arguments[0]
    getTune(music)
    var lyrics = arguments.slice(1).join(" ")
    print(setWords(music, lyrics))
    runCommand('say', tagTune(setWords(music, lyrics)))
}