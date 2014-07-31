// lexer.js Lexical Analyzer レキシカル解析

'use strict';

var Token = require('../lib/token');

//----------------------------------------------------------------------
exports = module.exports = Lexer;

//----------------------------------------------------------------------
// pattern. パターン
// white space. 空白
var RE_WHITE_SPACE = /\s/;

// symbol. シンボル
var RE_SYM =      /[a-z\$\_][a-z0-9\$\_]*/i;

// number. 数字
var RE_NUM =      /(0x[0-9a-f]+|0o[0-7]+|0b[01]+|(\d+(\.\d*)?|(\.\d+))(e[+\-]?\d+)?)/i;
var RE_NUM_PART = /(0x[0-9a-f]*|0o[0-7]*|0b[01]*|(\d+(\.\d*)?|(\.\d*))(e[+\-]?\d*)?)/i;

// separator. セパレータ/区切り ※1文字でトークンとなる
var RE_SEP = /[\(\){}\[\];]/;

// operator. オペレータ/演算子 ※組み合わせでトークンとなる
var RE_OPE = /!=?=?|~=?|[+\-*/<=>?:&|^,.]+/;
// <K<V>> に注意! できるのか?

var STR_SQUOT = "'";
var STR_DQUOT = '"';
var STR_BACKSLASH = '\\';

//######################################################################
function match(string, regexp) {
  var matched = string.match(regexp);
  if (!matched) return false;
  return matched[0] === string;
}

//######################################################################
// lexer: reader -> token
function Lexer(reader) {
  if (!(this instanceof Lexer))
    return new Lexer(reader);

  // this['class'] = this.constructor.name;
  this.reader = reader;
  this.unreadStack = [];
}

//######################################################################
// next for iteration or generator
Lexer.prototype.next = function next() {
  var token = this.read();
  if (token === null) return {done: true};
  return {done: false, value: token};
};

//######################################################################
// peek token.
Lexer.prototype.peek = function peek() {
  var token = this.read();
  if (token !== null) this.unread(token);
  return token;
};

//######################################################################
// skip white space.
Lexer.prototype.skipWhiteSpace = function skipWhiteSpace() {
  var ch = this.reader.read();
  if (ch === null) return null; // EOF

  // skip white spaces ホワイトスペース
  while (ch.match(RE_WHITE_SPACE)) {
    ch = this.reader.read();
    if (ch === null) return null; // EOF
  }

  return ch; // not white space character
}

//######################################################################
// read token.
Lexer.prototype.read = function read() {
  var comments = [];

  var token = this._read();
  if (token === null) return null;
  while (token instanceof Token.CmtToken) {
    comments.push(token);
    token = this._read();
  }
  if (token === null && comments.length === 0) return null;
  if (token === null) token = comments.shift();
  if (comments.length !== 0)
    token.comments = comments;
  return token;
}

//######################################################################
// read token.
Lexer.prototype._read = function _read() {
  if (this.unreadStack.length > 0)
    return this.unreadStack.pop();

  for (;;) {
    var ch = this.skipWhiteSpace();
    if (ch === null) return null; // EOF

    var pos = this.reader.getPos();
    var string = ch;

    // process comments コメントの処理
    if (ch !== '/') break;
    var ch2 = this.reader.read();
    var str2 = ch;
    if (ch2 === '/') {
      str2 += ch2;
      while ((ch2 = this.reader.read()) !== null) {
        str2 += ch2;
        if (ch2 === '\n') break;
      }
      return new Token.CmtToken(pos, str2);
    } else if (ch2 === '*') {
      str2 += ch2;
      while ((ch2 = this.reader.read()) !== null) {
        str2 += ch2;
        if (ch2 !== '*') continue;
        ch2 = this.reader.read();
        if (ch2 === null) return null;
        str2 += ch2;
        if (ch2 === '/') break;
      }
      return new Token.CmtToken(pos, str2);
    } else {
      this.reader.unread(ch2);
      break;
    }
  }

  var prevString = '';
  var ahead = '';

  if (match(ch, RE_SEP)) {
    // separator セパレータ、区切り
    return new Token.SepToken(pos, ch);
  } else if (match(ch, RE_SYM)) {
    // symbol, id etc シンボル、IDなど
    while (match(string, RE_SYM)) {
      prevString = string;
      ch = this.reader.read();
      if (ch === null) break; // EOF
      string += ch;
    }
    this.reader.unread(ch);
    return new Token.SymToken(pos, prevString);
  } else if (match(ch, RE_NUM_PART)) {
    // numbers and dot 数字とドット
    while (match(string, RE_NUM_PART)) {
      if (match(string, RE_NUM)) {
        ahead = '';
        prevString = string;
      }
      ch = this.reader.read();
      if (ch === null) break; // EOF
      string += ch;
      ahead += ch;
    }
    this.reader.unread(ahead);

    if (prevString === '') {
      // dot operator ドットだけの場合はオペレータとして解析しなおし
      string = ch = '.';
      while (match(string, RE_OPE)) {
        prevString = string;
        ch = this.reader.read();
        if (ch === null) break; // EOF
        string += ch;
      }
      this.reader.unread(ch);
      return new Token.OpeToken(pos, prevString);
    }

    if (prevString.slice(-1) === '.' && (ch === '.' || match(ch, RE_SYM))) {
      this.reader.unread('.'); // becomes dot op
      return new Token.NumToken(pos, prevString.slice(0, -1));
    }

    return new Token.NumToken(pos, prevString);
  } else if (match(ch, RE_OPE)) {
    // オペレータ
    while (match(string, RE_OPE)) {
      prevString = string;
      ch = this.reader.read();
      if (ch === null) break; // EOF
      string += ch;
    }
    this.reader.unread(ch);
    return new Token.OpeToken(pos, prevString);
  } else if (ch === STR_SQUOT || ch === STR_DQUOT) {
    // string 文字列
    var end = ch;
    ch = this.reader.read();
    if (ch === null) return null; // EOF
    string += ch;
    while (ch !== end) {
      ch = this.reader.read();
      if (ch === null) return null; // EOF
      string += ch;
      if (ch === STR_BACKSLASH) {
        ch = this.reader.read();
        if (ch === null) return null; // EOF
        string += ch;
        ch = '';
      }
    }
    return new Token.StrToken(pos, string);
  } else {
    // それ以外は何でしょうか?
    return new Token.EtcToken(pos, ch);
  }

};

//######################################################################
// unread token or token of array.
Lexer.prototype.unread = function unread(token) {
  // token が null の場合、何もしない
  if (token === null) return;

  // 1つの token の場合
  if (token instanceof Token)
    return this.unreadStack.push(token);

  // 配列以外の場合
  if (!(token instanceof Array))
    throw new TypeError('Token type error: ' + typeof token + ' ' + token.constructor.name);

  // 配列の場合 (後ろから積む、前から取り出せる様に)
  for (var i = token.length - 1; i >= 0; --i) {
    if (!(token[i] instanceof Token))
      throw new TypeError('Token type error: ' + typeof token[i] + ' ' + token[i].constructor.name);

    this.unreadStack.push(token[i]);
  }
};
