# sing.js 

Makes the Mac OS voices sing. Use it from the command line with [rhino](http://www.mozilla.org/rhino/). Melody in [ABC notation](http://abcnotation.com).

## Command-Line Usage

straight up

```
rhino sing.js GCEA3 my dog has fleas
```

with options

```
rhino sing.js -v Bruce -o -1 -t 0.5 -m melody.txt -l lyrics.txt
```

help

```
rhino sing.js --help
Usage: rhino sing.js [opts] [melody] [lyrics...]
  (melody in abc notation, enclosed in quotes if necessary)
    -l, --lyrics FILE                Read lyrics from file
    -m, --melody FILE                Read melody from file
    -n, --hsteps N                   Shift pitch N half-steps
    -o, --octaves N                  Shift pitch N octaves
    -p, --print                      Print phonemes instead of singing
    -t, --tempo N                    Multiply tempo by N
    -v, --voice NAME                 Sing with specified voice
```

print don't speak

```
rhino sing.js -p GCEA3 my dog has fleas
~ {W "MY" Undef !Emphatic !CitFunc}
m {D 75; P 392:0}
AY {D 225; P 392:0}
_ {W "DOG" Noun}
d {D 36.1; P 261.6:0}
1AO {D 225; P 261.6:0}
g {D 38.9; P 261.6:0}
~ {W "HAS" Undef !Emphatic !CitFunc}
h {D 35; P 329.6:0}
AE {D 225; P 329.6:0}
z {D 40; P 329.6:0}
_ {W "FLEAS" Noun}
f {D 72; P 440:0}
l {D 45; P 440:0}
1IY {D 675; P 440:0}
z {D 102; P 440:0}
. {D 6}
```

## Thanks

This is written in JavaScript because it uses the excellent [abcjs](http://code.google.com/p/abcjs/) library. Thanks to the authors of it, Gregory Dyke and Paul Rosen.

Thanks also to Greg Beller who showed me how to get detailed phoneme data from the speech synthesizer.

## TODO

* add effects (vibrato, staccato, etc)
