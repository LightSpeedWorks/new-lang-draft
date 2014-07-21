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
function Token(type, pos, string) {
  if (!(this instanceof Token))
    return new Token(type, pos, string);

  // this['class'] = this.constructor.name;
  this.type = type;
  this.pos = pos;
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
function OpeToken(pos, string) {
  Token.call(this, 'ope', pos, string);
}

//######################################################################
inherits(SymToken, Token);
function SymToken(pos, string) {
  Token.call(this, 'sym', pos, string);
}

//######################################################################
inherits(SepToken, Token);
function SepToken(pos, string) {
  Token.call(this, 'sep', pos, string);
}

//######################################################################
inherits(NumToken, Token);
function NumToken(pos, string) {
  Token.call(this, 'num', pos, string);
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
function StrToken(pos, string) {
  Token.call(this, 'str', pos, string);
  this.value = eval(string);
}

//######################################################################
inherits(EtcToken, Token);
function EtcToken(pos, string) {
  Token.call(this, 'etc', pos, string);
}

//######################################################################
inherits(CmtToken, Token);
function CmtToken(pos, string) {
  Token.call(this, 'cmt', pos, string);
}

//----------------------------------------------------------------------
exports = module.exports = Token;
classes.forEach(function (fn) {
  exports[fn.name] = fn;
});
