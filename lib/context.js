'use strict';

//######################################################################
function Context(ctx) {
  if (!(this instanceof Context))
    return new Context(ctx);

  // this['class'] = this.constructor.name;

  // variable scope chain
  this.contextChain = ctx ? ctx : null;
  this.localVars = Object.create(null);
  this.globalContext = this.getGlobalContext();
}

//######################################################################
Context.prototype.getGlobalContext = function getGlobalContext() {
  var ctx = this;
  while (ctx.contextChain)
    ctx = this.contextChain;
  return ctx;
};

//######################################################################
Context.prototype.locateContext = function locateContext(symbol) {
  var ctx = this;
  while (ctx) {
    if (symbol in ctx.localVars) return ctx;
    ctx = this.contextChain;
  }
  return null;
};

//######################################################################
Context.prototype.getSymbolValue = function getSymbolValue(symbol) {
  var ctx = this.locateContext(symbol);
  if (ctx === null)
    throw new Error('Symbol not found: ' + symbol);
  return ctx.localVars[symbol];
};

//######################################################################
Context.prototype.setSymbolValue = function setSymbolValue(symbol, value) {
  var ctx = this.locateContext(symbol);
  if (ctx === null)
    throw new Error('Symbol not found: ' + symbol);
  ctx.localVars[symbol] = value;
  return ctx;
};

//######################################################################
Context.prototype.defineLocal = function defineLocal(symbol, value) {
  var ctx = this.locateContext(symbol);
  if (ctx === null) ctx = this;
  ctx.localVars[symbol] = value;
  return ctx;
};

//######################################################################
Context.prototype.defineGlobal = function defineGlobal(symbol, value) {
  var ctx = this.locateContext(symbol);
  if (ctx === null) ctx = this.globalContext;
  ctx.localVars[symbol] = value;
  return ctx;
};

//######################################################################

exports = module.exports = Context;
exports.Context = Context;
