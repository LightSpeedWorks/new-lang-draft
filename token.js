'use strict';

var util = require('util');

//######################################################################
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
util.inherits(OpeToken, Token);
function OpeToken(string) {
  Token.call(this, 'ope', string);
}

//######################################################################
util.inherits(SymToken, Token);
function SymToken(string) {
  Token.call(this, 'sym', string);
}

//######################################################################
util.inherits(SepToken, Token);
function SepToken(string) {
  Token.call(this, 'sep', string);
}

//######################################################################
util.inherits(NumToken, Token);
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
util.inherits(EtcToken, Token);
function EtcToken(string) {
  Token.call(this, 'etc', string);
}

exports = module.exports = Token;
exports.Token = Token;
exports.OpeToken = OpeToken;
exports.SymToken = SymToken;
exports.SepToken = SepToken;
exports.NumToken = NumToken;
exports.EtcToken = EtcToken;
