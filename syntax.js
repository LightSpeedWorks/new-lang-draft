'use strict';

var util = require('util');

var syntaxes = [];

// 実行して値を返す run eval exec calc
// 実行直前の場所を返す locate
//   symbol -> SymToken
//   expr.symbol -> AccessDot
//   expr[expr]  -> AccessGetSet
// コンパイル・計算できる所(数値や定数が引数の純粋関数の場合)は実行する compile

//######################################################################
syntaxes.push(Syntax);
function Syntax() {
  this['class'] = this.constructor.name;
}

//######################################################################
function inherits(ctor, superCtor) {
  util.inherits(ctor, superCtor);
  syntaxes.push(ctor);
}

//######################################################################
inherits(BlockSyntax, Syntax);
function BlockSyntax(syntaxes) {
  Syntax.call(this);
  this.syntaxes = syntaxes;
}

//######################################################################
inherits(CommaSyntax, Syntax);
function CommaSyntax(syntaxes) {
  Syntax.call(this);
  this.syntaxes = syntaxes;
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
//----------------------------------------------------------------------
inherits(PreDecSyntax, PrefixSyntax);
function PreDecSyntax(op, syntax) {
  PrefixSyntax.call(this, op, syntax);
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
//----------------------------------------------------------------------
inherits(PostDecSyntax, PostfixSyntax);
function PostDecSyntax(op, syntax) {
  PostfixSyntax.call(this, op, syntax);
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
//----------------------------------------------------------------------
inherits(SubSyntax, BinSyntax);
function SubSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(MulSyntax, BinSyntax);
function MulSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(DivSyntax, BinSyntax);
function DivSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(ModSyntax, BinSyntax);
function ModSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignSyntax, BinSyntax);
function AssignSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignAddSyntax, BinSyntax);
function AssignAddSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignSubSyntax, BinSyntax);
function AssignSubSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignMulSyntax, BinSyntax);
function AssignMulSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignDivSyntax, BinSyntax);
function AssignDivSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignModSyntax, BinSyntax);
function AssignModSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignLogShiftLeftSyntax, BinSyntax);
function AssignLogShiftLeftSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignArithShiftRightSyntax, BinSyntax);
function AssignArithShiftRightSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignLogShiftRightSyntax, BinSyntax);
function AssignLogShiftRightSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignBitAndSyntax, BinSyntax);
function AssignBitAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignBitXorSyntax, BinSyntax);
function AssignBitXorSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(AssignBitOrSyntax, BinSyntax);
function AssignBitOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(LogOrSyntax, BinSyntax);
function LogOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(LogAndSyntax, BinSyntax);
function LogAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(BitAndSyntax, BinSyntax);
function BitAndSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(BitXorSyntax, BinSyntax);
function BitXorSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(BitOrSyntax, BinSyntax);
function BitOrSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(EqRelSyntax, BinSyntax);
function EqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(StrictEqRelSyntax, BinSyntax);
function StrictEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(NotEqRelSyntax, BinSyntax);
function NotEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(StrictNotEqRelSyntax, BinSyntax);
function StrictNotEqRelSyntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
}
//----------------------------------------------------------------------
inherits(Cond2Syntax, BinSyntax);
function Cond2Syntax(op, syntax1, syntax2) {
  BinSyntax.call(this, op, syntax1, syntax2);
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


//----------------------------------------------------------------------
exports = module.exports = Syntax;
syntaxes.forEach(function (fn) {
  Syntax[fn.name] = fn;
});
