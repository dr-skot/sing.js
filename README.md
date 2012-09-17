# sing.js 

Makes the Mac OS voices sing. Use it from the command line with [rhino](http://www.mozilla.org/rhino/). Melody in [ABC notation](http://abcnotation.com).

## Command-Line Usage

straight up:

```
rhino sing.js GCEA3 my dog has fleas
```

with options:

```
rhino sing.js -v Bruce -o -1 -t 0.5 GCEA3 my dog has fleas
```

print don't speak

```
rhino sing.js -p GCEA3 my dog has fleas
~ {W "MY" Undef !Emphatic !CitFunc}
m {D 75; P 493.883:0}
AY {D 225; P 493.883:0}
,_ {W "DOG" Noun}
d {D 36.1; P 329.627:0}
1AO {D 225; P 329.627:0}
g {D 38.9; P 329.627:0}
,~ {W "HAS" Undef !Emphatic !CitFunc}
h {D 35; P 415.304:0}
AE {D 225; P 415.304:0}
z {D 40; P 415.304:0}
,_ {W "FLEAS" Noun}
f {D 74; P 554.365:0}
l {D 46.2; P 554.365:0}
1IY {D 675; P 554.365:0}
z {D 104.8; P 554.365:0}
. {D 10}
```

help:

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


## TODO

* include punctuation in tempo computations
