'use strict';

var Tree = require('./tree');

//######################################################################
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
// http://ja.wikipedia.org/wiki/演算子の優先順位
// http://www.bohyoh.com/CandCPP/C/operator.html
// http://ja.cppreference.com/w/cpp/language/operator_precedence
// Block          := Statement ...
// Statement      := Expr ";"
//                 | Expr "\n"
// 18 Expr        := AssignExpr
//                 | Expr "," AssignExpr
// 17 AssignExpr  := YieldExpr
//                 | YieldExpr "=" AssignExpr
//                   =  +=  -=  *=  /=  %=  <<=  >>=  >>>=  &=  ^=  |=
// 16 YieldExpr   := "yield" YieldExpr
//                 | CondExpr
// 15 CondExpr    := LogOrExpr
//                 | LogOrExpr "?" CondExpr ":" CondExpr
//                 | LogOrExpr "?:" CondExpr
// 14 LogOrExpr   := LogAndExpr
//                 | LogOrExpr "||" LogAndExpr
// 13 LogAndExpr  := BitOrExpr
//                 | LogAndExpr "&&" BitOrExpr
// 12 BitOrExpr   := BitXorExpr
//                 | BitOrExpr "|" BitXorExpr
// 11 BitXorExpr  := BitAndExpr
//                 | BitXorExpr "^" BitAndExpr
// 10 BitAndExpr  := EqRelExpr
//                 | BitAndExpr "&" EqRelExpr
// 9 EqRelExpr    := CompRelExpr
//                 | EqRelExpr "==" CompRelExpr
//                   == != === !==
// 8 CompRelExpr  := BitShiftExpr
//                 | CompRelExpr "<" BitShiftExpr
//                   < <= > >= in instanceof (is as)
// 7 BitShiftExpr := AddSubExpr
//                 | BitShiftExpr "<<" AddSubExpr
//                 | BitShiftExpr ">>" AddSubExpr
//                 | BitShiftExpr ">>>" AddSubExpr
// 6 AddSubExpr   := MulDivExpr
//                 | AddSubExpr "+" MulDivExpr
//                 | AddSubExpr "-" MulDivExpr
// 5 MulDivExpr   := MonoExpr
//                 | MulDivExpr "*" MonoExpr
//                 | MulDivExpr "/" MonoExpr
//                 | MulDivExpr "%" MonoExpr
// 4 MonoExpr      := IncDecExpr
//                 | "!" MonoExpr
//                   ! ~ + - typeof void delete sizeof (cast) & * (new checkd unchecked)
// 3 IncDecExpr   := FuncCallExpr
//                 | FuncCallExpr "++"
//                 | FuncCallExpr "--"
//                 | "++" FuncCallExpr
//                 | "--" FuncCallExpr
// **
// 2 FuncCallExpr := AccessExpr
//                 | AccessExpr "(" AssignExpr "," ... ")"
// 1 AccessExpr   := CoreExpr
//                 | "new" AccessExpr
//                 | AccessExpr "." Symbol
//                 | AccessExpr "[" Expr "]"
//                 | AccessExpr "->" Expr
// 0 CoreExpr     := Number
//                 | Symbol
//                 | String
//                 | "(" Expr ")"

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
  var stmts = [];
  var stmt;

  while (stmt = this.parseStatement())
    stmts.push(stmt);

  return new Tree.BlockTree(stmts);
  //if (stmts.length === 0) return null;
  //if (stmts.length === 1) return stmts[0];
  //return stmts;
};

//######################################################################
// parseStatement: 文
Parser.prototype.parseStatement = function parseStatement() {
  var expr = this.parseExpr();

  // TODO: check EOL also
  if (this.lexer.peek() == ';')
    this.lexer.read(); // skip op

  return expr;
};


//######################################################################
// parseExpr: 式
Parser.prototype.parseExpr = function parseExpr() {
  var expr = this.parseAssignExpr();
  if (expr === null) return null;

  var exprs = [expr];

  while (this.lexer.peek() == ',') {
    this.lexer.read(); // skip op
    expr = this.parseAssignExpr();
    if (expr === null) break;
    exprs.push(expr);
  }

  if (exprs.length === 1) return exprs[0];
  return new Tree.CommaTree(exprs);
};

//######################################################################
// parseAssignExpr: 式
var assignOps = {
  '=':1,   '+=':1,  '-=':1,   '*=':1, '/=':1, '%=':1,
  '<<=':1, '>>=':1, '>>>=':1, '&=':1, '^=':1, '|=':1
};
Parser.prototype.parseAssignExpr = function parseAssignExpr() {
  var expr = this.parseYieldExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';
  if (s in assignOps) {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseAssignExpr();
    if (expr2 === null) return null; // TODO: error
    return Tree.BinTree.create(op, expr, expr2);
  }
  // TODO: other op= ...
  return expr;
};

//######################################################################
// parseYieldExpr: 式
Parser.prototype.parseYieldExpr = function parseYieldExpr() {
  if (this.lexer.peek() == 'yeild') {
    var op = this.lexer.read(); // skip 'yield'
    var expr = this.parseYieldExpr();
    if (expr === null) return null; // TODO: error
    return new Tree.PrefixTree(op, expr);
  }

  return this.parseCondExpr();
};

//######################################################################
// parseCondExpr: 式
Parser.prototype.parseCondExpr = function parseCondExpr() {
  var expr = this.parseLogOrExpr();
  if (expr === null) return expr;

  if (this.lexer.peek() == "?") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseCondExpr();
    //if (expr2 === null) break; // TODO: error

    if (this.lexer.peek() == ":") {
      this.lexer.read(); // skip op
      var expr3 = this.parseCondExpr();
      //if (expr3 === null) break; // TODO: error

      return new TriTree(op, expr, expr2, expr3);
    }
    
    // TODO: error
  }

  return expr;
};

//######################################################################
// parseLogOrExpr: 式
Parser.prototype.parseLogOrExpr = function parseLogOrExpr() {
  var expr = this.parseLogAndExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == "||") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseLogAndExpr();
    if (expr2 === null) break; // TODO: error
    expr = new BinTree(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseLogAndExpr: 式
Parser.prototype.parseLogAndExpr = function parseLogAndExpr() {
  var expr = this.parseBitOrExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == "&&") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseBitOrExpr();
    if (expr2 === null) break; // TODO: error
    expr = new BinTree(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseBitOrExpr: 式
Parser.prototype.parseBitOrExpr = function parseBitOrExpr() {
  var expr = this.parseBitXorExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == "|") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseBitXorExpr();
    if (expr2 === null) break; // TODO: error
    expr = new BinTree(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseBitXorExpr: 式
Parser.prototype.parseBitXorExpr = function parseBitXorExpr() {
  var expr = this.parseBitAndExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == "^") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseBitAndExpr();
    if (expr2 === null) break; // TODO: error
    expr = new BinTree(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseBitAndExpr: 式
Parser.prototype.parseBitAndExpr = function parseBitAndExpr() {
  var expr = this.parseEqRelExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == "&") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseEqRelExpr();
    if (expr2 === null) break; // TODO: error
    expr = new BinTree(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseEqRelExpr: 式
Parser.prototype.parseEqRelExpr = function parseEqRelExpr() {
  var expr = this.parseCompRelExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (s == "==" || s == "!=" || s == "===" || s == "!==") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseCompRelExpr();
    if (expr2 === null) break; // TODO: error

    expr = new BinTree(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};

//######################################################################
// parseCompRelExpr: 式
Parser.prototype.parseCompRelExpr = function parseCompRelExpr() {
  var expr = this.parseBitShiftExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (s == "<" || s == "<=" || s == ">" || s == ">=" || s == "in" || s == "instanceof") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseBitShiftExpr();
    if (expr2 === null) break; // TODO: error

    expr = new BinTree(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};

//######################################################################
// parseBitShiftExpr: 式
Parser.prototype.parseBitShiftExpr = function parseBitShiftExpr() {
  var expr = this.parseAddSubExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (s == "<<" || s == ">>" || s == ">>>") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseAddSubExpr();
    if (expr2 === null) break; // TODO: error

    expr = new BinTree(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};

//######################################################################
// parseAddSubExpr: 式
Parser.prototype.parseAddSubExpr = function parseAddSubExpr() {
  var expr = this.parseMulDivExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (s == "+" || s == "-") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseMulDivExpr();
    if (expr2 === null) break; // TODO: error

    expr = new BinTree(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};


//######################################################################
// parseMulDivExpr: 式
Parser.prototype.parseMulDivExpr = function parseMulDivExpr() {
  var expr = this.parseMonoExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (s == "*" || s == "/" || s == "%") {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseMonoExpr();
    if (expr2 === null) break; // TODO: error

    expr = new BinTree(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};

//######################################################################
// parseMonoExpr: 式
Parser.prototype.parseMonoExpr = function parseMonoExpr() {
  var s = this.lexer.peek() + '';

  if (s == "!" || s == "~" || s == "+" || s == "-" ||
      s == "typeof" || s == "void" || s == "delete" || s == "sizeof") {
    var op = this.lexer.read(); // skip op
    var expr = this.parseMonoExpr();
    if (expr === null) return null; // TODO: error

    return new PrefixTree(op, expr);
  }

  return this.parseIncDecExpr();
};

//######################################################################
// parseIncDecExpr: 式
Parser.prototype.parseIncDecExpr = function parseIncDecExpr() {
  var s = this.lexer.peek() + '';

  if (s == "++" || s == "--") {
    var op = this.lexer.read(); // skip op
    var expr = this.parseFuncCallExpr();
    if (expr === null) return null; // TODO: error

    return new PrefixTree(op, expr);
  }

  var expr = this.parseFuncCallExpr();
  var s = this.lexer.peek() + '';
  if (s == "++" || s == "--") {
    var op = this.lexer.read(); // skip op

    return new PostfixTree(op, expr);
  }
  return expr;
};

//######################################################################
// parseYzExpr: 式
Parser.prototype.parseYzExpr = function parseYzExpr() {
  var expr = this.parseXyExpr();
  if (expr === null) return null;

  return expr;
};

exports = module.exports = Parser;
