// conext.js コンテキスト

(function () {
  'use strict';

  var BaseClass = require('base-class-extend');

  //######################################################################
  var Context = BaseClass.extend({
    new: function Context(ctx) {
      if (!(this instanceof Context))
        return new Context(ctx);

      // this['class'] = this.constructor.name;

      // local variables context scope chain
      if (ctx) {
        this.contextChain = ctx;
        this.globalContext = ctx.globalContext;
      }
      else {
        this.contextChain = null;
        this.globalContext = this;
      }
      this.localVars = Object.create(null);
    },

    //######################################################################
    locateContext: function locateContext(symbol) {
      var ctx = this;
      while (ctx) {
        if (ctx.localVars[symbol] !== undefined || symbol in ctx.localVars) return ctx;
        ctx = this.contextChain;
      }
      return null;
    },

    //######################################################################
    getSymbolValue: function getSymbolValue(symbol) {
      var ctx = this.locateContext(symbol);
      if (ctx === null)
        throw new Error('Symbol not found: ' + symbol);
      return ctx.localVars[symbol];
    },

    //######################################################################
    setSymbolValue: function setSymbolValue(symbol, value) {
      var ctx = this.locateContext(symbol);
      if (ctx === null)
        throw new Error('Symbol not found: ' + symbol);
      ctx.localVars[symbol] = value;
      return ctx;
    },

    //######################################################################
    defineLocal: function defineLocal(symbol, value) {
      var ctx = this.locateContext(symbol);
      if (ctx === null) ctx = this;
      ctx.localVars[symbol] = value;
      return ctx;
    },

    //######################################################################
    defineGlobal: function defineGlobal(symbol, value) {
      var ctx = this.locateContext(symbol);
      if (ctx === null) ctx = this.globalContext;
      ctx.localVars[symbol] = value;
      return ctx;
    },

  });

  //----------------------------------------------------------------------
  exports = module.exports = Context;

})();
