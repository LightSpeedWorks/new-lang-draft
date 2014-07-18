'use strict';

var util = require('util');

var classes = [];

//######################################################################
function inherits(ctor, superCtor) {
  util.inherits(ctor, superCtor);
  classes.push(ctor);
}

// 実行して値を返す run
// 実行直前の場所を返す locate
//   symbol -> SymToken
//   expr.symbol -> AccessDot
//   expr[expr]  -> AccessGetSet
// コンパイル・計算できる所(数値や定数が引数の純粋関数の場合)は実行する compile

//######################################################################
classes.push(Syntax);
function Syntax() {
  this['class'] = this.constructor.name;
}

//######################################################################
// {文; ...}
inherits(BlockSyntax, Syntax);
function BlockSyntax(syntaxes) {
  Syntax.call(this);
  this.syntaxes = syntaxes;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BlockSyntax.prototype.run = function run(env) {
  var val;
  for (var i = 0, n = this.syntaxes.length; i < n; ++i)
    val = this.syntaxes[i].run(env);
  return val;
}

//######################################################################
// 式, ...
inherits(CommaSyntax, Syntax);
function CommaSyntax(syntaxes) {
  Syntax.call(this);
  this.syntaxes = syntaxes;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
CommaSyntax.prototype.run = function run(env) {
  var val;
  for (var i = 0, n = this.syntaxes.length; i < n; ++i)
    val = this.syntaxes[i].run(env);
  return val;
}

//######################################################################
// (式)
inherits(ParenSyntax, Syntax);
function ParenSyntax(syntax) {
  Syntax.call(this);
  this.syntax = syntax;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ParenSyntax.prototype.run = function run(env) {
  return this.syntax.run(env);
}

//######################################################################
inherits(PrefixSyntax, Syntax);
function PrefixSyntax(op, syntax) {
  Syntax.call(this);
  this.op = op;
  this.syntax = syntax;
}

//======================================================================
PrefixSyntax.ctors = {
  '++': PreIncSyntax,
  '--': PreDecSyntax,
  'new': NewSyntax,
}
//----------------------------------------------------------------------
PrefixSyntax.create = function create(op, syntax) {
  var s = op + '';
  var ctor = PrefixSyntax.ctors[s];
  if (ctor) return new ctor(op, syntax);
  throw TypeError('Op: ' + op);
};

//----------------------------------------------------------------------
inherits(PreIncSyntax, PrefixSyntax);
function PreIncSyntax(op, syntax) {
  PrefixSyntax.call(this, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PreIncSyntax.prototype.run = function run(env) {
  var loc = this.syntax.locate(env);
  var val = loc.get() + 1;
  loc.set(val);
  return val;
}
//----------------------------------------------------------------------
inherits(PreDecSyntax, PrefixSyntax);
function PreDecSyntax(op, syntax) {
  PrefixSyntax.call(this, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PreDecSyntax.prototype.run = function run(env) {
  var loc = this.syntax.locate(env);
  var val = loc.get() - 1;
  loc.set(val);
  return val;
}
//----------------------------------------------------------------------
inherits(NewSyntax, PrefixSyntax);
function NewSyntax(op, syntax) {
  PrefixSyntax.call(this, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NewSyntax.prototype.run = function run(env) {
  var func = this.syntax.run(env);
  throw new Error('未実装');
}

//######################################################################
inherits(PostfixSyntax, Syntax);
function PostfixSyntax(op, syntax) {
  Syntax.call(this);
  this.op = op;
  this.syntax = syntax;
}

//======================================================================
PostfixSyntax.ctors = {
  '++': PostIncSyntax,
  '--': PostDecSyntax,
}
//----------------------------------------------------------------------
PostfixSyntax.create = function create(op, syntax) {
  var s = op + '';
  var ctor = PostfixSyntax.ctors[s];
  if (ctor) return new ctor(op, syntax);
  throw TypeError('Op: ' + op);
};

//----------------------------------------------------------------------
inherits(PostIncSyntax, PostfixSyntax);
function PostIncSyntax(op, syntax) {
  PostfixSyntax.call(this, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PostIncSyntax.prototype.run = function run(env) {
  var loc = this.syntax.locate(env);
  var val = loc.get();
  loc.set(val + 1);
  return val;
}
//----------------------------------------------------------------------
inherits(PostDecSyntax, PostfixSyntax);
function PostDecSyntax(op, syntax) {
  PostfixSyntax.call(this, op, syntax);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PostDecSyntax.prototype.run = function run(env) {
  var loc = this.syntax.locate(env);
  var val = loc.get();
  loc.set(val - 1);
  return val;
}

//######################################################################
inherits(BinSyntax, Syntax);
function BinSyntax(op, syntax1, syntax2) {
  Syntax.call(this);
  this.op = op;
  this.syntax1 = syntax1;
  this.syntax2 = syntax2;
}

//======================================================================
BinSyntax.ctors = {
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
  '&':    BitOrSyntax,
  '==':   EqRelSyntax,
  '===':  StrictEqRelSyntax,
  '!=':   NotEqRelSyntax,
  '!==':  StrictNotEqRelSyntax,
  '?:':   Cond2Syntax,
};
//----------------------------------------------------------------------
BinSyntax.create = function create(op, syntax1, syntax2) {
  var s = op + '';
  var ctor = BinSyntax.ctors[s];
  if (ctor) return new ctor(op, syntax1, syntax2);
  throw TypeError('Op: ' + op);
};

//----------------------------------------------------------------------
inherits(AddSyntax, BinSyntax);
function AddSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AddSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) + this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(SubSyntax, BinSyntax);
function SubSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SubSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) - this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(MulSyntax, BinSyntax);
function MulSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MulSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) * this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(DivSyntax, BinSyntax);
function DivSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DivSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) / this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(ModSyntax, BinSyntax);
function ModSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ModSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) % this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(AssignSyntax, BinSyntax);
function AssignSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignSyntax.prototype.run = function run(env) {
  return this.syntax1.locate(env).set(this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignAddSyntax, BinSyntax);
function AssignAddSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignAddSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() + this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignSubSyntax, BinSyntax);
function AssignSubSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignSubSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() - this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignMulSyntax, BinSyntax);
function AssignMulSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignMulSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() * this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignDivSyntax, BinSyntax);
function AssignDivSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignDivSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() / this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignModSyntax, BinSyntax);
function AssignModSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignModSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() % this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignLogShiftLeftSyntax, BinSyntax);
function AssignLogShiftLeftSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignLogShiftLeftSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() << this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignArithShiftRightSyntax, BinSyntax);
function AssignArithShiftRightSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignArithShiftRightSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() >> this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignLogShiftRightSyntax, BinSyntax);
function AssignLogShiftRightSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignLogShiftRightSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() >>> this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignBitAndSyntax, BinSyntax);
function AssignBitAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitAndSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() & this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignBitXorSyntax, BinSyntax);
function AssignBitXorSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitXorSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() ^ this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(AssignBitOrSyntax, BinSyntax);
function AssignBitOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AssignBitOrSyntax.prototype.run = function run(env) {
  var loc = this.syntax1.locate(env);
  return loc.set(loc.get() | this.syntax2.run(env));
}
//----------------------------------------------------------------------
inherits(LogOrSyntax, BinSyntax);
function LogOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogOrSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) || this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(LogAndSyntax, BinSyntax);
function LogAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
LogAndSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) && this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(BitAndSyntax, BinSyntax);
function BitAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitAndSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) & this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(BitXorSyntax, BinSyntax);
function BitXorSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitXorSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) ^ this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(BitOrSyntax, BinSyntax);
function BitOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
BitOrSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) | this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(EqRelSyntax, BinSyntax);
function EqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
EqRelSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) == this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(StrictEqRelSyntax, BinSyntax);
function StrictEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StrictEqRelSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) === this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(NotEqRelSyntax, BinSyntax);
function NotEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NotEqRelSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) != this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(StrictNotEqRelSyntax, BinSyntax);
function StrictNotEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StrictNotEqRelSyntax.prototype.run = function run(env) {
  return this.syntax1.run(env) !== this.syntax2.run(env);
}
//----------------------------------------------------------------------
inherits(Cond2Syntax, BinSyntax);
function Cond2Syntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Cond2Syntax.prototype.run = function run(env) {
  var val = this.syntax1.run(env);
  // TODO: 正しいのかチェックしてください。
  return val ? val : this.syntax2.run(env);
}
/*
//----------------------------------------------------------------------
inherits(EqRelSyntax, BinSyntax);
function EqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
*/

//######################################################################
inherits(Cond3Syntax, Syntax);
function Cond3Syntax(op1, op2, syntax1, syntax2, syntax3) {
  Syntax.call(this);
  this.op1 = op1;
  this.op2 = op2;
  this.syntax1 = syntax1;
  this.syntax2 = syntax2;
  this.syntax3 = syntax3;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Cond3Syntax.prototype.run = function run(env) {
  return this.syntax1.run(env) ? this.syntax2.run(env) : this.syntax3.run(env);
}

//######################################################################
inherits(FuncCallSyntax, Syntax);
function FuncCallSyntax(func, args) {
  Syntax.call(this);
  this.func = func;
  this.args = args;
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
FuncCallSyntax.prototype.run = function run(env) {
  var func = this.func.run(env);
  var args = this.args;
  throw Error('未実装');
}

//######################################################################
inherits(AccessSyntax, BinSyntax);
function AccessSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, symtax1, syntax2);
}

//======================================================================
AccessSyntax.ctors = {
  '.':  AccessDotSyntax,
  '?.': AccessWeakDotSyntax,
  '[':  AccessGetSetSyntax,
  '->': AccessThinArrowSyntax,
};
//----------------------------------------------------------------------
AccessSyntax.create = function create(op, syntax1, syntax2) {
  var s = op + '';
  var ctor = AccessSyntax.ctors[s];
  if (ctor) return new ctor(op, syntax1, syntax2);
  throw TypeError('Op: ' + op);
};

//----------------------------------------------------------------------
inherits(AccessDotSyntax, AccessSyntax);
function AccessDotSyntax(op, syntax1, syntax2) {
  AccessSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessDotSyntax.prototype.locate = function locate(env) {
  var access = this.syntax1.run(env);
  var propertyName = this.syntax2 + '';
  throw new Error('未実装');
}
//----------------------------------------------------------------------
inherits(AccessWeakDotSyntax, AccessSyntax);
function AccessWeakDotSyntax(op, syntax1, syntax2) {
  AccessSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessWeakDotSyntax.prototype.locate = function locate(env) {
  var access = this.syntax1.run(env);
  var propertyName = this.syntax2 + '';
  throw new Error('未実装');
}
//----------------------------------------------------------------------
inherits(AccessGetSetSyntax, AccessSyntax);
function AccessGetSetSyntax(op, syntax1, syntax2) {
  AccessSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessGetSetSyntax.prototype.locate = function locate(env) {
  var access = this.syntax1.run(env);
  var propertyName = this.syntax2.run(env) + '';
  throw new Error('未実装');
}
//----------------------------------------------------------------------
inherits(AccessThinArrowSyntax, AccessSyntax);
function AccessThinArrowSyntax(op, syntax1, syntax2) {
  AccessSyntax.call(this, op, syntax1, syntax2);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AccessThinArrowSyntax.prototype.locate = function locate(env) {
  var access = this.syntax1.run(env);
  var propertyName = this.syntax2 + '';
  throw new Error('未実装');
}




//######################################################################
inherits(CoreSyntax, Syntax);
function CoreSyntax(token) {
  Syntax.call();
  this.token = token;
}

//======================================================================
CoreSyntax.ctors = {
  'NumToken':  NumberSyntax,
  'StrToken':  StringSyntax,
  'SymToken':  SymbolSyntax,
};
//----------------------------------------------------------------------
CoreSyntax.create = function create(token) {
  var ctor = CoreSyntax.ctors[token.constructor.name];
  if (ctor) return new ctor(token);
  throw TypeError('Token: ' + token);
};

//----------------------------------------------------------------------
inherits(NumberSyntax, CoreSyntax);
function NumberSyntax(token) {
  CoreSyntax.call(this, token);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NumberSyntax.prototype.run = function run(env) {
  return this.token.value;
}
//----------------------------------------------------------------------
inherits(StringSyntax, CoreSyntax);
function StringSyntax(token) {
  CoreSyntax.call(this, token);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
StringSyntax.prototype.run = function run(env) {
  return this.token.value;
}
//----------------------------------------------------------------------
inherits(SymbolSyntax, CoreSyntax);
function SymbolSyntax(token) {
  CoreSyntax.call(this, token);
}
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SymbolSyntax.prototype.run = function run(env) {
  return this.token.value;
}

//----------------------------------------------------------------------
exports = module.exports = Syntax;
classes.forEach(function (fn) {
  exports[fn.name] = fn;
});
