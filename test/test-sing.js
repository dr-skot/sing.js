load("lib/assert.js")
load("sing.js")

test.suite = {
    
    can_sing_my_dog_has_fleas: function() {
	var text = setWords("GCEA2", "my dog has fleas");
	var expected =
	    "~ {W \"MY\" Undef !Emphatic !CitFunc}\n" +
	    "m {D 75; P 493.883:0}\n" +
	    "AY {D 225; P 493.883:0}\n" +
	    "_ {W \"DOG\" Noun}\n" +
	    "d {D 36.1; P 329.627:0}\n" +
	    "1AO {D 225; P 329.627:0}\n" +
	    "g {D 38.9; P 329.627:0}\n" +
	    "~ {W \"HAS\" Undef !Emphatic !CitFunc}\n" +
	    "h {D 35; P 415.304:0}\n" +
	    "AE {D 225; P 415.304:0}\n" +
	    "z {D 40; P 415.304:0}\n" +
	    "_ {W \"FLEAS\" Noun}\n" +
	    "f {D 49.3; P 554.365:0}\n" +
	    "l {D 30.8; P 554.365:0}\n" +
	    "1IY {D 450; P 554.365:0}\n" +
	    "z {D 69.9; P 554.365:0}\n" +
	    ". {D 10}\n";
	var old_expected = 
	    "~ {W \"MY\" Undef !Emphatic !CitFunc}\n" +
	    "m {D 100; P 471:0 477:50}\n" +
	    "AY {D 200; P 493.883:0}\n" +
	    "_ {W \"DOG\" Noun}\n" +
	    "d {D 65; P 263.1:0 278.1:38 296.1:69 309.8:85}\n" +
	    "1AO {D 165; P 329.627:0}\n" +
	    "g {D 70; P 236.5:0}\n" +
	    "~ {W \"HAS\" Undef !Emphatic !CitFunc}\n" +
	    "h {D 70; P 387.1:0}\n" +
	    "AE {D 150; P 415.304:0}\n" +
	    "z {D 80; P 395.3:0 403.1:50}\n" +
	    "_ {W \"FLEAS\" Noun}\n" +
	    "f {D 120; P 372.9:0 402.3:29 454.9:63 472.3:71}\n" +
	    "l {D 75; P 553.6:0 571.4:40 573.3:60}\n" +
	    "1IY {D 235; P 554.365:0}\n" +
	    "z {D 170; P 490.2:0 453.2:56 452:85 462.5:100}\n" +
	    ". {D 10}\n";
	assertEquals(expected, text, "should set my dog has fleas")
    }
}

test()