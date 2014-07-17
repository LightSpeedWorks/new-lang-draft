'use strict';

//######################################################################
// Block := Statement ...
// Statement := Expression
//            | 
// Expression := 

//######################################################################
function Parser(lexer) {
  if (!(this instanceof Parser))
    return new Parser(lexer);

  // this['class'] = this.constructor.name;
  this.lexer = lexer;
}

//######################################################################
Parser.prototype.parseExpression = function parseExpression() {
  var token = this.lexer.read();
  if (token === null) return null;


};

exports = module.exports = Parser;
