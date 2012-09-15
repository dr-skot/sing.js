load("abc2pd.js");

// TODO use assert.js

// ASSERT
function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () { return 'AssertException: ' + this.message; }
function assert(exp, message) { 
    if (!exp) {
	print(message);
	throw new AssertException(message); 
    }
}

function testHeightForPitch() 
{
    assert(tools.heightForPitch(-1) == -1);
    assert(tools.heightForPitch(0) == 0);
    assert(tools.heightForPitch(1) == 2);
    assert(tools.heightForPitch(2) == 4);
    assert(tools.heightForPitch(3) == 5);
    assert(tools.heightForPitch(4) == 7);
    assert(tools.heightForPitch(5) == 9);
    assert(tools.heightForPitch(6) == 11);
    assert(tools.heightForPitch(7) == 12);
    assert(tools.heightForPitch(8) == 14);
    assert(tools.heightForPitch(15) == 26);
}
testHeightForPitch();

function testAbc2pd(abc, pd)
{
    var actual = abc2pd(abc);
    if (actual != pd) tools.printTune(abc);
    assert(abc2pd(abc) == pd, "For abc:\n" + abc + "\n  expected " + pd + "\n  got " + abc2pd(abc));
}

// basic
var abc = "CGEA";
var pd = "329.627 300 493.883 300 415.304 300 554.365 300";
testAbc2pd(abc, pd);

// longer last note
var abc = "CGEA2";
var pd = "329.627 300 493.883 300 415.304 300 554.365 600";
testAbc2pd(abc, pd);

// '<' notation
var abc = "CGE<A";
var pd = "329.627 300 493.883 300 415.304 150 554.365 450";
testAbc2pd(abc, pd);

// with a rest
var abc = "CGEzA";
var pd = "329.627 300 493.883 300 415.304 300 0 300 554.365 300";
testAbc2pd(abc, pd);

// tempo
abc = "Q:1/8=1\nCGEA2";
pd = "329.627 60000 493.883 60000 415.304 60000 554.365 120000";
testAbc2pd(abc, pd);

// tuplet
abc = "(3CGE A";
pd = "329.627 200 493.883 200 415.304 200 554.365 300";
testAbc2pd(abc, pd);

// slur (tie notation)
abc = "G-C-E A2";
pd = "493.883 300 TIE 329.627 300 TIE 415.304 300 554.365 600";
testAbc2pd(abc, pd);

// slur (slur notation)
abc = "(GCE)A";
pd = "493.883 300 TIE 329.627 300 TIE 415.304 300 554.365 300";
testAbc2pd(abc, pd);

print("tests passed");