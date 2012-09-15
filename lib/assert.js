function assert(condition, message) {
    if (typeof message === 'undefined') message = "";
    if (!condition) {
	message = "FAILED " + message;
	print(message);
    }
    return;
}

function assertTrue(condition, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    message += "expected |true|, got |false|";
    assert(condition, message);
}

function assertFalse(condition, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    message += "expected |false|, got |true|";
    assert(!condition, message);
}

function assertEquals(expected, actual, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    message += "expected |" + expected + "|, got |" + actual + "|";
    assert(expected == actual ? true : false, message);
}

function assertIsClose(expected, actual, epsilon, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    message += "expected |" + expected + "|, got |" + actual + "|";
    assert(Math.abs(expected - actual) <= epsilon ? true : false, message);
}

function assertArraysEqual(expected, actual, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    assertIsArray(expected);
    assertIsArray(actual);
    assertEquals(expected.length, actual.length, message + "array lengths don't match");
    for (var i = 0; i < actual.length; i++) {
	assertEquals(expected[i], actual[i], message + "element " + i + " doesn't match");
    }
}

function assertIsArray(value) {
    assert(isArray(value), "not an array: " + value);
}

function isArray(value) {
    return Object.prototype.toString.apply(value)==='[object Array]';
}

function test() {
    print("Running tests:");
    for (f in test.suite) {
	print(" - " + f);
	(test.suite[f])();
    }
    print("tests done\n");
}

