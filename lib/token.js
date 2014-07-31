// token.js Lexical Token トークン

'use strict';

var util = require('util');

//----------------------------------------------------------------------
exports = module.exports = Token;

//######################################################################
// inherits - 継承
function inherits(ctor, superCtor) {
  util.inherits(ctor, superCtor);
  exports[ctor.name] = ctor;
}

//######################################################################
// Token - トークン
function Token(type, pos, str) {
  if (!(this instanceof Token))
    return new Token(type, pos, str);

  // this['class'] = this.constructor.name;
  this.tok = type;
  this.pos = pos;
  this.str = str;

  // 共通設定
}

//----------------------------------------------------------------------
// toString - 文字列に変換する
Token.prototype.toString = function toString() {
  return this.str;
}
//----------------------------------------------------------------------
// getValue - 値を取得する
Token.prototype.getValue = function getValue() {
  return this.str;
}
//----------------------------------------------------------------------
// getPos - 位置情報を取得する
Token.prototype.getPos = function getPos() {
  return this.pos;
}

//######################################################################
// Operator Token - オペレータ・トークン
inherits(OpeToken, Token);
function OpeToken(pos, str) {
  Token.call(this, 'ope', pos, str);
}

//######################################################################
// Symbol Token - シンボル・トークン
inherits(SymToken, Token);
function SymToken(pos, str) {
  Token.call(this, 'sym', pos, str);
}

//######################################################################
// Separator Token - セパレータ、区切りトークン
inherits(SepToken, Token);
function SepToken(pos, str) {
  Token.call(this, 'sep', pos, str);
}

//######################################################################
// Number Token - 数値トークン
inherits(NumToken, Token);
function NumToken(pos, str) {
  Token.call(this, 'num', pos, str);
  var string2 = str.slice(0, 2);
  if (string2 === '0o' || string2 === '0O')
    this.val = parseInt(str.slice(2), 8);
  else if (string2 === '0b' || string2 === '0B')
    this.val = parseInt(str.slice(2), 2);
  else
    this.val = Number(str);
}
//----------------------------------------------------------------------
// getValue - 値を取得する
NumToken.prototype.getValue = function getValue() {
  return this.val;
}

//######################################################################
// String Token - 文字列トークン
inherits(StrToken, Token);
function StrToken(pos, str) {
  Token.call(this, 'str', pos, str);
  this.val = eval(str);
  // " -> eval, JSON.parse
  // ' -> eval
}
//----------------------------------------------------------------------
// getValue - 値を取得する
StrToken.prototype.getValue = function getValue() {
  return this.val;
}

//######################################################################
// Etc Token - その他のトークン
inherits(EtcToken, Token);
function EtcToken(pos, str) {
  Token.call(this, 'etc', pos, str);
}

//######################################################################
// Comment Token - コメント・トークン
inherits(CmtToken, Token);
function CmtToken(pos, str) {
  Token.call(this, 'cmt', pos, str);
}
