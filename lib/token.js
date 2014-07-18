// token.js Lexical Token トークン

'use strict';

var util = require('util');

var classes = [];

//######################################################################
function inherits(ctor, superCtor) {
  util.inherits(ctor, superCtor);
  classes.push(ctor);
}

//######################################################################
classes.push(Token);
function Token(type, string) {
  if (!(this instanceof Token))
    return new Token(type, string);

  // this['class'] = this.constructor.name;
  this.type = type;
  this.string = string;

  // 共通設定
}

//######################################################################
// toString 文字列に変換する
Token.prototype.toString = function toString() {
  return this.string;
}

//######################################################################
inherits(OpeToken, Token);
function OpeToken(string) {
  Token.call(this, 'ope', string);
}

//######################################################################
inherits(SymToken, Token);
function SymToken(string) {
  Token.call(this, 'sym', string);
}

//######################################################################
inherits(SepToken, Token);
function SepToken(string) {
  Token.call(this, 'sep', string);
}

//######################################################################
inherits(NumToken, Token);
function NumToken(string) {
  Token.call(this, 'num', string);
  var string2 = string.slice(0, 2);
  if (string2 === '0o' || string2 === '0O')
    this.value = parseInt(string.slice(2), 8);
  else if (string2 === '0b' || string2 === '0B')
    this.value = parseInt(string.slice(2), 2);
  else
    this.value = Number(string);
}

//######################################################################
inherits(StrToken, Token);
function StrToken(string) {
  Token.call(this, 'str', string);
  this.value = eval(string);
}

//######################################################################
inherits(EtcToken, Token);
function EtcToken(string) {
  Token.call(this, 'etc', string);
}

//----------------------------------------------------------------------
exports = module.exports = Token;
classes.forEach(function (fn) {
  exports[fn.name] = fn;
});
