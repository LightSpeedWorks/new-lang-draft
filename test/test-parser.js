'use strict';

var assert = require('assert');
var util = require('util');
var fs = require('fs');

var StringReader = require('../lib/string-reader');
var Lexer = require('../lib/lexer');
var Parser = require('../lib/parser');

function test(contents, expStr, expRun) {
  var reader = new StringReader(contents.toString(), 'fileName');
  var lexer = new Lexer(reader);
  var parser = new Parser(lexer);
  var syntax;
  var actStr = [];
  var actRun = [];
  while (syntax = parser.parseStatement()) {
    actStr.push(syntax.toString().trim());
    actRun.push((syntax.run() + '').trim());
  }
  assert.deepEqual(actStr, expStr);
  assert.deepEqual(actRun, expRun);
}

var testCases = [
  ['1;', ['1;'], ['1']],
  ['1', ['1;'], ['1']],
  ['1+2*3;', ['1+2*3;'], ['7']],
  ['1?"aaa":3;', ['1?"aaa":3;'], ['aaa']],
  ['1?\'aaa\':3;', ['1?\'aaa\':3;'], ['aaa']],
  ['1||2;', ['1||2;'], ['1']],
  ['1&&2;', ['1&&2;'], ['2']],
  ['1|4;', ['1|4;'], ['5']],
  ['5^7;', ['5^7;'], ['2']],
  ['5&6;', ['5&6;'], ['4']],
  ['1==2;', ['1==2;'], ['false']],
  ['1==1;', ['1==1;'], ['true']],
  ['1=="2";', ['1=="2";'], ['false']],
  ['1=="1";', ['1=="1";'], ['true']],
  ['1===2;', ['1===2;'], ['false']],
  ['1===1;', ['1===1;'], ['true']],
  ['1==="2";', ['1==="2";'], ['false']],
  ['1==="1";', ['1==="1";'], ['false']],
  ['1!=2;', ['1!=2;'], ['true']],
  ['1!=1;', ['1!=1;'], ['false']],
  ['1!="2";', ['1!="2";'], ['true']],
  ['1!="1";', ['1!="1";'], ['false']],
  ['1!==2;', ['1!==2;'], ['true']],
  ['1!==1;', ['1!==1;'], ['false']],
  ['1!=="2";', ['1!=="2";'], ['true']],
  ['1!=="1";', ['1!=="1";'], ['true']],
  ['1>2;', ['1>2;'], ['false']],
  ['2>1;', ['2>1;'], ['true']],
  ['2>2;', ['2>2;'], ['false']],
  ['1<2;', ['1<2;'], ['true']],
  ['2<1;', ['2<1;'], ['false']],
  ['2<2;', ['2<2;'], ['false']],
  ['1>=2;', ['1>=2;'], ['false']],
  ['2>=1;', ['2>=1;'], ['true']],
  ['2>=2;', ['2>=2;'], ['true']],
  ['1<=2;', ['1<=2;'], ['true']],
  ['2<=1;', ['2<=1;'], ['false']],
  ['2<=2;', ['2<=2;'], ['true']],
  ['1<<3;', ['1<<3;'], ['8']],
  ['1024>>5;', ['1024>>5;'], ['32']],
  ['-1>>>24;', ['-1>>>24;'], ['255']],
  ['+2;', ['+2;'], ['2']],
  ['-3;', ['-3;'], ['-3']],
  ['!1;', ['!1;'], ['false']],
  ['!0;', ['!0;'], ['true']],
  ['!!0;', ['!!0;'], ['false']],
  ['!!1;', ['!!1;'], ['true']],
  ['~1;', ['~1;'], ['-2']],
  ['~0;', ['~0;'], ['-1']],
  ['~~0;', ['~~0;'], ['0']],
  ['~~1;', ['~~1;'], ['1']],
  ['typeof 123;', ['typeof 123;'], ['number']],
  ['typeof "abc";', ['typeof "abc";'], ['string']],
  ['null;', ['null;'], ['null']],
  ['undefined;', ['undefined;'], ['undefined']],
  ['true;', ['true;'], ['true']],
  ['false;', ['false;'], ['false']],
  ['2*((2+3));', ['2*(2+3);'], ['10']],
  ['(1,2,3);', ['1, 2, 3;'], ['3']],
  ['((1,2),3);', ['(1, 2), 3;'], ['3']],
  ['(((1),2),3);', ['(1, 2), 3;'], ['3']],
  ['(((1,2),(3,5)),4,(1,2));', ['((1, 2), (3, 5)), 4, (1, 2);'], ['2']],
  [';', [';'], ['undefined']],
  ['{}', ['{}'], ['undefined']],
  ['{1}', ['{1; }'], ['1']],
  ['{1;2}', ['{1; 2; }'], ['2']],
  ['{;}', ['{; }'], ['undefined']],
  ['{{}}', ['{{}}'], ['undefined']],
  ['{};', ['{}', ';'], ['undefined', 'undefined']],
];

describe('Parser test', function () {
  testCases.forEach(function (elem) {
    it(elem[0].trim() + ' → ' + elem[1].join(' ') + ' → ' + elem[2].join(' '), function () {
      test(elem[0], elem[1], elem[2]);
    });
  });
});
