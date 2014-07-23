'use strict';

//######################################################################
function Context(globalFrame) {
  if (!(this instanceof Context))
    return new Context(globalFrame);

  // this['class'] = this.constructor.name;

  // variable scope chain
  this.frames = [this.globalFrame = globalFrame];
}

//######################################################################
function Frame() {
  this.localVariables = Object.create(null);
}

//######################################################################
Context.prototype.top = function top() {
  return this.frames[this.frames.length - 1];
};

//######################################################################
Context.prototype.loc = function loc(symbol) {
  var frames = this.frames;
  for (var i = frames.length - 1; i >= 0; --i) {
    if (symbol in frames[i].localVariables) return frames[i];
  }
  return null;
};

//######################################################################
Context.prototype.get = function get(symbol) {
  var frame = this.loc(symbol);
  if (frame === null)
    throw new Error('Symbol not found: ' + symbol);
  return frame.localVariables[symbol];
};

//######################################################################
Context.prototype.set = function set(symbol, value) {
  var frame = this.loc(symbol);
  if (frame === null)
    throw new Error('Symbol not found: ' + symbol);
  frame.localVariables[symbol] = value;
  return frame;
};

//######################################################################
Context.prototype.defineLocal = function defineLocal(symbol, value) {
  var frame = this.loc(symbol);
  if (frame === null) frame = this.top();
  frame.localVariables[symbol] = value;
  return frame;
};

//######################################################################
Context.prototype.defineGlobal = function defineGlobal(symbol, value) {
  var frame = this.loc(symbol);
  if (frame === null) frame = this.frames[0];
  frame.localVariables[symbol] = value;
  return frame;
};

//######################################################################

exports = module.exports = Context;
exports.Context = Context;
exports.Frame = Frame;
