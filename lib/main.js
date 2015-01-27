// main.js

(function () {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var util = require('util');

  var StringReader = require('../lib/string-reader');
  var Lexer = require('../lib/lexer');
  var Parser = require('../lib/parser');
  var Context = require('../lib/context');

  var ctx = new Context(null);

  function main(args) {
    // file name. ファイル名
    var fileName = args[0] || 'main.nl';
    fs.readFile(path.resolve(fileName), function (err, contents) {
      // if error then exit
      if (err) return console.log(err + '');

      var reader = new StringReader(contents.toString(), fileName);
      var parser = new Parser(new Lexer(reader));
      var syntax;

      while (syntax = parser.parseStatement()) {
        console.log(util.inspect(syntax, {colors: true, depth: null}));
        console.log(' parse: ' + (syntax + '').trim());
        console.log('result: ' + (syntax.run(ctx) + '').trim());
        console.log();
      } // while
    }); // fs.readFile
  }

  var args = process.argv.slice(2);
  main(args);

})();
