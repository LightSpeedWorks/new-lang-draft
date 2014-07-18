// string-reader.js リーダー

'use strict';

//######################################################################
// StringReader
function StringReader(string, file) {
  if (!(this instanceof StringReader))
    return new StringReader(string);

  // this['class'] = this.constructor.name;
  this.contents = string;
  this.contentsLength = this.contents.length;
  this.contentsIndex = 0;
  this.unreadStack = [];
  this.line = 1;
  this.column = 1;
  this.file = file;
}

//######################################################################
// next for iteration or generator
StringReader.prototype.next = function next() {
  var ch = this.read();
  if (ch === null) return {done: true};
  return {done: false, value: ch};
}

//######################################################################
// read character
StringReader.prototype.read = function read() {
  if (this.unreadStack.length > 0)
    return this.unreadStack.pop();

  if (this.contentsIndex >= this.contentsLength)
    return null; // EOF

  var ch = this.contents[this.contentsIndex++];

  if (ch === '\n') this.line++, this.column = 1;
  else this.column++;

  return ch;
};

//######################################################################
// unread string
StringReader.prototype.unread = function unread(string) {
  if (string === null) return;

  if (typeof string !== 'string')
    throw new TypeError('String type error: ' + typeof string + ' ' + string.constructor.name);

  for (var i = string.length - 1; i >= 0; --i)
    this.unreadStack.push(string[i]);
};

//----------------------------------------------------------------------
exports = module.exports = StringReader;
