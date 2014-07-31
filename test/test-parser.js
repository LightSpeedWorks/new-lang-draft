'use strict';

describe('Parser test', function () {
it('no errors', function (done) {

var util = require('util');
var fs = require('fs');
var path = require('path');

var StringReader = require('../lib/string-reader');
var Lexer = require('../lib/lexer');
var Parser = require('../lib/parser');

var args = process.argv.slice();
args.shift();
args.shift();

var fileName = args.shift();

fileName = fileName || path.resolve(__dirname, 'test-parser.nl'); // *** DEFAULT FILE NAME FOR TEST
//console.log(util.inspect(args, {colors:true}));

// ファイルを読んで
// 字句解析 lexer string reader -> token
// 構文解析(パーサ) parser token -> AST abstract syntax tree
// 解析木を実行する run AST
// FileReader

fs.readFile(fileName, function (err, contents) {
  if (err) {
    console.log(err.toString());
    process.exit(1); // error abnormal exit
  }

  var reader = new StringReader(contents.toString(), fileName);
  var lexer = new Lexer(reader);
  var parser = parser = new Parser(lexer);
  var syntax;
  for (;;) {
    syntax = parser.parseStatement();
    if (syntax === null && lexer.peek() !== null) {
      var token = lexer.read();
      console.log('\x1b[31;1m###### ' + token + '\x1b[m');
      console.log('### -> ' + util.inspect(token, {colors: true, depth: null}));
      console.log();
      continue;
    }
    if (syntax === null) break;
    console.log(util.inspect(syntax, {colors: true, depth: null}));
    console.log('###### \x1b[36;1m' + syntax + '\x1b[m');
    console.log('### -> ' + util.inspect(syntax.run(null), {colors: true, depth: null}));
    console.log();
  }
  done();
});

});
});
