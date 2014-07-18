'use strict';

var Token = require('../lib/token');
var OpeToken = Token.OpeToken;
var SymToken = Token.SymToken;
var SepToken = Token.SepToken;
var NumToken = Token.NumToken;
var StrToken = Token.StrToken;
var EtcToken = Token.EtcToken;

// パターン
var RE_WHITE_SPACE = /\s/;

var RE_SYM =      /[a-z\$\_][a-z0-9\$\_]*/i;
var RE_NUM =      /(0x[0-9a-f]+|0o[0-7]+|0b[01]+|(\d+(\.\d*)?|(\.\d+))(e[+\-]?\d+)?)/i;
var RE_NUM_PART = /(0x[0-9a-f]*|0o[0-7]*|0b[01]*|(\d+(\.\d*)?|(\.\d*))(e[+\-]?\d*)?)/i;

var RE_SEP = /[\(\){}\[\];]/;
var RE_OPE = /[+\-*/<=>?:!&|^~,.]+/;	// <K<V>> に注意! できるのか?

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
// read token.
Lexer.prototype.read = function read() {
  if (this.unreadStack.length > 0)
    return this.unreadStack.pop();

  var ch = this.reader.read();
  if (ch === null) return null; // EOF

  // ホワイトスペース
  while (ch.match(RE_WHITE_SPACE)) {
    ch = this.reader.read();
    if (ch === null) return null; // EOF
  }
  var pos = [this.reader.line, this.reader.column - 1]; //, this.reader.file];
  this.reader.unread(ch);

  var token = this._read();
  if (token === null) return token;
  token.pos = pos;
  return token;
}

//######################################################################
// read token.
Lexer.prototype._read = function _read() {
  if (this.unreadStack.length > 0)
    return this.unreadStack.pop();

  var ch = this.reader.read();
  if (ch === null) return null; // EOF

  // ホワイトスペース
  while (ch.match(RE_WHITE_SPACE)) {
    ch = this.reader.read();
    if (ch === null) return null; // EOF
  }
  var string = ch;
  var prevString = '';
  var ahead = '';

  if (match(ch, RE_SEP)) {
    // セパレータ、区切り
    return new SepToken(ch);
  } else if (match(ch, RE_SYM)) {
    // シンボル、IDなど
    while (match(string, RE_SYM)) {
      prevString = string;
      ch = this.reader.read();
      if (ch === null) break; // EOF
      string += ch;
    }
    this.reader.unread(ch);
    return new SymToken(prevString);
  } else if (match(ch, RE_NUM_PART)) {
    // 数字とドット
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
      // ドットだけの場合はオペレータとして解析しなおし
      string = ch = '.';
      while (match(string, RE_OPE)) {
        prevString = string;
        ch = this.reader.read();
        if (ch === null) break; // EOF
        string += ch;
      }
      this.reader.unread(ch);
      return new OpeToken(prevString);
    }

    if (prevString.slice(-1) === '.' && (ch === '.' || match(ch, RE_SYM))) {
      this.reader.unread('.'); // becomes dot op
      return new NumToken(prevString.slice(0, -1));
    }

    return new NumToken(prevString);
  } else if (match(ch, RE_OPE)) {
    // オペレータ
    while (match(string, RE_OPE)) {
      prevString = string;
      ch = this.reader.read();
      if (ch === null) break; // EOF
      string += ch;
    }
    this.reader.unread(ch);
    return new OpeToken(prevString);
  } else if (ch === STR_SQUOT || ch === STR_DQUOT) {
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
    return new StrToken(string);
  } else {
    // それ以外は何でしょうか?
    return new EtcToken(ch);
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

exports = module.exports = Lexer;
