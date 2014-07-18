'use strict';

var util = require('util');

var trees = [];

// 実行して値を返す run eval exec calc
// 実行直前の場所を返す locate
//   symbol -> SymToken
//   expr.symbol -> AccessDot
//   expr[expr]  -> AccessGetSet
// コンパイル・計算できる所(数値や定数が引数の純粋関数の場合)は実行する compile

//######################################################################
trees.push(Tree);
function Tree() {
}

//######################################################################
function inherits(ctor, superCtor) {
  util.inherits(ctor, superCtor);
  trees.push(ctor);
}

//######################################################################
inherits(BlockTree, Tree);
function BlockTree(trees) {
  Tree.call(this);
  this.trees = trees;
}

//######################################################################
inherits(CommaTree, Tree);
function CommaTree(trees) {
  Tree.call(this);
  this.trees = trees;
}

//######################################################################
inherits(PrefixTree, Tree);
function PrefixTree(op, tree) {
  Tree.call(this);
  this.op = op;
  this.tree = tree;
}

//======================================================================
PrefixTree.ctors = {
  '++': PreIncTree,
  '--': PreDecTree,
}
//----------------------------------------------------------------------
PrefixTree.create = function create(op, tree) {
  var s = op + '';
  var ctor = PrefixTree.ctors[s];
  if (ctor) return new ctor(op, tree);
  throw TypeError('Op: ' + op);
};

//----------------------------------------------------------------------
inherits(PreIncTree, PrefixTree);
function PreIncTree(op, tree) {
  PrefixTree.call(this, op, tree);
}
//----------------------------------------------------------------------
inherits(PreDecTree, PrefixTree);
function PreDecTree(op, tree) {
  PrefixTree.call(this, op, tree);
}

//######################################################################
inherits(PostfixTree, Tree);
function PostfixTree(op, tree) {
  Tree.call(this);
  this.op = op;
  this.tree = tree;
}

//======================================================================
PostfixTree.ctors = {
  '++': PostIncTree,
  '--': PostDecTree,
}
//----------------------------------------------------------------------
PostfixTree.create = function create(op, tree) {
  var s = op + '';
  var ctor = PostfixTree.ctors[s];
  if (ctor) return new ctor(op, tree);
  throw TypeError('Op: ' + op);
};

//----------------------------------------------------------------------
inherits(PostIncTree, PostfixTree);
function PostIncTree(op, tree) {
  PostfixTree.call(this, op, tree);
}
//----------------------------------------------------------------------
inherits(PostDecTree, PostfixTree);
function PostDecTree(op, tree) {
  PostfixTree.call(this, op, tree);
}

//######################################################################
inherits(BinTree, Tree);
function BinTree(op, tree1, tree2) {
  Tree.call(this);
  this.op = op;
  this.tree1 = tree1;
  this.tree2 = tree2;
}

//======================================================================
BinTree.ctors = {
  '+':    AddTree,
  '-':    SubTree,
  '*':    MulTree,
  '/':    DivTree,
  '%':    ModTree,
  '=':    AssignTree,
  '+=':   AssignAddTree,
  '-=':   AssignSubTree,
  '*=':   AssignMulTree,
  '/=':   AssignDivTree,
  '%=':   AssignModTree,
  '<<=':  AssignLogShiftLeftTree,
  '>>=':  AssignArithShiftRightTree,
  '>>>=': AssignLogShiftRightTree,
  '&=':   AssignBitAndTree,
  '^=':   AssignBitXorTree,
  '|=':   AssignBitOrTree,
  '||':   LogOrTree,
  '&&':   LogAndTree,
  '|':    BitOrTree,
  '^':    BitXorTree,
  '&':    BitOrTree,
  '?:':   Cond2Tree,
  '==':   EqRelTree,
  '===':  StrictEqRelTree,
  '!=':   NotEqRelTree,
  '!==':  StrictNotEqRelTree,
};
//----------------------------------------------------------------------
BinTree.create = function create(op, tree1, tree2) {
  var s = op + '';
  var ctor = BinTree.ctors[s];
  if (ctor) return new ctor(op, tree1, tree2);
  throw TypeError('Op: ' + op);
};

//----------------------------------------------------------------------
inherits(AddTree, BinTree);
function AddTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(SubTree, BinTree);
function SubTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(MulTree, BinTree);
function MulTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(DivTree, BinTree);
function DivTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(ModTree, BinTree);
function ModTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignTree, BinTree);
function AssignTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignAddTree, BinTree);
function AssignAddTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignSubTree, BinTree);
function AssignSubTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignMulTree, BinTree);
function AssignMulTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignDivTree, BinTree);
function AssignDivTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignModTree, BinTree);
function AssignModTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignLogShiftLeftTree, BinTree);
function AssignLogShiftLeftTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignArithShiftRightTree, BinTree);
function AssignArithShiftRightTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignLogShiftRightTree, BinTree);
function AssignLogShiftRightTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignBitAndTree, BinTree);
function AssignBitAndTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignBitXorTree, BinTree);
function AssignBitXorTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(AssignBitOrTree, BinTree);
function AssignBitOrTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(LogOrTree, BinTree);
function LogOrTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(LogAndTree, BinTree);
function LogAndTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(BitAndTree, BinTree);
function BitAndTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(BitXorTree, BinTree);
function BitXorTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(BitOrTree, BinTree);
function BitOrTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(Cond2Tree, BinTree);
function Cond2Tree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(EqRelTree, BinTree);
function EqRelTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(StrictEqRelTree, BinTree);
function StrictEqRelTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(NotEqRelTree, BinTree);
function NotEqRelTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
inherits(StrictNotEqRelTree, BinTree);
function StrictNotEqRelTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
/*
//----------------------------------------------------------------------
inherits(EqRelTree, BinTree);
function EqRelTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
*/

//######################################################################
inherits(Cond3Tree, Tree);
function Cond3Tree(op1, op2, tree1, tree2, tree3) {
  Tree.call(this);
  this.op1 = op1;
  this.op2 = op2;
  this.tree1 = tree1;
  this.tree2 = tree2;
  this.tree3 = tree3;
}


//----------------------------------------------------------------------
exports = module.exports = Tree;
trees.forEach(function (fn) {
  Tree[fn.name] = fn;
});
