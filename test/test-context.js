'use strict';

var assert = require('assert');

var StringReader = require('../lib/string-reader');
var Lexer = require('../lib/lexer');
var Parser = require('../lib/parser');
var Context = require('../lib/context');

var ctx = new Context(null);

function test(contents, expStr, expRun) {
  var reader = new StringReader(contents.toString(), 'fileName');
  var lexer = new Lexer(reader);
  var parser = new Parser(lexer);
  var syntax;
  var actStr = [];
  var actRun = [];
  while (syntax = parser.parseStatement()) {
    try {
      actStr.push(syntax.toString().trim());
    } catch (e) {
      actStr.push(new Error);
    }
    try {
      actRun.push((syntax.run(ctx) + '').trim());
    } catch (e) {
      actRun.push(new Error);
    }
  }
  assert.deepEqual(actStr, expStr);
  assert.deepEqual(actRun, expRun);
}

var testCases = [
  ['a=1;', ['a=1;'], [new Error]],
  ['b=a+1;', ['b=a+1;'], [new Error]],
  ['c=a+b*3;', ['c=a+b*3;'], [new Error]],
  ['var a=1; a;', ['var a = 1;', 'a;'], ['undefined', '1']],
  ['var b=a+1; b;', ['var b = a+1;', 'b;'], ['undefined', '2']],
  ['var c=a+b*3; c;', ['var c = a+b*3;', 'c;'], ['undefined', '7']],
  ['var d=a*((b+3)); d;', ['var d = a*(b+3);', 'd;'], ['undefined', '5']],
  ['4+x;', ['4+x;'], [new Error]],
  ['y=4+x;', ['y=4+x;'], [new Error]],
];

describe('Context test', function () {
  testCases.forEach(function (elem) {
    var name = (elem[0].trim() + ' → ' + elem[1].join(' ') + ' → ' + elem[2].join(' ')).replace(/\n/g, '');
    it(name, function () {
      test(elem[0], elem[1], elem[2]);
    });
  });
});
