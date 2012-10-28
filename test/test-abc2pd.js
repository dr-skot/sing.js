load("lib/assert.js")
load("abc2pd.js")

test.suite = {
    test_height_for_pitch: function() {
	assert(ABC.tools.heightForPitch(-1) == -1);
	assert(ABC.tools.heightForPitch(0) == 0);
	assert(ABC.tools.heightForPitch(1) == 2);
	assert(ABC.tools.heightForPitch(2) == 4);
	assert(ABC.tools.heightForPitch(3) == 5);
	assert(ABC.tools.heightForPitch(4) == 7);
	assert(ABC.tools.heightForPitch(5) == 9);
	assert(ABC.tools.heightForPitch(6) == 11);
	assert(ABC.tools.heightForPitch(7) == 12);
	assert(ABC.tools.heightForPitch(8) == 14);
	assert(ABC.tools.heightForPitch(15) == 26);
    },

    // basic
    basic: function() {
	var abc = "CGEA"
	var pd = "261.625 300 391.995 300 329.627 300 440 300"
	assertEquals(pd, ABC.abc2pd(abc))
    },

    // longer last note
    longer_last_note: function() {
	var abc = "CGEA2"
	var pd = "261.625 300 391.995 300 329.627 300 440 600"
	assertEquals(pd, ABC.abc2pd(abc))
    },

    // '<' notation
    right_angle_notation: function() {
	var abc = "CGE<A";
	var pd = "261.625 300 391.995 300 329.627 150 440 450";
	assertEquals(pd, ABC.abc2pd(abc))
    },

    // with a rest
    with_a_rest: function() {
	var abc = "CGEzA";
	var pd = "261.625 300 391.995 300 329.627 300 0 300 440 300";
	assertEquals(pd, ABC.abc2pd(abc))
    },

    // tempo
    tempo: function() {
	abc = "Q:1/8=1\nCGEA2";
	pd = "261.625 60000 391.995 60000 329.627 60000 440 120000";
	assertEquals(pd, ABC.abc2pd(abc))
    },

    // tuplet
    tuplet: function() {
	abc = "(3CGE A";
	pd = "261.625 200 391.995 200 329.627 200 440 300";
	assertEquals(pd, ABC.abc2pd(abc))
    },

    // slur (tie notation)
    slur_with_tie_notation: function() {
	abc = "G-C-E A2";
	pd = "391.995 300 TIE 261.625 300 TIE 329.627 300 440 600";
	assertEquals(pd, ABC.abc2pd(abc))
    },

    // slur (slur notation)
    slur_with_slur_notation: function() {
	abc = "(GCE)A";
	pd = "391.995 300 TIE 261.625 300 TIE 329.627 300 440 300";
	assertEquals(pd, ABC.abc2pd(abc))
    },

    slur_with_slur_notation_array: function() {
	var abc = "(GCE)A";
	var pd = [[[391.995, 300], [261.625, 300], [329.627, 300]], [[440, 300]]];
	assertArraysEqual(pd, ABC.abc2array(abc))
    },

    can_change_tempo: function() {
	var abc = 'CGEA2'
	var pd = [ [[261.625, 600]], [[391.995, 600]], [[329.627, 600]], [[440, 1200]] ]
	assertArraysEqual(pd, ABC.abc2array(abc, 2))
    },

    can_change_octave: function() {
	var pd = [ [[261.625, 300]], [[391.995, 300]], [[329.627, 300]], [[440, 600]] ]
	var expected = [ [[2*261.625, 300]], [[2*391.995, 300]], [[2*329.627, 300]], [[2*440, 600]] ]
	ABC.shiftPitch(pd, 1, 0)
	assertArraysEqual(expected, pd)
    },

    can_change_half_steps: function() {
	var pd = [ [[261.625, 300]], [[391.995, 300]], [[329.627, 300]], [[440, 600]] ]
	var expected = [ [[2*261.625, 300]], [[2*391.995, 300]], [[2*329.627, 300]], [[2*440, 600]] ]
	ABC.shiftPitch(pd, 0, 12)
	assertArraysEqual(expected, pd)
    },

    abc_to_array_can_change_octave: function() {
	var abc = "CGEA2"
	var expected = [ [[2*261.625, 300]], [[2*391.995, 300]], [[2*329.627, 300]], [[2*440, 600]] ]
	var actual = ABC.abc2array(abc, 1, 1, 0)
	assertArraysEqual(expected, actual)
    },

}

test();