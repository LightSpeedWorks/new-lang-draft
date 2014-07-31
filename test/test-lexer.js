'use strict';

var assert = require('assert');
var util = require('util');
var fs = require('fs');

var StringReader = require('../lib/string-reader');
var Lexer = require('../lib/lexer');
var Parser = require('../lib/parser');

function test(contents, expected) {
  var reader = new StringReader(contents.toString(), 'fileName');
  var lexer = new Lexer(reader);
  var token;
  var actual = [];
  while (token = lexer.read()) {
    actual.push(token.toString());
  }
  assert.deepEqual(actual, expected);
}

var testCases = [
  ['   $.$$', ['$', '.', '$$']],
  ['   __$$', ['__$$']],
  ['www', ['www']],
  ['-',   ['-']],
  ['++',  ['++']],
  ['--',  ['--']],
  ['<<',  ['<<']],
  ['<<<', ['<<<']],
  ['>>',  ['>>']],
  ['>>>', ['>>>']],
  ['==',  ['==']],
  ['=',   ['=']],
  ['!==', ['!==']],
  ['!=',  ['!=']],
  ['!!',  ['!', '!']],
  ['>=',  ['>=']],
  ['<=',  ['<=']],
  ['->',  ['->']],
  ['<-',  ['<-']],
  ['~',   ['~']],
  ['~~',  ['~', '~']],
  ['{}()[];', ['{', '}', '(', ')', '[', ']', ';']],
  ['   abc123', ['abc123']],
  ['   123xyz', ['123', 'xyz']],
  ['   1.2', ['1.2']],
  ['   3', ['3']],
  ['   3.', ['3.']],
  ['   .3', ['.3']],
  ['  456', ['456']],
  ['  7.8    ', ['7.8']],
  ['  9e4', ['9e4']],
  ['  123.toString', ['123', '.', 'toString']],
  ['  123..toString', ['123', '..', 'toString']],
  ['  123.3e12ee', ['123.3e12', 'ee']],
  ['1.2', ['1.2']],
  ['1..2 a..b', ['1', '..', '2', 'a', '..', 'b']],
  ['1...3 a...b', ['1', '...', '3', 'a', '...', 'b']],
  ['||', ['||']],
  ['&&', ['&&']],
  [',', [',']],
  [',,', [',,']],
  [',.2', [',.', '2']],
  ['**', ['**']],
  ['//\n.', ['.']],
  ['?:', ['?:']],
  ['.?', ['.?']],
  ['?.', ['?.']],
  ['..', ['..']],
  ['...', ['...']],
  ['....', ['....']],
  ['"#%\'\\"@`"', ['"#%\'\\"@`"']],
  ['0x11 0X11', ['0x11', '0X11']],
  ['0xff 0XFF', ['0xff', '0XFF']],
  ['0o77 0O77', ['0o77', '0O77']],
  ['0b11 0B11', ['0b11', '0B11']],
  ['"\'str\'"', ['"\'str\'"']],
  ['\'"str"\'', ['\'"str"\'']],
  ['"a\\"b"',['"a\\"b"']],
  ['"a\\"b"',['"a\\"b"']],
  ["'a\\'b'",["'a\\'b'"]],
  ['//aaa', ['//aaa']],
  ['/*xx*/', ['/*xx*/']],
  ['\'abc\'', ['\'abc\'']],
  ['123', ['123']],
];

describe('Lexer test', function () {
  testCases.forEach(function (elem) {
    it(elem[0].trim() + ' → ' + elem[1].join(' '), function () {
      test(elem[0], elem[1]);
    });
  });
});
