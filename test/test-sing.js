load("lib/assert.js")
load("sing.js")

test.suite = {
    
    can_sing_my_dog_has_fleas: function() {
	var text = setWords("GCEA2", "my dog has fleas");
	var expected = [
	    "~ {W \"MY\" Undef !Emphatic !CitFunc}",
	    "m {D 75; P 392:0}",
	    "AY {D 225; P 392:0}",
	    "_ {W \"DOG\" Noun}",
	    "d {D 36.1; P 261.6:0}",
	    "1AO {D 225; P 261.6:0}",
	    "g {D 38.9; P 261.6:0}",
	    "~ {W \"HAS\" Undef !Emphatic !CitFunc}",
	    "h {D 35; P 329.6:0}",
	    "AE {D 225; P 329.6:0}",
	    "z {D 40; P 329.6:0}",
	    "_ {W \"FLEAS\" Noun}",
	    "f {D 48; P 440:0}",
	    "l {D 30; P 440:0}",
	    "1IY {D 450; P 440:0}",
	    "z {D 68; P 440:0}",
	    ". {D 4}",
	    "",
	    "",
	].join("\n")

	assertEquals(expected, text, "should set my dog has fleas")
    }
}

test()