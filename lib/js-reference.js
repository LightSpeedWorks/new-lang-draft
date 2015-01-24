// js-reference.js リファレンス

// http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/8_Types.html

'use strict';

exports = module.exports = JsReference;

function JsReference(base, propName) {
  this.__baseObject = base;
  this.__propertyName = propName;
}

JsReference.prototype.getBase = function getBase() {
  return this.__baseObject;
}

JsReference.prototype.getPropertyName = function getPropertyName() {
  return this.__propertyName;
}

JsReference.prototype.getValue = function getValue() {
  // if this is not Reference then return V
  if (this.__baseObject === null)
    throw new ReferenceError();

  return this.__baseObject.__get(this.__propertyName);
}

JsReference.prototype.putValue = function putValue(value) {
  // if this is not Reference then throw ReferenceError
  var base = this.__baseObject;
  if (base === null)
    base = globalObject; // global object @@@

  base.__put(this.__propertyName, value);
  return;
}
