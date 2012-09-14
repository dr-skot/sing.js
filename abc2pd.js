// outlets
outlets = 1;
var PD_OUTLET = 0;

var set = list;
function list() {
  var args = Array.prototype.slice.call(arguments);
  $abc = args.join(" ");
  /*
  $abc = "% Generated more or less automatically by swtoabc by Erich Rickheit KSC\n" +
  "X:1\n" +
  "T:Little Sir Hugh\n" +
  "M:6/8\n" +
  "L:1/8\n" +
  "Q:90\n" +
  "K:G\n" +
  "z/2-^c/2|d-f dB-A B| GGD D2B/2-c/2|d-e dB-A G| A3- A2 A|d-e dB-A B|\\\n" +
  " G2 D D2 D|G-A Bc-B A| G3- G2||\n";
  */
  var parser = new AbcParse();
  parser.parse($abc);
  var tune = parser.getTune();
  var key = tune.lines[0].staff[0].key;
  var tempo = tune.metaText.tempo || { bpm:100, duration:[0.25] };
  var elements = tune.lines[0].staff[0].voices[0];
  var results = [];
  var tying = 0;
  elements.each(function(elem) {
      //console.log(elem);
    if (elem.el_type == "note") {
      var ms = tools.millisecondsForNote(elem, tempo);
      var freq;
      var symbol;
      if (elem.rest) {
        freq = 0;
        symbol = '%';
      } else {
        freq = tools.frequencyForNote(elem.pitches[0], key);
        var letter = tools.letterForPitch(elem.pitches[0].pitch);
        var acc = tools.accidentalForNote(elem.pitches[0], key);
        var accSymbol = tools.symbolForAcc(acc);
        symbol = letter + accSymbol;
        if (elem.pitches[0].startTie) tying = true;
        if (elem.pitches[0].endTie) tying = false;
      }
      results.push(tools.round(freq), tools.round(ms));
      if (tying) results.push("TIE");
    }
  });
  
  outputList(PD_OUTLET, results)
}

outputList.local = 1;
function outputList(outletNumber, list) {
  // TODO: find a shortcut for this
  var listMessage = ["list"];
  for (var i = 0; i < list.length; i++) {
    listMessage.push(list[i]);
  }
  outlet(outletNumber, listMessage);
}


// miscelaneous useful routines
var tools = {
  letterForPitch : function(pitch) {
    return "CDEFGAB".charAt((pitch + 700) % 7);
  },
  symbolForAcc : function(acc) {
    if (acc == 'dbl_flat') return 'bb';
    if (acc == 'flat') return 'b';
    if (acc == 'natural') return '=';
    if (acc == 'sharp') return '#';
    if (acc == 'dbl_sharp') return '##';
    return '';
  },
  accidentalForKey : function(pitch, key) {
    var acc = null;
    var note = this.letterForPitch(pitch).toLowerCase();
    key.accidentals.each(function(value) {
      if (value.note == note) acc = value.acc;
    });
    return acc;
  },
  accidentalForNote : function(note, key) {
    var pitch = note.pitch;
    var acc = note.accidental;
    if (null == key) acc || null;
    return (acc && acc != "none") ? acc : this.accidentalForKey(pitch, key); 
  },
  // converts name-indexed pitch (C=0 D=1 etc) to halfstep-indexed height (C=0 D=2 E=4 F=5)
  heightForPitch : function(pitch) {
    pitch += 700; // get rid of negative numbers
    var quotient = Math.floor(pitch/7);
    var remainder = pitch % 7;
    var strictHeight = [0, 2, 4, 5, 7, 9, 11][remainder];
    return (quotient * 12 + strictHeight) - 1200;
    },
  frequency : function(height, acc) {
     n = height - 5; // half steps up from A 440
     if ('dbl_flat' == acc) n -= 2;
     if ('flat' == acc) n -= 1;
     if ('sharp' == acc) n += 1;
     if ('dbl_flat' == acc) n += 2;
     return Math.pow(2, n/12) * 440;
    },
  frequencyForNote : function(note, key) {
    var height = this.heightForPitch(note.pitch);
    var acc = this.accidentalForNote(note, key);
    return this.frequency(height, acc);
    },
	millisecondsForNote : function(note, tempo) {
      var bpm = tempo.bpm;
      var beatLength = tempo.duration[0]; // why is this an array?
      var beats = note.duration / beatLength;
      return 60000 * beats/bpm;
    },
  round : function(num) {
      return Math.floor(num * 1000)/1000;
    },
  };



// make the top-level AbcParser functions private
AbcParseHeader.local = 1;
AbcTokenizer.local = 1;
AbcTune.local = 1;
AbcParse.local = 1;

/**
 * What follows is third-party code, namely AbcParse and its dependencies
 */

/*
    http://www.JSON.org/json2.js
    2011-02-23

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false, regexp: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    "use strict";

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                this.getUTCFullYear()     + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' : gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());


/*extern document */
/*global Ajax */
// A few useful prototype elements so we don't have to load the whole thing.

	Object.clone = function(source) {
		var destination = {};
		for (var property in source)
			destination[property] = source[property];
		return destination;
	};

	Object.keys = function(object) {
		var keys = [];
		for (var property in object)
			if (object.hasOwnProperty(property))
				keys.push(property);
		return keys;
	};

	Array.prototype.clone = function(source) {
		var destination = [];
		for (var i = 0; i < source.length; i++)
			destination.push(source[i]);
		return destination;
	};

	String.prototype.gsub = function(pattern, replacement) {
		return this.split(pattern).join(replacement);
	};

	String.prototype.strip = function() {
		return this.replace(/^\s+/, '').replace(/\s+$/, '');
	};

	String.prototype.startsWith = function(pattern) {
		return this.indexOf(pattern) === 0;
	};

	String.prototype.endsWith = function(pattern) {
		var d = this.length - pattern.length;
		return d >= 0 && this.lastIndexOf(pattern) === d;
	};

	Array.prototype.each = function(iterator, context) {
		for (var i = 0, length = this.length; i < length; i++)
		  iterator.apply(context, [this[i],i]);
	};

	Array.prototype.last = function() {
		if (this.length === 0)
			return null;
		return this[this.length-1];
	};

	Array.prototype.compact = function() {
		var output = [];
		for (var i = 0; i < this.length; i++) {
			if (this[i])
				output.push(this[i]);
		}
		return output;
	};

	Array.prototype.detect = function(iterator) {
		for (var i = 0; i < this.length; i++) {
			if (iterator(this[i]))
				return true;
		}
		return false;
	};



//    abc_parse_header.js: parses a the header fields from a string representing ABC Music Notation into a usable internal structure.
//    Copyright (C) 2010 Paul Rosen (paul at paulrosen dot net)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*extern AbcParseHeader */

function AbcParseHeader(tokenizer, warn, multilineVars, tune) {
	var key1sharp = {acc: 'sharp', note: 'f'};
	var key2sharp = {acc: 'sharp', note: 'c'};
	var key3sharp = {acc: 'sharp', note: 'g'};
	var key4sharp = {acc: 'sharp', note: 'd'};
	var key5sharp = {acc: 'sharp', note: 'A'};
	var key6sharp = {acc: 'sharp', note: 'e'};
	var key7sharp = {acc: 'sharp', note: 'B'};
	var key1flat = {acc: 'flat', note: 'B'};
	var key2flat = {acc: 'flat', note: 'e'};
	var key3flat = {acc: 'flat', note: 'A'};
	var key4flat = {acc: 'flat', note: 'd'};
	var key5flat = {acc: 'flat', note: 'G'};
	var key6flat = {acc: 'flat', note: 'c'};
	var key7flat = {acc: 'flat', note: 'f'};

	var keys = {
		'C#': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
		'A#m': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
		'G#Mix': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
		'D#Dor': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
		'E#Phr': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
		'F#Lyd': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],
		'B#Loc': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ],

		'F#': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
		'D#m': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
		'C#Mix': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
		'G#Dor': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
		'A#Phr': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
		'BLyd': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],
		'E#Loc': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp ],

		'B': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
		'G#m': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
		'F#Mix': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
		'C#Dor': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
		'D#Phr': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
		'ELyd': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],
		'A#Loc': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp ],

		'E': [ key1sharp, key2sharp, key3sharp, key4sharp ],
		'C#m': [ key1sharp, key2sharp, key3sharp, key4sharp ],
		'BMix': [ key1sharp, key2sharp, key3sharp, key4sharp ],
		'F#Dor': [ key1sharp, key2sharp, key3sharp, key4sharp ],
		'G#Phr': [ key1sharp, key2sharp, key3sharp, key4sharp ],
		'ALyd': [ key1sharp, key2sharp, key3sharp, key4sharp ],
		'D#Loc': [ key1sharp, key2sharp, key3sharp, key4sharp ],

		'A': [ key1sharp, key2sharp, key3sharp ],
		'F#m': [ key1sharp, key2sharp, key3sharp ],
		'EMix': [ key1sharp, key2sharp, key3sharp ],
		'BDor': [ key1sharp, key2sharp, key3sharp ],
		'C#Phr': [ key1sharp, key2sharp, key3sharp ],
		'DLyd': [ key1sharp, key2sharp, key3sharp ],
		'G#Loc': [ key1sharp, key2sharp, key3sharp ],

		'D': [ key1sharp, key2sharp ],
		'Bm': [ key1sharp, key2sharp ],
		'AMix': [ key1sharp, key2sharp ],
		'EDor': [ key1sharp, key2sharp ],
		'F#Phr': [ key1sharp, key2sharp ],
		'GLyd': [ key1sharp, key2sharp ],
		'C#Loc': [ key1sharp, key2sharp ],

		'G': [ key1sharp ],
		'Em': [ key1sharp ],
		'DMix': [ key1sharp ],
		'ADor': [ key1sharp ],
		'BPhr': [ key1sharp ],
		'CLyd': [ key1sharp ],
		'F#Loc': [ key1sharp ],

		'C': [],
		'Am': [],
		'GMix': [],
		'DDor': [],
		'EPhr': [],
		'FLyd': [],
		'BLoc': [],

		'F': [ key1flat ],
		'Dm': [ key1flat ],
		'CMix': [ key1flat ],
		'GDor': [ key1flat ],
		'APhr': [ key1flat ],
		'BbLyd': [ key1flat ],
		'ELoc': [ key1flat ],

		'Bb': [ key1flat, key2flat ],
		'Gm': [ key1flat, key2flat ],
		'FMix': [ key1flat, key2flat ],
		'CDor': [ key1flat, key2flat ],
		'DPhr': [ key1flat, key2flat ],
		'EbLyd': [ key1flat, key2flat ],
		'ALoc': [ key1flat, key2flat ],

		'Eb': [ key1flat, key2flat, key3flat ],
		'Cm': [ key1flat, key2flat, key3flat ],
		'BbMix': [ key1flat, key2flat, key3flat ],
		'FDor': [ key1flat, key2flat, key3flat ],
		'GPhr': [ key1flat, key2flat, key3flat ],
		'AbLyd': [ key1flat, key2flat, key3flat ],
		'DLoc': [ key1flat, key2flat, key3flat ],

		'Ab': [ key1flat, key2flat, key3flat, key4flat ],
		'Fm': [ key1flat, key2flat, key3flat, key4flat ],
		'EbMix': [ key1flat, key2flat, key3flat, key4flat ],
		'BbDor': [ key1flat, key2flat, key3flat, key4flat ],
		'CPhr': [ key1flat, key2flat, key3flat, key4flat ],
		'DbLyd': [ key1flat, key2flat, key3flat, key4flat ],
		'GLoc': [ key1flat, key2flat, key3flat, key4flat ],

		'Db': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
		'Bbm': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
		'AbMix': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
		'EbDor': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
		'FPhr': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
		'GbLyd': [ key1flat, key2flat, key3flat, key4flat, key5flat ],
		'CLoc': [ key1flat, key2flat, key3flat, key4flat, key5flat ],

		'Gb': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
		'Ebm': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
		'DbMix': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
		'AbDor': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
		'BbPhr': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
		'CbLyd': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],
		'FLoc': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat ],

		'Cb': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
		'Abm': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
		'GbMix': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
		'DbDor': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
		'EbPhr': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
		'FbLyd': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],
		'BbLoc': [ key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat ],

		// The following are not in the 2.0 spec, but seem normal enough.
		// TODO-PER: These SOUND the same as what's written, but they aren't right
		'A#': [ key1flat, key2flat ],
		'B#': [],
		'D#': [ key1flat, key2flat, key3flat ],
		'E#': [ key1flat ],
		'G#': [ key1flat, key2flat, key3flat, key4flat ],
		'Gbm': [ key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp ]
	};

	var calcMiddle = function(clef, oct) {
		var mid = 0;
		switch(clef) {
			case 'treble':
			case 'perc':
			case 'none':
			case 'treble+8':
			case 'treble-8':
				break;
			case 'bass3':
			case 'bass':
			case 'bass+8':
			case 'bass-8':
			case 'bass+16':
			case 'bass-16':
				mid = -12;
				break;
			case 'tenor':
				mid = -8;
				break;
			case 'alto2':
			case 'alto1':
			case 'alto':
			case 'alto+8':
			case 'alto-8':
				mid = -6;
				break;
		}
		return mid+oct;
	};

	this.parseFontChangeLine = function(textstr) {
		var textParts = textstr.split('$');
		if (textParts.length > 1 && multilineVars.setfont) {
			var textarr = [ { text: textParts[0] }];
			for (var i = 1; i < textParts.length; i++) {
				if (textParts[i].charAt(0) === '0')
					textarr.push({ text: textParts[i].substring(1) });
				else if (textParts[i].charAt(0) === '1' && multilineVars.setfont[1])
					textarr.push({font: multilineVars.setfont[1], text: textParts[i].substring(1) });
				else if (textParts[i].charAt(0) === '2' && multilineVars.setfont[2])
					textarr.push({font: multilineVars.setfont[2], text: textParts[i].substring(1) });
				else if (textParts[i].charAt(0) === '3' && multilineVars.setfont[3])
					textarr.push({font: multilineVars.setfont[3], text: textParts[i].substring(1) });
				else if (textParts[i].charAt(0) === '4' && multilineVars.setfont[4])
					textarr.push({font: multilineVars.setfont[4], text: textParts[i].substring(1) });
				else
					textarr[textarr.length-1].text += '$' + textParts[i];
			}
			if (textarr.length > 1)
				return textarr;
		}
		return textstr;
	}

	this.deepCopyKey = function(key) {
	    var ret = { accidentals: [], root: key.root, acc: key.acc, mode: key.mode };
	    key.accidentals.each(function(k) {
		ret.accidentals.push(Object.clone(k));
	    });
	    return ret;
	};

	var pitches = {A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11};

	this.addPosToKey = function(clef, key) {
		// Shift the key signature from the treble positions to whatever position is needed for the clef.
		// This may put the key signature unnaturally high or low, so if it does, then shift it.
		var mid = clef.verticalPos;
		key.accidentals.each(function(acc) {
			var pitch = pitches[acc.note];
			pitch = pitch - mid;
			acc.verticalPos = pitch;
		});
		if (mid < -10) {
			key.accidentals.each(function(acc) {
				acc.verticalPos -= 7;
				if (acc.verticalPos >= 11 || (acc.verticalPos === 10 && acc.acc === 'flat'))
					acc.verticalPos -= 7;
			});
		} else if (mid < -4) {
			key.accidentals.each(function(acc) {
				acc.verticalPos -= 7;
			});
		} else if (mid >= 7) {
			key.accidentals.each(function(acc) {
				acc.verticalPos += 7;
			});
		}
	};

	this.fixKey = function(clef, key) {
		var fixedKey = Object.clone(key);
		this.addPosToKey(clef, fixedKey);
		return fixedKey;
	};

	var parseMiddle = function(str) {
	  var mid = pitches[str.charAt(0)];
		for (var i = 1; i < str.length; i++) {
			if (str.charAt(i) === ',') mid -= 7;
			else if (str.charAt(i) === ',') mid += 7;
			else break;
		}
		return { mid: mid - 6, str: str.substring(i) };	// We get the note in the middle of the staff. We want the note that appears as the first ledger line below the staff.
	};

	var normalizeAccidentals = function(accs) {
		for (var i = 0; i < accs.length; i++) {
			if (accs[i].note === 'b')
				accs[i].note = 'B';
			else if (accs[i].note === 'a')
				accs[i].note = 'A';
			else if (accs[i].note === 'F')
				accs[i].note = 'f';
			else if (accs[i].note === 'E')
				accs[i].note = 'e';
			else if (accs[i].note === 'D')
				accs[i].note = 'd';
			else if (accs[i].note === 'C')
				accs[i].note = 'c';
			else if (accs[i].note === 'G' && accs[i].acc === 'sharp')
				accs[i].note = 'g';
			else if (accs[i].note === 'g' && accs[i].acc === 'flat')
				accs[i].note = 'G';
		}
	};

	this.parseKey = function(str)	// (and clef)
	{
		// returns:
		//		{ foundClef: true, foundKey: true }
		// Side effects: 
		//		calls warn() when there is a syntax error
		//		sets these members of multilineVars:
		//			clef
		//			key
		//			style
		//
		// The format is:
		// K: [⟨key⟩] [⟨modifiers⟩*]
		// modifiers are any of the following in any order:
		//  [⟨clef⟩] [middle=⟨pitch⟩] [transpose=[-]⟨number⟩] [stafflines=⟨number⟩] [staffscale=⟨number⟩][style=⟨style⟩]
		// key is none|HP|Hp|⟨specified_key⟩
		// clef is [clef=] [⟨clef type⟩] [⟨line number⟩] [+8|-8]
		// specified_key is ⟨pitch⟩[#|b][mode(first three chars are significant)][accidentals*]
		if (str.length === 0) {
			// an empty K: field is the same as K:none
			str = 'none';
		}
		var tokens = tokenizer.tokenize(str, 0, str.length);
		var ret = {};

		// first the key
		switch (tokens[0].token) {
			case 'HP':
				this.addDirective("bagpipes");
				multilineVars.key = { root: "HP", accidentals: [], acc: "", mode: "" };
				ret.foundKey = true;
				tokens.shift();
				break;
			case 'Hp':
				this.addDirective("bagpipes");
				multilineVars.key = { root: "Hp", accidentals: [{acc: 'natural', note: 'g'}, {acc: 'sharp', note: 'f'}, {acc: 'sharp', note: 'c'}], acc: "", mode: "" };
				ret.foundKey = true;
				tokens.shift();
				break;
			case 'none':
				// we got the none key - that's the same as C to us
				multilineVars.key = { root: "none", accidentals: [], acc: "", mode: "" };
				ret.foundKey = true;
				tokens.shift();
				break;
			default:
				var retPitch = tokenizer.getKeyPitch(tokens[0].token);
				if (retPitch.len > 0) {
					ret.foundKey = true;
					var acc = "";
					var mode = "";
					// The accidental and mode might be attached to the pitch, so we might want to just remove the first character.
					if (tokens[0].token.length > 1)
						tokens[0].token = tokens[0].token.substring(1);
					else
						tokens.shift();
					var key = retPitch.token;
					// We got a pitch to start with, so we might also have an accidental and a mode
					if (tokens.length > 0) {
						var retAcc = tokenizer.getSharpFlat(tokens[0].token);
						if (retAcc.len > 0) {
							if (tokens[0].token.length > 1)
								tokens[0].token = tokens[0].token.substring(1);
							else
								tokens.shift();
							key += retAcc.token;
							acc = retAcc.token;
						}
						if (tokens.length > 0) {
							var retMode = tokenizer.getMode(tokens[0].token);
							if (retMode.len > 0) {
								tokens.shift();
								key += retMode.token;
								mode = retMode.token;
							}
						}
					}
					// We need to do a deep copy because we are going to modify it
					multilineVars.key = this.deepCopyKey({accidentals: keys[key]});
					multilineVars.key.root = retPitch.token;
					multilineVars.key.acc = acc;
					multilineVars.key.mode = mode;
				}
				break;
		}

		// There are two special cases of deprecated syntax. Ignore them if they occur
		if (tokens.length === 0) return ret;
		if (tokens[0].token === 'exp') tokens.shift();
		if (tokens.length === 0) return ret;
		if (tokens[0].token === 'oct') tokens.shift();

		// now see if there are extra accidentals
		if (tokens.length === 0) return ret;
		var accs = tokenizer.getKeyAccidentals2(tokens);
		if (accs.warn)
			warn(accs.warn, str, 0);
		// If we have extra accidentals, first replace ones that are of the same pitch before adding them to the end.
		if (accs.accs) {
			if (!ret.foundKey) {		// if there are only extra accidentals, make sure this is set.
				ret.foundKey = true;
				multilineVars.key = { root: "none", acc: "", mode: "", accidentals: [] };
			}
			normalizeAccidentals(accs.accs);
			for (var i = 0; i < accs.accs.length; i++) {
				var found = false;
				for (var j = 0; j < multilineVars.key.accidentals.length && !found; j++) {
					if (multilineVars.key.accidentals[j].note === accs.accs[i].note) {
						found = true;
						multilineVars.key.accidentals[j].acc = accs.accs[i].acc;
					}
				}
				if (!found)
					multilineVars.key.accidentals.push(accs.accs[i]);
			}
		}

		// Now see if any optional parameters are present. They have the form "key=value", except that "clef=" is optional
		var token;
		while (tokens.length > 0) {
			switch (tokens[0].token) {
				case "m":
				case "middle":
					tokens.shift();
					if (tokens.length === 0) { warn("Expected = after middle", str, 0); return ret; }
					token = tokens.shift();
					if (token.token !== "=") { warn("Expected = after middle", str, 0); break; }
					if (tokens.length === 0) { warn("Expected parameter after middle=", str, 0); return ret; }
					var pitch = tokenizer.getPitchFromTokens(tokens);
					if (pitch.warn)
						warn(pitch.warn, str, 0);
					if (pitch.position)
						multilineVars.clef.verticalPos = pitch.position - 6;	// we get the position from the middle line, but want to offset it to the first ledger line.
					break;
				case "transpose":
					tokens.shift();
					if (tokens.length === 0) { warn("Expected = after transpose", str, 0); return ret; }
					token = tokens.shift();
					if (token.token !== "=") { warn("Expected = after transpose", str, 0); break; }
					if (tokens.length === 0) { warn("Expected parameter after transpose=", str, 0); return ret; }
					if (tokens[0].type !== 'number') { warn("Expected number after transpose", str, 0); break; }
					multilineVars.clef.transpose = parseInt(tokens[0].token);
					tokens.shift();
					break;
				case "stafflines":
					tokens.shift();
					if (tokens.length === 0) { warn("Expected = after stafflines", str, 0); return ret; }
					token = tokens.shift();
					if (token.token !== "=") { warn("Expected = after stafflines", str, 0); break; }
					if (tokens.length === 0) { warn("Expected parameter after stafflines=", str, 0); return ret; }
					if (tokens[0].type !== 'number') { warn("Expected number after stafflines", str, 0); break; }
					multilineVars.clef.stafflines = parseInt(tokens[0].token);
					tokens.shift();
					break;
				case "staffscale":
					tokens.shift();
					if (tokens.length === 0) { warn("Expected = after staffscale", str, 0); return ret; }
					token = tokens.shift();
					if (token.token !== "=") { warn("Expected = after staffscale", str, 0); break; }
					if (tokens.length === 0) { warn("Expected parameter after staffscale=", str, 0); return ret; }
					if (tokens[0].type !== 'number') { warn("Expected number after staffscale", str, 0); break; }
					multilineVars.clef.staffscale = parseInt(tokens[0].token);
					tokens.shift();
					break;
				case "style":
					tokens.shift();
					if (tokens.length === 0) { warn("Expected = after style", str, 0); return ret; }
					token = tokens.shift();
					if (token.token !== "=") { warn("Expected = after style", str, 0); break; }
					if (tokens.length === 0) { warn("Expected parameter after style=", str, 0); return ret; }
					switch (tokens[0].token) {
						case "normal":
						case "harmonic":
						case "rhythm":
						case "x":
							multilineVars.style = tokens[0].token;
							tokens.shift();
							break;
						default:
							warn("error parsing style element: " + tokens[0].token, str, 0);
							break;
					}
					break;
				case "clef":
					tokens.shift();
					if (tokens.length === 0) { warn("Expected = after clef", str, 0); return ret; }
					token = tokens.shift();
					if (token.token !== "=") { warn("Expected = after clef", str, 0); break; }
					if (tokens.length === 0) { warn("Expected parameter after clef=", str, 0); return ret; }
					//break; yes, we want to fall through. That allows "clef=" to be optional.
				case "treble":
				case "bass":
				case "alto":
				case "tenor":
				case "perc":
					// clef is [clef=] [⟨clef type⟩] [⟨line number⟩] [+8|-8]
					var clef = tokens.shift();
					switch (clef.token) {
						case 'treble':
						case 'tenor':
						case 'alto':
						case 'bass':
						case 'perc':
						case 'none':
							break;
						case 'C': clef.token = 'alto'; break;
						case 'F': clef.token = 'bass'; break;
						case 'G': clef.token = 'treble'; break;
						case 'c': clef.token = 'alto'; break;
						case 'f': clef.token = 'bass'; break;
						case 'g': clef.token = 'treble'; break;
						default:
							warn("Expected clef name. Found " + clef.token, str, 0);
							break;
					}
					if (tokens.length > 0 && tokens[0].type === 'number') {
						clef.token += tokens[0].token;
						tokens.shift();
					}
					if (tokens.length > 1 && (tokens[0].token === '-' || tokens[0].token === '+') && tokens[1].token === '8') {
						clef.token += tokens[0].token + tokens[1].token;
						tokens.shift();
						tokens.shift();
					}
					multilineVars.clef = {type: clef.token, verticalPos: calcMiddle(clef.token, 0)};
					ret.foundClef = true;
					break;
				default:
					warn("Unknown parameter: " + tokens[0].token, str, 0);
					tokens.shift();
			}
		}
		return ret;
	};

	this.parseKeyOld = function(str)	// (and clef)
	{
		str = tokenizer.stripComment(str);
		var origStr = str;
		if (str.length === 0) {
			// an empty K: field is the same as K:none
			str = 'none';
		}
		// The format is:
		// [space][tonic[#|b][ ][3-letter-mode][ignored-chars][space]][ accidentals...][ clef=treble|bass|bass3|tenor|alto|alto2|alto1|none [+8|-8] [middle=note] [transpose=num] [stafflines=num] ]
		// K: ⟨key⟩ [[clef=] [clef type] [line number] [+8|-8]] [middle=⟨pitch⟩] [transpose=] [stafflines=⟨number⟩] [staffscale=⟨number⟩][style=⟨style⟩]
		// V: ⟨voice name⟩ [clef=] [clef type] [name=] [sname=] [merge] [stem=] [up | down | auto] [gstem=] [up | down | auto] [dyn=] [up | down | auto] [lyrics=] [up | down | auto] [gchord=] [up | down | auto] [scale=] [staffscale=] [stafflines=]
		// -- or -- the key can be "none"
		// First get the key letter: turn that into a index into the key array (0-11)
		// Then see if there is a sharp or flat. Increment or decrement.
		// Then see if there is a mode modifier. Add or subtract to the index.
		// Then do a mod 12 on the index and return the key.
		// TODO: This may leave unparsed characters at the end after something reasonable was found.
	        // TODO: The above description does not seem to be valid as key names rather than indexes are used -- GD

		var setClefMiddle = function(str) {
			var i = tokenizer.skipWhiteSpace(str);
			str = str.substring(i);
			if (str.startsWith('m=') || str.startsWith('middle=')) {
				str = str.substring(str.indexOf('=')+1);
				var mid = parseMiddle(str);
				multilineVars.clef.verticalPos = mid.mid;
				str = mid.str;
			}
			i = tokenizer.skipWhiteSpace(str);
			str = str.substring(i);
			if (str.startsWith('transpose=')) {
				str = str.substring(str.indexOf('=')+1);
				var num = tokenizer.getInt(str);
				if (num.digits > 0) {
					str = str.substring(num.digits);
					multilineVars.clef.transpose = num.value;
				}
			}
			i = tokenizer.skipWhiteSpace(str);
			str = str.substring(i);
			if (str.startsWith('stafflines=')) {
				str = str.substring(str.indexOf('=')+1);
				var num2 = tokenizer.getInt(str);
				if (num2.digits > 0) {
					str = str.substring(num2.digits);
					multilineVars.clef.stafflines = num2.value;
				}
			}
		};
		// check first to see if there is only a clef. If so, just take that, but ignore an error after that.
		var retClef = tokenizer.getClef(str, true);
		if (retClef.token !== undefined && (retClef.explicit === true || retClef.token !== 'none')) {	// none, C, F, and G are the only ambiguous marking. We need to assume that's a key
			multilineVars.clef = {type: retClef.token, verticalPos: calcMiddle(retClef.token, 0)};
			str = str.substring(retClef.len);
			setClefMiddle(str);
			return {foundClef: true};
		        //TODO multilinevars.key is not set - is this normal? -- GD
		}

		var ret = { root: 'none', acc: '', mode: '' };

		var retPitch = tokenizer.getKeyPitch(str);
		if (retPitch.len > 0) {
			var key = retPitch.token;
			str = str.substring(retPitch.len);
			// We got a pitch to start with, so we might also have an accidental and a mode
			var retAcc = tokenizer.getSharpFlat(str);
			if (retAcc.len > 0) {
				key += retAcc.token;
				str = str.substring(retAcc.len);
			}
			var retMode = tokenizer.getMode(str);
			if (retMode.len > 0) {
				key += retMode.token;
				str = str.substring(retMode.len);
			}
			// We need to do a deep copy because we are going to modify it
			ret = this.deepCopyKey({accidentals: keys[key]});
			ret.root = retPitch.token;
			ret.acc = retAcc.token || "";
			ret.mode = retMode.token || "";
		} else if (str.startsWith('HP')) {
			this.addDirective("bagpipes");
			ret.accidentals = [];
			ret.root = "HP";
			multilineVars.key = ret;
			return {foundKey: true};
		} else if (str.startsWith('Hp')) {
			ret.accidentals = [ {acc: 'natural', note: 'g'}, {acc: 'sharp', note: 'f'}, {acc: 'sharp', note: 'c'} ];
			this.addDirective("bagpipes");
			ret.root = "Hp";
			multilineVars.key = ret;
			return {foundKey: true};
		} else {
			var retNone = tokenizer.isMatch(str, 'none');
			if (retNone > 0) {
				// we got the none key - that's the same as C to us
				ret.accidentals = [];
				str = str.substring(retNone);
			}
		}
		// There are two special cases of deprecated syntax. Ignore them if they occur
		var j = tokenizer.skipWhiteSpace(str);
		str = str.substring(j);
		if (str.startsWith('exp') || str.startsWith('oct'))
			str = str.substring(3);

		// now see if there are extra accidentals
		var done = false;
		while (!done) {
			var retExtra = tokenizer.getKeyAccidental(str);
			if (retExtra.len === 0)
				done = true;
			else {
				str = str.substring(retExtra.len);
				if (retExtra.warn)
					warn("error parsing extra accidentals:", origStr, 0);
				else {
					if (!ret.accidentals)
						ret.accidentals = [];
					ret.accidentals.push(retExtra.token);
				}
			}
		}

		// now see if there is a clef
		retClef = tokenizer.getClef(str, false);
		if (retClef.len > 0) {
			if (retClef.warn)
				warn("error parsing clef:" + retClef.warn, origStr, 0);
			else {
				//ret.clef = retClef.token;
				multilineVars.clef = {type: retClef.token, verticalPos: calcMiddle(retClef.token, 0)};
				str = str.substring(retClef.len);
				setClefMiddle(str);
			}
		}

		// now see if there is a note style
		i = tokenizer.skipWhiteSpace(str);
		str = str.substring(i);
		if (str.startsWith('style=')) {
			var style = tokenizer.getToken(str, 6, str.length);
			switch (style) {
				case "normal":
				case "harmonic":
				case "rhythm":
				case "x":
					multilineVars.style = style;
					break;
				default:
					warn("error parsing style element of key: ", origStr, 0);
					break;
			}
			str = str.substring(6+style.length);
		}

//		if (ret.accidentals === undefined && retClef.token === undefined) {
//			warn("error parsing key: ", origStr, 0);
//			return {};
//		}
		var result = {};
		if (retClef.token !== undefined)
			result.foundClef = true;
		if (ret.accidentals !== undefined) {
			// Adjust the octave of the accidentals, if necessary
			ret.accidentals.each(function(acc) {
				if (retClef.token === 'bass') {
					//if (acc.note === 'A') acc.note = 'a';
					//if (acc.note === 'B') acc.note = 'b';
					if (acc.note === 'C') acc.note = 'c';
					if (acc.note === 'D' && acc.acc !== 'flat') acc.note = 'd';
					if (acc.note === 'E' && acc.acc !== 'flat') acc.note = 'e';
					if (acc.note === 'F' && acc.acc !== 'flat') acc.note = 'f';
					if (acc.note === 'G' && acc.acc !== 'flat') acc.note = 'g';
				} else {
					if (acc.note === 'a') acc.note = 'A';
					if (acc.note === 'b') acc.note = 'B';
					if (acc.note === 'C') acc.note = 'c';
				}
			});
			multilineVars.key = ret;
			result.foundKey = true;
		}
		return result;
	};

	this.addDirective = function(str) {
		var getRequiredMeasurement = function(cmd, tokens) {
			var points = tokenizer.getMeasurement(tokens);
			if (points.used === 0 || tokens.length !== 0)
				return { error: "Directive \"" + cmd + "\" requires a measurement as a parameter."};
			return points.value;
		};
		var oneParameterMeasurement = function(cmd, tokens) {
			var points = tokenizer.getMeasurement(tokens);
			if (points.used === 0 || tokens.length !== 0)
				return "Directive \"" + cmd + "\" requires a measurement as a parameter.";
			tune.formatting[cmd] = points.value;
			return null;
		};
		var getFontParameter = function(tokens) {
			var font = {};
			var token = tokens.last();
			if (token.type === 'number') {
				font.size = parseInt(token.token);
				tokens.pop();
			}
			if (tokens.length > 0) {
				var scratch = "";
				tokens.each(function(tok) {
					if (tok.token !== '-') {
						if (scratch.length > 0) scratch += ' ';
						scratch += tok.token;
					}
				});
				font.font = scratch;
			}
			return font;
		};
		var getChangingFont = function(cmd, tokens) {
			if (tokens.length === 0)
				return "Directive \"" + cmd + "\" requires a font as a parameter.";
			multilineVars[cmd] = getFontParameter(tokens);
			return null;
		};
		var getGlobalFont = function(cmd, tokens) {
			if (tokens.length === 0)
				return "Directive \"" + cmd + "\" requires a font as a parameter.";
			tune.formatting[cmd] = getFontParameter(tokens);
			return null;
		};

		var tokens = tokenizer.tokenize(str, 0, str.length);	// 3 or more % in a row, or just spaces after %% is just a comment
		if (tokens.length === 0 || tokens[0].type !== 'alpha') return null;
		var restOfString = str.substring(str.indexOf(tokens[0].token)+tokens[0].token.length);
		restOfString = tokenizer.stripComment(restOfString);
		var cmd = tokens.shift().token.toLowerCase();
		var num;
		var scratch = "";
		switch (cmd)
		{
			// The following directives were added to abc_parser_lint, but haven't been implemented here.
			// Most of them are direct translations from the directives that will be parsed in. See abcm2ps's format.txt for info on each of these.
			//					alignbars: { type: "number", optional: true },
			//					aligncomposer: { type: "string", Enum: [ 'left', 'center','right' ], optional: true },
			//					annotationfont: fontType,
			//					barsperstaff: { type: "number", optional: true },
			//					bstemdown: { type: "boolean", optional: true },
			//					continueall: { type: "boolean", optional: true },
			//					dynalign: { type: "boolean", optional: true },
			//					exprabove: { type: "boolean", optional: true },
			//					exprbelow: { type: "boolean", optional: true },
			//					flatbeams: { type: "boolean", optional: true },
			//					footer: { type: "string", optional: true },
			//					footerfont: fontType,
			//					gchordbox: { type: "boolean", optional: true },
			//					graceslurs: { type: "boolean", optional: true },
			//					gracespacebefore: { type: "number", optional: true },
			//					gracespaceinside: { type: "number", optional: true },
			//					gracespaceafter: { type: "number", optional: true },
			//					header: { type: "string", optional: true },
			//					headerfont: fontType,
			//					historyfont: fontType,
			//					infofont: fontType,
			//					infospace: { type: "number", optional: true },
			//					lineskipfac: { type: "number", optional: true },
			//					maxshrink: { type: "number", optional: true },
			//					maxstaffsep: { type: "number", optional: true },
			//					maxsysstaffsep: { type: "number", optional: true },
			//					measurebox: { type: "boolean", optional: true },
			//					measurefont: fontType,
			//					notespacingfactor: { type: "number", optional: true },
			//					parskipfac: { type: "number", optional: true },
			//					partsbox: { type: "boolean", optional: true },
			//					repeatfont: fontType,
			//					rightmargin: { type: "number", optional: true },
			//					slurheight: { type: "number", optional: true },
			//					splittune: { type: "boolean", optional: true },
			//					squarebreve: { type: "boolean", optional: true },
			//					stemheight: { type: "number", optional: true },
			//					straightflags: { type: "boolean", optional: true },
			//					stretchstaff: { type: "boolean", optional: true },
			//					textfont: fontType,
			//					titleformat: { type: "string", optional: true },
			//					vocalabove: { type: "boolean", optional: true },
			//					vocalfont: fontType,
			//					wordsfont: fontType,
			case "bagpipes":tune.formatting.bagpipes = true;break;
			case "landscape":multilineVars.landscape = true;break;
			case "papersize":multilineVars.papersize = restOfString;break;
			case "slurgraces":tune.formatting.slurgraces = true;break;
			case "stretchlast":tune.formatting.stretchlast = true;break;
			case "titlecaps":multilineVars.titlecaps = true;break;
			case "titleleft":tune.formatting.titleleft = true;break;
			case "measurebox":tune.formatting.measurebox = true;break;

			case "botmargin":
			case "botspace":
			case "composerspace":
			case "indent":
			case "leftmargin":
			case "linesep":
			case "musicspace":
			case "partsspace":
			case "pageheight":
			case "pagewidth":
			case "rightmargin":
			case "staffsep":
			case "staffwidth":
			case "subtitlespace":
			case "sysstaffsep":
			case "systemsep":
			case "textspace":
			case "titlespace":
			case "topmargin":
			case "topspace":
			case "vocalspace":
			case "wordsspace":
				return oneParameterMeasurement(cmd, tokens);
			case "vskip":
				var vskip = getRequiredMeasurement(cmd, tokens);
				if (vskip.error)
					return vskip.error;
				tune.addSpacing(vskip);
				return null;
				break;
			case "scale":
				scratch = "";
				tokens.each(function(tok) {
					scratch += tok.token;
				});
				num = parseFloat(scratch);
				if (isNaN(num) || num === 0)
					return "Directive \"" + cmd + "\" requires a number as a parameter.";
				tune.formatting.scale = num;
				break;
			case "sep":
				if (tokens.length === 0)
					tune.addSeparator();
				else {
					var points = tokenizer.getMeasurement(tokens);
					if (points.used === 0)
						return "Directive \"" + cmd + "\" requires 3 numbers: space above, space below, length of line";
					var spaceAbove = points.value;

					points = tokenizer.getMeasurement(tokens);
					if (points.used === 0)
						return "Directive \"" + cmd + "\" requires 3 numbers: space above, space below, length of line";
					var spaceBelow = points.value;

					points = tokenizer.getMeasurement(tokens);
					if (points.used === 0 || tokens.length !== 0)
						return "Directive \"" + cmd + "\" requires 3 numbers: space above, space below, length of line";
					var lenLine = points.value;
					tune.addSeparator(spaceAbove, spaceBelow, lenLine);
				}
				break;
			case "measurenb":
				if (tokens.length !== 1 || tokens[0].type !== 'number')
					return "Directive \"" + cmd + "\" requires a number as a parameter.";
				multilineVars.barNumbers = parseInt(tokens[0].token);
				break;
			case "barnumbers":
				if (tokens.length !== 1 || tokens[0].type !== 'number')
					return "Directive \"" + cmd + "\" requires a number as a parameter.";
				multilineVars.barNumbers = parseInt(tokens[0].token);
				break;
			case "begintext":
				multilineVars.inTextBlock = true;
				break;
			case "beginps":
				multilineVars.inPsBlock = true;
				warn("Postscript ignored", str, 0);
				break;
			case "deco":
				if (restOfString.length > 0)
					multilineVars.ignoredDecorations.push(restOfString.substring(0, restOfString.indexOf(' ')));
				warn("Decoration redefinition ignored", str, 0);
				break;
			case "text":
				var textstr = tokenizer.translateString(restOfString);
				tune.addText(this.parseFontChangeLine(textstr));
				break;
			case "center":
				var centerstr = tokenizer.translateString(restOfString);
				tune.addCentered(this.parseFontChangeLine(centerstr));
				break;
			case "font":
				// don't need to do anything for this; it is a useless directive
				break;
			case "setfont":
				var sfTokens = tokenizer.tokenize(restOfString, 0, restOfString.length);
				var sfDone = false;
				if (sfTokens.length >= 4) {
					if (sfTokens[0].token === '-' && sfTokens[1].type === 'number') {
						var sfNum = parseInt(sfTokens[1].token);
						if (sfNum >= 1 && sfNum <= 4) {
							if (!multilineVars.setfont)
								multilineVars.setfont = [];
							var sfSize = sfTokens.pop();
							if (sfSize.type === 'number') {
								sfSize = parseInt(sfSize.token);
								var sfFontName = '';
								for (var sfi = 2; sfi < sfTokens.length; sfi++)
									sfFontName += sfTokens[sfi].token;
								multilineVars.setfont[sfNum] = { font: sfFontName, size: sfSize };
								sfDone = true;
							}
						}
					}
				}
				if (!sfDone)
					return "Bad parameters: " + cmd;
				break;
			case "gchordfont":
			case "partsfont":
			case "vocalfont":
			case "textfont":
				return getChangingFont(cmd, tokens);
			case "barlabelfont":
			case "barnumberfont":
			case "composerfont":
			case "subtitlefont":
			case "tempofont":
			case "titlefont":
			case "voicefont":
				return getGlobalFont(cmd, tokens);
			case "barnumfont":
				return getGlobalFont("barnumberfont", tokens);
			case "staves":
			case "score":
				multilineVars.score_is_present = true;
				var addVoice = function(id, newStaff, bracket, brace, continueBar) {
					if (newStaff || multilineVars.staves.length === 0) {
						multilineVars.staves.push({index: multilineVars.staves.length, numVoices: 0});
					}
					var staff = multilineVars.staves.last();
					if (bracket !== undefined) staff.bracket = bracket;
					if (brace !== undefined) staff.brace = brace;
					if (continueBar) staff.connectBarLines = 'end';
					if (multilineVars.voices[id] === undefined) {
						multilineVars.voices[id] = {staffNum: staff.index, index: staff.numVoices};
						staff.numVoices++;
					}
				};

				var openParen = false;
				var openBracket = false;
				var openBrace = false;
				var justOpenParen = false;
				var justOpenBracket = false;
				var justOpenBrace = false;
				var continueBar = false;
				var lastVoice = undefined;
				var addContinueBar = function() {
					continueBar = true;
					if (lastVoice) {
						var ty = 'start';
						if (lastVoice.staffNum > 0) {
							if (multilineVars.staves[lastVoice.staffNum-1].connectBarLines === 'start' ||
								multilineVars.staves[lastVoice.staffNum-1].connectBarLines === 'continue')
								ty = 'continue';
						}
						multilineVars.staves[lastVoice.staffNum].connectBarLines = ty;
					}
				};
				while (tokens.length) {
					var t = tokens.shift();
					switch (t.token) {
						case '(':
							if (openParen) warn("Can't nest parenthesis in %%score", str, t.start);
							else {openParen = true;justOpenParen = true;}
							break;
						case ')':
							if (!openParen || justOpenParen) warn("Unexpected close parenthesis in %%score", str, t.start);
							else openParen = false;
							break;
						case '[':
							if (openBracket) warn("Can't nest brackets in %%score", str, t.start);
							else {openBracket = true;justOpenBracket = true;}
							break;
						case ']':
							if (!openBracket || justOpenBracket) warn("Unexpected close bracket in %%score", str, t.start);
							else {openBracket = false;multilineVars.staves[lastVoice.staffNum].bracket = 'end';}
							break;
						case '{':
							if (openBrace ) warn("Can't nest braces in %%score", str, t.start);
							else {openBrace = true;justOpenBrace = true;}
							break;
						case '}':
							if (!openBrace || justOpenBrace) warn("Unexpected close brace in %%score", str, t.start);
							else {openBrace = false;multilineVars.staves[lastVoice.staffNum].brace = 'end';}
							break;
						case '|':
							addContinueBar();
							break;
						default:
							var vc = "";
							while (t.type === 'alpha' || t.type === 'number') {
								vc += t.token;
								if (t.continueId)
									t = tokens.shift();
								else
									break;
							}
							var newStaff = !openParen || justOpenParen;
							var bracket = justOpenBracket ? 'start' : openBracket ? 'continue' : undefined;
							var brace = justOpenBrace ? 'start' : openBrace ? 'continue' : undefined;
							addVoice(vc, newStaff, bracket, brace, continueBar);
							justOpenParen = false;
							justOpenBracket = false;
							justOpenBrace = false;
							continueBar = false;
							lastVoice = multilineVars.voices[vc];
							if (cmd === 'staves')
								addContinueBar();
							break;
					}
				}
				break;

			case "newpage":
				var pgNum = tokenizer.getInt(restOfString);
				tune.addNewPage(pgNum.digits === 0 ? -1 : pgNum.value);
				break;

			case "abc-copyright":
			case "abc-creator":
			case "abc-version":
			case "abc-charset":
			case "abc-edited-by":
				tune.addMetaText(cmd, restOfString);
				break;
			case "header":
			case "footer":
				var footerStr = tokenizer.getMeat(restOfString, 0, restOfString.length);
				footerStr = restOfString.substring(footerStr.start, footerStr.end);
				if (footerStr.charAt(0) === '"' && footerStr.charAt(footerStr.length-1) === '"' )
					footerStr = footerStr.substring(1, footerStr.length-2);
				var footerArr = footerStr.split('\t');
				var footer = {};
				if (footerArr.length === 1)
					footer = { left: "", center: footerArr[0], right: "" };
				else if (footerArr.length === 2)
					footer = { left: footerArr[0], center: footerArr[1], right: "" };
				else
					footer = { left: footerArr[0], center: footerArr[1], right: footerArr[2] };
				 if (footerArr.length > 3)
					 warn("Too many tabs in "+cmd+": "+footerArr.length+" found.", restOfString, 0);

				tune.addMetaTextObj(cmd, footer);
				break;

			case "midi":
				var midi = tokenizer.tokenize(restOfString, 0, restOfString.length);
				if (midi.length > 0 && midi[0].token === '=')
					midi.shift();
				if (midi.length === 0)
					warn("Expected midi command", restOfString, 0);
				else {
//				var midiCmd = restOfString.split(' ')[0];
//				var midiParam = restOfString.substring(midiCmd.length+1);
					// TODO-PER: make sure the command is legal
					tune.formatting[cmd] = { cmd: midi.shift().token };
					if (midi.length > 0)
						tune.formatting[cmd].param = midi.shift().token;
					// TODO-PER: save all the parameters, not just the first.
				}
//%%MIDI barlines: deactivates %%nobarlines.
//%%MIDI bassprog n
//%%MIDI bassvol n
//%%MIDI beat ⟨int1⟩ ⟨int2⟩ ⟨int3⟩ ⟨int4⟩: controls the volumes of the notes in a measure. The first note in a bar has volume ⟨int1⟩; other ‘strong’ notes have volume ⟨int2⟩ and all the rest have volume ⟨int3⟩. These values must be in the range 0–127. The parameter ⟨int4⟩ determines which notes are ‘strong’. If the time signature is x/y, then each note is given a position number k = 0, 1, 2. . . x-1 within each bar. If k is a multiple of ⟨int4⟩, then the note is ‘strong’.
//%%MIDI beataccents: reverts to normally emphasised notes. See also %%MIDI nobeat-
//%%MIDI beatmod ⟨int⟩: increments the velocities as defined by %%MIDI beat
//%%MIDI beatstring ⟨string⟩: similar to %%MIDI beat, but indicated with an fmp string.
//%%MIDI c ⟨int⟩: specifies the MIDI pitch which corresponds to	. The default is 60.
//%%MIDI channel ⟨int⟩: selects the melody channel ⟨int⟩ (1–16).
//%%MIDI chordattack ⟨int⟩: delays the start of chord notes by ⟨int⟩ MIDI units.
//%%MIDI chordname ⟨string int1 int2 int3 int4 int5 int6⟩: defines new chords or re-defines existing ones as was seen in Section 12.8.
//%%MIDI chordprog 20 % Church organ
//%%MIDI chordvol ⟨int⟩: sets the volume (velocity) of the chord notes to ⟨int⟩ (0–127).
//%%MIDI control ⟨bass/chord⟩ ⟨int1 int2⟩: generates a MIDI control event. If %%control is followed by ⟨bass⟩ or ⟨chord⟩, the event apply to the bass or chord channel, otherwise it will be applied to the melody channel. ⟨int1⟩ is the MIDI control number (0–127) and ⟨int2⟩ the value (0–127).
//%%MIDI deltaloudness⟨int⟩: bydefault,!crescendo!and!dimuendo!modifythebe- at variables ⟨vol1⟩ ⟨vol2⟩ ⟨vol3⟩ 15 volume units. This command allows the user to change this default.
//%%MIDI drone ⟨int1 int2 int3 int4 int5⟩: specifies a two-note drone accompaniment. ⟨int1⟩ is the drone MIDI instrument, ⟨int2⟩ the MIDI pitch 1, ⟨int3⟩ the MIDI pitch 2, ⟨int4⟩ the MIDI volume 1, ⟨int5⟩ the MIDI volume 2. Default values are 70 45 33 80 80.
//%%MIDI droneoff: turns the drone accompaniment off.
//%%MIDI droneon: turns the drone accompaniment on.
//%%MIDI drum string [drum programs] [drum velocities]
//%%MIDI drumbars ⟨int⟩: specifies the number of bars over which a drum pattern string is spread. Default is 1.
//%%MIDI drummap ⟨str⟩ ⟨int⟩: associates the note ⟨str⟩ (in ABC notation) to the a percussion instrument, as listed in Section H.2.
//%%MIDI drumoff turns drum accompaniment off.
//%%MIDI drumon turns drum accompaniment on.
//%%MIDI fermatafixed: expands a !fermata! by one unit length; that is, GC3 becomes
//%%MIDI fermataproportional: doubles the length of a note preceded by !fermata!;
//%%MIDI gchord string
//%%MIDI gchord str
//%%MIDI gchordon
//%%MIDI gchordoff
//%%MIDI grace ⟨float⟩: sets the fraction of the next note that grace notes will take up. ⟨float⟩ must be a fraction such as 1/6.
//%%MIDI gracedivider ⟨int⟩: sets the grace note length as 1/⟨int⟩th of the following note.
//%%MIDI makechordchannels⟨int⟩: thisisaverycomplexcommandusedinchordscon-
//%%MIDI nobarlines
//%%MIDI nobeataccents: forces the ⟨int2⟩ volume (see %%MIDI beat) for each note in a bar, regardless of their position.
//%%MIDI noportamento: turns off the portamento controller on the current channel.
//%%MIDI pitchbend [bass/chord] <high byte> <low byte>
//%%MIDI program 2 75
//%%MIDI portamento ⟨int⟩: turns on the portamento controller on the current channel and set it to ⟨int⟩. Experts only.
//%%MIDI randomchordattack: delays the start of chord notes by a random number of MIDI units.
//%%MIDI ratio n m
//%%MIDI rtranspose ⟨int1⟩: transposes relatively to a prior %%transpose command by ⟨int1⟩ semitones; the total transposition will be ⟨int1 + int2⟩ semitones.
//%%MIDI temperament ⟨int1⟩ ⟨int2⟩: TO BE WRITTEN
//%%MIDI temperamentlinear ⟨float1 float2⟩: changes the temperament of the scale. ⟨fl- oat1⟩ specifies the size of an octave in cents of a semitone, or 1/1200 of an octave. ⟨float2⟩ specifies in the size of a fifth (normally 700 cents).
//%%MIDI temperamentnormal: restores normal temperament.
//%%MIDI transpose n
//%%MIDI voice [<ID>] [instrument=<integer> [bank=<integer>]] [mute]
				break;

			case "indent":
			case "playtempo":
			case "auquality":
			case "continuous":
			case "nobarcheck":
				// TODO-PER: Actually handle the parameters of these
				tune.formatting[cmd] = restOfString;
				break;
			default:
				return "Unknown directive: " + cmd;
		}
		return null;
	};

	this.setCurrentVoice = function(id) {
		multilineVars.currentVoice = multilineVars.voices[id];
		tune.setCurrentVoice(multilineVars.currentVoice.staffNum, multilineVars.currentVoice.index);
	};

	this.parseVoice = function(line, i, e) {
		//First truncate the string to the first non-space character after V: through either the
		//end of the line or a % character. Then remove trailing spaces, too.
		var ret = tokenizer.getMeat(line, i, e);
		var start = ret.start;
		var end = ret.end;
		//The first thing on the line is the ID. It can be any non-space string and terminates at the
		//first space.
		var id = tokenizer.getToken(line, start, end);
		if (id.length === 0) {
			warn("Expected a voice id", line, start);
			return;
		}
		var isNew = false;
		if (multilineVars.voices[id] === undefined) {
			multilineVars.voices[id] = {};
			isNew = true;
			if (multilineVars.score_is_present)
				warn("Can't have an unknown V: id when the %score directive is present", line, start);
		}
		start += id.length;
		start += tokenizer.eatWhiteSpace(line, start);

		var staffInfo = {startStaff: isNew};
		var addNextTokenToStaffInfo = function(name) {
			var attr = tokenizer.getVoiceToken(line, start, end);
			if (attr.warn !== undefined)
				warn("Expected value for " + name + " in voice: " + attr.warn, line, start);
			else if (attr.token.length === 0 && line.charAt(start) !== '"')
				warn("Expected value for " + name + " in voice", line, start);
			else
				staffInfo[name] = attr.token;
			start += attr.len;
		};
		var addNextTokenToVoiceInfo = function(id, name, type) {
			var attr = tokenizer.getVoiceToken(line, start, end);
			if (attr.warn !== undefined)
				warn("Expected value for " + name + " in voice: " + attr.warn, line, start);
			else if (attr.token.length === 0 && line.charAt(start) !== '"')
				warn("Expected value for " + name + " in voice", line, start);
			else {
				if (type === 'number')
					attr.token = parseFloat(attr.token);
				multilineVars.voices[id][name] = attr.token;
			}
			start += attr.len;
		};

		//Then the following items can occur in any order:
		while (start < end) {
			var token = tokenizer.getVoiceToken(line, start, end);
			start += token.len;

			if (token.warn) {
				warn("Error parsing voice: " + token.warn, line, start);
			} else {
				var attr = null;
				switch (token.token) {
					case 'clef':
					case 'cl':
						addNextTokenToStaffInfo('clef');
						// TODO-PER: check for a legal clef; do octavizing
						var oct = 0;
//							for (var ii = 0; ii < staffInfo.clef.length; ii++) {
//								if (staffInfo.clef[ii] === ',') oct -= 7;
//								else if (staffInfo.clef[ii] === "'") oct += 7;
//							}
						if (staffInfo.clef !== undefined) {
						  staffInfo.clef = staffInfo.clef.replace(/[',]/g, ""); //'//comment for emacs formatting of regexp
							if (staffInfo.clef.indexOf('+16') !== -1) {
								oct += 14;
								staffInfo.clef = staffInfo.clef.replace('+16', '');
							}
							staffInfo.verticalPos = calcMiddle(staffInfo.clef, oct);
						}
						break;
					case 'treble':
					case 'bass':
					case 'tenor':
					case 'alto':
					case 'none':
					case 'treble\'':
					case 'bass\'':
					case 'tenor\'':
					case 'alto\'':
					case 'none\'':
					case 'treble\'\'':
					case 'bass\'\'':
					case 'tenor\'\'':
					case 'alto\'\'':
					case 'none\'\'':
					case 'treble,':
					case 'bass,':
					case 'tenor,':
					case 'alto,':
					case 'none,':
					case 'treble,,':
					case 'bass,,':
					case 'tenor,,':
					case 'alto,,':
					case 'none,,':
						// TODO-PER: handle the octave indicators on the clef by changing the middle property
						var oct2 = 0;
//							for (var iii = 0; iii < token.token.length; iii++) {
//								if (token.token[iii] === ',') oct2 -= 7;
//								else if (token.token[iii] === "'") oct2 += 7;
//							}
											  staffInfo.clef = token.token.replace(/[',]/g, ""); //'//comment for emacs formatting of regexp
						staffInfo.verticalPos = calcMiddle(staffInfo.clef, oct2);
						break;
					case 'staves':
					case 'stave':
					case 'stv':
						addNextTokenToStaffInfo('staves');
						break;
					case 'brace':
					case 'brc':
						addNextTokenToStaffInfo('brace');
						break;
					case 'bracket':
					case 'brk':
						addNextTokenToStaffInfo('bracket');
						break;
					case 'name':
					case 'nm':
						addNextTokenToStaffInfo('name');
						break;
					case 'subname':
					case 'sname':
					case 'snm':
						addNextTokenToStaffInfo('subname');
						break;
					case 'merge':
						staffInfo.startStaff = false;
						break;
					case 'stems':
						attr = tokenizer.getVoiceToken(line, start, end);
						if (attr.warn !== undefined)
							warn("Expected value for stems in voice: " + attr.warn, line, start);
						else if (attr.token === 'up' || attr.token === 'down')
							multilineVars.voices[id].stem = attr.token;
						else
							warn("Expected up or down for voice stem", line, start);
						start += attr.len;
						break;
					case 'up':
					case 'down':
						multilineVars.voices[id].stem = token.token;
						break;
					case 'middle':
					case 'm':
						addNextTokenToStaffInfo('verticalPos');
						staffInfo.verticalPos = parseMiddle(staffInfo.verticalPos).mid;
						break;
					case 'gchords':
					case 'gch':
						multilineVars.voices[id].suppressChords = true;
						break;
					case 'space':
					case 'spc':
						addNextTokenToStaffInfo('spacing');
						break;
					case 'scale':
						addNextTokenToVoiceInfo(id, 'scale', 'number');
						break;
				}
			}
			start += tokenizer.eatWhiteSpace(line, start);
		}

		// now we've filled up staffInfo, figure out what to do with this voice
		// TODO-PER: It is unclear from the standard and the examples what to do with brace, bracket, and staves, so they are ignored for now.
		if (staffInfo.startStaff || multilineVars.staves.length === 0) {
			multilineVars.staves.push({index: multilineVars.staves.length, meter: multilineVars.origMeter});
			if (!multilineVars.score_is_present)
				multilineVars.staves[multilineVars.staves.length-1].numVoices = 0;
		}
		if (multilineVars.voices[id].staffNum === undefined) {
			// store where to write this for quick access later.
			multilineVars.voices[id].staffNum = multilineVars.staves.length-1;
			var vi = 0;
			for(var v in multilineVars.voices) {
				if(multilineVars.voices.hasOwnProperty(v)) {
					if (multilineVars.voices[v].staffNum === multilineVars.voices[id].staffNum)
						vi++;
				}
			}
			multilineVars.voices[id].index = vi-1;
		}
		var s = multilineVars.staves[multilineVars.voices[id].staffNum];
		if (!multilineVars.score_is_present)
			s.numVoices++;
		if (staffInfo.clef) s.clef = {type: staffInfo.clef, verticalPos: staffInfo.verticalPos};
		if (staffInfo.spacing) s.spacing_below_offset = staffInfo.spacing;
		if (staffInfo.verticalPos) s.verticalPos = staffInfo.verticalPos;

		if (staffInfo.name) {if (s.name) s.name.push(staffInfo.name); else s.name = [ staffInfo.name ];}
		if (staffInfo.subname) {if (s.subname) s.subname.push(staffInfo.subname); else s.subname = [ staffInfo.subname ];}

		this.setCurrentVoice(id);
	};

	this.setTitle = function(title) {
		if (multilineVars.hasMainTitle)
			tune.addSubtitle(tokenizer.translateString(tokenizer.stripComment(title)));	// display secondary title
		else
		{
			tune.addMetaText("title", tokenizer.translateString(tokenizer.theReverser(tokenizer.stripComment(title))));
			multilineVars.hasMainTitle = true;
		}
	};

	this.setMeter = function(line) {
		line = tokenizer.stripComment(line);
		if (line === 'C') {
			if (multilineVars.havent_set_length === true)
				multilineVars.default_length = 0.125;
			return {type: 'common_time'};
		} else if (line === 'C|') {
			if (multilineVars.havent_set_length === true)
				multilineVars.default_length = 0.125;
			return {type: 'cut_time'};
		} else if (line.length === 0 || line.toLowerCase() === 'none') {
			if (multilineVars.havent_set_length === true)
				multilineVars.default_length = 0.125;
			return null;
		}
		else
		{
			var tokens = tokenizer.tokenize(line, 0, line.length);
			// the form is [open_paren] decimal [ plus|dot decimal ]... [close_paren] slash decimal [plus same_as_before]
			try {
				var parseNum = function() {
					// handles this much: [open_paren] decimal [ plus|dot decimal ]... [close_paren]
					var ret = {value: 0, num: ""};

					var tok = tokens.shift();
					if (tok.token === '(')
						tok = tokens.shift();
					while (1) {
						if (tok.type !== 'number') throw "Expected top number of meter";
						ret.value += parseInt(tok.token);
						ret.num += tok.token;
						if (tokens.length === 0 || tokens[0].token === '/') return ret;
						tok = tokens.shift();
						if (tok.token === ')') {
							if (tokens.length === 0 || tokens[0].token === '/') return ret;
							throw "Unexpected paren in meter";
						}
						if (tok.token !== '.' && tok.token !== '+') throw "Expected top number of meter";
						ret.num += tok.token;
						if (tokens.length === 0) throw "Expected top number of meter";
						tok = tokens.shift();
					}
					return ret;	// just to suppress warning
				};

				var parseFraction = function() {
					// handles this much: parseNum slash decimal
					var ret = parseNum();
					if (tokens.length === 0) throw "Expected slash in meter";
					var tok = tokens.shift();
					if (tok.token !== '/') throw "Expected slash in meter";
					tok = tokens.shift();
					if (tok.type !== 'number') throw "Expected bottom number of meter";
					ret.den = tok.token;
					ret.value = ret.value / parseInt(ret.den);
					return ret;
				};

				if (tokens.length === 0) throw "Expected meter definition in M: line";
				var meter = {type: 'specified', value: [ ]};
				var totalLength = 0;
				while (1) {
					var ret = parseFraction();
					totalLength += ret.value;
					meter.value.push({num: ret.num, den: ret.den});
					if (tokens.length === 0) break;
					var tok = tokens.shift();
					if (tok.token !== '+') throw "Extra characters in M: line";
				}

				if (multilineVars.havent_set_length === true) {
					multilineVars.default_length = totalLength < 0.75 ? 0.0625 : 0.125;
				}
				return meter;
			} catch (e) {
				warn(e, line, 0);
			}
		}
		return null;
	};

	this.calcTempo = function(relTempo) {
		var dur = 1/4;
		if (multilineVars.meter && multilineVars.meter.type === 'specified') {
			dur = 1 / parseInt(multilineVars.meter.value[0].den);
		} else if (multilineVars.origMeter && multilineVars.origMeter.type === 'specified') {
			dur = 1 / parseInt(multilineVars.origMeter.value[0].den);
		}
		//var dur = multilineVars.default_length ? multilineVars.default_length : 1;
		for (var i = 0; i < relTempo.duration; i++)
			relTempo.duration[i] = dur * relTempo.duration[i];
		return relTempo;
	};

	this.resolveTempo = function() {
		if (multilineVars.tempo) {	// If there's a tempo waiting to be resolved
			this.calcTempo(multilineVars.tempo);
			tune.metaText.tempo = multilineVars.tempo;
			delete multilineVars.tempo;
		}
	};

	this.addUserDefinition = function(line, start, end) {
		var equals = line.indexOf('=', start);
		if (equals === -1) {
			warn("Need an = in a macro definition", line, start);
			return;
		}

		var before = line.substring(start, equals).strip();
		var after = line.substring(equals+1).strip();

		if (before.length !== 1) {
			warn("Macro definitions can only be one character", line, start);
			return;
		}
		var legalChars = "HIJKLMNOPQRSTUVWXYhijklmnopqrstuvw~";
		if (legalChars.indexOf(before) === -1) {
			warn("Macro definitions must be H-Y, h-w, or tilde", line, start);
			return;
		}
		if (after.length === 0) {
			warn("Missing macro definition", line, start);
			return;
		}
		if (multilineVars.macros === undefined)
			multilineVars.macros = {};
		multilineVars.macros[before] = after;
	};

	this.setDefaultLength = function(line, start, end) {
		var len = line.substring(start, end).gsub(" ", "");
		var len_arr = len.split('/');
		if (len_arr.length === 2) {
			var n = parseInt(len_arr[0]);
			var d = parseInt(len_arr[1]);
			if (d > 0) {
				var q = n / d;
				multilineVars.default_length = q;	// a whole note is 1
				multilineVars.havent_set_length = false;
			}
		}
	};

	this.setTempo = function(line, start, end) {
		//Q - tempo; can be used to specify the notes per minute, e.g. If
		//the meter denominator is a 4 note then Q:120 or Q:C=120
		//is 120 quarter notes per minute. Similarly  Q:C3=40 would be 40
		//dotted half notes per minute. An absolute tempo may also be
		//set, e.g. Q:1/8=120 is 120 eighth notes per minute,
		//irrespective of the meter's denominator.
		//
		// This is either a number, "C=number", "Cnumber=number", or fraction [fraction...]=number
		// It depends on the M: field, which may either not be present, or may appear after this.
		// If M: is not present, an eighth note is used.
		// That means that this field can't be calculated until the end, if it is the first three types, since we don't know if we'll see an M: field.
		// So, if it is the fourth type, set it here, otherwise, save the info in the multilineVars.
		// The temporary variables we keep are the duration and the bpm. In the first two forms, the duration is 1.
		// In addition, a quoted string may both precede and follow. If a quoted string is present, then the duration part is optional.
		try {
			var tokens = tokenizer.tokenize(line, start, end);

			if (tokens.length === 0) throw "Missing parameter in Q: field";

			var tempo = {};
			var delaySet = true;
			var token = tokens.shift();
			if (token.type === 'quote') {
				tempo.preString = token.token;
				token = tokens.shift();
				if (tokens.length === 0) {	// It's ok to just get a string for the tempo
					return {type: 'immediate', tempo: tempo};
				}
			}
			if (token.type === 'alpha' && token.token === 'C')	 { // either type 2 or type 3
				if (tokens.length === 0) throw "Missing tempo after C in Q: field";
				token = tokens.shift();
				if (token.type === 'punct' && token.token === '=') {
					// This is a type 2 format. The duration is an implied 1
					if (tokens.length === 0) throw "Missing tempo after = in Q: field";
					token = tokens.shift();
					if (token.type !== 'number') throw "Expected number after = in Q: field";
					tempo.duration = [1];
					tempo.bpm = parseInt(token.token);
				} else if (token.type === 'number') {
					// This is a type 3 format.
					tempo.duration = [parseInt(token.token)];
					if (tokens.length === 0) throw "Missing = after duration in Q: field";
					token = tokens.shift();
					if (token.type !== 'punct' || token.token !== '=') throw "Expected = after duration in Q: field";
					if (tokens.length === 0) throw "Missing tempo after = in Q: field";
					token = tokens.shift();
					if (token.type !== 'number') throw "Expected number after = in Q: field";
					tempo.bpm = parseInt(token.token);
				} else throw "Expected number or equal after C in Q: field";

			} else if (token.type === 'number') {	// either type 1 or type 4
				var num = parseInt(token.token);
				if (tokens.length === 0 || tokens[0].type === 'quote') {
					// This is type 1
					tempo.duration = [1];
					tempo.bpm = num;
				} else {	// This is type 4
					delaySet = false;
					token = tokens.shift();
					if (token.type !== 'punct' && token.token !== '/') throw "Expected fraction in Q: field";
					token = tokens.shift();
					if (token.type !== 'number') throw "Expected fraction in Q: field";
					var den = parseInt(token.token);
					tempo.duration = [num/den];
					// We got the first fraction, keep getting more as long as we find them.
					while (tokens.length > 0  && tokens[0].token !== '=' && tokens[0].type !== 'quote') {
						token = tokens.shift();
						if (token.type !== 'number') throw "Expected fraction in Q: field";
						num = parseInt(token.token);
						token = tokens.shift();
						if (token.type !== 'punct' && token.token !== '/') throw "Expected fraction in Q: field";
						token = tokens.shift();
						if (token.type !== 'number') throw "Expected fraction in Q: field";
						den = parseInt(token.token);
						tempo.duration.push(num/den);
					}
					token = tokens.shift();
					if (token.type !== 'punct' && token.token !== '=') throw "Expected = in Q: field";
					token = tokens.shift();
					if (token.type !== 'number') throw "Expected tempo in Q: field";
					tempo.bpm = parseInt(token.token);
				}
			} else throw "Unknown value in Q: field";
			if (tokens.length !== 0) {
				token = tokens.shift();
				if (token.type === 'quote') {
					tempo.postString = token.token;
					token = tokens.shift();
				}
				if (tokens.length !== 0) throw "Unexpected string at end of Q: field";
			}
			return {type: delaySet?'delaySet':'immediate', tempo: tempo};
		} catch (msg) {
			warn(msg, line, start);
			return {type: 'none'};
		}
	};

	this.letter_to_inline_header = function(line, i)
	{
		var ws = tokenizer.eatWhiteSpace(line, i);
		i +=ws;
		if (line.length >= i+5 && line.charAt(i) === '[' && line.charAt(i+2) === ':') {
			var e = line.indexOf(']', i);
			switch(line.substring(i, i+3))
			{
				case "[I:":
					var err = this.addDirective(line.substring(i+3, e));
					if (err) warn(err, line, i);
					return [ e-i+1+ws ];
				case "[M:":
					var meter = this.setMeter(line.substring(i+3, e));
					if (tune.hasBeginMusic() && meter)
						tune.appendStartingElement('meter', -1, -1, meter);
					return [ e-i+1+ws ];
				case "[K:":
					var result = this.parseKey(line.substring(i+3, e));
					if (result.foundClef && tune.hasBeginMusic())
						tune.appendStartingElement('clef', -1, -1, multilineVars.clef);
					if (result.foundKey && tune.hasBeginMusic())
						tune.appendStartingElement('key', -1, -1, this.fixKey(multilineVars.clef, multilineVars.key));
					return [ e-i+1+ws ];
				case "[P:":
					tune.appendElement('part', -1, -1, {title: line.substring(i+3, e)});
					return [ e-i+1+ws ];
				case "[L:":
					this.setDefaultLength(line, i+3, e);
					return [ e-i+1+ws ];
				case "[Q:":
					if (e > 0) {
						var tempo = this.setTempo(line, i+3, e);
						if (tempo.type === 'delaySet') tune.appendElement('tempo', -1, -1, this.calcTempo(tempo.tempo));
						else if (tempo.type === 'immediate') tune.appendElement('tempo', -1, -1, tempo.tempo);
						return [ e-i+1+ws, line.charAt(i+1), line.substring(i+3, e)];
					}
					break;
				case "[V:":
					if (e > 0) {
						this.parseVoice(line, i+3, e);
						//startNewLine();
						return [ e-i+1+ws, line.charAt(i+1), line.substring(i+3, e)];
					}
					break;

				default:
					// TODO: complain about unhandled header
			}
		}
		return [ 0 ];
	};

	this.letter_to_body_header = function(line, i)
	{
		if (line.length >= i+3) {
			switch(line.substring(i, i+2))
			{
				case "I:":
					var err = this.addDirective(line.substring(i+2));
					if (err) warn(err, line, i);
					return [ line.length ];
				case "M:":
					var meter = this.setMeter(line.substring(i+2));
					if (tune.hasBeginMusic() && meter)
						tune.appendStartingElement('meter', -1, -1, meter);
					return [ line.length ];
				case "K:":
					var result = this.parseKey(line.substring(i+2));
					if (result.foundClef && tune.hasBeginMusic())
						tune.appendStartingElement('clef', -1, -1, multilineVars.clef);
					if (result.foundKey && tune.hasBeginMusic())
						tune.appendStartingElement('key', -1, -1, this.fixKey(multilineVars.clef, multilineVars.key));
					return [ line.length ];
				case "P:":
					if (tune.hasBeginMusic())
						tune.appendElement('part', -1, -1, {title: line.substring(i+2)});
					return [ line.length ];
				case "L:":
					this.setDefaultLength(line, i+2, line.length);
					return [ line.length ];
				case "Q:":
					var e = line.indexOf('\x12', i+2);
					if (e === -1) e = line.length;
					var tempo = this.setTempo(line, i+2, e);
					if (tempo.type === 'delaySet') tune.appendElement('tempo', -1, -1, this.calcTempo(tempo.tempo));
					else if (tempo.type === 'immediate') tune.appendElement('tempo', -1, -1, tempo.tempo);
				return [ e, line.charAt(i), line.substring(i+2).strip()];
				case "V:":
					this.parseVoice(line, 2, line.length);
//						startNewLine();
					return [ line.length, line.charAt(i), line.substring(i+2).strip()];
				default:
					// TODO: complain about unhandled header
			}
		}
		return [ 0 ];
	};

	var metaTextHeaders = {
		A: 'author',
		B: 'book',
		C: 'composer',
		D: 'discography',
		F: 'url',
		G: 'group',
		I: 'instruction',
		N: 'notes',
		O: 'origin',
		R: 'rhythm',
		S: 'source',
		W: 'unalignedWords',
		Z: 'transcription'
	};

	this.parseHeader = function(line) {
		if (line.startsWith('%%')) {
			var err = this.addDirective(line.substring(2));
			if (err) warn(err, line, 2);
			return {};
		}
		line = tokenizer.stripComment(line);
		if (line.length === 0)
			return {};

		if (line.length >= 2) {
			if (line.charAt(1) === ':') {
				var nextLine = "";
				if (line.indexOf('\x12') >= 0 && line.charAt(0) !== 'w') {	// w: is the only header field that can have a continuation.
					nextLine = line.substring(line.indexOf('\x12')+1);
					line = line.substring(0, line.indexOf('\x12'));	//This handles a continuation mark on a header field
				}
				var field = metaTextHeaders[line.charAt(0)];
				if (field !== undefined) {
					if (field === 'unalignedWords')
						tune.addMetaTextArray(field, this.parseFontChangeLine(tokenizer.translateString(tokenizer.stripComment(line.substring(2)))));
					else
						tune.addMetaText(field, tokenizer.translateString(tokenizer.stripComment(line.substring(2))));
					return {};
				} else {
					switch(line.charAt(0))
					{
						case  'H':
							tune.addMetaText("history", tokenizer.translateString(tokenizer.stripComment(line.substring(2))));
							multilineVars.is_in_history = true;
							break;
						case  'K':
							// since the key is the last thing that can happen in the header, we can resolve the tempo now
							this.resolveTempo();
							var result = this.parseKey(line.substring(2));
							if (!multilineVars.is_in_header && tune.hasBeginMusic()) {
								if (result.foundClef)
									tune.appendStartingElement('clef', -1, -1, multilineVars.clef);
								if (result.foundKey)
									tune.appendStartingElement('key', -1, -1, this.fixKey(multilineVars.clef, multilineVars.key));
							}
							multilineVars.is_in_header = false;	// The first key signifies the end of the header.
							break;
						case  'L':
							this.setDefaultLength(line, 2, line.length);
							break;
						case  'M':
							multilineVars.origMeter = multilineVars.meter = this.setMeter(line.substring(2));
							break;
						case  'P':
							// TODO-PER: There is more to do with parts, but the writer doesn't care.
							if (multilineVars.is_in_header)
								tune.addMetaText("partOrder", tokenizer.translateString(tokenizer.stripComment(line.substring(2))));
							else
								multilineVars.partForNextLine = tokenizer.translateString(tokenizer.stripComment(line.substring(2)));
							break;
						case  'Q':
							var tempo = this.setTempo(line, 2, line.length);
							if (tempo.type === 'delaySet') multilineVars.tempo = tempo.tempo;
							else if (tempo.type === 'immediate') tune.metaText.tempo = tempo.tempo;
							break;
						case  'T':
							this.setTitle(line.substring(2));
							break;
						case 'U':
							this.addUserDefinition(line, 2, line.length);
							break;
						case  'V':
							this.parseVoice(line, 2, line.length);
							if (!multilineVars.is_in_header)
								return {newline: true};
							break;
						case  's':
							return {symbols: true};
						case  'w':
							return {words: true};
						case 'X':
							break;
						case 'E':
						case 'm':
							warn("Ignored header", line, 0);
							break;
						default:
							// It wasn't a recognized header value, so parse it as music.
							if (nextLine.length)
								nextLine = "\x12" + nextLine;
							//parseRegularMusicLine(line+nextLine);
							//nextLine = "";
							return {regular: true, str: line+nextLine};
					}
				}
				if (nextLine.length > 0)
					return {recurse: true, str: nextLine};
				return {};
			}
		}

		// If we got this far, we have a regular line of mulsic
		return {regular: true, str: line};
	};
}

//    abc_tokenizer.js: tokenizes an ABC Music Notation string to support abc_parse.
//    Copyright (C) 2010 Paul Rosen (paul at paulrosen dot net)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*extern AbcTokenizer */

// this is a series of functions that get a particular element out of the passed stream.
// the return is the number of characters consumed, so 0 means that the element wasn't found.
// also returned is the element found. This may be a different length because spaces may be consumed that aren't part of the string.
// The return structure for most calls is { len: num_chars_consumed, token: str }
function AbcTokenizer() {
	this.skipWhiteSpace = function(str) {
		for (var i = 0; i < str.length; i++) {
		  if (!this.isWhiteSpace(str.charAt(i)))
				return i;
		}
		return str.length;	// It must have been all white space
	};
	var finished = function(str, i) {
		return i >= str.length;
	};
	this.eatWhiteSpace = function(line, index) {
		for (var i = index; i < line.length; i++) {
		  if (!this.isWhiteSpace(line.charAt(i)))
				return i-index;
		}
		return i-index;
	};

	// This just gets the basic pitch letter, ignoring leading spaces, and normalizing it to a capital
	this.getKeyPitch = function(str) {
		var i = this.skipWhiteSpace(str);
		if (finished(str, i))
			return {len: 0};
		switch (str.charAt(i)) {
			case 'A':return {len: i+1, token: 'A'};
			case 'B':return {len: i+1, token: 'B'};
			case 'C':return {len: i+1, token: 'C'};
			case 'D':return {len: i+1, token: 'D'};
			case 'E':return {len: i+1, token: 'E'};
			case 'F':return {len: i+1, token: 'F'};
			case 'G':return {len: i+1, token: 'G'};
//			case 'a':return {len: i+1, token: 'A'};
//			case 'b':return {len: i+1, token: 'B'};
//			case 'c':return {len: i+1, token: 'C'};
//			case 'd':return {len: i+1, token: 'D'};
//			case 'e':return {len: i+1, token: 'E'};
//			case 'f':return {len: i+1, token: 'F'};
//			case 'g':return {len: i+1, token: 'G'};
		}
		return {len: 0};
	};

	// This just gets the basic accidental, ignoring leading spaces, and only the ones that appear in a key
	this.getSharpFlat = function(str) {
		if (str === 'bass')
			return {len: 0};
		switch (str.charAt(0)) {
			case '#':return {len: 1, token: '#'};
			case 'b':return {len: 1, token: 'b'};
		}
		return {len: 0};
	};

	this.getMode = function(str) {
		var skipAlpha = function(str, start) {
			// This returns the index of the next non-alphabetic char, or the entire length of the string if not found.
		  while (start < str.length && ((str.charAt(start) >= 'a' && str.charAt(start) <= 'z') || (str.charAt(start) >= 'A' && str.charAt(start) <= 'Z')))
				start++;
			return start;
		};

		var i = this.skipWhiteSpace(str);
		if (finished(str, i))
			return {len: 0};
		var firstThree = str.substring(i,i+3).toLowerCase();
		if (firstThree.length > 1 && firstThree.charAt(1) === ' ' || firstThree.charAt(1) === '^' || firstThree.charAt(1) === '_' || firstThree.charAt(1) === '=') firstThree = firstThree.charAt(0);	// This will handle the case of 'm'
		switch (firstThree) {
			case 'mix':return {len: skipAlpha(str, i), token: 'Mix'};
			case 'dor':return {len: skipAlpha(str, i), token: 'Dor'};
			case 'phr':return {len: skipAlpha(str, i), token: 'Phr'};
			case 'lyd':return {len: skipAlpha(str, i), token: 'Lyd'};
			case 'loc':return {len: skipAlpha(str, i), token: 'Loc'};
			case 'aeo':return {len: skipAlpha(str, i), token: 'm'};
			case 'maj':return {len: skipAlpha(str, i), token: ''};
			case 'ion':return {len: skipAlpha(str, i), token: ''};
			case 'min':return {len: skipAlpha(str, i), token: 'm'};
			case 'm':return {len: skipAlpha(str, i), token: 'm'};
		}
		return {len: 0};
	};

	this.getClef = function(str, bExplicitOnly) {
		var strOrig = str;
		var i = this.skipWhiteSpace(str);
		if (finished(str, i))
			return {len: 0};
		// The word 'clef' is optional, but if it appears, a clef MUST appear
		var needsClef = false;
		var strClef = str.substring(i);
		if (strClef.startsWith('clef=')) {
			needsClef = true;
			strClef = strClef.substring(5);
			i += 5;
		}
		if (strClef.length === 0 && needsClef)
			return {len: i+5, warn: "No clef specified: " + strOrig};

		var j = this.skipWhiteSpace(strClef);
		if (finished(strClef, j))
			return {len: 0};
		if (j > 0) {
			i += j;
			strClef = strClef.substring(j);
		}
		var name = null;
		if (strClef.startsWith('treble'))
			name = 'treble';
		else if (strClef.startsWith('bass3'))
			name = 'bass3';
		else if (strClef.startsWith('bass'))
			name = 'bass';
		else if (strClef.startsWith('tenor'))
			name = 'tenor';
		else if (strClef.startsWith('alto2'))
			name = 'alto2';
		else if (strClef.startsWith('alto1'))
			name = 'alto1';
		else if (strClef.startsWith('alto'))
			name = 'alto';
		else if (!bExplicitOnly && (needsClef && strClef.startsWith('none')))
			name = 'none';
		else if (strClef.startsWith('perc'))
			name = 'perc';
		else if (!bExplicitOnly && (needsClef && strClef.startsWith('C')))
			name = 'tenor';
		else if (!bExplicitOnly && (needsClef && strClef.startsWith('F')))
			name = 'bass';
		else if (!bExplicitOnly && (needsClef && strClef.startsWith('G')))
			name = 'treble';
		else
			return {len: i+5, warn: "Unknown clef specified: " + strOrig};

		strClef = strClef.substring(name.length);
		j = this.isMatch(strClef, '+8');
		if (j > 0)
			name += "+8";
		else {
			j = this.isMatch(strClef, '-8');
			if (j > 0)
				name += "-8";
		}
		return {len: i+name.length, token: name, explicit: needsClef};
	};

	// This returns one of the legal bar lines
	// This is called alot and there is no obvious tokenable items, so this is broken apart.
	this.getBarLine = function(line, i) {
		switch (line.charAt(i)) {
			case ']':
				++i;
				switch (line.charAt(i)) {
					case '|': return {len: 2, token: "bar_thick_thin"};
					case '[':
						++i;
						if ((line.charAt(i) >= '1' && line.charAt(i) <= '9') || line.charAt(i) === '"')
							return {len: 2, token: "bar_invisible"};
						return {len: 1, warn: "Unknown bar symbol"};
					default:
						return {len: 1, token: "bar_invisible"};
				}
				break;
			case ':':
				++i;
				switch (line.charAt(i)) {
					case ':': return {len: 2, token: "bar_dbl_repeat"};
					case '|':	// :|
						++i;
						switch (line.charAt(i)) {
							case ']':	// :|]
								++i;
								switch (line.charAt(i)) {
									case '|':	// :|]|
										++i;
										if (line.charAt(i) === ':')  return {len: 5, token: "bar_dbl_repeat"};
										return {len: 3, token: "bar_right_repeat"};
									default:
										return {len: 3, token: "bar_right_repeat"};
								}
								break;
							case '|':	// :||
								++i;
								if (line.charAt(i) === ':')  return {len: 4, token: "bar_dbl_repeat"};
								return {len: 3, token: "bar_right_repeat"};
							default:
								return {len: 2, token: "bar_right_repeat"};
						}
						break;
					default:
						return {len: 1, warn: "Unknown bar symbol"};
				}
				break;
			case '[':	// [
				++i;
				if (line.charAt(i) === '|') {	// [|
					++i;
					switch (line.charAt(i)) {
						case ':': return {len: 3, token: "bar_left_repeat"};
						case ']': return {len: 3, token: "bar_invisible"};
						default: return {len: 2, token: "bar_thick_thin"};
					}
				} else {
					if ((line.charAt(i) >= '1' && line.charAt(i) <= '9') || line.charAt(i) === '"')
						return {len: 1, token: "bar_invisible"};
					return {len: 0};
				}
				break;
			case '|':	// |
				++i;
				switch (line.charAt(i)) {
					case ']': return {len: 2, token: "bar_thin_thick"};
					case '|': // ||
						++i;
						if (line.charAt(i) === ':') return {len: 3, token: "bar_left_repeat"};
						return {len: 2, token: "bar_thin_thin"};
					case ':':	// |:
						var colons = 0;
						while (line.charAt(i+colons) === ':') colons++;
						return { len: 1+colons, token: "bar_left_repeat"};
					default: return {len: 1, token: "bar_thin"};
				}
				break;
		}
		return {len: 0};
	};

	// this returns all the characters in the string that match one of the characters in the legalChars string
	this.getTokenOf = function(str, legalChars) {
		for (var i = 0; i < str.length; i++) {
			if (legalChars.indexOf(str.charAt(i)) < 0)
				return {len: i, token: str.substring(0, i)};
		}
		return {len: i, token: str};
	};

	this.getToken = function(str, start, end) {
		// This returns the next set of chars that doesn't contain spaces
		var i = start;
		while (i < end && !this.isWhiteSpace(str.charAt(i)))
			i++;
		return str.substring(start, i);
	};

	// This just sees if the next token is the word passed in, with possible leading spaces
	this.isMatch = function(str, match) {
		var i = this.skipWhiteSpace(str);
		if (finished(str, i))
			return 0;
		if (str.substring(i).startsWith(match))
			return i+match.length;
		return 0;
	};

	this.getPitchFromTokens = function(tokens) {
		var ret = { };
		var pitches = {A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11};
		ret.position = pitches[tokens[0].token];
		if (ret.position === undefined)
			return { warn: "Pitch expected. Found: " + tokens[0].token };
		tokens.shift();
		while (tokens.length) {
			switch (tokens[0].token) {
				case ',': ret.position -= 7; tokens.shift(); break;
				case '\'': ret.position += 7; tokens.shift(); break;
				default: return ret;
			}
		}
		return ret;
	}

	this.getKeyAccidentals2 = function(tokens) {
		var accs;
		// find and strip off all accidentals in the token list
		while (tokens.length > 0) {
			var acc;
			if (tokens[0].token === '^') {
				acc = 'sharp';
				tokens.shift();
				if (tokens.length === 0) return {accs: accs, warn: 'Expected note name after ' + acc};
				switch (tokens[0].token) {
					case '^': acc = 'dblsharp'; tokens.shift(); break;
					case '/': acc = 'quartersharp'; tokens.shift(); break;
				}
			} else if (tokens[0].token === '=') {
				acc = 'natural';
				tokens.shift();
			} else if (tokens[0].token === '_') {
				acc = 'flat';
				tokens.shift();
				if (tokens.length === 0) return {accs: accs, warn: 'Expected note name after ' + acc};
				switch (tokens[0].token) {
					case '_': acc = 'dblflat'; tokens.shift(); break;
					case '/': acc = 'quarterflat'; tokens.shift(); break;
				}
			} else {
				// Not an accidental, we'll assume that a later parse will recognize it.
				return { accs: accs };
			}
			if (tokens.length === 0) return {accs: accs, warn: 'Expected note name after ' + acc};
			switch (tokens[0].token.charAt(0))
			{
				case 'a':
				case 'b':
				case 'c':
				case 'd':
				case 'e':
				case 'f':
				case 'g':
				case 'A':
				case 'B':
				case 'C':
				case 'D':
				case 'E':
				case 'F':
				case 'G':
					if (accs === undefined)
						accs = [];
					accs.push({ acc: acc, note: tokens[0].token.charAt(0) });
					if (tokens[0].token.length === 1)
						tokens.shift();
					else
						tokens[0].token = tokens[0].token.substring(1);
					break;
				default:
					return {accs: accs, warn: 'Expected note name after ' + acc + ' Found: ' + tokens[0].token };
					break;
			}
		}
		return { accs: accs };
	};

	// This gets an accidental marking for the key signature. It has the accidental then the pitch letter.
	this.getKeyAccidental = function(str) {
		var accTranslation = {
			'^': 'sharp',
			'^^': 'dblsharp',
			'=': 'natural',
			'_': 'flat',
			'__': 'dblflat',
			'_/': 'quarterflat',
			'^/': 'quartersharp'
		};
		var i = this.skipWhiteSpace(str);
		if (finished(str, i))
			return {len: 0};
		var acc = null;
		switch (str.charAt(i))
		{
			case '^':
			case '_':
			case '=':
				acc = str.charAt(i);
				break;
			default:return {len: 0};
		}
		i++;
		if (finished(str, i))
			return {len: 1, warn: 'Expected note name after accidental'};
		switch (str.charAt(i))
		{
			case 'a':
			case 'b':
			case 'c':
			case 'd':
			case 'e':
			case 'f':
			case 'g':
			case 'A':
			case 'B':
			case 'C':
			case 'D':
			case 'E':
			case 'F':
			case 'G':
				return {len: i+1, token: {acc: accTranslation[acc], note: str.charAt(i)}};
			case '^':
			case '_':
			case '/':
				acc += str.charAt(i);
				i++;
				if (finished(str, i))
					return {len: 2, warn: 'Expected note name after accidental'};
				switch (str.charAt(i))
				{
					case 'a':
					case 'b':
					case 'c':
					case 'd':
					case 'e':
					case 'f':
					case 'g':
					case 'A':
					case 'B':
					case 'C':
					case 'D':
					case 'E':
					case 'F':
					case 'G':
						return {len: i+1, token: {acc: accTranslation[acc], note: str.charAt(i)}};
					default:
						return {len: 2, warn: 'Expected note name after accidental'};
				}
				break;
			default:
				return {len: 1, warn: 'Expected note name after accidental'};
		}
	};

	this.isWhiteSpace = function(ch) {
		return ch === ' ' || ch === '\t' || ch === '\x12';
	};

	this.getMeat = function(line, start, end) {
		// This removes any comments starting with '%' and trims the ends of the string so that there are no leading or trailing spaces.
		// it returns just the start and end characters that contain the meat.
		var comment = line.indexOf('%', start);
		if (comment >= 0 && comment < end)
			end = comment;
		while (start < end && (line.charAt(start) === ' ' || line.charAt(start) === '\t' || line.charAt(start) === '\x12'))
			start++;
		while (start < end && (line.charAt(end-1) === ' ' || line.charAt(end-1) === '\t' || line.charAt(end-1) === '\x12'))
			end--;
		return {start: start, end: end};
	};

	var isLetter = function(ch) {
		return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
	};

	var isNumber = function(ch) {
		return (ch >= '0' && ch <= '9');
	};

	this.tokenize = function(line, start, end) {
		// this returns all the tokens inside the passed string. A token is a punctuation mark, a string of digits, a string of letters.
		//  Quoted strings are one token.
		// The type of token is returned: quote, alpha, number, punct
		var ret = this.getMeat(line, start, end);
		start = ret.start;
		end = ret.end;
		var tokens = [];
		var i;
		while (start < end) {
			if (line.charAt(start) === '"') {
				i = start+1;
				while (i < end && line.charAt(i) !== '"') i++;
				tokens.push({ type: 'quote', token: line.substring(start+1, i), start: start+1, end: i});
				i++;
			} else if (isLetter(line.charAt(start))) {
				i = start+1;
				while (i < end && isLetter(line.charAt(i))) i++;
				tokens.push({ type: 'alpha', token: line.substring(start, i), continueId: isNumber(line.charAt(i)), start: start, end: i});
				start = i + 1;
			} else if (isNumber(line.charAt(start))) {
				i = start+1;
				while (i < end && isNumber(line.charAt(i))) i++;
				tokens.push({ type: 'number', token: line.substring(start, i), continueId: isLetter(line.charAt(i)), start: start, end: i});
				start = i + 1;
			} else if (line.charAt(start) === ' ' || line.charAt(start) === '\t') {
				i = start+1;
			} else {
				tokens.push({ type: 'punct', token: line.charAt(start), start: start, end: start+1});
				i = start+1;
			}
			start = i;
		}
		return tokens;
	};

	this.getVoiceToken = function(line, start, end) {
		// This finds the next token. A token is delimited by a space or an equal sign. If it starts with a quote, then the portion between the quotes is returned.
		var i = start;
		while (i < end && this.isWhiteSpace(line.charAt(i)) || line.charAt(i) === '=')
			i++;

		if (line.charAt(i) === '"') {
			var close = line.indexOf('"', i+1);
			if (close === -1 || close >= end)
				return {len: 1, err: "Missing close quote"};
			return {len: close-start+1, token: this.translateString(line.substring(i+1, close))};
		} else {
			var ii = i;
			while (ii < end && !this.isWhiteSpace(line.charAt(ii)) && line.charAt(ii) !== '=')
				ii++;
			return {len: ii-start+1, token: line.substring(i, ii)};
		}
	};

	var charMap = {
		"`a": 'à', "'a": "á", "^a": "â", "~a": "ã", "\"a": "ä", "oa": "å", "=a": "ā", "ua": "ă", ";a": "ą",
		"`e": 'è', "'e": "é", "^e": "ê", "\"e": "ë", "=e": "ē", "ue": "ĕ", ";e": "ę", ".e": "ė",
		"`i": 'ì', "'i": "í", "^i": "î", "\"i": "ï", "=i": "ī", "ui": "ĭ", ";i": "į",
		"`o": 'ò', "'o": "ó", "^o": "ô", "~o": "õ", "\"o": "ö", "=o": "ō", "uo": "ŏ", "/o": "ø",
		"`u": 'ù', "'u": "ú", "^u": "û", "~u": "ũ", "\"u": "ü", "ou": "ů", "=u": "ū", "uu": "ŭ", ";u": "ų",
		"`A": 'À', "'A": "Á", "^A": "Â", "~A": "Ã", "\"A": "Ä", "oA": "Å", "=A": "Ā", "uA": "Ă", ";A": "Ą",
		"`E": 'È', "'E": "É", "^E": "Ê", "\"E": "Ë", "=E": "Ē", "uE": "Ĕ", ";E": "Ę", ".E": "Ė",
		"`I": 'Ì', "'I": "Í", "^I": "Î", "~I": "Ĩ", "\"I": "Ï", "=I": "Ī", "uI": "Ĭ", ";I": "Į", ".I": "İ",
		"`O": 'Ò', "'O": "Ó", "^O": "Ô", "~O": "Õ", "\"O": "Ö", "=O": "Ō", "uO": "Ŏ", "/O": "Ø",
		"`U": 'Ù', "'U": "Ú", "^U": "Û", "~U": "Ũ", "\"U": "Ü", "oU": "Ů", "=U": "Ū", "uU": "Ŭ", ";U": "Ų",
		"ae": "æ", "AE": "Æ", "oe": "œ", "OE": "Œ", "ss": "ß",
		"'c": "ć", "^c": "ĉ", "uc": "č", "cc": "ç", ".c": "ċ", "cC": "Ç", "'C": "Ć", "^C": "Ĉ", "uC": "Č", ".C": "Ċ",
		"~n": "ñ",
		"=s": "š", "vs": "š",
		"vz": 'ž'

// More chars: Ñ Ĳ ĳ Ď ď Đ đ Ĝ ĝ Ğ ğ Ġ ġ Ģ ģ Ĥ ĥ Ħ ħ Ĵ ĵ Ķ ķ ĸ Ĺ ĺ Ļ ļ Ľ ľ Ŀ ŀ Ł ł Ń ń Ņ ņ Ň ň ŉ Ŋ ŋ   Ŕ ŕ Ŗ ŗ Ř ř Ś ś Ŝ ŝ Ş ş Š Ţ ţ Ť ť Ŧ ŧ Ŵ ŵ Ŷ ŷ Ÿ ÿ Ÿ Ź ź Ż ż Ž 
	};
	var charMap1 = {
		"#": "♯",
		"b": "♭",
		"=": "♮"
	};
	var charMap2 = {
		"201": "♯",
		"202": "♭",
		"203": "♮",
		"241": "¡",
 		"242": "¢", "252": "a", "262": "2", "272": "o", "302": "Â", "312": "Ê", "322": "Ò", "332": "Ú", "342": "â", "352": "ê", "362": "ò", "372": "ú",
 		"243": "£", "253": "«", "263": "3", "273": "»", "303": "Ã", "313": "Ë", "323": "Ó", "333": "Û", "343": "ã", "353": "ë", "363": "ó", "373": "û",
 		"244": "¤", "254": "¬", "264": "  ́", "274": "1⁄4", "304": "Ä", "314": "Ì", "324": "Ô", "334": "Ü", "344": "ä", "354": "ì", "364": "ô", "374": "ü",
 		"245": "¥", "255": "-", "265": "μ", "275": "1⁄2", "305": "Å", "315": "Í", "325": "Õ", "335": "Ý",  "345": "å", "355": "í", "365": "õ", "375": "ý",
 		"246": "¦", "256": "®", "266": "¶", "276": "3⁄4", "306": "Æ", "316": "Î", "326": "Ö", "336": "Þ", "346": "æ", "356": "î", "366": "ö", "376": "þ",
 		"247": "§", "257": " ̄", "267": "·", "277": "¿", "307": "Ç", "317": "Ï", "327": "×", "337": "ß", "347": "ç", "357": "ï", "367": "÷", "377": "ÿ",
		"250": " ̈", "260": "°", "270": " ̧", "300": "À", "310": "È", "320": "Ð", "330": "Ø", "340": "à", "350": "è", "360": "ð", "370": "ø",
 		"251": "©", "261": "±", "271": "1", "301": "Á", "311": "É", "321": "Ñ", "331": "Ù", "341": "á", "351": "é", "361": "ñ", "371": "ù" };
	this.translateString = function(str) {
		var arr = str.split('\\');
		if (arr.length === 1) return str;
		var out = null;
		arr.each(function(s) {
			if (out === null)
				out = s;
			else {
				var c = charMap[s.substring(0, 2)];
				if (c !== undefined)
					out += c + s.substring(2);
				else {
					c = charMap2[s.substring(0, 3)];
					if (c !== undefined)
						out += c + s.substring(3);
					else {
						c = charMap1[s.substring(0, 1)];
						if (c !== undefined)
							out += c + s.substring(1);
						else
							out += "\\" + s;
					}
				}
			}
		});
		return out;
	};
	this.getNumber = function(line, index) {
		var num = 0;
		while (index < line.length) {
			switch (line.charAt(index)) {
				case '0':num = num*10;index++;break;
				case '1':num = num*10+1;index++;break;
				case '2':num = num*10+2;index++;break;
				case '3':num = num*10+3;index++;break;
				case '4':num = num*10+4;index++;break;
				case '5':num = num*10+5;index++;break;
				case '6':num = num*10+6;index++;break;
				case '7':num = num*10+7;index++;break;
				case '8':num = num*10+8;index++;break;
				case '9':num = num*10+9;index++;break;
				default:
					return {num: num, index: index};
			}
		}
		return {num: num, index: index};
	};

	this.getFraction = function(line, index) {
		var num = 1;
		var den = 1;
		if (line.charAt(index) !== '/') {
			var ret = this.getNumber(line, index);
			num = ret.num;
			index = ret.index;
		}
		if (line.charAt(index) === '/') {
			index++;
			if (line.charAt(index) === '/') {
				var div = 0.5;
				while (line.charAt(index++) === '/')
					div = div /2;
				return {value: num * div, index: index-1};
			} else {
				var iSave = index;
				var ret2 = this.getNumber(line, index);
				if (ret2.num === 0 && iSave === index)	// If we didn't use any characters, it is an implied 2
					ret2.num = 2;
				if (ret2.num !== 0)
					den = ret2.num;
				index = ret2.index;
			}
		}

		return {value: num/den, index: index};
	};

	this.theReverser = function(str) {
		if (str.endsWith(", The"))
			return "The " + str.substring(0, str.length-5);
		if (str.endsWith(", A"))
			return "A " + str.substring(0, str.length-3);
		return str;
	};

	this.stripComment = function(str) {
		var i = str.indexOf('%');
		if (i >= 0)
			return str.substring(0, i).strip();
		return str.strip();
	};

	this.getInt = function(str) {
		// This parses the beginning of the string for a number and returns { value: num, digits: num }
		// If digits is 0, then the string didn't point to a number.
		var x = parseInt(str);
		if (isNaN(x))
			return {digits: 0};
		var s = "" + x;
		var i = str.indexOf(s);	// This is to account for leading spaces
		return {value: x, digits: i+s.length};
	};

	this.getFloat = function(str) {
		// This parses the beginning of the string for a number and returns { value: num, digits: num }
		// If digits is 0, then the string didn't point to a number.
		var x = parseFloat(str);
		if (isNaN(x))
			return {digits: 0};
		var s = "" + x;
		var i = str.indexOf(s);	// This is to account for leading spaces
		return {value: x, digits: i+s.length};
	};

	this.getMeasurement = function(tokens) {
		if (tokens.length === 0) return { used: 0 };
		var used = 1;
		var num = '';
		if (tokens[0].token === '-') {
			tokens.shift();
			num = '-';
			used++;
		}
		else if (tokens[0].type !== 'number') return { used: 0 };
		num += tokens.shift().token;
		if (tokens.length === 0) return { used: 1, value: parseInt(num) };
		var x = tokens.shift();
		if (x.token === '.') {
			used++;
			if (tokens.length === 0) return { used: used, value: parseInt(num) };
			if (tokens[0].type === 'number') {
				x = tokens.shift();
				num = num + '.' + x.token;
				used++;
				if (tokens.length === 0) return { used: used, value: parseFloat(num) };
			}
			x = tokens.shift();
		}
		switch (x.token) {
			case 'pt': return { used: used+1, value: parseFloat(num) };
			case 'cm': return { used: used+1, value: parseFloat(num)/2.54*72 };
			case 'in': return { used: used+1, value: parseFloat(num)*72 };
			default: tokens.unshift(x); return { used: used, value: parseFloat(num) };
		}
		return { used: 0 };
	};
	var substInChord = function(str)
	{
		while ( str.indexOf("\\n") !== -1)
		{
			str = str.replace("\\n", "\n");
		}
		return str;
	};
	this.getBrackettedSubstring = function(line, i, maxErrorChars, _matchChar)
	{
		// This extracts the sub string by looking at the first character and searching for that
		// character later in the line (or search for the optional _matchChar).
		// For instance, if the first character is a quote it will look for
		// the end quote. If the end of the line is reached, then only up to the default number
		// of characters are returned, so that a missing end quote won't eat up the entire line.
		// It returns the substring and the number of characters consumed.
		// The number of characters consumed is normally two more than the size of the substring,
		// but in the error case it might not be.
		var matchChar = _matchChar || line.charAt(i);
		var pos = i+1;
		while ((pos < line.length) && (line.charAt(pos) !== matchChar))
			++pos;
		if (line.charAt(pos) === matchChar)
			return [pos-i+1,substInChord(line.substring(i+1, pos)), true];
		else	// we hit the end of line, so we'll just pick an arbitrary num of chars so the line doesn't disappear.
		{
			pos = i+maxErrorChars;
			if (pos > line.length-1)
				pos = line.length-1;
			return [pos-i+1, substInChord(line.substring(i+1, pos)), false];
		}
	};
}

//    abc_tune.js: a computer usable internal structure representing one tune.
//    Copyright (C) 2010 Paul Rosen (paul at paulrosen dot net)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*extern AbcTune */

// This is the data for a single ABC tune. It is created and populated by the AbcParse class.
function AbcTune() {
	// The structure consists of a hash with the following two items:
	// metaText: a hash of {key, value}, where key is one of: title, author, rhythm, source, transcription, unalignedWords, etc...
	// tempo: { noteLength: number (e.g. .125), bpm: number }
	// lines: an array of elements, or one of the following:
	//
	// STAFF: array of elements
	// SUBTITLE: string
	//
	// TODO: actually, the start and end char should modify each part of the note type
	// The elements all have a type field and a start and end char
	// field. The rest of the fields depend on the type and are listed below:
	// REST: duration=1,2,4,8; chord: string
	// NOTE: accidental=none,dbl_flat,flat,natural,sharp,dbl_sharp
	//		pitch: "C" is 0. The numbers refer to the pitch letter.
	//		duration: .5 (sixteenth), .75 (dotted sixteenth), 1 (eighth), 1.5 (dotted eighth)
	//			2 (quarter), 3 (dotted quarter), 4 (half), 6 (dotted half) 8 (whole)
	//		chord: { name:chord, position: one of 'default', 'above', 'below' }
	//		end_beam = true or undefined if this is the last note in a beam.
	//		lyric: array of { syllable: xxx, divider: one of " -_" }
	//		startTie = true|undefined
	//		endTie = true|undefined
	//		startTriplet = num <- that is the number to print
	//		endTriplet = true|undefined (the last note of the triplet)
	// TODO: actually, decoration should be an array.
	//		decoration: upbow, downbow, accent
	// BAR: type=bar_thin, bar_thin_thick, bar_thin_thin, bar_thick_thin, bar_right_repeat, bar_left_repeat, bar_double_repeat
	//	number: 1 or 2: if it is the start of a first or second ending
	// CLEF: type=treble,bass
	// KEY-SIG:
	//		accidentals[]: { acc:sharp|dblsharp|natural|flat|dblflat,  note:a|b|c|d|e|f|g }
	// METER: type: common_time,cut_time,specified
	//		if specified, { num: 99, den: 99 }
	this.reset = function () {
		this.version = "1.0.1";
		this.media = "screen";
		this.metaText = {};
		this.formatting = {};
		this.lines = [];
		this.staffNum = 0;
		this.voiceNum = 0;
		this.lineNum = 0;
	};

	this.cleanUp = function(defWidth, defLength) {
		this.closeLine();	// Close the last line.
		// Remove any blank lines
		var anyDeleted = false;
		for (var i = 0; i < this.lines.length; i++) {
			if (this.lines[i].staff !== undefined) {
				var hasAny = false;
				for (var s = 0; s < this.lines[i].staff.length; s++) {
					if (this.lines[i].staff[s] === undefined) {
						anyDeleted = true;
						this.lines[i].staff[s] = null;
						//this.lines[i].staff[s] = { voices: []};	// TODO-PER: There was a part missing in the abc music. How should we recover?
					} else {
						for (var v = 0; v < this.lines[i].staff[s].voices.length; v++) {
							if (this.lines[i].staff[s].voices[v] === undefined)
								this.lines[i].staff[s].voices[v] = [];	// TODO-PER: There was a part missing in the abc music. How should we recover?
							else
								if (this.containsNotes(this.lines[i].staff[s].voices[v])) hasAny = true;
						}
					}
				}
				if (!hasAny) {
					this.lines[i] = null;
					anyDeleted = true;
				}
			}
		}
		if (anyDeleted) {
			this.lines = this.lines.compact();
			this.lines.each(function(line) {
				if (line.staff)
					line.staff = line.staff.compact();
			});
		}
		function cleanUpSlursInLine(line) {
			var currSlur = [];
			var x;
//			var lyr = null;	// TODO-PER: debugging.

			var addEndSlur = function(obj, num, chordPos) {
				if (currSlur[chordPos] === undefined) {
					// There isn't an exact match for note position, but we'll take any other open slur.
					for (x = 0; x < currSlur.length; x++) {
						if (currSlur[x] !== undefined) {
							chordPos = x;
							break;
						}
					}
					if (currSlur[chordPos] === undefined) {
						var offNum = chordPos*100;
						obj.endSlur.each(function(x) { if (offNum === x) --offNum; })
						currSlur[chordPos] = [offNum];
					}
				}
				for (var i = 0; i < num; i++) {
					var slurNum = currSlur[chordPos].pop();
					obj.endSlur.push(slurNum);
//					lyr.syllable += '<' + slurNum;	// TODO-PER: debugging
				}
				if (currSlur[chordPos].length === 0)
					delete currSlur[chordPos];
				return slurNum;
			};

			var addStartSlur = function(obj, num, chordPos, usedNums) {
				obj.startSlur = [];
				if (currSlur[chordPos] === undefined) {
					currSlur[chordPos] = [];
				}
				var nextNum = chordPos*100+1;
				for (var i = 0; i < num; i++) {
					if (usedNums) {
						usedNums.each(function(x) { if (nextNum === x) ++nextNum; })
						usedNums.each(function(x) { if (nextNum === x) ++nextNum; })
						usedNums.each(function(x) { if (nextNum === x) ++nextNum; })
					}
					currSlur[chordPos].each(function(x) { if (nextNum === x) ++nextNum; })
					currSlur[chordPos].each(function(x) { if (nextNum === x) ++nextNum; })

					currSlur[chordPos].push(nextNum);
					obj.startSlur.push({ label: nextNum });
//					lyr.syllable += ' ' + nextNum + '>';	// TODO-PER:debugging
					nextNum++;
				}
			};

			for (var i = 0; i < line.length; i++) {
				var el = line[i];
//				if (el.lyric === undefined)	// TODO-PER: debugging
//					el.lyric = [{ divider: '-' }];	// TODO-PER: debugging
//				lyr = el.lyric[0];	// TODO-PER: debugging
//				lyr.syllable = '';	// TODO-PER: debugging
				if (el.el_type === 'note') {
					if (el.gracenotes) {
						for (var g = 0; g < el.gracenotes.length; g++) {
							if (el.gracenotes[g].endSlur) {
								var gg = el.gracenotes[g].endSlur;
								el.gracenotes[g].endSlur = [];
								for (var ggg = 0; ggg < gg; ggg++)
									addEndSlur(el.gracenotes[g], 1, 20);
							}
							if (el.gracenotes[g].startSlur) {
								x = el.gracenotes[g].startSlur;
								addStartSlur(el.gracenotes[g], x, 20);
							}
						}
					}
					if (el.endSlur) {
						x = el.endSlur;
						el.endSlur = [];
						addEndSlur(el, x, 0);
					}
					if (el.startSlur) {
						x = el.startSlur;
						addStartSlur(el, x, 0);
					}
					if (el.pitches) {
						var usedNums = [];
						for (var p = 0; p < el.pitches.length; p++) {
							if (el.pitches[p].endSlur) {
								var k = el.pitches[p].endSlur;
								el.pitches[p].endSlur = [];
								for (var j = 0; j < k; j++) {
									var slurNum = addEndSlur(el.pitches[p], 1, p+1);
									usedNums.push(slurNum);
								}
							}
						}
						for (p = 0; p < el.pitches.length; p++) {
							if (el.pitches[p].startSlur) {
								x = el.pitches[p].startSlur;
								addStartSlur(el.pitches[p], x, p+1, usedNums);
							}
						}
						// Correct for the weird gracenote case where ({g}a) should match.
						// The end slur was already assigned to the note, and needs to be moved to the first note of the graces.
						if (el.gracenotes && el.pitches[0].endSlur && el.pitches[0].endSlur[0] === 100 && el.pitches[0].startSlur) {
							if (el.gracenotes[0].endSlur)
								el.gracenotes[0].endSlur.push(el.pitches[0].startSlur[0].label);
							else
								el.gracenotes[0].endSlur = [el.pitches[0].startSlur[0].label];
							if (el.pitches[0].endSlur.length === 1)
								delete el.pitches[0].endSlur;
							else if (el.pitches[0].endSlur[0] === 100)
								el.pitches[0].endSlur.shift();
							else if (el.pitches[0].endSlur[el.pitches[0].endSlur.length-1] === 100)
								el.pitches[0].endSlur.pop();
							if (currSlur[1].length === 1)
								delete currSlur[1];
							else
								currSlur[1].pop();
						}
					}
				}
			}
		}

		// TODO-PER: This could be done faster as we go instead of as the last step.
		function fixClefPlacement(el) {
			//if (el.el_type === 'clef') {
				var min = -2;
				var max = 5;
				switch(el.type) {
					case 'treble+8':
					case 'treble-8':
						break;
					case 'bass':
					case 'bass+8':
					case 'bass-8':
						el.verticalPos = 20 + el.verticalPos; min += 6; max += 6; break;
						break;
					case 'tenor':
					case 'tenor+8':
					case 'tenor-8':
						el.verticalPos = - el.verticalPos; min = -40; max = 40;
//						el.verticalPos+=2; min += 6; max += 6;
						break;
					case 'alto':
					case 'alto+8':
					case 'alto-8':
						el.verticalPos = - el.verticalPos; min = -40; max = 40;
//						el.verticalPos-=2; min += 4; max += 4;
						break;
				}
				if (el.verticalPos < min) {
					while (el.verticalPos < min)
						el.verticalPos += 7;
				} else if (el.verticalPos > max) {
					while (el.verticalPos > max)
						el.verticalPos -= 7;
				}
			//}
		}

		for (this.lineNum = 0; this.lineNum < this.lines.length; this.lineNum++) {
			if (this.lines[this.lineNum].staff) for (this.staffNum = 0; this.staffNum < this.lines[this.lineNum].staff.length; this.staffNum++) {
				if (this.lines[this.lineNum].staff[this.staffNum].clef)
					fixClefPlacement(this.lines[this.lineNum].staff[this.staffNum].clef);
				for (this.voiceNum = 0; this.voiceNum < this.lines[this.lineNum].staff[this.staffNum].voices.length; this.voiceNum++) {
//					var el = this.getLastNote();
//					if (el) el.end_beam = true;
					cleanUpSlursInLine(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum]);
					for (var j = 0; j < this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum].length; j++)
						if (this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum][j].el_type === 'clef')
							fixClefPlacement(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum][j]);
				}
			}
		}

		if (!this.formatting.pagewidth)
			this.formatting.pagewidth = defWidth;
		if (!this.formatting.pageheight)
			this.formatting.pageheight = defLength;

		// Remove temporary variables that the outside doesn't need to know about
		delete this.staffNum;
		delete this.voiceNum;
		delete this.lineNum;
		delete this.potentialStartBeam;
		delete this.potentialEndBeam;
		delete this.vskipPending;
	};

	this.reset();

	this.getLastNote = function() {
		if (this.lines[this.lineNum] && this.lines[this.lineNum].staff && this.lines[this.lineNum].staff[this.staffNum] &&
			this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum]) {
			for (var i = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum].length-1; i >= 0; i--) {
				var el = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum][i];
				if (el.el_type === 'note') {
					return el;
				}
			}
		}
		return null;
	};

	this.addTieToLastNote = function() {
		// TODO-PER: if this is a chord, which note?
		var el = this.getLastNote();
		if (el && el.pitches && el.pitches.length > 0) {
			el.pitches[0].startTie = {};
			return true;
		}
		return false;
	};

	this.getDuration = function(el) {
		if (el.duration) return el.duration;
		//if (el.pitches && el.pitches.length > 0) return el.pitches[0].duration;
		return 0;
	};

	this.closeLine = function() {
		if (this.potentialStartBeam && this.potentialEndBeam) {
			this.potentialStartBeam.startBeam = true;
			this.potentialEndBeam.endBeam = true;
		}
		delete this.potentialStartBeam;
		delete this.potentialEndBeam;
	};

	this.appendElement = function(type, startChar, endChar, hashParams)
	{
		var This = this;
		var pushNote = function(hp) {
			if (hp.pitches !== undefined) {
				var mid = This.lines[This.lineNum].staff[This.staffNum].clef.verticalPos;
				hp.pitches.each(function(p) { p.verticalPos = p.pitch - mid; });
			}
			if (hp.gracenotes !== undefined) {
				var mid2 = This.lines[This.lineNum].staff[This.staffNum].clef.verticalPos;
				hp.gracenotes.each(function(p) { p.verticalPos = p.pitch - mid2; });
			}
			This.lines[This.lineNum].staff[This.staffNum].voices[This.voiceNum].push(hp);
		};
		hashParams.el_type = type;
		if (startChar !== null)
			hashParams.startChar = startChar;
		if (endChar !== null)
			hashParams.endChar = endChar;
		var endBeamHere = function() {
			This.potentialStartBeam.startBeam = true;
			hashParams.endBeam = true;
			delete This.potentialStartBeam;
			delete This.potentialEndBeam;
		};
		var endBeamLast = function() {
			if (This.potentialStartBeam !== undefined && This.potentialEndBeam !== undefined) {	// Do we have a set of notes to beam?
				This.potentialStartBeam.startBeam = true;
				This.potentialEndBeam.endBeam = true;
			}
			delete This.potentialStartBeam;
			delete This.potentialEndBeam;
		};
		if (type === 'note') { // && (hashParams.rest !== undefined || hashParams.end_beam === undefined)) {
			// Now, add the startBeam and endBeam where it is needed.
			// end_beam is already set on the places where there is a forced end_beam. We'll remove that here after using that info.
			// this.potentialStartBeam either points to null or the start beam.
			// this.potentialEndBeam either points to null or the start beam.
			// If we have a beam break (note is longer than a quarter, or an end_beam is on this element), then set the beam if we have one.
			// reset the variables for the next notes.
			var dur = This.getDuration(hashParams);
			if (dur >= 0.25) {	// The beam ends on the note before this.
				endBeamLast();
			} else if (hashParams.force_end_beam_last && This.potentialStartBeam !== undefined) {
				endBeamLast();
			} else if (hashParams.end_beam && This.potentialStartBeam !== undefined) {	// the beam is forced to end on this note, probably because of a space in the ABC
				if (hashParams.rest === undefined)
					endBeamHere();
				else
					endBeamLast();
			} else if (hashParams.rest === undefined) {	// this a short note and we aren't about to end the beam
				if (This.potentialStartBeam === undefined) {	// We aren't collecting notes for a beam, so start here.
					if (!hashParams.end_beam) {
						This.potentialStartBeam = hashParams;
						delete This.potentialEndBeam;
					}
				} else {
					This.potentialEndBeam = hashParams;	// Continue the beaming, look for the end next note.
				}
			}

			//  end_beam goes on rests and notes which precede rests _except_ when a rest (or set of adjacent rests) has normal notes on both sides (no spaces)
//			if (hashParams.rest !== undefined)
//			{
//				hashParams.end_beam = true;
//				var el2 = this.getLastNote();
//				if (el2) el2.end_beam = true;
//				// TODO-PER: implement exception mentioned in the comment.
//			}
		} else {	// It's not a note, so there definitely isn't beaming after it.
			endBeamLast();
		}
		delete hashParams.end_beam;	// We don't want this temporary variable hanging around.
		delete hashParams.force_end_beam_last;	// We don't want this temporary variable hanging around.
		pushNote(hashParams);
	};

	this.appendStartingElement = function(type, startChar, endChar, hashParams2)
	{
		// Clone the object because it will be sticking around for the next line and we don't want the extra fields in it.
		var hashParams = Object.clone(hashParams2);

		// These elements should not be added twice, so if the element exists on this line without a note or bar before it, just replace the staff version.
		var voice = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum];
		for (var i = 0; i < voice.length; i++) {
			if (voice[i].el_type === 'note' || voice[i].el_type === 'bar') {
				hashParams.el_type = type;
				hashParams.startChar = startChar;
				hashParams.endChar = endChar;
				voice.push(hashParams);
				return;
			}
			if (voice[i].el_type === type) {
				hashParams.el_type = type;
				hashParams.startChar = startChar;
				hashParams.endChar = endChar;
				voice[i] = hashParams;
				return;
			}
		}
		// We didn't see either that type or a note, so replace the element to the staff.
		this.lines[this.lineNum].staff[this.staffNum][type] = hashParams2;
	};

	this.getNumLines = function() {
		return this.lines.length;
	};

	this.pushLine = function(hash) {
		if (this.vskipPending) {
			hash.vskip = this.vskipPending;
			delete this.vskipPending;
		}
		this.lines.push(hash);
	}

	this.addSubtitle = function(str) {
		this.pushLine({subtitle: str});
	};

	this.addSpacing = function(num) {
		this.vskipPending = num;
	};

	this.addNewPage = function(num) {
		this.pushLine({newpage: num});
	};

	this.addSeparator = function(spaceAbove, spaceBelow, lineLength) {
		this.pushLine({separator: {spaceAbove: spaceAbove, spaceBelow: spaceBelow, lineLength: lineLength}});
	};

	this.addText = function(str) {
		this.pushLine({text: str});
	};

	this.addCentered = function(str) {
		this.pushLine({text: [{text: str, center: true }]});
	};

	this.containsNotes = function(voice) {
		for (var i = 0; i < voice.length; i++) {
			if (voice[i].el_type === 'note' || voice[i].el_type === 'bar')
				return true;
		}
		return false;
	};

//	anyVoiceContainsNotes: function(line) {
//		for (var i = 0; i < line.staff.voices.length; i++) {
//			if (this.containsNotes(line.staff.voices[i]))
//				return true;
//		}
//		return false;
//	},

	this.startNewLine = function(params) {
		// If the pointed to line doesn't exist, just create that. If the line does exist, but doesn't have any music on it, just use it.
		// If it does exist and has music, then increment the line number. If the new element doesn't exist, create it.
		var This = this;
		this.closeLine();	// Close the previous line.
		var createVoice = function(params) {
			This.lines[This.lineNum].staff[This.staffNum].voices[This.voiceNum] = [];
			if (This.isFirstLine(This.lineNum)) {
				if (params.name) {if (!This.lines[This.lineNum].staff[This.staffNum].title) This.lines[This.lineNum].staff[This.staffNum].title = [];This.lines[This.lineNum].staff[This.staffNum].title[This.voiceNum] = params.name;}
			} else {
				if (params.subname) {if (!This.lines[This.lineNum].staff[This.staffNum].title) This.lines[This.lineNum].staff[This.staffNum].title = [];This.lines[This.lineNum].staff[This.staffNum].title[This.voiceNum] = params.subname;}
			}
			if (params.style)
				This.appendElement('style', null, null, {head: params.style});
			if (params.stem)
				This.appendElement('stem', null, null, {direction: params.stem});
			else if (This.voiceNum > 0) {
				if (This.lines[This.lineNum].staff[This.staffNum].voices[0]!== undefined) {
					var found = false;
					for (var i = 0; i < This.lines[This.lineNum].staff[This.staffNum].voices[0].length; i++) {
						if (This.lines[This.lineNum].staff[This.staffNum].voices[0].el_type === 'stem')
							found = true;
					}
					if (!found) {
						var stem = { el_type: 'stem', direction: 'up' };
						This.lines[This.lineNum].staff[This.staffNum].voices[0].splice(0,0,stem);
					}
				}
				This.appendElement('stem', null, null, {direction: 'down'});
			}
			if (params.scale)
				This.appendElement('scale', null, null, { size: params.scale} );
		};
		var createStaff = function(params) {
			This.lines[This.lineNum].staff[This.staffNum] = {voices: [ ], clef: params.clef, key: params.key};
			if (params.vocalfont) This.lines[This.lineNum].staff[This.staffNum].vocalfont = params.vocalfont;
			if (params.bracket) This.lines[This.lineNum].staff[This.staffNum].bracket = params.bracket;
			if (params.brace) This.lines[This.lineNum].staff[This.staffNum].brace = params.brace;
			if (params.connectBarLines) This.lines[This.lineNum].staff[This.staffNum].connectBarLines = params.connectBarLines;
			createVoice(params);
			// Some stuff just happens for the first voice
			if (params.part)
				This.appendElement('part', params.startChar, params.endChar, {title: params.part});
			if (params.meter !== undefined) This.lines[This.lineNum].staff[This.staffNum].meter = params.meter;
		};
		var createLine = function(params) {
			This.lines[This.lineNum] = {staff: []};
			createStaff(params);
		};
		if (this.lines[this.lineNum] === undefined) createLine(params);
		else if (this.lines[this.lineNum].staff === undefined) {
			this.lineNum++;
			this.startNewLine(params);
		} else if (this.lines[this.lineNum].staff[this.staffNum] === undefined) createStaff(params);
		else if (this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum] === undefined) createVoice(params);
		else if (!this.containsNotes(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum])) return;
		else {
			this.lineNum++;
			this.startNewLine(params);
		}
	};

	this.hasBeginMusic = function() {
		return this.lines.length > 0;
	};

	this.isFirstLine = function(index) {
		for (var i = index-1; i >= 0; i--) {
			if (this.lines[i].staff !== undefined) return false;
		}
		return true;
	};

	this.getCurrentVoice = function() {
		if (this.lines[this.lineNum] !== undefined && this.lines[this.lineNum].staff[this.staffNum] !== undefined && this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum] !== undefined)
			return this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum];
		else return null;
	};

	this.setCurrentVoice = function(staffNum, voiceNum) {
		this.staffNum = staffNum;
		this.voiceNum = voiceNum;
		for (var i = 0; i < this.lines.length; i++) {
			if (this.lines[i].staff) {
				if (this.lines[i].staff[staffNum] === undefined || this.lines[i].staff[staffNum].voices[voiceNum] === undefined ||
					!this.containsNotes(this.lines[i].staff[staffNum].voices[voiceNum] )) {
					this.lineNum =  i;
					return;
				}
			}
		}
		this.lineNum =  i;
	};

	this.addMetaText = function(key, value) {
		if (this.metaText[key] === undefined)
			this.metaText[key] = value;
		else
			this.metaText[key] += "\n" + value;
	};

	this.addMetaTextArray = function(key, value) {
		if (this.metaText[key] === undefined)
			this.metaText[key] = [value];
		else
			this.metaText[key].push(value);
	};
	this.addMetaTextObj = function(key, value) {
		this.metaText[key] = value;
	};
}

//    abc_parse.js: parses a string representing ABC Music Notation into a usable internal structure.
//    Copyright (C) 2010 Paul Rosen (paul at paulrosen dot net)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*global AbcParseHeader, AbcTokenizer, AbcTune */
/*extern AbcParse */

function AbcParse() {
	var tune = new AbcTune();
	var tokenizer = new AbcTokenizer();

	this.getTune = function() {
		return tune;
	};

	var multilineVars = {
		reset: function() {
			for (var property in this) {
				if (this.hasOwnProperty(property) && typeof this[property] !== "function") {
					delete this[property];
				}
			}
			this.iChar = 0;
			this.key = {accidentals: [], root: 'none', acc: '', mode: '' };
			this.meter = {type: 'specified', value: [{num: '4', den: '4'}]};	// if no meter is specified, there is an implied one.
			this.origMeter = {type: 'specified', value: [{num: '4', den: '4'}]};	// this is for new voices that are created after we set the meter.
			this.hasMainTitle = false;
			this.default_length = 0.125;
			this.clef = { type: 'treble', verticalPos: 0 };
			this.next_note_duration = 0;
			this.start_new_line = true;
			this.is_in_header = true;
			this.is_in_history = false;
			this.partForNextLine = "";
			this.havent_set_length = true;
			this.voices = {};
			this.staves = [];
			this.macros = {};
			this.currBarNumber = 1;
			this.inTextBlock = false;
			this.inPsBlock = false;
			this.ignoredDecorations = [];
			this.textBlock = "";
			this.score_is_present = false;	// Can't have original V: lines when there is the score directive
			this.inEnding = false;
			this.inTie = false;
			this.inTieChord = {};
		}
	};

	var addWarning = function(str) {
		if (!multilineVars.warnings)
			multilineVars.warnings = [];
		multilineVars.warnings.push(str);
	};

	var warn = function(str, line, col_num) {
	  var bad_char = line.charAt(col_num);
		if (bad_char === ' ')
			bad_char = "SPACE";
		var clean_line = line.substring(0, col_num).gsub('\x12', ' ') + '\n' + bad_char + '\n' + line.substring(col_num+1).gsub('\x12', ' ');
		clean_line = clean_line.gsub('&', '&amp;').gsub('<', '&lt;').gsub('>', '&gt;').replace('\n', '<span style="text-decoration:underline;font-size:1.3em;font-weight:bold;">').replace('\n', '</span>');
		addWarning("Music Line:" + tune.getNumLines() + ":" + (col_num+1) + ': ' + str + ":  " + clean_line);
	};
	var header = new AbcParseHeader(tokenizer, warn, multilineVars, tune);

	this.getWarnings = function() {
		return multilineVars.warnings;
	};

	var letter_to_chord = function(line, i)
	{
		if (line.charAt(i) === '"')
		{
			var chord = tokenizer.getBrackettedSubstring(line, i, 5);
			if (!chord[2])
				warn("Missing the closing quote while parsing the chord symbol", line , i);
			// If it starts with ^, then the chord appears above.
			// If it starts with _ then the chord appears below.
			// (note that the 2.0 draft standard defines them as not chords, but annotations and also defines @.)
			if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '^') {
				chord[1] = chord[1].substring(1);
				chord[2] = 'above';
			} else if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '_') {
				chord[1] = chord[1].substring(1);
				chord[2] = 'below';
			} else if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '<') {
				chord[1] = chord[1].substring(1);
				chord[2] = 'left';
			} else if (chord[0] > 0 && chord[1].length > 0 && chord[1].charAt(0) === '>') {
				chord[1] = chord[1].substring(1);
				chord[2] = 'right';
			} else {
				chord[1] = chord[1].replace(/([ABCDEFG])b/g, "$1♭");
				chord[1] = chord[1].replace(/([ABCDEFG])#/g, "$1♯");
				chord[2] = 'default';
			}
			return chord;
		}
		return [0, ""];
	};

	var legalAccents = [ "trill", "lowermordent", "uppermordent", "mordent", "pralltriller", "accent",
		"emphasis", "fermata", "invertedfermata", "tenuto", "0", "1", "2", "3", "4", "5", "+", "wedge",
		"open", "thumb", "snap", "turn", "roll", "breath", "shortphrase", "mediumphrase", "longphrase",
		"segno", "coda", "D.S.", "D.C.", "fine", "crescendo(", "crescendo)", "diminuendo(", "diminuendo)",
		"p", "pp", "f", "ff", "mf", "mp", "ppp", "pppp",  "fff", "ffff", "sfz", "repeatbar", "repeatbar2", "slide",
		"upbow", "downbow", "/", "//", "///", "////", "trem1", "trem2", "trem3", "trem4",
		"turnx", "invertedturn", "invertedturnx", "trill(", "trill)", "arpeggio", "xstem",
		"style=normal", "style=harmonic", "style=rhythm", "style=x"
	];
	var accentPsuedonyms = [ ["<", "accent"], [">", "accent"], ["tr", "trill"], ["<(", "crescendo("], ["<)", "crescendo)"],
		[">(", "diminuendo("], [">)", "diminuendo)"], ["plus", "+"] ];
	var letter_to_accent = function(line, i)
	{
		var macro = multilineVars.macros[line.charAt(i)];

		if (macro !== undefined) {
			if (macro.charAt(0) === '!' || macro.charAt(0) === '+')
				macro = macro.substring(1);
			if (macro.charAt(macro.length-1) === '!' || macro.charAt(macro.length-1) === '+')
				macro = macro.substring(0, macro.length-1);
			if (legalAccents.detect(function(acc) {
					return (macro === acc);
				}))
				return [ 1, macro ];
			else {
				if (!multilineVars.ignoredDecorations.detect(function(dec) {
					return (macro === dec);
				}))
					warn("Unknown macro: " + macro, line, i);
				return [1, '' ];
			}
		}
		switch (line.charAt(i))
		{
			case '.':return [1, 'staccato'];
			case 'u':return [1, 'upbow'];
			case 'v':return [1, 'downbow'];
			case '~':return [1, 'roll'];
			case '!':
			case '+':
				var ret = tokenizer.getBrackettedSubstring(line, i, 5);
				// Be sure that the accent is recognizable.
			if (ret[1].length > 0 && (ret[1].charAt(0) === '^' || ret[1].charAt(0) ==='_'))
					ret[1] = ret[1].substring(1);	// TODO-PER: The test files have indicators forcing the orniment to the top or bottom, but that isn't in the standard. We'll just ignore them.
				if (legalAccents.detect(function(acc) {
					return (ret[1] === acc);
				}))
					return ret;

				if (accentPsuedonyms.detect(function(acc) {
					if (ret[1] === acc[0]) {
						ret[1] = acc[1];
						return true;
					} else
						return false;
				}))
					return ret;

				// We didn't find the accent in the list, so consume the space, but don't return an accent.
				// Although it is possible that ! was used as a line break, so accept that.
			if (line.charAt(i) === '!' && (ret[0] === 1 || line.charAt(i+ret[0]-1) !== '!'))
					return [1, null ];
				warn("Unknown decoration: " + ret[1], line, i);
				ret[1] = "";
				return ret;
			case 'H':return [1, 'fermata'];
			case 'J':return [1, 'slide'];
			case 'L':return [1, 'accent'];
			case 'M':return [1, 'mordent'];
			case 'O':return[1, 'coda'];
			case 'P':return[1, 'pralltriller'];
			case 'R':return [1, 'roll'];
			case 'S':return [1, 'segno'];
			case 'T':return [1, 'trill'];
		}
		return [0, 0];
	};

	var letter_to_spacer = function(line, i)
	{
		var start = i;
		while (tokenizer.isWhiteSpace(line.charAt(i)))
			i++;
		return [ i-start ];
	};

	// returns the class of the bar line
	// the number of the repeat
	// and the number of characters used up
	// if 0 is returned, then the next element was not a bar line
	var letter_to_bar = function(line, curr_pos)
	{
		var ret = tokenizer.getBarLine(line, curr_pos);
		if (ret.len === 0)
			return [0,""];
		if (ret.warn) {
			warn(ret.warn, line, curr_pos);
			return [ret.len,""];
		}

		// Now see if this is a repeated ending
		// A repeated ending is all of the characters 1,2,3,4,5,6,7,8,9,0,-, and comma
		// It can also optionally start with '[', which is ignored.
		// Also, it can have white space before the '['.
		for (var ws = 0; ws < line.length; ws++)
		  if (line.charAt(curr_pos+ret.len+ws) !== ' ')
				break;
		var orig_bar_len = ret.len;
		if (line.charAt(curr_pos+ret.len+ws) === '[') {
			ret.len += ws + 1;
			// It can also be a quoted string. It is unclear whether that construct requires '[', but it seems like it would. otherwise it would be confused with a regular chord.
			if (line.charAt(curr_pos+ret.len) === '"') {
				var ending = tokenizer.getBrackettedSubstring(line, curr_pos+ret.len, 5);
				return [ret.len+ending[0], ret.token, ending[1]];
			}
		}
		var retRep = tokenizer.getTokenOf(line.substring(curr_pos+ret.len), "1234567890-,");
		if (retRep.len === 0 || retRep.token[0] === '-')
			return [orig_bar_len, ret.token];

		return [ret.len+retRep.len, ret.token, retRep.token];
	};

	var letter_to_open_slurs_and_triplets =  function(line, i) {
		// consume spaces, and look for all the open parens. If there is a number after the open paren,
		// that is a triplet. Otherwise that is a slur. Collect all the slurs and the first triplet.
		var ret = {};
		var start = i;
		while (line.charAt(i) === '(' || tokenizer.isWhiteSpace(line.charAt(i))) {
			if (line.charAt(i) === '(') {
				if (i+1 < line.length && (line.charAt(i+1) >= '2' && line.charAt(i+1) <= '9')) {
					if (ret.triplet !== undefined)
						warn("Can't nest triplets", line, i);
					else {
						ret.triplet = line.charAt(i+1) - '0';
						if (i+2 < line.length && line.charAt(i+2) === ':') {
							// We are expecting "(p:q:r" or "(p:q" or "(p::r" we are only interested in the first number (p) and the number of notes (r)
							// if r is missing, then it is equal to p.
							if (i+3 < line.length && line.charAt(i+3) === ':') {
								if (i+4 < line.length && (line.charAt(i+4) >= '1' && line.charAt(i+4) <= '9')) {
									ret.num_notes = line.charAt(i+4) - '0';
									i += 3;
								} else
									warn("expected number after the two colons after the triplet to mark the duration", line, i);
							} else if (i+3 < line.length && (line.charAt(i+3) >= '1' && line.charAt(i+3) <= '9')) {
								// ignore this middle number
								if (i+4 < line.length && line.charAt(i+4) === ':') {
									if (i+5 < line.length && (line.charAt(i+5) >= '1' && line.charAt(i+5) <= '9')) {
										ret.num_notes = line.charAt(i+5) - '0';
										i += 4;
									}
								} else {
									ret.num_notes = ret.triplet;
									i += 3;
								}
							} else
								warn("expected number after the triplet to mark the duration", line, i);
						}
					}
					i++;
				}
				else {
					if (ret.startSlur === undefined)
						ret.startSlur = 1;
					else
						ret.startSlur++;
				}
			}
			i++;
		}
		ret.consumed = i-start;
		return ret;
	};

	var addWords = function(line, words) {
		if (!line) { warn("Can't add words before the first line of mulsic", line, 0); return; }
		words = words.strip();
		if (words.charAt(words.length-1) !== '-')
			words = words + ' ';	// Just makes it easier to parse below, since every word has a divider after it.
		var word_list = [];
		// first make a list of words from the string we are passed. A word is divided on either a space or dash.
		var last_divider = 0;
		var replace = false;
		var addWord = function(i) {
			var word = words.substring(last_divider, i).strip();
			last_divider = i+1;
			if (word.length > 0) {
				if (replace)
					word = word.gsub('~', ' ');
				var div = words.charAt(i);
				if (div !== '_' && div !== '-')
					div = ' ';
				word_list.push({syllable: tokenizer.translateString(word), divider: div});
				replace = false;
				return true;
			}
			return false;
		};
		for (var i = 0; i < words.length; i++) {
			switch (words.charAt(i)) {
				case ' ':
				case '\x12':
					addWord(i);
					break;
				case '-':
					if (!addWord(i) && word_list.length > 0) {
						word_list.last().divider = '-';
						word_list.push({skip: true, to: 'next'});
					}
					break;
				case '_':
					addWord(i);
					word_list.push({skip: true, to: 'slur'});
					break;
				case '*':
					addWord(i);
					word_list.push({skip: true, to: 'next'});
					break;
				case '|':
					addWord(i);
					word_list.push({skip: true, to: 'bar'});
					break;
				case '~':
					replace = true;
					break;
			}
		}

		var inSlur = false;
		line.each(function(el) {
			if (word_list.length !== 0) {
				if (word_list[0].skip) {
					switch (word_list[0].to) {
						case 'next': if (el.el_type === 'note' && el.pitches !== null && !inSlur) word_list.shift(); break;
						case 'slur': if (el.el_type === 'note' && el.pitches !== null) word_list.shift(); break;
						case 'bar': if (el.el_type === 'bar') word_list.shift(); break;
					}
				} else {
					if (el.el_type === 'note' && el.rest === undefined && !inSlur) {
						var lyric = word_list.shift();
						if (el.lyric === undefined)
							el.lyric = [ lyric ];
						else
							el.lyric.push(lyric);
					}
				}
			}
		});
	};

	var addSymbols = function(line, words) {
		// TODO-PER: Currently copied from w: line. This needs to be read as symbols instead.
		if (!line) { warn("Can't add symbols before the first line of mulsic", line, 0); return; }
		words = words.strip();
		if (words.charAt(words.length-1) !== '-')
			words = words + ' ';	// Just makes it easier to parse below, since every word has a divider after it.
		var word_list = [];
		// first make a list of words from the string we are passed. A word is divided on either a space or dash.
		var last_divider = 0;
		var replace = false;
		var addWord = function(i) {
			var word = words.substring(last_divider, i).strip();
			last_divider = i+1;
			if (word.length > 0) {
				if (replace)
					word = word.gsub('~', ' ');
				var div = words.charAt(i);
				if (div !== '_' && div !== '-')
					div = ' ';
				word_list.push({syllable: tokenizer.translateString(word), divider: div});
				replace = false;
				return true;
			}
			return false;
		};
		for (var i = 0; i < words.length; i++) {
			switch (words.charAt(i)) {
				case ' ':
				case '\x12':
					addWord(i);
					break;
				case '-':
					if (!addWord(i) && word_list.length > 0) {
						word_list.last().divider = '-';
						word_list.push({skip: true, to: 'next'});
					}
					break;
				case '_':
					addWord(i);
					word_list.push({skip: true, to: 'slur'});
					break;
				case '*':
					addWord(i);
					word_list.push({skip: true, to: 'next'});
					break;
				case '|':
					addWord(i);
					word_list.push({skip: true, to: 'bar'});
					break;
				case '~':
					replace = true;
					break;
			}
		}

		var inSlur = false;
		line.each(function(el) {
			if (word_list.length !== 0) {
				if (word_list[0].skip) {
					switch (word_list[0].to) {
						case 'next': if (el.el_type === 'note' && el.pitches !== null && !inSlur) word_list.shift(); break;
						case 'slur': if (el.el_type === 'note' && el.pitches !== null) word_list.shift(); break;
						case 'bar': if (el.el_type === 'bar') word_list.shift(); break;
					}
				} else {
					if (el.el_type === 'note' && el.rest === undefined && !inSlur) {
						var lyric = word_list.shift();
						if (el.lyric === undefined)
							el.lyric = [ lyric ];
						else
							el.lyric.push(lyric);
					}
				}
			}
		});
	};

	var getBrokenRhythm = function(line, index) {
		switch (line.charAt(index)) {
			case '>':
			if (index < line.length - 1 && line.charAt(index+1) === '>')	// double >>
					return [2, 1.75, 0.25];
				else
					return [1, 1.5, 0.5];
				break;
			case '<':
			if (index < line.length - 1 && line.charAt(index+1) === '<')	// double <<
					return [2, 0.25, 1.75];
				else
					return [1, 0.5, 1.5];
				break;
		}
		return null;
	};

	// TODO-PER: make this a method in el.
	var addEndBeam = function(el) {
		if (el.duration !== undefined && el.duration < 0.25)
			el.end_beam = true;
		return el;
	};

	var pitches = {A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11};
	var rests = {x: 'invisible', y: 'spacer', z: 'rest', Z: 'multimeasure' };
	var getCoreNote = function(line, index, el, canHaveBrokenRhythm) {
		//var el = { startChar: index };
		var isComplete = function(state) {
			return (state === 'octave' || state === 'duration' || state === 'Zduration' || state === 'broken_rhythm' || state === 'end_slur');
		};
		var state = 'startSlur';
		var durationSetByPreviousNote = false;
		while (1) {
			switch(line.charAt(index)) {
				case '(':
					if (state === 'startSlur') {
						if (el.startSlur === undefined) el.startSlur = 1; else el.startSlur++;
					} else if (isComplete(state)) {el.endChar = index;return el;}
					else return null;
					break;
				case ')':
					if (isComplete(state)) {
						if (el.endSlur === undefined) el.endSlur = 1; else el.endSlur++;
					} else return null;
					break;
				case '^':
					if (state === 'startSlur') {el.accidental = 'sharp';state = 'sharp2';}
					else if (state === 'sharp2') {el.accidental = 'dblsharp';state = 'pitch';}
					else if (isComplete(state)) {el.endChar = index;return el;}
					else return null;
					break;
				case '_':
					if (state === 'startSlur') {el.accidental = 'flat';state = 'flat2';}
					else if (state === 'flat2') {el.accidental = 'dblflat';state = 'pitch';}
					else if (isComplete(state)) {el.endChar = index;return el;}
					else return null;
					break;
				case '=':
					if (state === 'startSlur') {el.accidental = 'natural';state = 'pitch';}
					else if (isComplete(state)) {el.endChar = index;return el;}
					else return null;
					break;
				case 'A':
				case 'B':
				case 'C':
				case 'D':
				case 'E':
				case 'F':
				case 'G':
				case 'a':
				case 'b':
				case 'c':
				case 'd':
				case 'e':
				case 'f':
				case 'g':
					if (state === 'startSlur' || state === 'sharp2' || state === 'flat2' || state === 'pitch') {
						el.pitch = pitches[line.charAt(index)];
						state = 'octave';
						// At this point we have a valid note. The rest is optional. Set the duration in case we don't get one below
						if (canHaveBrokenRhythm && multilineVars.next_note_duration !== 0) {
							el.duration = multilineVars.next_note_duration;
							multilineVars.next_note_duration = 0;
							durationSetByPreviousNote = true;
						} else
							el.duration = multilineVars.default_length;
					} else if (isComplete(state)) {el.endChar = index;return el;}
					else return null;
					break;
				case ',':
					if (state === 'octave') {el.pitch -= 7;}
					else if (isComplete(state)) {el.endChar = index;return el;}
					else return null;
					break;
				case '\'':
					if (state === 'octave') {el.pitch += 7;}
					else if (isComplete(state)) {el.endChar = index;return el;}
					else return null;
					break;
				case 'x':
				case 'y':
				case 'z':
				case 'Z':
					if (state === 'startSlur') {
						el.rest = { type: rests[line.charAt(index)] };
						// There shouldn't be some of the properties that notes have. If some sneak in due to bad syntax in the abc file,
						// just nix them here.
						delete el.accidental;
						delete el.startSlur;
						delete el.startTie;
						delete el.endSlur;
						delete el.endTie;
						delete el.end_beam;
						delete el.grace_notes;
						// At this point we have a valid note. The rest is optional. Set the duration in case we don't get one below
						if (el.rest.type === 'multimeasure') {
							el.duration = 1;
							state = 'Zduration';
						} else {
							if (canHaveBrokenRhythm && multilineVars.next_note_duration !== 0) {
								el.duration = multilineVars.next_note_duration;
								multilineVars.next_note_duration = 0;
								durationSetByPreviousNote = true;
							} else
								el.duration = multilineVars.default_length;
							state = 'duration';
						}
					} else if (isComplete(state)) {el.endChar = index;return el;}
					else return null;
					break;
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
				case '0':
				case '/':
					if (state === 'octave' || state === 'duration') {
						var fraction = tokenizer.getFraction(line, index);
						if (!durationSetByPreviousNote)
							el.duration = el.duration * fraction.value;
						// TODO-PER: We can test the returned duration here and give a warning if it isn't the one expected.
						el.endChar = fraction.index;
						while (fraction.index < line.length && (tokenizer.isWhiteSpace(line.charAt(fraction.index)) || line.charAt(fraction.index) === '-')) {
						  if (line.charAt(fraction.index) === '-')
								el.startTie = {};
							else
								el = addEndBeam(el);
							fraction.index++;
						}
						index = fraction.index-1;
						state = 'broken_rhythm';
					} else if (state === 'sharp2') {
						el.accidental = 'quartersharp';state = 'pitch';
					} else if (state === 'flat2') {
						el.accidental = 'quarterflat';state = 'pitch';
					} else if (state === 'Zduration') {
						var num = tokenizer.getNumber(line, index);
						el.duration = num.num;
						el.endChar = num.index;
						return el;
					} else return null;
					break;
				case '-':
					if (state === 'startSlur') {
						// This is the first character, so it must have been meant for the previous note. Correct that here.
						tune.addTieToLastNote();
						el.endTie = true;
					} else if (state === 'octave' || state === 'duration' || state === 'end_slur') {
						el.startTie = {};
						if (!durationSetByPreviousNote && canHaveBrokenRhythm)
							state = 'broken_rhythm';
						else {
							// Peek ahead to the next character. If it is a space, then we have an end beam.
						  if (tokenizer.isWhiteSpace(line.charAt(index+1)))
								addEndBeam(el);
							el.endChar = index+1;
							return el;
						}
					} else if (state === 'broken_rhythm') {el.endChar = index;return el;}
					else return null;
					break;
				case ' ':
				case '\t':
					if (isComplete(state)) {
						el.end_beam = true;
						// look ahead to see if there is a tie
						do {
						  if (line.charAt(index) === '-')
								el.startTie = {};
							index++;
						} while (index < line.length && (tokenizer.isWhiteSpace(line.charAt(index)) || line.charAt(index) === '-'));
						el.endChar = index;
						if (!durationSetByPreviousNote && canHaveBrokenRhythm && (line.charAt(index) === '<' || line.charAt(index) === '>')) {	// TODO-PER: Don't need the test for < and >, but that makes the endChar work out for the regression test.
							index--;
							state = 'broken_rhythm';
						} else
							return el;
					}
					else return null;
					break;
				case '>':
				case '<':
					if (isComplete(state)) {
						if (canHaveBrokenRhythm) {
							var br2 = getBrokenRhythm(line, index);
							index += br2[0] - 1;	// index gets incremented below, so we'll let that happen
							multilineVars.next_note_duration = br2[2]*el.duration;
							el.duration = br2[1]*el.duration;
							state = 'end_slur';
						} else {
							el.endChar = index;
							return el;
						}
					} else
						return null;
					break;
				default:
					if (isComplete(state)) {
						el.endChar = index;
						return el;
					}
					return null;
			}
			index++;
			if (index === line.length) {
				if (isComplete(state)) {el.endChar = index;return el;}
				else return null;
			}
		}
		return null;
	};

	function startNewLine() {
		var params = { startChar: -1, endChar: -1};
		if (multilineVars.partForNextLine.length)
			params.part = multilineVars.partForNextLine;
		params.clef = multilineVars.currentVoice && multilineVars.staves[multilineVars.currentVoice.staffNum].clef !== undefined ? Object.clone(multilineVars.staves[multilineVars.currentVoice.staffNum].clef) : Object.clone(multilineVars.clef) ;
		params.key = header.deepCopyKey(multilineVars.key);
		header.addPosToKey(params.clef, params.key);
		if (multilineVars.meter !== null) {
			if (multilineVars.currentVoice) {
				multilineVars.staves.each(function(st) {
					st.meter = multilineVars.meter;
				});
				params.meter = multilineVars.staves[multilineVars.currentVoice.staffNum].meter;
				multilineVars.staves[multilineVars.currentVoice.staffNum].meter = null;
			} else
				params.meter = multilineVars.meter;
			multilineVars.meter = null;
		} else if (multilineVars.currentVoice && multilineVars.staves[multilineVars.currentVoice.staffNum].meter) {
			// Make sure that each voice gets the meter marking.
			params.meter = multilineVars.staves[multilineVars.currentVoice.staffNum].meter;
			multilineVars.staves[multilineVars.currentVoice.staffNum].meter = null;
		}
		if (multilineVars.currentVoice && multilineVars.currentVoice.name)
			params.name = multilineVars.currentVoice.name;
		if (multilineVars.vocalfont)
			params.vocalfont = multilineVars.vocalfont;
		if (multilineVars.style)
			params.style = multilineVars.style;
		if (multilineVars.currentVoice) {
			var staff = multilineVars.staves[multilineVars.currentVoice.staffNum];
			if (staff.brace) params.brace = staff.brace;
			if (staff.bracket) params.bracket = staff.bracket;
			if (staff.connectBarLines) params.connectBarLines = staff.connectBarLines;
			if (staff.name) params.name = staff.name[multilineVars.currentVoice.index];
			if (staff.subname) params.subname = staff.subname[multilineVars.currentVoice.index];
			if (multilineVars.currentVoice.stem)
				params.stem = multilineVars.currentVoice.stem;
			if (multilineVars.currentVoice.scale)
				params.scale = multilineVars.currentVoice.scale;
			if (multilineVars.currentVoice.style)
				params.style = multilineVars.currentVoice.style;
		}
		tune.startNewLine(params);

		multilineVars.partForNextLine = "";
		if (multilineVars.currentVoice === undefined || (multilineVars.currentVoice.staffNum === multilineVars.staves.length-1 && multilineVars.staves[multilineVars.currentVoice.staffNum].numVoices-1 === multilineVars.currentVoice.index)) {
			//multilineVars.meter = null;
			if (multilineVars.barNumbers === 0)
				multilineVars.barNumOnNextNote = multilineVars.currBarNumber;
		}
	}

	var letter_to_grace =  function(line, i) {
		// Grace notes are an array of: startslur, note, endslur, space; where note is accidental, pitch, duration
		if (line.charAt(i) === '{') {
			// fetch the gracenotes string and consume that into the array
			var gra = tokenizer.getBrackettedSubstring(line, i, 1, '}');
			if (!gra[2])
				warn("Missing the closing '}' while parsing grace note", line, i);
			// If there is a slur after the grace construction, then move it to the last note inside the grace construction
			if (line[i+gra[0]] === ')') {
				gra[0]++;
				gra[1] += ')';
			}

			var gracenotes = [];
			var ii = 0;
			var inTie = false;
			while (ii < gra[1].length) {
				var note = getCoreNote(gra[1], ii, {}, false);
				if (note !== null) {
					gracenotes.push(note);

					if (inTie) {
						note.endTie = true;
						inTie = false;
					}
					if (note.startTie)
						inTie = true;

					ii  = note.endChar;
					delete note.endChar;
				}
				else {
					// We shouldn't get anything but notes or a space here, so report an error
					if (gra[1].charAt(ii) === ' ') {
						if (gracenotes.length > 0)
							gracenotes[gracenotes.length-1].end_beam = true;
					} else
						warn("Unknown character '" + gra[1].charAt(ii) + "' while parsing grace note", line, i);
					ii++;
				}
			}
			if (gracenotes.length)
				return [gra[0], gracenotes];
//				for (var ret = letter_to_pitch(gra[1], ii); ret[0]>0 && ii<gra[1].length;
//					ret = letter_to_pitch(gra[1], ii)) {
//					//todo get other stuff that could be in a grace note
//					ii += ret[0];
//					gracenotes.push({el_type:"gracenote",pitch:ret[1]});
//				}
//				return [ gra[0], gracenotes ];
		}
		return [ 0 ];
	};

	//
	// Parse line of music
	//
	// This is a stream of <(bar-marking|header|note-group)...> in any order, with optional spaces between each element
	// core-note is <open-slur, accidental, pitch:required, octave, duration, close-slur&|tie> with no spaces within that
	// chord is <open-bracket:required, core-note:required... close-bracket:required duration> with no spaces within that
	// grace-notes is <open-brace:required, (open-slur|core-note:required|close-slur)..., close-brace:required> spaces are allowed
	// note-group is <grace-notes, chord symbols&|decorations..., grace-notes, slur&|triplet, chord|core-note, end-slur|tie> spaces are allowed between items
	// bar-marking is <ampersand> or <chord symbols&|decorations..., bar:required> spaces allowed
	// header is <open-bracket:required, K|M|L|V:required, colon:required, field:required, close-bracket:required> spaces can occur between the colon, in the field, and before the close bracket
	// header can also be the only thing on a line. This is true even if it is a continuation line. In this case the brackets are not required.
	// a space is a back-tick, a space, or a tab. If it is a back-tick, then there is no end-beam.

	// Line preprocessing: anything after a % is ignored (the double %% should have been taken care of before this)
	// Then, all leading and trailing spaces are ignored.
	// If there was a line continuation, the \n was replaced by a \r and the \ was replaced by a space. This allows the construct
	// of having a header mid-line conceptually, but actually be at the start of the line. This is equivolent to putting the header in [ ].

	// TODO-PER: How to handle ! for line break?
	// TODO-PER: dots before bar, dots before slur
	// TODO-PER: U: redefinable symbols.

	// Ambiguous symbols:
	// "[" can be the start of a chord, the start of a header element or part of a bar line.
	// --- if it is immediately followed by "|", it is a bar line
	// --- if it is immediately followed by K: L: M: V: it is a header (note: there are other headers mentioned in the standard, but I'm not sure how they would be used.)
	// --- otherwise it is the beginning of a chord
	// "(" can be the start of a slur or a triplet
	// --- if it is followed by a number from 2-9, then it is a triplet
	// --- otherwise it is a slur
	// "]"
	// --- if there is a chord open, then this is the close
	// --- if it is after a [|, then it is an invisible bar line
	// --- otherwise, it is par of a bar
	// "." can be a bar modifier or a slur modifier, or a decoration
	// --- if it comes immediately before a bar, it is a bar modifier
	// --- if it comes immediately before a slur, it is a slur modifier
	// --- otherwise it is a decoration for the next note.
	// number:
	// --- if it is after a bar, with no space, it is an ending marker
	// --- if it is after a ( with no space, it is a triplet count
	// --- if it is after a pitch or octave or slash, then it is a duration

	// Unambiguous symbols (except inside quoted strings):
	// vertical-bar, colon: part of a bar
	// ABCDEFGabcdefg: pitch
	// xyzZ: rest
	// comma, prime: octave
	// close-paren: end-slur
	// hyphen: tie
	// tilde, v, u, bang, plus, THLMPSO: decoration
	// carat, underscore, equal: accidental
	// ampersand: time reset
	// open-curly, close-curly: grace notes
	// double-quote: chord symbol
	// less-than, greater-than, slash: duration
	// back-tick, space, tab: space
	var nonDecorations = "ABCDEFGabcdefgxyzZ[]|^_{";	// use this to prescreen so we don't have to look for a decoration at every note.

	var parseRegularMusicLine = function(line) {
		header.resolveTempo();
		//multilineVars.havent_set_length = false;	// To late to set this now.
		multilineVars.is_in_header = false;	// We should have gotten a key header by now, but just in case, this is definitely out of the header.
		var i = 0;
		var startOfLine = multilineVars.iChar;
		// see if there is nothing but a comment on this line. If so, just ignore it. A full line comment is optional white space followed by %
		while (tokenizer.isWhiteSpace(line.charAt(i)) && i < line.length)
			i++;
		if (i === line.length || line.charAt(i) === '%')
			return;

		// Start with the standard staff, clef and key symbols on each line
		var delayStartNewLine = multilineVars.start_new_line;
//			if (multilineVars.start_new_line) {
//				startNewLine();
//			}
		multilineVars.start_new_line = true;
		var tripletNotesLeft = 0;
		//var tripletMultiplier = 0;
//		var inTie = false;
//		var inTieChord = {};

		// See if the line starts with a header field
		var retHeader = header.letter_to_body_header(line, i);
		if (retHeader[0] > 0) {
			i += retHeader[0];
			// TODO-PER: Handle inline headers
		}
		var el = { };

		while (i < line.length)
		{
			var startI = i;
			if (line.charAt(i) === '%')
				break;

			var retInlineHeader = header.letter_to_inline_header(line, i);
			if (retInlineHeader[0] > 0) {
					i += retInlineHeader[0];
					// TODO-PER: Handle inline headers
					//multilineVars.start_new_line = false;
			} else {
				// Wait until here to actually start the line because we know we're past the inline statements.
				if (delayStartNewLine) {
					startNewLine();
					delayStartNewLine = false;
				}
//					var el = { };

				// We need to decide if the following characters are a bar-marking or a note-group.
				// Unfortunately, that is ambiguous. Both can contain chord symbols and decorations.
				// If there is a grace note either before or after the chord symbols and decorations, then it is definitely a note-group.
				// If there is a bar marker, it is definitely a bar-marking.
				// If there is either a core-note or chord, it is definitely a note-group.
				// So, loop while we find grace-notes, chords-symbols, or decorations. [It is an error to have more than one grace-note group in a row; the others can be multiple]
				// Then, if there is a grace-note, we know where to go.
				// Else see if we have a chord, core-note, slur, triplet, or bar.

				while (1) {
					var ret = tokenizer.eatWhiteSpace(line, i);
					if (ret > 0) {
						i += ret;
					}
					if (i > 0 && line.charAt(i-1) === '\x12') {
						// there is one case where a line continuation isn't the same as being on the same line, and that is if the next character after it is a header.
						ret = header.letter_to_body_header(line, i);
						if (ret[0] > 0) {
							// TODO: insert header here
							i = ret[0];
							multilineVars.start_new_line = false;
						}
					}
					// gather all the grace notes, chord symbols and decorations
					ret = letter_to_spacer(line, i);
					if (ret[0] > 0) {
						i += ret[0];
					}

					ret = letter_to_chord(line, i);
					if (ret[0] > 0) {
						// There could be more than one chord here if they have different positions.
						// If two chords have the same position, then connect them with newline.
						if (!el.chord)
							el.chord = [];
						var chordName = tokenizer.translateString(ret[1]);
						chordName = chordName.replace(/;/g, "\n");
						var addedChord = false;
						for (var ci = 0; ci < el.chord.length; ci++) {
							if (el.chord[ci].position === ret[2]) {
								addedChord = true;
								el.chord[ci].name += "\n" + chordName;
							}
						}
						if (addedChord === false)
							el.chord.push({name: chordName, position: ret[2]});

						i += ret[0];
						var ii = tokenizer.skipWhiteSpace(line.substring(i));
						if (ii > 0)
							el.force_end_beam_last = true;
						i += ii;
					} else {
						if (nonDecorations.indexOf(line.charAt(i)) === -1)
							ret = letter_to_accent(line, i);
						else ret = [ 0 ];
						if (ret[0] > 0) {
							if (ret[1] === null) {
								 if (i+1 < line.length)
									startNewLine();	// There was a ! in the middle of the line. Start a new line if there is anything after it.
							} else if (ret[1].length > 0) {
								if (el.decoration === undefined)
									el.decoration = [];
								el.decoration.push(ret[1]);
							}
							i += ret[0];
						} else {
							ret = letter_to_grace(line, i);
							// TODO-PER: Be sure there aren't already grace notes defined. That is an error.
							if (ret[0] > 0) {
								el.gracenotes = ret[1];
								i += ret[0];
							} else
								break;
						}
					}
				}

				ret = letter_to_bar(line, i);
				if (ret[0] > 0) {
					// This is definitely a bar
					if (el.gracenotes !== undefined) {
						// Attach the grace note to an invisible note
						el.rest = { type: 'spacer' };
						el.duration = 0.125; // TODO-PER: I don't think the duration of this matters much, but figure out if it does.
						tune.appendElement('note', startOfLine+i, startOfLine+i+ret[0], el);
						multilineVars.measureNotEmpty = true;
						el = {};
					}
					var bar = {type: ret[1]};
					if (bar.type.length === 0)
						warn("Unknown bar type", line, i);
					else {
						if (multilineVars.inEnding && bar.type !== 'bar_thin') {
							bar.endEnding = true;
							multilineVars.inEnding = false;
						}
						if (ret[2]) {
							bar.startEnding = ret[2];
							if (multilineVars.inEnding)
								bar.endEnding = true;
							multilineVars.inEnding = true;
						}
						if (el.decoration !== undefined)
							bar.decoration = el.decoration;
						if (el.chord !== undefined)
							bar.chord = el.chord;
						if (bar.startEnding && multilineVars.barFirstEndingNum === undefined)
							multilineVars.barFirstEndingNum = multilineVars.currBarNumber;
						else if (bar.startEnding && bar.endEnding && multilineVars.barFirstEndingNum)
							multilineVars.currBarNumber = multilineVars.barFirstEndingNum;
						else if (bar.endEnding)
							multilineVars.barFirstEndingNum = undefined;
						if (bar.type !== 'bar_invisible' && multilineVars.measureNotEmpty) {
							multilineVars.currBarNumber++;
							if (multilineVars.barNumbers && multilineVars.currBarNumber % multilineVars.barNumbers === 0)
								multilineVars.barNumOnNextNote = multilineVars.currBarNumber;
						}
						tune.appendElement('bar', startOfLine+i, startOfLine+i+ret[0], bar);
						multilineVars.measureNotEmpty = false;
						el = {};
					}
					i += ret[0];
				} else if (line[i] === '&') {	// backtrack to beginning of measure
					warn("Overlay not yet supported", line, i);
					i++;

				} else {
					// This is definitely a note group
					//
					// Look for as many open slurs and triplets as there are. (Note: only the first triplet is valid.)
					ret = letter_to_open_slurs_and_triplets(line, i);
					if (ret.consumed > 0) {
						if (ret.startSlur !== undefined)
							el.startSlur = ret.startSlur;
						if (ret.triplet !== undefined) {
							if (tripletNotesLeft > 0)
								warn("Can't nest triplets", line, i);
							else {
								el.startTriplet = ret.triplet;
								tripletNotesLeft = ret.num_notes === undefined ? ret.triplet : ret.num_notes;
							}
						}
						i += ret.consumed;
					}

					// handle chords.
					if (line.charAt(i) === '[') {
						i++;
						var chordDuration = null;

						var done = false;
						while (!done) {
							var chordNote = getCoreNote(line, i, {}, false);
							if (chordNote !== null) {
								if (chordNote.end_beam) {
									el.end_beam = true;
									delete chordNote.end_beam;
								}
								if (el.pitches === undefined) {
									el.duration = chordNote.duration;
									el.pitches = [ chordNote ];
								} else	// Just ignore the note lengths of all but the first note. The standard isn't clear here, but this seems less confusing.
									el.pitches.push(chordNote);
								delete chordNote.duration;

								if (multilineVars.inTieChord[el.pitches.length]) {
									chordNote.endTie = true;
									multilineVars.inTieChord[el.pitches.length] = undefined;
								}
								if (chordNote.startTie)
									multilineVars.inTieChord[el.pitches.length] = true;

								i  = chordNote.endChar;
								delete chordNote.endChar;
							} else if (line.charAt(i) === ' ') {
								// Spaces are not allowed in chords, but we can recover from it by ignoring it.
								warn("Spaces are not allowed in chords", line, i);
								i++;
							} else {
								if (i < line.length && line.charAt(i) === ']') {
									// consume the close bracket
									i++;

									if (multilineVars.next_note_duration !== 0) {
										el.duration = el.duration * multilineVars.next_note_duration;
//											el.pitches.each(function(p) {
//												p.duration = p.duration * multilineVars.next_note_duration;
//											});
										multilineVars.next_note_duration = 0;
									}

									if (multilineVars.inTie) {
										el.pitches.each(function(pitch) { pitch.endTie = true; });
										multilineVars.inTie = false;
									}

									if (tripletNotesLeft > 0) {
										tripletNotesLeft--;
										if (tripletNotesLeft === 0) {
											el.endTriplet = true;
										}
									}

//									if (el.startSlur !== undefined) {
//										el.pitches.each(function(pitch) { if (pitch.startSlur === undefined) pitch.startSlur = el.startSlur; else pitch.startSlur += el.startSlur; });
//										delete el.startSlur;
//									}

									var postChordDone = false;
									while (i < line.length && !postChordDone) {
										switch (line.charAt(i)) {
											case ' ':
											case '\t':
												addEndBeam(el);
												break;
											case ')':
												if (el.endSlur === undefined) el.endSlur = 1; else el.endSlur++;
												//el.pitches.each(function(pitch) { if (pitch.endSlur === undefined) pitch.endSlur = 1; else pitch.endSlur++; });
												break;
											case '-':
												el.pitches.each(function(pitch) { pitch.startTie = {}; });
												multilineVars.inTie = true;
												break;
											case '>':
											case '<':
												var br2 = getBrokenRhythm(line, i);
												i += br2[0] - 1;	// index gets incremented below, so we'll let that happen
												multilineVars.next_note_duration = br2[2];
												chordDuration = br2[1];
												break;
											case '1':
											case '2':
											case '3':
											case '4':
											case '5':
											case '6':
											case '7':
											case '8':
											case '9':
											case '/':
												var fraction = tokenizer.getFraction(line, i);
												chordDuration = fraction.value;
												i = fraction.index;
												postChordDone = true;
												break;
											default:
												postChordDone = true;
												break;
										}
										if (!postChordDone) {
											i++;
										}
									}
								} else
									warn("Expected ']' to end the chords", line, i);

								if (el.pitches !== undefined) {
									if (chordDuration !== null) {
										el.duration = el.duration * chordDuration;
//											el.pitches.each(function(p) {
//												p.duration = p.duration * chordDuration;
//											});
									}
									if (multilineVars.barNumOnNextNote) {
										el.barNumber = multilineVars.barNumOnNextNote;
										multilineVars.barNumOnNextNote = null;
									}
									tune.appendElement('note', startOfLine+i, startOfLine+i, el);
									multilineVars.measureNotEmpty = true;
									el = {};
								}
								done = true;
							}
						}

					} else {
						// Single pitch
						var el2 = {};
						var core = getCoreNote(line, i, el2, true);
						if (el2.endTie !== undefined) multilineVars.inTie = true;
						if (core !== null) {
							if (core.pitch !== undefined) {
								el.pitches = [ { } ];
								// TODO-PER: straighten this out so there is not so much copying: getCoreNote shouldn't change e'
								if (core.accidental !== undefined) el.pitches[0].accidental = core.accidental;
								el.pitches[0].pitch = core.pitch;
								if (core.endSlur !== undefined) el.pitches[0].endSlur = core.endSlur;
								if (core.endTie !== undefined) el.pitches[0].endTie = core.endTie;
								if (core.startSlur !== undefined) el.pitches[0].startSlur = core.startSlur;
								if (el.startSlur !== undefined) el.pitches[0].startSlur = el.startSlur;
								if (core.startTie !== undefined) el.pitches[0].startTie = core.startTie;
								if (el.startTie !== undefined) el.pitches[0].startTie = el.startTie;
							} else {
								el.rest = core.rest;
								if (core.endSlur !== undefined) el.endSlur = core.endSlur;
								if (core.endTie !== undefined) el.rest.endTie = core.endTie;
								if (core.startSlur !== undefined) el.startSlur = core.startSlur;
								if (el.startSlur !== undefined) el.startSlur = el.startSlur;
								if (core.startTie !== undefined) el.rest.startTie = core.startTie;
								if (el.startTie !== undefined) el.rest.startTie = el.startTie;
							}

							if (core.chord !== undefined) el.chord = core.chord;
							if (core.duration !== undefined) el.duration = core.duration;
							if (core.decoration !== undefined) el.decoration = core.decoration;
							if (core.graceNotes !== undefined) el.graceNotes = core.graceNotes;
							delete el.startSlur;
							if (multilineVars.inTie) {
								if (el.pitches !== undefined)
									el.pitches[0].endTie = true;
								else
									el.rest.endTie = true;
								multilineVars.inTie = false;
							}
							if (core.startTie || el.startTie)
								multilineVars.inTie = true;
							i  = core.endChar;

							if (tripletNotesLeft > 0) {
								tripletNotesLeft--;
								if (tripletNotesLeft === 0) {
									el.endTriplet = true;
								}
							}

							if (core.end_beam)
								addEndBeam(el);

							if (multilineVars.barNumOnNextNote) {
								el.barNumber = multilineVars.barNumOnNextNote;
								multilineVars.barNumOnNextNote = null;
							}
							tune.appendElement('note', startOfLine+startI, startOfLine+i, el);
							multilineVars.measureNotEmpty = true;
							el = {};
						}
					}

					if (i === startI) {	// don't know what this is, so ignore it.
						if (line.charAt(i) !== ' ' && line.charAt(i) !== '`')
							warn("Unknown character ignored", line, i);
//							warn("Unknown character ignored (" + line.charCodeAt(i) + ")", line, i);
						i++;
					}
				}
			}
		}
	};

	var parseLine = function(line) {
		var ret = header.parseHeader(line);
		if (ret.regular)
			parseRegularMusicLine(ret.str);
		if (ret.newline)
			startNewLine();
		if (ret.words)
			addWords(tune.getCurrentVoice(), line.substring(2));
		if (ret.symbols)
			addSymbols(tune.getCurrentVoice(), line.substring(2));
		if (ret.recurse)
			parseLine(ret.str);
	};

	this.parse = function(strTune, switches) {
		// the switches are optional and cause a difference in the way the tune is parsed.
		// switches.header_only : stop parsing when the header is finished
		// switches.stop_on_warning : stop at the first warning encountered.
		// switches.print: format for the page instead of the browser.
		tune.reset();
		if (switches && switches.print)
			tune.media = 'print';
		multilineVars.reset();
		// Take care of whatever line endings come our way
		strTune = strTune.gsub('\r\n', '\n');
		strTune = strTune.gsub('\r', '\n');
		strTune += '\n';	// Tacked on temporarily to make the last line continuation work
		strTune = strTune.replace(/\n\\.*\n/g, "\n");	// get rid of latex commands.
		var continuationReplacement = function(all, backslash, comment){
			var spaces = "                                                                                                                                                                                                     ";
			var padding = comment ? spaces.substring(0, comment.length) : "";
			return backslash + " \x12" + padding;
		};
		strTune = strTune.replace(/\\([ \t]*)(%.*)*\n/g, continuationReplacement);	// take care of line continuations right away, but keep the same number of characters
		var lines = strTune.split('\n');
		if (lines.last().length === 0)	// remove the blank line we added above.
			lines.pop();
		try {
			lines.each( function(line) {
				if (switches) {
					if (switches.header_only && multilineVars.is_in_header === false)
						throw "normal_abort";
					if (switches.stop_on_warning && multilineVars.warnings)
						throw "normal_abort";
				}
				if (multilineVars.is_in_history) {
					if (line.charAt(1) === ':') {
						multilineVars.is_in_history = false;
						parseLine(line);
					} else
						tune.addMetaText("history", tokenizer.translateString(tokenizer.stripComment(line)));
				} else if (multilineVars.inTextBlock) {
					if (line.startsWith("%%endtext")) {
						//tune.addMetaText("textBlock", multilineVars.textBlock);
						tune.addText(multilineVars.textBlock);
						multilineVars.inTextBlock = false;
					}
					else {
						if (line.startsWith("%%"))
							multilineVars.textBlock += ' ' + line.substring(2);
						else
							multilineVars.textBlock += ' ' + line;
					}
				} else if (multilineVars.inPsBlock) {
					if (line.startsWith("%%endps")) {
						// Just ignore postscript
						multilineVars.inPsBlock = false;
					}
					else
						multilineVars.textBlock += ' ' + line;
				} else
					parseLine(line);
				multilineVars.iChar += line.length + 1;
			});
			var ph = 11*72;
			var pl = 8.5*72;
			switch (multilineVars.papersize) {
				//case "letter": ph = 11*72; pl = 8.5*72; break;
				case "legal": ph = 14*72; pl = 8.5*72; break;
				case "A4": ph = 11.7*72; pl = 8.3*72; break;
			}
			if (multilineVars.landscape) {
				var x = ph;
				ph = pl;
				pl = x;
			}
			tune.cleanUp(pl, ph);
		} catch (err) {
			if (err !== "normal_abort")
				throw err;
		}
	};
}


