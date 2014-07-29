// parse-error.js 解析エラー

'use strict';

var util = require('util');

//######################################################################
// ParseError
util.inherits(ParseError, SyntaxError);
function ParseError(message, options) {
  if (!(this instanceof ParseError))
    return new ParseError(message, options);

  var e = new Error(message);
  SyntaxError.call(this, message);
  Error.call(this, message);
  // this['class'] = this.constructor.name;
  this.name    = 'ParseError';
  this.message = message;
  var stack = e.stack.split('\n');
  stack.splice(1, 2);
  this.stack   = 'Parse' + stack.join('\n');
  this.options = options;
}

//----------------------------------------------------------------------
exports = module.exports = ParseError;
