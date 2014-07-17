'use strict';

var util = require('util');

var trees = [];

//######################################################################
trees.push(Tree);
function Tree() {
}

//######################################################################
util.inherits(BlockTree, Tree);
trees.push(BlockTree);
function BlockTree(trees) {
  Tree.call(this);
  this.trees = trees;
}

//######################################################################
util.inherits(CommaTree, Tree);
trees.push(CommaTree);
function CommaTree(trees) {
  Tree.call(this);
  this.trees = trees;
}

//######################################################################
util.inherits(PrefixTree, Tree);
trees.push(PrefixTree);
function PrefixTree(op, tree) {
  Tree.call(this);
  this.op = op;
  this.tree = tree;
}

//======================================================================
PrefixTree.create = function create(op, expr) {
  var s = op + '';
  switch (s) {
    case '++': return new PreIncTree(op, tree);
    case '--': return new PreDecTree(op, tree);
    default: throw TypeError('Op: ' + op);
  }
};

//----------------------------------------------------------------------
util.inherits(PreIncTree, PrefixTree);
trees.push(PreIncTree);
function PreIncTree(op, tree) {
  PrefixTree.call(this, op, tree);
}
//----------------------------------------------------------------------
util.inherits(PreDeccTree, PrefixTree);
trees.push(PreDecTree);
function PreDecTree(op, tree) {
  PrefixTree.call(this, op, tree);
}

//######################################################################
util.inherits(PostfixTree, Tree);
trees.push(PostfixTree);
function PostfixTree(op, tree) {
  Tree.call(this);
  this.op = op;
  this.tree = tree;
}

//======================================================================
PostfixTree.create = function create(op, expr) {
  var s = op + '';
  switch (s) {
    case '++': return new PostIncTree(op, tree);
    case '--': return new PostDecTree(op, tree);
    default: throw TypeError('Op: ' + op);
  }
};

//----------------------------------------------------------------------
util.inherits(PostIncTree, PostfixTree);
trees.push(PostIncTree);
function PostIncTree(op, tree) {
  PostfixTree.call(this, op, tree);
}
//----------------------------------------------------------------------
util.inherits(PostDecTree, PostfixTree);
trees.push(PostDecTree);
function PostDecTree(op, tree) {
  PostfixTree.call(this, op, tree);
}

//######################################################################
util.inherits(BinTree, Tree);
trees.push(BinTree);
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
  '/':    ModTree,
  '=':    AssignTree,
  '+=':   AssignAddTree,
  '-=':   AssignSubTree,
  '*=':   AssignMulTree,
  '/=':   AssignDivTree,
  '%=':   AssignModTree,
  '<<=':  AssignLogShiftLeftTree,
  '>>=':  AssignArithShiftRightTree,
  '>>>=': AssignLogShiftRightTree,
  '&=':   AssignAndTree,
  '^=':   AssignXorTree,
  '|=':   AssignOrTree
};
BinTree.create = function create(op, tree1, tree2) {
  var s = op + '';
  var ctor = BinTree.ctors[s];
  if (ctor) return new ctor(op, tree1, tree2);
  throw TypeError('Op: ' + op);
};

//----------------------------------------------------------------------
util.inherits(AddTree, BinTree);
trees.push(AddTree);
function AddTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
util.inherits(SubTree, BinTree);
trees.push(SubTree);
function SubTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
util.inherits(MulTree, BinTree);
trees.push(MulTree);
function MulTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
util.inherits(DivTree, BinTree);
trees.push(DivTree);
function DivTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}
//----------------------------------------------------------------------
util.inherits(AssignTree, BinTree);
trees.push(AssignTree);
function AssignTree(op, tree1, tree2) {
  BinTree.call(this, op, tree1, tree2);
}

//----------------------------------------------------------------------
exports = module.exports = Tree;
trees.forEach(function (fn) {
  Tree[fn.name] = fn;
});
