'use strict';

var util = require('util');
var fs = require('fs');

var StringReader = require('./string-reader');
var Lexer = require('./lexer');
var Parser = require('./parser');

var args = process.argv.slice();
args.shift();
args.shift();

var fileName = args.shift();

fileName = fileName || 'a.nl'; // *** DEFAULT FILE NAME FOR TEST
//console.log(util.inspect(args, {colors:true}));

// ファイルを読んで
// 字句解析 lexer string reader -> token
// 構文解析(パーサ) parser token -> AST abstract syntax tree
// 解析木を実行する exec AST
// FileReader

fs.readFile(fileName, function (err, contents) {
  if (err) {
    console.log(err.toString());
    process.exit(1); // error abnormal exit
  }

  var reader = new StringReader(contents.toString());
  var lexer = new Lexer(reader);
  //var parser = new Parser(lexer);
  var a;
  while (a = lexer.read())
    console.log(util.inspect(a, {colors: true}).replace(/\n /g, ''));
});
