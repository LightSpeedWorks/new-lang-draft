'use strict';

var fs = require('fs');
var path = require('path');

var files = fs.readdirSync('.');

files.forEach(function (file) {
  if (file.slice(-3) === '.js')
    require(path.resolve(file));
  else
    console.log('?? ' + file);
});
