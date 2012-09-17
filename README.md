sing - make the mac voices sing

* phonemes: converts text to phonemes in TUNE format
* abc2pd.js: converts music in ABC format to a series of pitch/duration pairs
* syllables.js: splits phonemes in TUNE format into syllables
* set-syllables.js: sets syllables to notes
* sing.js does the singing

Here's how you do it:

rhino sing.js GCEA3 my dog has fleas

Try rhino sing.js --help for more options.

TODO

* include punctuation in tempo computations
* make namespace policy more consistent