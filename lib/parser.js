// parser.js パーサ

'use strict';

var util = require('util');
var Syntax = require('../lib/syntax');
var Token = require('../lib/token');

//######################################################################
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
// http://ja.wikipedia.org/wiki/演算子の優先順位
// http://www.bohyoh.com/CandCPP/C/operator.html
// http://ja.cppreference.com/w/cpp/language/operator_precedence
// 200 Block       := Statement ...
// 190 Statement   := Expr ';'
//                  | Expr '\n'
//                  | label ':' Statement
//                  | 'var' symbol [ '=' AssignExpr ] [ ',' [ '=' AssignExpr ] ] ...
// 180 Expr        := AssignExpr
//                  | Expr ',' AssignExpr
// 170 AssignExpr  := YieldExpr
//                  | YieldExpr '=' AssignExpr
//                    =  +=  -=  *=  /=  %=  <<=  >>=  >>>=  &=  ^=  |=  =>
// 160 YieldExpr   := 'yield' YieldExpr
//                  | CondExpr
// 150 CondExpr    := LogOrExpr
//                  | LogOrExpr '?' CondExpr ':' CondExpr
//                  | LogOrExpr '?:' CondExpr
//                  | LogOrExpr '??' CondExpr
// 140 LogOrExpr   := LogAndExpr
//                  | LogOrExpr '||' LogAndExpr
// 130 LogAndExpr  := BitOrExpr
//                  | LogAndExpr '&&' BitOrExpr
// 120 BitOrExpr   := BitXorExpr
//                  | BitOrExpr '|' BitXorExpr
// 110 BitXorExpr  := BitAndExpr
//                  | BitXorExpr '^' BitAndExpr
// 100 BitAndExpr  := EqRelExpr
//                  | BitAndExpr '&' EqRelExpr
// 90 EqRelExpr    := CompRelExpr
//                  | EqRelExpr '==' CompRelExpr
//                    == != === !==
// 80 CompRelExpr  := BitShiftExpr
//                  | CompRelExpr '<' BitShiftExpr
//                    < <= > >= in instanceof (is as)
// 70 BitShiftExpr := AddSubExpr
//                  | BitShiftExpr '<<' AddSubExpr
//                  | BitShiftExpr '>>' AddSubExpr
//                  | BitShiftExpr '>>>' AddSubExpr
// 60 AddSubExpr   := MulDivExpr
//                  | AddSubExpr '+' MulDivExpr
//                  | AddSubExpr '-' MulDivExpr
// 50 MulDivExpr   := MonoExpr
//                  | MulDivExpr '*' MonoExpr
//                  | MulDivExpr '/' MonoExpr
//                  | MulDivExpr '%' MonoExpr
// 40 MonoExpr     := IncDecExpr
//                  | '!' MonoExpr
//                    ! ~ + - typeof void delete sizeof (cast) & * (new checkd unchecked)
// 30 IncDecExpr   := FuncCallExpr
//                  | FuncCallExpr '++'
//                  | FuncCallExpr '--'
//                  | '++' FuncCallExpr
//                  | '--' FuncCallExpr
// **
// 20 FuncCallExpr := AccessExpr
//                  | AccessExpr '(' AssignExpr ',' ... ')'
// 10 AccessExpr   := CoreExpr
//                  | 'new' AccessExpr
//                  | AccessExpr '.' Symbol
//                  | AccessExpr '?.' Symbol
//                  | AccessExpr '[' Expr ']'
//                  | AccessExpr '->' Symbol
// 0 CoreExpr      := Number
//                  | Symbol
//                  | String
//                  | '(' Expr ')'

//######################################################################
function dic(obj) {
  var o = Object.create(null);
  for (var i in obj)
    o[i] = obj[i];
  return o;
}

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
  var stmt = this.parseStatement();
  if (stmt === null) return null;
  var stmts = [stmt];

  while (stmt = this.parseStatement())
    stmts.push(stmt);

  return new Syntax.BlockSyntax(stmts);
};

//######################################################################
// parseStatement: 文
var statementReservedParser = dic({
  'var': parseVarStatement,
});
Parser.prototype.parseStatement = function parseStatement() {
  var sym = this.lexer.peek();
  if (sym instanceof Token.SymToken) {
    var s = sym.toString();
    if (statementReservedParser[s]) {
      var parse = statementReservedParser[s];
      if (typeof parse === 'function')
        return parse.call(this);
    }
  }

  var expr = this.parseExpr();
  if (expr === null) return null;

  // TODO: check EOL also
  if (this.lexer.peek() == ';')
    this.lexer.read(); // skip op

  return expr;
};


//######################################################################
// parseVarStatement: var 文
Parser.prototype.parseVarStatement = parseVarStatement;
function parseVarStatement() {
  var varSymExprs = [];
  this.lexer.read(); // skip 'var' or ','

  for (;;) {
    var sym = this.lexer.read();
    if (sym === null) break;
    if (!(sym instanceof Token.SymToken))
      throw new Error('var symbol expected');

    var s = sym.toString();
    var sep = this.lexer.read();
    if (sep == '=') {
      var expr = this.parseAssignExpr();
      if (expr === null) throw new Error('var = expr not found'); // return null;
      varSymExprs.push([sym, expr]);
      sep = this.lexer.read();
    } else {
      varSymExprs.push([sym]);
    }

    if (sep != ',') break;
  }

  if (varSymExprs.length === 0) throw new Error();

  if (sep === null || sep != ';') this.lexer.unread(sep);
  return new Syntax.VarSyntax(varSymExprs);
}


//######################################################################
// parseExpr: 式
Parser.prototype.parseExpr = function parseExpr() {
  var expr = this.parseAssignExpr();
  if (expr === null) return null;
  var exprs = [expr];
  //if (expr instanceof Syntax.CommaSyntax) {
  //  for (var i in expr.syntaxes)
  //    exprs.push(expr.syntaxes[i]);
  //} else {
  //  exprs.push(expr);
  //}

  while (this.lexer.peek() == ',') {
    this.lexer.read(); // skip op
    expr = this.parseAssignExpr();
    if (expr === null) break;
    exprs.push(expr);
    //if (expr instanceof Syntax.CommaSyntax) {
    //  for (var i in expr.syntaxes)
    //    exprs.push(expr.syntaxes[i]);
    //} else {
    //  exprs.push(expr);
    //}
  }

  if (exprs.length === 1) return exprs[0];
  return new Syntax.CommaSyntax(exprs);
};

//######################################################################
// parseAssignExpr: 式
var assignOps = dic({
  '=':1,   '+=':1,  '-=':1,   '*=':1, '/=':1, '%=':1,
  '<<=':1, '>>=':1, '>>>=':1, '&=':1, '^=':1, '|=':1, '=>':1
});
Parser.prototype.parseAssignExpr = function parseAssignExpr() {
  var expr = this.parseYieldExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';
  if (assignOps[s]) {
    var op = this.lexer.read(); // skip op
    // TODO: => support Lambda syntax
    var expr2 = this.parseAssignExpr();
    if (expr2 === null) return null; // TODO: error
    return Syntax.BinSyntax.create(op, expr, expr2);
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
    return new Syntax.PrefixSyntax(op, expr);
  }

  return this.parseCondExpr();
};

//######################################################################
// parseCondExpr: 式
Parser.prototype.parseCondExpr = function parseCondExpr() {
  var expr = this.parseLogOrExpr();
  if (expr === null) return expr;

  var s = this.lexer.peek() + '';

  if (s == '?') {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseCondExpr();
    if (expr2 === null) throw Error('? : expression1 not found'); // TODO: error

    if (this.lexer.peek() == ':') {
      var op2 = this.lexer.read(); // skip op
      var expr3 = this.parseCondExpr();
      if (expr3 === null) throw Error('? : expression2 not found'); // TODO: error

      return new Syntax.Cond3Syntax(op, op2, expr, expr2, expr3);
    }

    throw Error('? : colon not found');
    // TODO: error
  } else if (s == '?:' || s == '??') {
    // Elvis operator
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseCondExpr();
    if (expr2 === null) throw Error('?: expression not found'); // TODO: error

    return new Syntax.ElvisSyntax(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseLogOrExpr: 式
Parser.prototype.parseLogOrExpr = function parseLogOrExpr() {
  var expr = this.parseLogAndExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == '||') {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseLogAndExpr();
    if (expr2 === null) throw Error('|| expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseLogAndExpr: 式
Parser.prototype.parseLogAndExpr = function parseLogAndExpr() {
  var expr = this.parseBitOrExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == '&&') {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseBitOrExpr();
    if (expr2 === null) throw Error('&& expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseBitOrExpr: 式
Parser.prototype.parseBitOrExpr = function parseBitOrExpr() {
  var expr = this.parseBitXorExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == '|') {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseBitXorExpr();
    if (expr2 === null) throw Error('| expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseBitXorExpr: 式
Parser.prototype.parseBitXorExpr = function parseBitXorExpr() {
  var expr = this.parseBitAndExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == '^') {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseBitAndExpr();
    if (expr2 === null) throw Error('^ expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseBitAndExpr: 式
Parser.prototype.parseBitAndExpr = function parseBitAndExpr() {
  var expr = this.parseEqRelExpr();
  if (expr === null) return null;

  while (this.lexer.peek() == '&') {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseEqRelExpr();
    if (expr2 === null) throw Error('& expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseEqRelExpr: 式
var eqRelOps = dic({
  '==':1, '!=':1, '===':1, '!==':1
});
Parser.prototype.parseEqRelExpr = function parseEqRelExpr() {
  var expr = this.parseCompRelExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (eqRelOps[s]) {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseCompRelExpr();
    if (expr2 === null) throw Error(s + ' expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};

//######################################################################
// parseCompRelExpr: 式
var compRelOps = dic({
  '<':1, '<=':1, '>':1, '>=':1, 'in':1, 'instanceof':1
});
Parser.prototype.parseCompRelExpr = function parseCompRelExpr() {
  var expr = this.parseBitShiftExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (compRelOps[s]) {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseBitShiftExpr();
    if (expr2 === null) throw Error(s + ' expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};

//######################################################################
// parseBitShiftExpr: 式
var bitShiftOps = dic({
  '<<':1, '>>':1, '>>>':1
});
Parser.prototype.parseBitShiftExpr = function parseBitShiftExpr() {
  var expr = this.parseAddSubExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (bitShiftOps[s]) {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseAddSubExpr();
    if (expr2 === null) throw Error(s + ' expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};

//######################################################################
// parseAddSubExpr: 式
var addSubOps = dic({
  '+':1, '-':1
});
Parser.prototype.parseAddSubExpr = function parseAddSubExpr() {
  var expr = this.parseMulDivExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (addSubOps[s]) {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseMulDivExpr();
    if (expr2 === null) throw Error(s + ' expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};


//######################################################################
// parseMulDivExpr: 式
var mulDivOps = dic({
  '*':1, '/':1, '%':1
});
Parser.prototype.parseMulDivExpr = function parseMulDivExpr() {
  var expr = this.parseMonoExpr();
  if (expr === null) return null;

  var s = this.lexer.peek() + '';

  while (mulDivOps[s]) {
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseMonoExpr();
    if (expr2 === null) throw Error(s + ' expression not found'); // TODO: error
    expr = Syntax.BinSyntax.create(op, expr, expr2);
    s = this.lexer.peek() + '';
  }

  return expr;
};

//######################################################################
// parseMonoExpr: 式
var monoOps = dic({
  '!':1, '~':1, '+':1, '-':1, 'typeof':1, 'void':1, 'delete':1, 'sizeof':1
});
Parser.prototype.parseMonoExpr = function parseMonoExpr() {
  var s = this.lexer.peek() + '';

  if (monoOps[s]) {
    var op = this.lexer.read(); // skip op
    var expr = this.parseMonoExpr();
    if (expr === null) throw Error(s + ' expression not found'); // TODO: error
    return Syntax.PrefixSyntax.create(op, expr);
  }

  return this.parseIncDecExpr();
};

//######################################################################
// parseIncDecExpr: 式
var incDecOps = dic({'++':1, '--':1});
Parser.prototype.parseIncDecExpr = function parseIncDecExpr() {
  var s = this.lexer.peek() + '';

  if (incDecOps[s]) {
    var op = this.lexer.read(); // skip op
    var expr = this.parseFuncCallExpr();
    if (expr === null) throw Error(s + ' expression not found'); // TODO: error
    return Syntax.PrefixSyntax.create(op, expr);
  }

  var expr = this.parseFuncCallExpr();
  var s = this.lexer.peek() + '';

  if (incDecOps[s]) {
    var op = this.lexer.read(); // skip op

    return Syntax.PostfixSyntax.create(op, expr);
  }
  return expr;
};

//######################################################################
// parseFuncCallExpr: 式
Parser.prototype.parseFuncCallExpr = function parseFuncCallExpr() {
  var expr = this.parseAccessExpr();
  if (expr === null) return null;

  if (this.lexer.peek() == '(') {
    var op = this.lexer.read(); // skip op
    var args = [];
    var s = ',';
    while (s === ',') {
      var arg = this.parseAssignExpr();
      if (arg === null) throw new Error('FuncCall arguments expression not found');
      args.push(arg);
      op = this.lexer.read();
      if (op === null) throw new Error('FuncCall arguments separator or close paren not found');
      s = op + '';
    }

    if (s !== ')') throw new Error('FuncCall \')\' expected');
    return new Syntax.FuncCallSyntax(expr, args);
  }

  return expr;
};

//######################################################################
// parseAccessExpr: 式
var accessOps = dic({'.':1, '?.':1, '[':1, '->':1});
Parser.prototype.parseAccessExpr = function parseAccessExpr() {
  var op = this.lexer.peek();
  var expr, expr2;
  if (op == 'new') {
     op = this.lexer.read(); // skip op
     expr = this.parseAccessExpr();
     if (expr === null) throw new Error('new unexpected EOF');
     return new Syntax.NewSyntax(expr);
  }

  expr = this.parseCoreExpr();
  if (expr === null) return null;

  op = this.lexer.peek();
  var s = op + '';
  if (accessOps[s]) {
    if (s === '[') {
      expr2 = this.parseExpr();
      if (expr2 === null) throw new Error('[ expression not found');
      var op2 = this.lexer.read();
      if (op2 != ']') throw new Error('] expected');
    } else {
      expr2 = this.parseSymbol();
      if (expr2 === null || !(expr2 instanceof Syntax.SymbolSyntax)) throw new Error(s + ' symbol not found');
    }
    return Syntax.AccessSyntax.create(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseCoreExpr: 式
var coreTokens = dic({
  'NumToken':1, 'SymToken':1, 'StrToken':1
});
Parser.prototype.parseCoreExpr = function parseCoreExpr() {
  var op = this.lexer.read();
  if (op === null) return null;
  var s = op + '';

  if (s === '(') {
    var expr = this.parseExpr();
    if (expr === null) throw new Error('( expression not found');
    op = this.lexer.read();
    if (op != ')') throw new Error(') expected');
    return expr;
  }

  if (coreTokens[op.constructor.name])
    return Syntax.CoreSyntax.create(op);

  return null;
};

Parser.prototype.parseSymbol = Parser.prototype.parseCoreExpr;

//----------------------------------------------------------------------
exports = module.exports = Parser;
