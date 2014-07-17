'use strict';

var util = require('util');

//######################################################################
function Tree() {
  if (!(this instanceof Tree))
    return new Tree();

  // this['class'] = this.constructor.name;
}

//######################################################################
// util.inherits(MyTree, Tree);
function MyTree() {
}

exports = module.exports = Tree;
