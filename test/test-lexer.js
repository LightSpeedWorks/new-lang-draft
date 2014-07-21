'use strict';

var util = require('util');
var fs = require('fs');

var StringReader = require('../lib/string-reader');
var Lexer = require('../lib/lexer');
var Parser = require('../lib/parser');

var args = process.argv.slice();
args.shift();
args.shift();

var fileName = args.shift();

fileName = fileName || 'test-lexer.nl'; // *** DEFAULT FILE NAME FOR TEST
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
  //var parser = new Parser(lexer);
  var token;
  while (token = lexer.read()) {
    console.log('\x1b[36;1m' + token + '\x1b[m');
    console.log(util.inspect(token, {colors: true}));
    console.log();
  }
});
