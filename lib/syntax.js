// syntax.js AST Abstract Syntax Tree

'use strict';

var util = require('util');

var classes = [];

//######################################################################
function inherits(ctor, superCtor) {
  util.inherits(ctor, superCtor);
  classes.push(ctor);
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
classes.push(Syntax);
function Syntax(prio) {
  this['class'] = this.constructor.name;
  this.prio = prio;
}

//######################################################################
// {文; ...}
inherits(BlockSyntax, Syntax);
function BlockSyntax(syntaxes) {
  Syntax.call(this, 200);
  this.syntaxes = syntaxes;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BlockSyntax.prototype.run = function run(ctx) {
  var val;
  for (var i = 0, n = this.syntaxes.length; i < n; ++i)
    val = this.syntaxes[i].run(ctx);
  return val;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BlockSyntax.prototype.toString = function toString() {
  var s = '{';
  for (var i = 0, n = this.syntaxes.length; i < n; ++i)
    s += this.syntaxes[i].toString() + '; ';
  return s + '}';
}

//######################################################################
// 式, ...
inherits(CommaSyntax, Syntax);
function CommaSyntax(syntaxes) {
  Syntax.call(this, 180);
  this.syntaxes = syntaxes;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CommaSyntax.prototype.run = function run(ctx) {
  var val;
  for (var i = 0, n = this.syntaxes.length; i < n; ++i)
    val = this.syntaxes[i].run(ctx);
  return val;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CommaSyntax.prototype.toString = function toString() {
  var s = '';
  for (var i = 0, n = this.syntaxes.length; i < n; ++i) {
    if (this.syntaxes[i].prio >= this.prio) s += '(';
    s += this.syntaxes[i].toString();
    if (this.syntaxes[i].prio >= this.prio) s += ')';
    if (i != n - 1) s += ', ';
  }
  return s;
}

//######################################################################
// (式)
inherits(ParenSyntax, Syntax);
function ParenSyntax(syntax) {
  Syntax.call(this, 0);
  this.syntax = syntax;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ParenSyntax.prototype.run = function run(ctx) {
  return this.syntax.run(ctx);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ParenSyntax.prototype.toString = function toString() {
  return '(' + this.syntax.toString() + ')';
}

//######################################################################
inherits(PrefixSyntax, Syntax);
function PrefixSyntax(prio, op, syntax) {
  Syntax.call(this, prio);
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
}

//----------------------------------------------------------------------
inherits(PreIncSyntax, PrefixSyntax);
function PreIncSyntax(op, syntax) {
  PrefixSyntax.call(this, 30, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PreIncSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax.locate(ctx);
  var val = loc.get() + 1;
  loc.set(val);
  return val;
}
//----------------------------------------------------------------------
inherits(PreDecSyntax, PrefixSyntax);
function PreDecSyntax(op, syntax) {
  PrefixSyntax.call(this, 30, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PreDecSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax.locate(ctx);
  var val = loc.get() - 1;
  loc.set(val);
  return val;
}
//----------------------------------------------------------------------
inherits(PlusSyntax, PrefixSyntax);
function PlusSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PlusSyntax.prototype.run = function run(ctx) {
  return this.syntax.run(ctx);
}
//----------------------------------------------------------------------
inherits(MinusSyntax, PrefixSyntax);
function MinusSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MinusSyntax.prototype.run = function run(ctx) {
  return - this.syntax.run(ctx);
}
//----------------------------------------------------------------------
inherits(LogNotSyntax, PrefixSyntax);
function LogNotSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogNotSyntax.prototype.run = function run(ctx) {
  return ! this.syntax.run(ctx);
}
//----------------------------------------------------------------------
inherits(BitNotSyntax, PrefixSyntax);
function BitNotSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitNotSyntax.prototype.run = function run(ctx) {
  return ~ this.syntax.run(ctx);
}
//----------------------------------------------------------------------
inherits(NewSyntax, PrefixSyntax);
function NewSyntax(op, syntax) {
  PrefixSyntax.call(this, 10, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NewSyntax.prototype.run = function run(ctx) {
  var func = this.syntax.run(ctx);
  throw new Error('NewSyntax not supported');
}
//----------------------------------------------------------------------
inherits(TyepofSyntax, PrefixSyntax);
function TyepofSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TyepofSyntax.prototype.run = function run(ctx) {
  return typeof this.syntax.run(ctx);
}
//----------------------------------------------------------------------
inherits(VoidSyntax, PrefixSyntax);
function VoidSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
VoidSyntax.prototype.run = function run(ctx) {
  return void this.syntax.run(ctx);
}
//----------------------------------------------------------------------
inherits(DeleteSyntax, PrefixSyntax);
function DeleteSyntax(op, syntax) {
  PrefixSyntax.call(this, 40, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DeleteSyntax.prototype.run = function run(ctx) {
  return delete this.syntax.run(ctx);
}

//######################################################################
inherits(PostfixSyntax, Syntax);
function PostfixSyntax(prio, op, syntax) {
  Syntax.call(this, prio);
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
}

//----------------------------------------------------------------------
inherits(PostIncSyntax, PostfixSyntax);
function PostIncSyntax(op, syntax) {
  PostfixSyntax.call(this, 30, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PostIncSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax.locate(ctx);
  var val = loc.get();
  loc.set(val + 1);
  return val;
}
//----------------------------------------------------------------------
inherits(PostDecSyntax, PostfixSyntax);
function PostDecSyntax(op, syntax) {
  PostfixSyntax.call(this, 30, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PostDecSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax.locate(ctx);
  var val = loc.get();
  loc.set(val - 1);
  return val;
}

//######################################################################
inherits(BinSyntax, Syntax);
function BinSyntax(prio, op, syntax1, syntax2) {
  Syntax.call(this, prio);
  this.op = op;
  this.syntax1 = syntax1;
  this.syntax2 = syntax2;
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
  '?:':   Cond2Syntax,
  'in':          InSyntax,
  'instanceof':  InstanceofSyntax,
});
//----------------------------------------------------------------------
BinSyntax.create = function create(op, syntax1, syntax2) {
  var s = op + '';
  var ctor = BinSyntax.ctors[s];
  if (ctor) return new ctor(op, syntax1, syntax2);
  throw TypeError('BinSyntax Op: ' + op);
};
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BinSyntax.prototype.toString = function toString() {
  var op = this.op.toString();
  var z = op.slice(-1);
  if (z.match(/[a-z]/i))
    op = ' ' + op + ' ';

  var expr1 = this.syntax1.toString();
  if (this.prio < this.syntax1.prio) expr1 = '(' + expr1 + ')';
  var expr2 = this.syntax2.toString();
  if (this.prio < this.syntax2.prio) expr2 = '(' + expr2 + ')';
  return expr1 + op + expr2;
}

//----------------------------------------------------------------------
inherits(AddSyntax, BinSyntax);
function AddSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 60, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AddSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) + this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(SubSyntax, BinSyntax);
function SubSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 60, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SubSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) - this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(MulSyntax, BinSyntax);
function MulSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 50, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MulSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) * this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(DivSyntax, BinSyntax);
function DivSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 50, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DivSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) / this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(ModSyntax, BinSyntax);
function ModSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 50, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ModSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) % this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(AssignSyntax, BinSyntax);
function AssignSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignSyntax.prototype.run = function run(ctx) {
  return this.syntax1.locate(ctx).set(this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignAddSyntax, BinSyntax);
function AssignAddSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignAddSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() + this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignSubSyntax, BinSyntax);
function AssignSubSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignSubSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() - this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignMulSyntax, BinSyntax);
function AssignMulSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignMulSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() * this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignDivSyntax, BinSyntax);
function AssignDivSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignDivSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() / this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignModSyntax, BinSyntax);
function AssignModSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignModSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() % this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignLogShiftLeftSyntax, BinSyntax);
function AssignLogShiftLeftSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignLogShiftLeftSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() << this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignArithShiftRightSyntax, BinSyntax);
function AssignArithShiftRightSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignArithShiftRightSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() >> this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignLogShiftRightSyntax, BinSyntax);
function AssignLogShiftRightSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignLogShiftRightSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() >>> this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignBitAndSyntax, BinSyntax);
function AssignBitAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitAndSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() & this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignBitXorSyntax, BinSyntax);
function AssignBitXorSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitXorSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() ^ this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(AssignBitOrSyntax, BinSyntax);
function AssignBitOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 170, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitOrSyntax.prototype.run = function run(ctx) {
  var loc = this.syntax1.locate(ctx);
  return loc.set(loc.get() | this.syntax2.run(ctx));
}
//----------------------------------------------------------------------
inherits(LogOrSyntax, BinSyntax);
function LogOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 140, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogOrSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) || this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(LogAndSyntax, BinSyntax);
function LogAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 130, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogAndSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) && this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(BitAndSyntax, BinSyntax);
function BitAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 100, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitAndSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) & this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(BitXorSyntax, BinSyntax);
function BitXorSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 110, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitXorSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) ^ this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(BitOrSyntax, BinSyntax);
function BitOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 120, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitOrSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) | this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(EqRelSyntax, BinSyntax);
function EqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 90, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
EqRelSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) == this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(StrictEqRelSyntax, BinSyntax);
function StrictEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 90, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StrictEqRelSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) === this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(NotEqRelSyntax, BinSyntax);
function NotEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 90, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NotEqRelSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) != this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(StrictNotEqRelSyntax, BinSyntax);
function StrictNotEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 90, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StrictNotEqRelSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) !== this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(LtRelSyntax, BinSyntax);
function LtRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 80, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LtRelSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) < this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(LeRelSyntax, BinSyntax);
function LeRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 80, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LeRelSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) <= this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(GtRelSyntax, BinSyntax);
function GtRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 80, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GtRelSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) > this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(GeRelSyntax, BinSyntax);
function GeRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 80, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GeRelSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) >= this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(LogShiftLeftSyntax, BinSyntax);
function LogShiftLeftSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 70, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogShiftLeftSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) << this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(ArithShiftRightSyntax, BinSyntax);
function ArithShiftRightSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 70, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ArithShiftRightSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) >> this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(LogShiftRightSyntax, BinSyntax);
function LogShiftRightSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 70, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogShiftRightSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) >>> this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(Cond2Syntax, BinSyntax);
function Cond2Syntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 150, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Cond2Syntax.prototype.run = function run(ctx) {
  var val = this.syntax1.run(ctx);
  // TODO: 正しいのかチェックしてください。
  return val ? val : this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(InSyntax, BinSyntax);
function InSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 80, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
InSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) in this.syntax2.run(ctx);
}
//----------------------------------------------------------------------
inherits(InstanceofSyntax, BinSyntax);
function InstanceofSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 80, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
InstanceofSyntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) instanceof this.syntax2.run(ctx);
}

//######################################################################
inherits(Cond3Syntax, Syntax);
function Cond3Syntax(op1, op2, syntax1, syntax2, syntax3) {
  Syntax.call(this, 150);
  this.op1 = op1;
  this.op2 = op2;
  this.syntax1 = syntax1;
  this.syntax2 = syntax2;
  this.syntax3 = syntax3;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Cond3Syntax.prototype.run = function run(ctx) {
  return this.syntax1.run(ctx) ? this.syntax2.run(ctx) : this.syntax3.run(ctx);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Cond3Syntax.prototype.toString = function toString() {
  var op1 = this.op1.toString();
  var op2 = this.op2.toString();

  var expr1 = this.syntax1.toString();
  if (this.prio < this.syntax1.prio) expr1 = '(' + expr1 + ')';
  var expr2 = this.syntax2.toString();
  if (this.prio < this.syntax2.prio) expr2 = '(' + expr2 + ')';
  var expr3 = this.syntax2.toString();
  if (this.prio < this.syntax3.prio) expr3 = '(' + expr3 + ')';
  return expr1 + op1 + expr2 + op2;
}

//######################################################################
inherits(FuncCallSyntax, Syntax);
function FuncCallSyntax(func, args) {
  Syntax.call(this, 20);
  this.func = func;
  this.args = args;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
FuncCallSyntax.prototype.run = function run(ctx) {
  var func = this.func.run(ctx);
  var args = this.args;
  throw Error('FuncCallSyntax not supported');
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
FuncCallSyntax.prototype.toString = function toString() {
  var s = this.func.toString();
  if (this.args.length === 0)
    return s + '()';

  s += '(';
  for (var i = 0, n = this.args.length; i < n; ++i) {
    if (this.args[i].prio >= 180) s += '(';
    s += this.args[i].toString();
    if (this.args[i].prio >= 180) s += ')';
    if (i !== n - 1) s += ', ';
  }
  s += ')';
  return s;
}

//######################################################################
inherits(AccessSyntax, BinSyntax);
function AccessSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, 10, op, syntax1, syntax2);
}

//======================================================================
AccessSyntax.ctors = dic({
  '.':  AccessDotSyntax,
  '?.': AccessWeakDotSyntax,
  '[':  AccessGetSetSyntax,
  '->': AccessThinArrowSyntax,
});
//----------------------------------------------------------------------
AccessSyntax.create = function create(op, syntax1, syntax2) {
  var s = op + '';
  var ctor = AccessSyntax.ctors[s];
  if (ctor) return new ctor(op, syntax1, syntax2);
  throw TypeError('AccessSyntax Op: ' + op);
};

//----------------------------------------------------------------------
inherits(AccessDotSyntax, AccessSyntax);
function AccessDotSyntax(op, syntax1, syntax2) {
  AccessSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessDotSyntax.prototype.locate = function locate(ctx) {
  var access = this.syntax1.run(ctx);
  var propertyName = this.syntax2 + '';
  throw new Error('AccessDotSyntax not supported');
}
//----------------------------------------------------------------------
inherits(AccessWeakDotSyntax, AccessSyntax);
function AccessWeakDotSyntax(op, syntax1, syntax2) {
  AccessSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessWeakDotSyntax.prototype.locate = function locate(ctx) {
  var access = this.syntax1.run(ctx);
  var propertyName = this.syntax2 + '';
  throw new Error('AccessWeakDotSyntax not supported');
}
//----------------------------------------------------------------------
inherits(AccessGetSetSyntax, AccessSyntax);
function AccessGetSetSyntax(op, syntax1, syntax2) {
  AccessSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessGetSetSyntax.prototype.locate = function locate(ctx) {
  var access = this.syntax1.run(ctx);
  var propertyName = this.syntax2.run(ctx) + '';
  throw new Error('AccessGetSetSyntax not supported');
}
//----------------------------------------------------------------------
inherits(AccessThinArrowSyntax, AccessSyntax);
function AccessThinArrowSyntax(op, syntax1, syntax2) {
  AccessSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessThinArrowSyntax.prototype.locate = function locate(ctx) {
  var access = this.syntax1.run(ctx);
  var propertyName = this.syntax2 + '';
  throw new Error('AccessThinArrowSyntax not supported');
}

//######################################################################
inherits(CoreSyntax, Syntax);
function CoreSyntax(token) {
  Syntax.call(this, 0);
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
}

//----------------------------------------------------------------------
inherits(NumberSyntax, CoreSyntax);
function NumberSyntax(token) {
  CoreSyntax.call(this, token);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NumberSyntax.prototype.run = function run(ctx) {
  return this.token.value;
}
//----------------------------------------------------------------------
inherits(StringSyntax, CoreSyntax);
function StringSyntax(token) {
  CoreSyntax.call(this, token);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StringSyntax.prototype.run = function run(ctx) {
  return this.token.value;
}
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
  var s = this.token.string;
  if (s in SymbolSyntax.reservedGlobalConstants)
    return SymbolSyntax.reservedGlobalConstants[s];

  return ctx.get(s);
  //throw new Error('Symbol run not supported');
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SymbolSyntax.prototype.locate = function locate(ctx) {
  var s = this.token.string;
  if (s in SymbolSyntax.reservedGlobalConstants)
    throw new Error('reserved keyword locate not supported');

  return {
    get: function () { return ctx.get(s); },
    set: function (value) { return ctx.set(s, value), value; }
  };
  //throw new Error('Symbol run not supported');
}

//----------------------------------------------------------------------
exports = module.exports = Syntax;
classes.forEach(function (fn) {
  exports[fn.name] = fn;
});
