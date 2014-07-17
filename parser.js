'use strict';

var Tree = require('./tree');

//######################################################################
// Block := Statement ...
// Statement := Expression
//            | 
// Expression := AssignmentExpression
// AssignmentExpression := LogicalExpression
//                       | LHS = LogicalExpression
// LogicalExpression := ArithmeticExpression
// ArithmeticExpression := 
// Factor := 
// Term := 

//######################################################################
function Parser(lexer) {
  if (!(this instanceof Parser))
    return new Parser(lexer);

  // this['class'] = this.constructor.name;
  this.lexer = lexer;
}

//######################################################################
// parseBlock: ブロック
Parser.prototype.parseBlock = function parseBlock() {
  return this.parseStatement();
};

//######################################################################
// parseStatement: 文
Parser.prototype.parseStatement = function parseStatement() {
  return this.parseExpression();
};


//######################################################################
// parseStatement: 式
Parser.prototype.parseExpression = function parseExpression() {
  var token = this.lexer.read();
  if (token === null) return null;

};

exports = module.exports = Parser;
