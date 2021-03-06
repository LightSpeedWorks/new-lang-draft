// parser.js パーサ

'use strict';

var util = require('util');
var Syntax = require('../lib/syntax');
var Token = require('../lib/token');
var ParseError = require('../lib/parse-error');

//----------------------------------------------------------------------
exports = module.exports = Parser;

//######################################################################
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
// http://ja.wikipedia.org/wiki/演算子の優先順位
// http://www.bohyoh.com/CandCPP/C/operator.html
// http://ja.cppreference.com/w/cpp/language/operator_precedence
// 200 Block       := '{' Statement... '}'
// 190 Statement   := ';'
//                  | Block
//                  | Expr ';'
//                  | Expr '\n'
//                  | label ':' Statement
//                  | 'var' symbol [ '=' AssignExpr ] [ ',' [ '=' AssignExpr ] ] ...
//                  | 'if' '(' AssignExpr ')' Statement [ 'else if' '(' AssignExpr ')' Statement ] ... [ 'else' Statement ]
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

function LOG(msg) {
  console.log('\x1b[33;1m' + msg + '\x1b[m'); // skip op
}

//######################################################################
// parseBlock: ブロック
Parser.prototype.parseBlock = function parseBlock() {
  var op = this.lexer.peek();
  if (op === null) return null;
  if (op != '{')
    throw new ParseError('block must start with \'{\': ', op);
  op = this.lexer.read(); // skip op '{'

  var stmt = this.parseStatement();
  if (stmt === null) {
    if (this.lexer.peek() != '}')
      throw new ParseError('unexpected EOF in block statement: ' + this.lexer.peek());
    this.lexer.read(); // skip op
    return new Syntax.BlockSyntax([]);
  }

  var stmts = [stmt];

  while (this.lexer.peek() != '}' && (stmt = this.parseStatement())) {
    stmts.push(stmt);
  }
  if (this.lexer.peek() == '}')
    this.lexer.read(); // skip op

  return new Syntax.BlockSyntax(stmts);
};

//######################################################################
// parseStatement: 文
var statementReservedParser = dic({
  'var': parseVarStatement,
  'if': parseIfElseStatement,
});
Parser.prototype.parseStatement = function parseStatement() {
  var token = this.lexer.peek();
  if (token === null) return null;

  var s = token + '';
  if (token instanceof Token.SymToken) {
    if (statementReservedParser[s]) {
      var parse = statementReservedParser[s];
      if (typeof parse === 'function')
        return parse.call(this);
    }
  }

  if (s === '}') return null; // for speed up

  if (s === ';') {
    this.lexer.read(); // skip op
    return new Syntax.EmptySyntax(token);
  }

  if (s === '{')
    return this.parseBlock();

  var expr = this.parseExpr();
  if (expr === null) return null;

  // TODO: end of expression, check EOL also
  if (this.lexer.peek() == ';')
    this.lexer.read(); // skip op

  return new Syntax.ExpressionStatementSyntax(expr);
};


//######################################################################
// parseVarStatement: var 文
Parser.prototype.parseVarStatement = parseVarStatement;
function parseVarStatement() {
  var token = this.lexer.read(); // skip 'var'
  if (token != 'var')
    throw new ParseError('\'var\' expected', token);

  var varSymExprs = [];
  for (;;) {
    var sym = this.lexer.read();
    if (sym === null) break;
    if (!(sym instanceof Token.SymToken))
      throw new Error('var symbol expected');

    var s = sym.toString();
    var sep = this.lexer.read();
    if (sep == '=') {
      var expr = this.parseAssignExpr();
      if (expr === null)
        throw new ParseError('var = expr not found', sep); // return null;
      varSymExprs.push([sym, expr]);
      sep = this.lexer.read();
    } else {
      varSymExprs.push([sym]);
    }

    if (sep != ',') break;
  }

  if (varSymExprs.length === 0)
    throw new ParseError('var body expected', token);

  if (sep === null || sep != ';') this.lexer.unread(sep);
  return new Syntax.VarSyntax(varSymExprs);
}


//######################################################################
// parseIfElseStatement: if 文
Parser.prototype.parseIfElseStatement = parseIfElseStatement;
function parseIfElseStatement() {
  var op = this.lexer.read(); // skip 'if'
  if (op != 'if')
    throw new ParseError('\'if\' expected', token);

  var elem = {op: 'if'};
  elem.expr = this.parseExpr();
  if (elem.expr === null) throw new SyntaxError(op + ' expression expected');
  elem.stmt = this.parseStatement();
  if (elem.stmt === null) throw new SyntaxError(op + ' statement expected');
  var opExprStmts = [elem];

  for (;;) {
    var op = this.lexer.read(); // skip 'if' / 'else'
    if (op === null) break;

    if (op == 'elseif' || op == 'elsif') {
      elem = {op: op + ''};
      elem.expr = this.parseExpr();
      if (elem.expr === null) throw new SyntaxError(op + ' expression expected');
      elem.stmt = this.parseStatement();
      if (elem.stmt === null) throw new SyntaxError(op + ' statement expected');
      opExprStmts.push(elem);
    } else if (op == 'else') {
      if (this.lexer.peek() == 'if') {
        op = this.lexer.read(); // skip 'if'
        elem = {op: 'else if'};
        elem.expr = this.parseExpr();
        if (elem.expr === null) throw new SyntaxError(op + ' expression expected');
        elem.stmt = this.parseStatement();
        if (elem.stmt === null) throw new SyntaxError(op + ' statement expected');
        opExprStmts.push(elem);
      } else {
        elem = {op: 'else'};
        elem.stmt = this.parseStatement();
        if (elem.stmt === null) throw new SyntaxError(op + ' statement expected');
        opExprStmts.push(elem);
      }
    }
    else {
      this.lexer.unread(op);
      break;
    }
  }

  return new Syntax.IfElseSyntax(opExprStmts);
}


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
    if (expr2 === null)
      throw new ParseError('assign expression expected', op);
    return Syntax.BinSyntax.createx(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseYieldExpr: 式
Parser.prototype.parseYieldExpr = function parseYieldExpr() {
  if (this.lexer.peek() == 'yeild') {
    var op = this.lexer.read(); // skip 'yield'
    var expr = this.parseYieldExpr();
    if (expr === null)
      throw new ParseError('yield expression expected', op);
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
    if (expr2 === null)
      throw new ParseError('? : expression1 not found', op);

    if (this.lexer.peek() == ':') {
      var op2 = this.lexer.read(); // skip op
      var expr3 = this.parseCondExpr();
      if (expr3 === null)
        throw new ParseError('? : expression2 not found', op2);

      return new Syntax.Cond3Syntax(op, op2, expr, expr2, expr3);
    }

    throw new ParseError('? : colon not found', op);
  } else if (s == '?:' || s == '??') {
    // Elvis operator
    var op = this.lexer.read(); // skip op
    var expr2 = this.parseCondExpr();
    if (expr2 === null)
      throw new ParseError('?: expression not found', op);

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
    if (expr2 === null)
      throw new ParseError('|| expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError('&& expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError('| expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError('^ expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError('& expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError(s + ' expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError(s + ' expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError(s + ' expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError(s + ' expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr2 === null)
      throw new ParseError(s + ' expression not found', op);
    expr = Syntax.BinSyntax.createx(op, expr, expr2);
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
    if (expr === null)
      throw new ParseError(s + ' expression not found', op);
    return Syntax.PrefixSyntax.createx(op, expr);
  }

  return this.parseIncDecExpr();
};

//######################################################################
// parseIncDecExpr: 式
var incDecOps = dic({'++':1, '--':1});
Parser.prototype.parseIncDecExpr = function parseIncDecExpr() {
  var token = this.lexer.peek();
  if (token === null) return null;
  var s = token + '';

  if (incDecOps[s]) {
    var op = this.lexer.read(); // skip op
    var expr = this.parseFuncCallExpr();
    if (expr === null)
      throw new ParseError(s + ' expression not found', op);
    return Syntax.PrefixSyntax.createx(op, expr);
  }

  var expr = this.parseFuncCallExpr();
  if (expr === null) return null;
  var s = this.lexer.peek() + '';

  if (incDecOps[s]) {
    var op = this.lexer.read(); // skip op

    return Syntax.PostfixSyntax.createx(op, expr);
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
      if (arg === null && this.lexer.peek() == ')') {
        op = this.lexer.read();
        s = op + '';
        break;
      }
      if (arg === null)
        throw new ParseError('FuncCall arguments expression not found', op);
      args.push(arg);
      op = this.lexer.read();
      if (op === null)
        throw new ParseError('FuncCall arguments separator or close paren not found', arg);
      s = op + '';
    }

    if (s !== ')')
      throw new ParseError('FuncCall \')\' expected', op);

    return new Syntax.FuncCallSyntax(expr, args);
  }

  return expr;
};

//######################################################################
// parseAccessExpr: 式
var accessOps = dic({'.':1, '?.':1, '[':1, '->':1});
Parser.prototype.parseAccessExpr = function parseAccessExpr() {
  var op = this.lexer.peek();
  if (op === null) return null;

  var expr, expr2;
  if (op == 'new') {
     op = this.lexer.read(); // skip op
     expr = this.parseAccessExpr();
     if (expr === null)
       throw new ParseError('new expression expected', op);
     return new Syntax.NewSyntax(expr);
  }

  expr = this.parseCoreExpr();
  if (expr === null) return null;

  op = this.lexer.peek();
  var s = op + '';
  if (accessOps[s]) {
    if (s === '[') {
      expr2 = this.parseExpr();
      if (expr2 === null)
        throw new ParseError('[ expression not found', op);
      var op2 = this.lexer.read();
      if (op2 != ']')
        throw new ParseError('] expected', op);
    } else {
      // . ?. ->
      expr2 = this.parseSymbol();
      if (expr2 === null || !(expr2 instanceof Syntax.SymbolSyntax))
        throw new ParseError(s + ' symbol not found', op);
    }
    return Syntax.AccessSyntax.createx(op, expr, expr2);
  }

  return expr;
};

//######################################################################
// parseCoreExpr: 式
var coreTokens = dic({
  'NumToken':1, 'SymToken':1, 'StrToken':1
});
Parser.prototype.parseCoreExpr = function parseCoreExpr() {
  var op = this.lexer.peek();
  if (op === null) return null;
  var s = op + '';

  if (s === '(') {
    this.lexer.read(); // skip op
    var expr = this.parseExpr();
    if (expr === null)
      throw new ParseError('( expression not found', op);
    if (this.lexer.peek() != ')')
      throw new ParseError(') expected', op);
    op = this.lexer.read();

    return expr;
  }

  if (coreTokens[op.constructor.name]) {
    this.lexer.read(); // skip core token
    return Syntax.CoreSyntax.createx(op);
  }

  return null;
};

Parser.prototype.parseSymbol = Parser.prototype.parseCoreExpr;
