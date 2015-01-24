// js-object.js オブジェクト

'use strict';

exports = module.exports = JsObject;

function JsObject() {
  this.__readOnly = false;
  this.__dontEnum = false;
  this.__dontDelete = false;
  this.__prototype = null;
  this.__class = null;
  this.__value = null;
  this.__properties = Object.create(null);
  this.__scope = null;
}

JsObject.prototype.__get == function __get(propName) {
  if (this.__properties[propName] || propName in this.__properties)
    return this.__properties[propName].__value;

  if (this.__prototype === null)
    return undefined;

  return this.__prototype.__get(propName);
}

JsObject.prototype.__put == function __put(propName, value) {
  if (! this.__canPut(propName))
    return;

  if (this.__properties[propName]) {
    this.__properties[propName].__value = value;
    return;
  }

  (this.__properties[propName] = new JsObject()).__value = value;
}

JsObject.prototype.__canPut == function __canPut(propName) {
  if (this.__properties[propName])
    return ! this.__properties[propName].__readOnly;

  if (this.__prototype === null)
    return true;

  return this.__prototype.__canPut(propName);
}

JsObject.prototype.__hasProperty == function __hasProperty(propName) {
  if (this.__properties[propName])
    return true;

  if (this.__prototype === null)
    return false;

  return this.__prototype.__hasProperty(propName);
}

JsObject.prototype.__delete == function __delete(propName) {
  if (! this.__properties[propName])
    return true;

  if (this.__properties[propName].__dontDelete)
    return false;

  delete this.__properties[propName];
  return true;
}

JsObject.prototype.__defaultValue == function __defaultValue(hint) {
  if (hint === undefined) {
    hint = 'Number';
    if (this.__class === 'Date')
      hint = 'String';
  }

  if (hint === 'String') var methods = ['toString', 'valueOf'];
  else if (hint === 'Number') var methods = ['valueOf', 'toString'];
  else throw new TypeError();

  var fn = this.__get(methods[0]);
  if (fn) {
    var result = fn.__call(this);
    if (isPrimitive(result))
      return result;
  }

  var fn = this.__get(methods[1]);
  if (fn) {
    var result = fn.__call(this);
    if (isPrimitive(result))
      return result;
  }
  throw new TypeError();
}

JsObject.prototype.__construct == function __construct(args) {
}

JsObject.prototype.__call == function __call(args) {
}

JsObject.prototype.__hasInstance == function __hasInstance(value) {
}

JsObject.prototype.__match == function __match(string, index) {
}

function isPrimitive(prim) {
  return prim === null ||
         prim === undefined ||
         prim === true ||
         prim === false ||
         typeof prim === 'string' ||
         typeof prim === 'number';
}
