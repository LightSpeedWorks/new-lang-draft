'use strict';

//######################################################################
function Parser(lexer) {
  this['class'] = this.constructor.name;
  this.lexer = lexer;
}

exports = module.exports = Parser;
