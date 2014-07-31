// syntax.js AST Abstract Syntax Tree

'use strict';

var util = require('util');

//----------------------------------------------------------------------
exports = module.exports = Syntax;

//######################################################################
function inherits(ctor, superCtor) {
  util.inherits(ctor, superCtor);
  exports[ctor.name] = ctor;
}

//######################################################################
function dic(obj) {
  var o = Object.create(null);
  for (var i in obj)
    o[i] = obj[i];
  return o;
}

// 実行して値を返す run
// 実行直前の場所を返す locate
//   symbol -> SymToken
//   expr.symbol -> AccessDot
//   expr[expr]  -> AccessGetSet
// コンパイル・計算できる所(数値や定数が引数の純粋関数の場合)は実行する compile

//######################################################################
function Syntax(prio) {
  this['syn'] = this.constructor.name.slice(0, -6);
  this.prio = prio;
}

//######################################################################
// statement 文
inherits(StatementSyntax, Syntax);
function StatementSyntax(prio) {
  Syntax.call(this, prio);
}

//######################################################################
// expression 式
inherits(ExpressionSyntax, Syntax);
function ExpressionSyntax(prio) {
  Syntax.call(this, prio);
}

//######################################################################
// ; empty statement 空文
inherits(EmptySyntax, StatementSyntax);
function EmptySyntax(op) {
  StatementSyntax.call(this, 200);
  this.op = op;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
EmptySyntax.prototype.run = function run(ctx) {
  return undefined;
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
EmptySyntax.prototype.toString = function toString() {
  return this.op.toString() + ' ';
};

//######################################################################
// {statement; ...} block statement ブロック文
inherits(BlockSyntax, StatementSyntax);
function BlockSyntax(stmts) {
  StatementSyntax.call(this, 200);
  this.stmts = stmts;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BlockSyntax.prototype.run = function run(ctx) {
  var val;
  for (var i = 0, n = this.stmts.length; i < n; ++i)
    val = this.stmts[i].run(ctx);
  return val;
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BlockSyntax.prototype.toString = function toString() {
  var s = '{';
  for (var i = 0, n = this.stmts.length; i < n; ++i) {
    var stmt = this.stmts[i];
    if (stmt instanceof StatementSyntax)
      s += stmt + '';
    else if (stmt instanceof ExpressionSyntax)
      s += stmt + '; ';
    else
      s += '/*eh?{*/' + stmt + '/*}?*/ ';
  }
  return s + '}';
};

//######################################################################
// 式; expression statement 式の文
inherits(ExpressionStatementSyntax, StatementSyntax);
function ExpressionStatementSyntax(expr) {
  StatementSyntax.call(this, 200);
  this.expr = expr;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ExpressionStatementSyntax.prototype.run = function run(ctx) {
  return this.expr.run(ctx);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ExpressionStatementSyntax.prototype.toString = function toString() {
  return this.expr.toString() + '; ';
};

//######################################################################
// expression, ... comma expression コンマ式
inherits(CommaSyntax, ExpressionSyntax);
function CommaSyntax(exprs) {
  ExpressionSyntax.call(this, 180);
  this.exprs = exprs;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CommaSyntax.prototype.run = function run(ctx) {
  var val;
  for (var i = 0, n = this.exprs.length; i < n; ++i)
    val = this.exprs[i].run(ctx);
  return val;
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CommaSyntax.prototype.toString = function toString() {
  var s = '';
  for (var i = 0, n = this.exprs.length; i < n; ++i) {
    var expr = this.exprs[i];
    if (expr.prio >= this.prio) s += '(';
    s += expr.toString();
    if (expr.prio >= this.prio) s += ')';
    if (i != n - 1) s += ', ';
  }
  return s;
};

//######################################################################
// (式)
inherits(ParenSyntax, ExpressionSyntax);
function ParenSyntax(expr) {
  ExpressionSyntax.call(this, 0);
  this.expr = expr;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ParenSyntax.prototype.run = function run(ctx) {
  return this.expr.run(ctx);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ParenSyntax.prototype.toString = function toString() {
  return '(' + this.expr.toString() + ')';
};

//######################################################################
// var symbol = 式 , ...
inherits(VarSyntax, StatementSyntax);
function VarSyntax(symExprs) {
  StatementSyntax.call(this, 190);
  this.symExprs = symExprs;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VarSyntax.prototype.run = function run(ctx) {
  var symExprs = this.symExprs
  for (var i = 0, n = symExprs.length; i < n; ++i) {
    var symExpr = symExprs[i];
    if (symExpr.length === 2)
      ctx.defineLocal(symExpr[0].toString(), symExpr[1].run(ctx));
    else
      ctx.defineLocal(symExpr[0].toString(), undefined);
  }
  return undefined;
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VarSyntax.prototype.toString = function toString() {
  var s = 'var ';
  var symExprs = this.symExprs
  for (var i = 0, n = symExprs.length; i < n; ++i) {
    var symExpr = symExprs[i];
    if (symExpr.length === 2)
      s += symExpr[0].toString() + ' = ' + symExpr[1].toString();
    else if (symExpr.length === 1)
      s += symExpr[0].toString();
    else
      throw new Error('BUG: length wrong! may be Parser bug!');
    if (i != n - 1) s += ',';
  }
  return s + '; ';
};

//######################################################################
inherits(PrefixSyntax, ExpressionSyntax);
function PrefixSyntax(prio, op, syntax) {
  ExpressionSyntax.call(this, prio);
  this.op = op;
  this.syntax = syntax;
}

//======================================================================
PrefixSyntax.ctors = dic({
  '++':     PreIncSyntax,
  '--':     PreDecSyntax,
  '+':      PlusSyntax,
  '-':      MinusSyntax,
  '!':      LogNotSyntax,
  '~':      BitNotSyntax,
  'new':    NewSyntax,
  'typeof': TyepofSyntax,
  'void':   VoidSyntax,
  'delete': DeleteSyntax,
  // sizeof
});
//----------------------------------------------------------------------
PrefixSyntax.create = function create(op, syntax) {
  var s = op + '';
  var ctor = PrefixSyntax.ctors[s];
  if (ctor) return new ctor(op, syntax);
  throw TypeError('PrefixSyntax Op: ' + op);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PrefixSyntax.prototype.toString = function toString() {
  var op = this.op.toString();
  var z = op.slice(-1);
  if (z.match(/[a-z]/i))
    op += ' ';

  var expr = this.syntax.toString();
  if (this.prio < this.syntax.prio) expr = '(' + expr + ')';
  return op + expr;
};

//----------------------------------------------------------------------
inherits(PreIncSyntax, PrefixSyntax);
function PreIncSyntax(op, syntax) {
  PrefixSyntax.call(this, 30, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PreIncSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax.locate(ctx);
  var val = loc.getValue() + 1;
  loc.setValue(val);
  return val;
};
//----------------------------------------------------------------------
inherits(PreDecSyntax, PrefixSyntax);
function PreDecSyntax(op, syntax) {
  PrefixSyntax.call(this, 30, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PreDecSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax.locate(ctx);
  var val = loc.getValue() - 1;
  loc.setValue(val);
  return val;
};
//----------------------------------------------------------------------
inherits(PlusSyntax, PrefixSyntax);
function PlusSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PlusSyntax.prototype.run = function run(ctx) {
  return this.syntax.run(ctx);
};
//----------------------------------------------------------------------
inherits(MinusSyntax, PrefixSyntax);
function MinusSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MinusSyntax.prototype.run = function run(ctx) {
  return - this.syntax.run(ctx);
};
//----------------------------------------------------------------------
inherits(LogNotSyntax, PrefixSyntax);
function LogNotSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogNotSyntax.prototype.run = function run(ctx) {
  return ! this.syntax.run(ctx);
};
//----------------------------------------------------------------------
inherits(BitNotSyntax, PrefixSyntax);
function BitNotSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitNotSyntax.prototype.run = function run(ctx) {
  return ~ this.syntax.run(ctx);
};
//----------------------------------------------------------------------
inherits(NewSyntax, PrefixSyntax);
function NewSyntax(op, syntax) {
  PrefixSyntax.call(this, 10, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NewSyntax.prototype.run = function run(ctx) {
  var func = this.syntax.run(ctx);
  throw new Error('NewSyntax not supported');
};
//----------------------------------------------------------------------
inherits(TyepofSyntax, PrefixSyntax);
function TyepofSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TyepofSyntax.prototype.run = function run(ctx) {
  return typeof this.syntax.run(ctx);
};
//----------------------------------------------------------------------
inherits(VoidSyntax, PrefixSyntax);
function VoidSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VoidSyntax.prototype.run = function run(ctx) {
  return void this.syntax.run(ctx);
};
//----------------------------------------------------------------------
inherits(DeleteSyntax, PrefixSyntax);
function DeleteSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DeleteSyntax.prototype.run = function run(ctx) {
  return delete this.syntax.run(ctx);
};

//######################################################################
inherits(PostfixSyntax, ExpressionSyntax);
function PostfixSyntax(prio, op, syntax) {
  ExpressionSyntax.call(this, prio);
  this.op = op;
  this.syntax = syntax;
}

//======================================================================
PostfixSyntax.ctors = dic({
  '++': PostIncSyntax,
  '--': PostDecSyntax,
});
//----------------------------------------------------------------------
PostfixSyntax.create = function create(op, syntax) {
  var s = op + '';
  var ctor = PostfixSyntax.ctors[s];
  if (ctor) return new ctor(op, syntax);
  throw TypeError('PostfixSyntax Op: ' + op);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PostfixSyntax.prototype.toString = function toString() {
  var op = this.op.toString();

  var expr = this.syntax.toString();
  if (this.prio < this.syntax.prio) expr = '(' + expr + ')';
  return expr + op;
};

//----------------------------------------------------------------------
inherits(PostIncSyntax, PostfixSyntax);
function PostIncSyntax(op, syntax) {
  PostfixSyntax.call(this, 30, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PostIncSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax.locate(ctx);
  var val = loc.getValue();
  loc.setValue(val + 1);
  return val;
};
//----------------------------------------------------------------------
inherits(PostDecSyntax, PostfixSyntax);
function PostDecSyntax(op, syntax) {
  PostfixSyntax.call(this, 30, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PostDecSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax.locate(ctx);
  var val = loc.getValue();
  loc.setValue(val - 1);
  return val;
};

//######################################################################
inherits(BinSyntax, ExpressionSyntax);
function BinSyntax(prio, op, lhs, rhs) {
  ExpressionSyntax.call(this, prio);
  this.op = op;
  this.lhs = lhs;
  this.rhs = rhs;
}

//======================================================================
BinSyntax.ctors = dic({
  '+':    AddSyntax,
  '-':    SubSyntax,
  '*':    MulSyntax,
  '/':    DivSyntax,
  '%':    ModSyntax,
  '=':    AssignSyntax,
  '+=':   AssignAddSyntax,
  '-=':   AssignSubSyntax,
  '*=':   AssignMulSyntax,
  '/=':   AssignDivSyntax,
  '%=':   AssignModSyntax,
  '<<=':  AssignLogShiftLeftSyntax,
  '>>=':  AssignArithShiftRightSyntax,
  '>>>=': AssignLogShiftRightSyntax,
  '&=':   AssignBitAndSyntax,
  '^=':   AssignBitXorSyntax,
  '|=':   AssignBitOrSyntax,
  '=>':   LambdaSyntax,
  '||':   LogOrSyntax,
  '&&':   LogAndSyntax,
  '|':    BitOrSyntax,
  '^':    BitXorSyntax,
  '&':    BitAndSyntax,
  '==':   EqRelSyntax,
  '===':  StrictEqRelSyntax,
  '!=':   NotEqRelSyntax,
  '!==':  StrictNotEqRelSyntax,
  '<':    LtRelSyntax,
  '<=':   LeRelSyntax,
  '>':    GtRelSyntax,
  '>=':   GeRelSyntax,
  '<<':   LogShiftLeftSyntax,
  '>>':   ArithShiftRightSyntax,
  '>>>':  LogShiftRightSyntax,
  '?:':   ElvisSyntax,
  '??':   ElvisSyntax,
  'in':          InSyntax,
  'instanceof':  InstanceofSyntax,
});
//----------------------------------------------------------------------
BinSyntax.create = function create(op, lhs, rhs) {
  var s = op + '';
  var ctor = BinSyntax.ctors[s];
  if (ctor) return new ctor(op, lhs, rhs);
  throw TypeError('BinSyntax Op: ' + op);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BinSyntax.prototype.toString = function toString() {
  var op = this.op.toString();
  var z = op.slice(-1);
  if (z.match(/[a-z]/i))
    op = ' ' + op + ' ';

  var expr1 = this.lhs.toString();
  if (this.prio < this.lhs.prio) expr1 = '(' + expr1 + ')';
  var expr2 = this.rhs.toString();
  if (this.prio < this.rhs.prio) expr2 = '(' + expr2 + ')';
  return expr1 + op + expr2;
};

//----------------------------------------------------------------------
inherits(AddSyntax, BinSyntax);
function AddSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 60, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AddSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) + this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(SubSyntax, BinSyntax);
function SubSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 60, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SubSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) - this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(MulSyntax, BinSyntax);
function MulSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 50, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MulSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) * this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(DivSyntax, BinSyntax);
function DivSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 50, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DivSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) / this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(ModSyntax, BinSyntax);
function ModSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 50, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ModSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) % this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(AssignSyntax, BinSyntax);
function AssignSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignSyntax.prototype.run = function run(ctx) {
  return this.lhs.locate(ctx).setValue(this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignAddSyntax, BinSyntax);
function AssignAddSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignAddSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() + this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignSubSyntax, BinSyntax);
function AssignSubSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignSubSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() - this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignMulSyntax, BinSyntax);
function AssignMulSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignMulSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() * this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignDivSyntax, BinSyntax);
function AssignDivSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignDivSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() / this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignModSyntax, BinSyntax);
function AssignModSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignModSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() % this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignLogShiftLeftSyntax, BinSyntax);
function AssignLogShiftLeftSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignLogShiftLeftSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() << this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignArithShiftRightSyntax, BinSyntax);
function AssignArithShiftRightSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignArithShiftRightSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() >> this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignLogShiftRightSyntax, BinSyntax);
function AssignLogShiftRightSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignLogShiftRightSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() >>> this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignBitAndSyntax, BinSyntax);
function AssignBitAndSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitAndSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() & this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignBitXorSyntax, BinSyntax);
function AssignBitXorSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitXorSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() ^ this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(AssignBitOrSyntax, BinSyntax);
function AssignBitOrSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitOrSyntax.prototype.run = function run(ctx) {
  var loc = this.lhs.locate(ctx);
  return loc.setValue(loc.getValue() | this.rhs.run(ctx));
};
//----------------------------------------------------------------------
inherits(LambdaSyntax, BinSyntax);
function LambdaSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 170, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LambdaSyntax.prototype.run = function run(ctx) {
  // TODO => Lambda syntax support
  throw new Error('TODO => Lambda syntax not supported');
};
//----------------------------------------------------------------------
inherits(LogOrSyntax, BinSyntax);
function LogOrSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 140, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogOrSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) || this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(LogAndSyntax, BinSyntax);
function LogAndSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 130, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogAndSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) && this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(BitAndSyntax, BinSyntax);
function BitAndSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 100, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitAndSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) & this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(BitXorSyntax, BinSyntax);
function BitXorSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 110, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitXorSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) ^ this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(BitOrSyntax, BinSyntax);
function BitOrSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 120, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitOrSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) | this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(EqRelSyntax, BinSyntax);
function EqRelSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 90, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
EqRelSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) == this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(StrictEqRelSyntax, BinSyntax);
function StrictEqRelSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 90, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StrictEqRelSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) === this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(NotEqRelSyntax, BinSyntax);
function NotEqRelSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 90, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NotEqRelSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) != this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(StrictNotEqRelSyntax, BinSyntax);
function StrictNotEqRelSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 90, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StrictNotEqRelSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) !== this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(LtRelSyntax, BinSyntax);
function LtRelSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 80, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LtRelSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) < this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(LeRelSyntax, BinSyntax);
function LeRelSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 80, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LeRelSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) <= this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(GtRelSyntax, BinSyntax);
function GtRelSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 80, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GtRelSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) > this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(GeRelSyntax, BinSyntax);
function GeRelSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 80, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GeRelSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) >= this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(LogShiftLeftSyntax, BinSyntax);
function LogShiftLeftSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 70, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogShiftLeftSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) << this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(ArithShiftRightSyntax, BinSyntax);
function ArithShiftRightSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 70, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ArithShiftRightSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) >> this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(LogShiftRightSyntax, BinSyntax);
function LogShiftRightSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 70, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogShiftRightSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) >>> this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(ElvisSyntax, BinSyntax);
function ElvisSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 150, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ElvisSyntax.prototype.run = function run(ctx) {
  var val = this.lhs.run(ctx);
  return val != null ? val : this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(InSyntax, BinSyntax);
function InSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 80, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
InSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) in this.rhs.run(ctx);
};
//----------------------------------------------------------------------
inherits(InstanceofSyntax, BinSyntax);
function InstanceofSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 80, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
InstanceofSyntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) instanceof this.rhs.run(ctx);
};

//######################################################################
inherits(Cond3Syntax, ExpressionSyntax);
function Cond3Syntax(op1, op2, lhs, mhs, rhs) {
  ExpressionSyntax.call(this, 150);
  this.op1 = op1;
  this.op2 = op2;
  this.lhs = lhs;
  this.mhs = mhs;
  this.rhs = rhs;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Cond3Syntax.prototype.run = function run(ctx) {
  return this.lhs.run(ctx) ? this.mhs.run(ctx) : this.rhs.run(ctx);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Cond3Syntax.prototype.toString = function toString() {
  var op1 = this.op1.toString();
  var op2 = this.op2.toString();

  var lhs = this.lhs.toString();
  if (this.prio < this.lhs.prio) lhs = '(' + lhs + ')';
  var mhs = this.mhs.toString();
  if (this.prio < this.mhs.prio) mhs = '(' + mhs + ')';
  var rhs = this.rhs.toString();
  if (this.prio < this.rhs.prio) rhs = '(' + rhs + ')';
  return lhs + op1 + mhs + op2 + rhs;
};

//######################################################################
inherits(FuncCallSyntax, ExpressionSyntax);
function FuncCallSyntax(func, args) {
  ExpressionSyntax.call(this, 20);
  this.func = func;
  this.args = args;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
FuncCallSyntax.prototype.run = function run(ctx) {
  var func = this.func.run(ctx);
  var args = this.args;
  throw Error('FuncCallSyntax not supported');
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
FuncCallSyntax.prototype.toString = function toString() {
  var args = this.args;
  var s = this.func.toString();
  if (args.length === 0)
    return s + '()';

  s += '(';
  for (var i = 0, n = args.length; i < n; ++i) {
    var arg = args[i];
    if (arg.prio >= 180) s += '(';
    s += arg.toString();
    if (arg.prio >= 180) s += ')';
    if (i !== n - 1) s += ', ';
  }
  s += ')';
  return s;
};

//######################################################################
inherits(AccessSyntax, BinSyntax);
function AccessSyntax(op, lhs, rhs) {
  BinSyntax.call(this, 10, op, lhs, rhs);
}

//======================================================================
AccessSyntax.ctors = dic({
  '.':  AccessDotSyntax,
  '?.': AccessWeakDotSyntax,
  '[':  AccessGetSetSyntax,
  '->': AccessThinArrowSyntax,
});
//----------------------------------------------------------------------
AccessSyntax.create = function create(op, lhs, rhs) {
  var s = op + '';
  var ctor = AccessSyntax.ctors[s];
  if (ctor) return new ctor(op, lhs, rhs);
  throw TypeError('AccessSyntax Op: ' + op);
};

//----------------------------------------------------------------------
inherits(AccessDotSyntax, AccessSyntax);
function AccessDotSyntax(op, lhs, rhs) {
  AccessSyntax.call(this, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessDotSyntax.prototype.locate = function locate(ctx) {
  var access = this.lhs.run(ctx);
  var propertyName = this.rhs + '';
  throw new Error('AccessDotSyntax not supported');
};
//----------------------------------------------------------------------
inherits(AccessWeakDotSyntax, AccessSyntax);
function AccessWeakDotSyntax(op, lhs, rhs) {
  AccessSyntax.call(this, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessWeakDotSyntax.prototype.locate = function locate(ctx) {
  var access = this.lhs.run(ctx);
  var propertyName = this.rhs + '';
  throw new Error('AccessWeakDotSyntax not supported');
};
//----------------------------------------------------------------------
inherits(AccessGetSetSyntax, AccessSyntax);
function AccessGetSetSyntax(op, lhs, rhs) {
  AccessSyntax.call(this, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessGetSetSyntax.prototype.locate = function locate(ctx) {
  var access = this.lhs.run(ctx);
  var propertyName = this.rhs.run(ctx) + '';
  throw new Error('AccessGetSetSyntax not supported');
};
//----------------------------------------------------------------------
inherits(AccessThinArrowSyntax, AccessSyntax);
function AccessThinArrowSyntax(op, lhs, rhs) {
  AccessSyntax.call(this, op, lhs, rhs);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessThinArrowSyntax.prototype.locate = function locate(ctx) {
  var access = this.lhs.run(ctx);
  var propertyName = this.rhs + '';
  throw new Error('AccessThinArrowSyntax not supported');
};

//######################################################################
inherits(CoreSyntax, ExpressionSyntax);
function CoreSyntax(token) {
  ExpressionSyntax.call(this, 0);
  this.token = token;
}

//======================================================================
CoreSyntax.ctors = dic({
  'NumToken':  NumberSyntax,
  'StrToken':  StringSyntax,
  'SymToken':  SymbolSyntax,
});
//----------------------------------------------------------------------
CoreSyntax.create = function create(token) {
  var ctor = CoreSyntax.ctors[token.constructor.name];
  if (ctor) return new ctor(token);
  throw TypeError('CoreSyntax Token: ' + token);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CoreSyntax.prototype.toString = function toString() {
  return this.token.toString();
};

//----------------------------------------------------------------------
inherits(NumberSyntax, CoreSyntax);
function NumberSyntax(token) {
  CoreSyntax.call(this, token);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NumberSyntax.prototype.run = function run(ctx) {
  return this.token.getValue();
};
//----------------------------------------------------------------------
inherits(StringSyntax, CoreSyntax);
function StringSyntax(token) {
  CoreSyntax.call(this, token);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StringSyntax.prototype.run = function run(ctx) {
  return this.token.getValue();
};
//----------------------------------------------------------------------
inherits(SymbolSyntax, CoreSyntax);
function SymbolSyntax(token) {
  CoreSyntax.call(this, token);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SymbolSyntax.reservedGlobalConstants = dic({
  'null': null,
  'undefined': undefined,
  'true': true,
  'false': false,
});
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SymbolSyntax.prototype.run = function run(ctx) {
  var s = this.token.toString();
  if (SymbolSyntax.reservedGlobalConstants[s] !== undefined || s in SymbolSyntax.reservedGlobalConstants)
    return SymbolSyntax.reservedGlobalConstants[s];

  return ctx.getSymbolValue(s);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SymbolSyntax.prototype.locate = function locate(ctx) {
  var s = this.token.toString();
  if (SymbolSyntax.reservedGlobalConstants[s] !== undefined || s in SymbolSyntax.reservedGlobalConstants)
    throw new Error('reserved keyword locate not supported');

  return {
    getValue: function () { return ctx.getSymbolValue(s); },
    setValue: function (value) { return ctx.setSymbolValue(s, value), value; }
  };
};
