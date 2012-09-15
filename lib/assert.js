function assert(condition, message) {
    if (typeof message === 'undefined') message = "";
    if (!condition) {
	message = "FAILED " + message;
	print(message);
    }
    return condition;
}

function assertTrue(condition, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    message += "expected |true|, got |false|";
    return assert(condition, message);
}

function assertFalse(condition, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    message += "expected |false|, got |true|";
    return assert(!condition, message);
}

function assertEquals(expected, actual, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    message += "expected |" + expected + "|, got |" + actual + "|";
    return assert(expected == actual ? true : false, message);
}

function assertIsClose(expected, actual, epsilon, message) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    message += "expected |" + expected + "|, got |" + actual + "|";
    return assert(Math.abs(expected - actual) <= epsilon ? true : false, message);
}

function assertArraysEqual(expected, actual, message) {
    m = typeof(message) === 'undefined' ? "" : message + ": ";
    var valid
    if (!assertIsArray(expected, message)) return false;
    if (!assertIsArray(actual, message)) return false;
    if (!assertEquals(expected.length, actual.length, 
		      m + "array lengths don't match")) return false;
    for (var i = 0; i < actual.length; i++) {
	if (isArray(expected[i])) {
	    assertIsArray(actual[i], message);
	    assertArraysEqual(expected[i], actual[i], message);
	} else {
	    assertEquals(expected[i], actual[i], 
			 m + "element " + i + " doesn't match");
	}
    }
}

function assertIsArray(value) {
    message = typeof(message) === 'undefined' ? "" : message + ": ";
    return assert(isArray(value), message + "not an array: " + value);
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

