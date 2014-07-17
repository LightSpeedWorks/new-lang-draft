'use strict';

//######################################################################
function Tmpl(member) {
  if (!(this instanceof Tmpl))
    return new Tmpl(member);

  // this['class'] = this.constructor.name;
  this.member = member;
}

exports = module.exports = Tmpl;
