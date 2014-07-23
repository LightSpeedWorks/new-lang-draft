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
  return Object.create(null);
}

//######################################################################
Context.prototype.loc(symbol) {
  var frames = this.frames;
  for (var i = frames.length - 1; i >= 0; --i) {
    if (symbol in frames[i]) return frames[i];
  }
  return null;
}

//######################################################################
Context.prototype.get(symbol) {
  var frame = loc(symbol);
  if (frame === null) return undefined;
  return frame[symbol];
}

//######################################################################
Context.prototype.set(symbol, value) {
  var frame = loc(symbol);
  if (frame === null) return undefined;
  frame[symbol] = value;
  return frame;
}

//######################################################################

exports = module.exports = Context;
