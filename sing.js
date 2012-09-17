// don't pass arguments to include files
args = arguments
arguments = []

load("abc2pd.js")
load("syllables.js")
load("set-syllables.js")

function getPhonemes(text, voice) {
    opt = { output: '' }

    if (voice === undefined)
	runCommand('phonemes', '-t', text, opt)
    else
	runCommand('phonemes', '-t', '-v', voice, text, opt)
	
    return opt.output;
}

function setWords(abcMusic, lyrics) {
    return setPhonemes(abcMusic, getPhonemes(lyrics))
}

function setPhonemes(abcMusic, phonemes) {
    var settings = ABC.abc2array(abcMusic)
    var syllables = Syllables.getSyllables(phonemes)
    Sing.setSyllables(syllables, settings)
    return syllables
}

function tagTune(tune) {
    return "[[inpt TUNE]]\n" + tune + "[[inpt TEXT]]\n"
}

function singWords(abcMusic, lyrics) {
    say(tagTune(setWords(abcMusic, lyrics)))
}

function singPhonemes(abcMusic, phonemes) {
    say(tagTune(setPhonemes(abcMusic, phonemes)))
}

function say(x) {
    runCommand('say', x)
}

if (args.length > 0) {
    // execute from the command line

    // parse options
    opts = { half_steps: 0, octaves: 0, tempo: 1 }
    var checkingOpts = true
    while (args.length > 0 && checkingOpts) {
	o = args[0]
	if (o == '-h' || o == '--help') {
	    opts.help = true; break;
	}
	else if (o == "-l" || o == "--lyrics") {
	    args.shift(); opts.lyrics = args.shift();
	}
	else if (o == "-m" || o == "--melody") {
	    args.shift(); opts.melody = args.shift();
	}
	else if (o == '-p' || o == '--print') {
	    args.shift(); opts.print = true
	}
	else if (o == '-n' || o == '--hsteps') {
	    args.shift(); opts.half_steps = parseFloat(args.shift());
	}
	else if (o == '-o' || o == '--octaves') {
	    args.shift(); opts.octaves = parseFloat(args.shift());
	}
	else if (o == '-t' || o == '--tempo') {
	    args.shift(); opts.tempo = parseFloat(args.shift());
	}
	else if (o == '-v' || o == '--voice') {
	    args.shift(); opts.voice = args.shift();
	}
	else checkingOpts = false
    }
    
    if (opts.help) {
	print(["Usage: rhino sing.js [opts] [melody] [lyrics...]",
	       "  (melody in abc notation, enclosed in quotes if necessary)",
	       "    -l, --lyrics FILE                Read lyrics from file",
	       "    -m, --melody FILE                Read melody from file",
	       "    -n, --hsteps N                   Shift pitch N half-steps",
	       "    -o, --octaves N                  Shift pitch N octaves",
	       "    -p, --print                      Print phonemes instead of singing",
	       "    -t, --tempo N                    Multiply tempo by N",
	       "    -v, --voice NAME                 Sing with specified voice",
	       "",
	      ].join("\n"))
    } else {
	var melody = opts.melody ? readFile(opts.melody) : args.shift()
	var lyrics = opts.lyrics ? readFile(opts.lyrics) : args.join(" ")

	var syllables = 
	    Syllables.getSyllables(getPhonemes(lyrics, opts.voice))
	var settings = 
	    ABC.abc2array(melody, opts.tempo, opts.octaves, opts.half_steps)
	Sing.setSyllables(syllables, settings)

	var tune = syllables.toString()

	if (opts.print) {
	    print(tune)
	} else {
	    if (opts.voice) runCommand('say', '-v', opts.voice, tagTune(tune))
	    else runCommand('say', tagTune(tune))
	}
    }
}