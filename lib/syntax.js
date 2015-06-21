// syntax.js AST Abstract Syntax Tree

this.Syntax = function () {
  'use strict';

  var util = require('util');

  var extend = require('base-class-extend').extend;
  var $extend = extend;

  // 実行して値を返す run
  // 実行直前の場所を返す locate
  //   symbol -> SymToken
  //   expr.symbol -> AccessDot
  //   expr[expr]  -> AccessGetSet
  // コンパイル・計算できる所(数値や定数が引数の純粋関数の場合)は実行する compile

  //######################################################################
  var Syntax = extend('Syntax', {
    constructor: function Syntax(prio) {
      this.syn = this.constructor.name.slice(0, -6);
      this.prio = prio;
    }
  }, {
    extend: function extend() {
      var ctor = $extend.apply(this, arguments);
      console.log(ctor.name, this.name);
      Syntax[ctor.name] = this;
      return ctor;
    }
  });

  //----------------------------------------------------------------------
  if (typeof module === 'object' && module && module.exports)
    module.exports = Syntax;

  //######################################################################
  function dic(obj) {
    var o = Object.create(null);
    for (var i in obj) o[i] = obj[i];
    return o;
  }

  //######################################################################
  // statement 文
  var StatementSyntax = Syntax.StatementSyntax =
      Syntax.extend('StatementSyntax');

  //######################################################################
  // expression 式
  var ExpressionSyntax = Syntax.ExpressionSyntax =
      Syntax.extend('ExpressionSyntax');

  //######################################################################
  // ; empty statement 空文
  var EmptySyntax = Syntax.EmptySyntax =
      StatementSyntax.extend('EmptySyntax', {
    constructor: function EmptySyntax(op) {
      StatementSyntax.call(this, 200);
      this.op = op;
    },
    run: function run(ctx) { return undefined; },
    toString: function toString() { return this.op.toString() + ' '; }
  });

  //######################################################################
  // {statement; ...} block statement ブロック文
  var BlockSyntax = Syntax.BlockSyntax =
      StatementSyntax.extend('BlockSyntax', {
    constructor: function BlockSyntax(stmts) {
      StatementSyntax.call(this, 200);
      this.stmts = stmts;
    },
    run: function run(ctx) {
      var val;
      for (var i = 0, n = this.stmts.length; i < n; ++i)
        val = this.stmts[i].run(ctx);
      return val;
    },
    toString: function toString() {
      var s = '{';
      for (var i = 0, n = this.stmts.length; i < n; ++i) {
        var stmt = this.stmts[i];
        if (stmt instanceof StatementSyntax)
          s += stmt + '';
        else if (stmt instanceof ExpressionSyntax)
          s += stmt + '; ';
        else
          s += '/*eh?{*/' + stmt + '/*}?*/ ';
      }
      return s + '}';
    }
  });

  //######################################################################
  // 式; expression statement 式の文
  var ExpressionStatementSyntax = Syntax.ExpressionStatementSyntax =
      StatementSyntax.extend('ExpressionStatementSyntax', {
    constructor: function ExpressionStatementSyntax(expr) {
      StatementSyntax.call(this, 200);
      this.expr = expr;
    },
    run: function run(ctx) { return this.expr.run(ctx); },
    toString: function toString() {
      return this.expr.toString() + '; '; }
  });

  //######################################################################
  var IfElseSyntax = Syntax.IfElseSyntax =
      StatementSyntax.extend('IfElseSyntax', {
    constructor: function IfElseSyntax(opExprStmts) {
      StatementSyntax.call(this, 200);
      this.opExprStmts = opExprStmts;
      // {op: string, expr: ExpressionSyntax, stmt: StatementSyntax}
    },
    // if (expr) stmt
    // [elsif (expr) stmt]
    // [elseif (expr) stmt]
    // [else if (expr) stmt]
    // ...
    // [else stmt]
    run: function run(ctx) {
      for (var i in this.opExprStmts) {
        var elem = this.opExprStmts[i];
        if (elem.op === 'else')
          return elem.stmt.run(ctx);
        else if (elem.expr.run(ctx))
          return elem.stmt.run(ctx);
      }
      return undefined;
    },
    toString: function toString() {
      var s = '';
      for (var i in this.opExprStmts) {
        var elem = this.opExprStmts[i];
        if (elem.op === 'if')
          s += elem.op + ' (' + elem.expr + ') ' + elem.stmt;
        else if (elem.op === 'else')
          s += elem.op + ' ' + elem.stmt;
        else
          s += elem.op + ' (' + elem.expr + ') ' + elem.stmt;
      }
      return s;
    }
  });

  //######################################################################
  // expression, ... comma expression コンマ式
  var CommaSyntax = Syntax.CommaSyntax =
      ExpressionSyntax.extend('CommaSyntax', {
    constructor: function CommaSyntax(exprs) {
      ExpressionSyntax.call(this, 180);
      this.exprs = exprs;
    },
    run: function run(ctx) {
      var val;
      for (var i = 0, n = this.exprs.length; i < n; ++i)
        val = this.exprs[i].run(ctx);
      return val;
    },
    toString: function toString() {
      var s = '';
      for (var i = 0, n = this.exprs.length; i < n; ++i) {
        var expr = this.exprs[i];
        if (expr.prio >= this.prio) s += '(';
        s += expr.toString();
        if (expr.prio >= this.prio) s += ')';
        if (i != n - 1) s += ', ';
      }
      return s;
    }
  });

  //######################################################################
  // (式)
  var ParenSyntax = Syntax.ParenSyntax =
      ExpressionSyntax.extend('ParenSyntax', {
    constructor: function ParenSyntax(expr) {
      ExpressionSyntax.call(this, 0);
      this.expr = expr;
    },
    run: function run(ctx) {
      return this.expr.run(ctx); },
    toString: function toString() {
      return '(' + this.expr.toString() + ')'; }
  });

  //######################################################################
  // var symbol = 式 , ...
  var VarSyntax = Syntax.VarSyntax =
      StatementSyntax.extend('VarSyntax', {
    constructor: function VarSyntax(symExprs) {
      StatementSyntax.call(this, 190);
      this.symExprs = symExprs;
    },
    run: function run(ctx) {
      var symExprs = this.symExprs
      for (var i = 0, n = symExprs.length; i < n; ++i) {
        var symExpr = symExprs[i];
        if (symExpr.length === 2)
          ctx.defineLocal(symExpr[0].toString(), symExpr[1].run(ctx));
        else
          ctx.defineLocal(symExpr[0].toString(), undefined);
      }
      return undefined;
    },
    toString: function toString() {
      var s = 'var ';
      var symExprs = this.symExprs
      for (var i = 0, n = symExprs.length; i < n; ++i) {
        var symExpr = symExprs[i];
        if (symExpr.length === 2)
          s += symExpr[0].toString() + ' = ' + symExpr[1].toString();
        else if (symExpr.length === 1)
          s += symExpr[0].toString();
        else
          throw new Error('BUG: length wrong! may be Parser bug!');
        if (i != n - 1) s += ',';
      }
      return s + '; ';
    }
  });

  //######################################################################
  var PrefixSyntax = Syntax.PrefixSyntax =
      ExpressionSyntax.extend('PrefixSyntax', {
    constructor: function PrefixSyntax(prio, op, syntax) {
      ExpressionSyntax.call(this, prio);
      this.op = op;
      this.syntax = syntax;
    },
    toString: function toString() {
      var op = this.op.toString();
      var z = op.slice(-1);
      if (z.match(/[a-z]/i))
        op += ' ';

      var expr = this.syntax.toString();
      if (this.prio < this.syntax.prio) expr = '(' + expr + ')';
      return op + expr;
    }
  }, {
    createx: function createx(op, syntax) {
      var s = op + '';
      var ctor = this.ctors[s];
      if (ctor) return new ctor(op, syntax);
      throw TypeError('PrefixSyntax Op: ' + op);
    }
  });

  //----------------------------------------------------------------------
  var PreIncSyntax = Syntax.PreIncSyntax =
      PrefixSyntax.extend('PreIncSyntax', {
    constructor: function PreIncSyntax(op, syntax) {
      PrefixSyntax.call(this, 30, op, syntax); },
    run: function run(ctx) {
      var loc = this.syntax.locate(ctx);
      var val = loc.getValue() + 1;
      loc.setValue(val);
      return val;
    }
  });

  //----------------------------------------------------------------------
  var PreDecSyntax = Syntax.PreDecSyntax =
      PrefixSyntax.extend('PreDecSyntax', {
    constructor: function PreDecSyntax(op, syntax) {
      PrefixSyntax.call(this, 30, op, syntax); },
    run: function run(ctx) {
      var loc = this.syntax.locate(ctx);
      var val = loc.getValue() - 1;
      loc.setValue(val);
      return val;
    }
  });

  //----------------------------------------------------------------------
  // +
  var PlusSyntax = Syntax.PlusSyntax =
      PrefixSyntax.extend('PlusSyntax', {
    constructor: function PlusSyntax(op, syntax) {
      PrefixSyntax.call(this, 40, op, syntax); },
    run: function run(ctx) {
      return this.syntax.run(ctx); }
  });

  //----------------------------------------------------------------------
  // -
  var MinusSyntax = Syntax.MinusSyntax =
      PrefixSyntax.extend('MinusSyntax', {
    constructor: function MinusSyntax(op, syntax) {
      PrefixSyntax.call(this, 40, op, syntax); },
    run: function run(ctx) {
      return - this.syntax.run(ctx); }
  });

  //----------------------------------------------------------------------
  // !
  var LogNotSyntax = Syntax.LogNotSyntax =
      PrefixSyntax.extend('LogNotSyntax', {
    constructor: function LogNotSyntax(op, syntax) {
      PrefixSyntax.call(this, 40, op, syntax); },
    run: function run(ctx) {
      return ! this.syntax.run(ctx); }
  });

  //----------------------------------------------------------------------
  // ~
  var BitNotSyntax = Syntax.BitNotSyntax =
      PrefixSyntax.extend('BitNotSyntax', {
    constructor: function BitNotSyntax(op, syntax) {
      PrefixSyntax.call(this, 40, op, syntax); },
    run: function run(ctx) {
      return ~ this.syntax.run(ctx); }
  });

  //----------------------------------------------------------------------
  // new
  var NewSyntax = Syntax.NewSyntax =
      PrefixSyntax.extend('NewSyntax', {
    constructor: function NewSyntax(op, syntax) {
      PrefixSyntax.call(this, 10, op, syntax); },
    run: function run(ctx) {
      var func = this.syntax.run(ctx);
      throw new Error('NewSyntax not supported');
    }
  });

  //----------------------------------------------------------------------
  // typeof
  var TyepofSyntax = Syntax.TyepofSyntax =
      PrefixSyntax.extend('TyepofSyntax', {
    constructor: function TyepofSyntax(op, syntax) {
      PrefixSyntax.call(this, 40, op, syntax); },
    run: function run(ctx) {
      return typeof this.syntax.run(ctx); }
  });

  //----------------------------------------------------------------------
  // void
  var VoidSyntax = Syntax.VoidSyntax =
      PrefixSyntax.extend('VoidSyntax', {
    constructor: function VoidSyntax(op, syntax) {
      PrefixSyntax.call(this, 40, op, syntax); },
    run: function run(ctx) {
      return void this.syntax.run(ctx); } // no need to run
  });

  //----------------------------------------------------------------------
  // delete
  var DeleteSyntax = Syntax.DeleteSyntax =
      PrefixSyntax.extend('DeleteSyntax', {
    constructor: function DeleteSyntax(op, syntax) {
      PrefixSyntax.call(this, 40, op, syntax); },
    run: function run(ctx) {
      return delete this.syntax.run(ctx); } // TODO locate
  });

  //######################################################################
  var PostfixSyntax = Syntax.PostfixSyntax =
      ExpressionSyntax.extend('PostfixSyntax', {
    constructor: function PostfixSyntax(prio, op, syntax) {
      ExpressionSyntax.call(this, prio);
      this.op = op;
      this.syntax = syntax;
    },
    toString: function toString() {
      var op = this.op.toString();
      var expr = this.syntax.toString();
      if (this.prio < this.syntax.prio) expr = '(' + expr + ')';
      return expr + op;
    }
  }, {
    createx: function createx(op, syntax) {
      var s = op + '';
      var ctor = this.ctors[s];
      if (ctor) return new ctor(op, syntax);
      throw TypeError('PostfixSyntax Op: ' + op);
    }
  });

  //----------------------------------------------------------------------
  // ()++
  var PostIncSyntax = Syntax.PostIncSyntax =
      PostfixSyntax.extend('PostIncSyntax', {
    constructor: function PostIncSyntax(op, syntax) {
      PostfixSyntax.call(this, 30, op, syntax); },
    run: function run(ctx) {
      var loc = this.syntax.locate(ctx);
      var val = loc.getValue();
      loc.setValue(val + 1);
      return val;
    }
  });

  //----------------------------------------------------------------------
  // ()--
  var PostDecSyntax = Syntax.PostDecSyntax =
      PostfixSyntax.extend('PostDecSyntax', {
    constructor: function PostDecSyntax(op, syntax) {
      PostfixSyntax.call(this, 30, op, syntax); },
    run: function run(ctx) {
      var loc = this.syntax.locate(ctx);
      var val = loc.getValue();
      loc.setValue(val - 1);
      return val;
    }
  });

  //######################################################################
  var BinSyntax = Syntax.BinSyntax =
      ExpressionSyntax.extend('BinSyntax', {
    constructor: function BinSyntax(prio, op, lhs, rhs) {
      ExpressionSyntax.call(this, prio);
      this.op = op;
      this.lhs = lhs;
      this.rhs = rhs;
    },
    toString: function toString() {
      var op = this.op.toString();
      var z = op.slice(-1);
      if (z.match(/[a-z]/i))
        op = ' ' + op + ' ';

      var expr1 = this.lhs.toString();
      if (this.prio < this.lhs.prio) expr1 = '(' + expr1 + ')';
      var expr2 = this.rhs.toString();
      if (this.prio < this.rhs.prio) expr2 = '(' + expr2 + ')';
      return expr1 + op + expr2;
    }
  }, {
    createx: function createx(op, lhs, rhs) {
      var s = op + '';
      var ctor = this.ctors[s];
      if (ctor) return new ctor(op, lhs, rhs);
      throw TypeError('BinSyntax Op: ' + op);
    }
  });

  //----------------------------------------------------------------------
  // lhs + rhs
  var AddSyntax = Syntax.AddSyntax =
      BinSyntax.extend('AddSyntax', {
    constructor: function AddSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 60, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) + this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // lhs - rhs
  var SubSyntax = Syntax.SubSyntax =
      BinSyntax.extend('SubSyntax', {
    constructor: function SubSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 60, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) - this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var MulSyntax = Syntax.MulSyntax =
      BinSyntax.extend('MulSyntax', {
    constructor: function MulSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 50, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) * this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var DivSyntax = Syntax.DivSyntax =
      BinSyntax.extend('DivSyntax', {
    constructor: function DivSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 50, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) / this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var ModSyntax = Syntax.ModSyntax =
      BinSyntax.extend('ModSyntax', {
    constructor: function ModSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 50, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) % this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var AssignSyntax = Syntax.AssignSyntax =
      BinSyntax.extend('AssignSyntax', {
    constructor: function AssignSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.locate(ctx).setValue(this.rhs.run(ctx)); }
  });

  //----------------------------------------------------------------------
  var AssignAddSyntax = Syntax.AssignAddSyntax =
      BinSyntax.extend('AssignAddSyntax', {
    constructor: function AssignAddSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() + this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignSubSyntax = Syntax.AssignSubSyntax =
      BinSyntax.extend('AssignSubSyntax', {
    constructor: function AssignSubSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() - this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignMulSyntax = Syntax.AssignMulSyntax =
      BinSyntax.extend('AssignMulSyntax', {
    constructor: function AssignMulSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() * this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignDivSyntax = Syntax.AssignDivSyntax =
      BinSyntax.extend('AssignDivSyntax', {
    constructor: function AssignDivSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() / this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignModSyntax = Syntax.AssignModSyntax =
      BinSyntax.extend('AssignModSyntax', {
    constructor: function AssignModSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() % this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignLogShiftLeftSyntax = Syntax.AssignLogShiftLeftSyntax =
      BinSyntax.extend('AssignLogShiftLeftSyntax', {
    constructor: function AssignLogShiftLeftSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() << this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignArithShiftRightSyntax = Syntax.AssignArithShiftRightSyntax =
      BinSyntax.extend('AssignArithShiftRightSyntax', {
    constructor: function AssignArithShiftRightSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() >> this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignLogShiftRightSyntax = Syntax.AssignLogShiftRightSyntax =
      BinSyntax.extend('AssignLogShiftRightSyntax', {
    constructor: function AssignLogShiftRightSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() >>> this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignBitAndSyntax = Syntax.AssignBitAndSyntax =
      BinSyntax.extend('AssignBitAndSyntax', {
    constructor: function AssignBitAndSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() & this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignBitXorSyntax = Syntax.AssignBitXorSyntax =
      BinSyntax.extend('AssignBitXorSyntax', {
    constructor: function AssignBitXorSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() ^ this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  var AssignBitOrSyntax = Syntax.AssignBitOrSyntax =
      BinSyntax.extend('AssignBitOrSyntax', {
    constructor: function AssignBitOrSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      var loc = this.lhs.locate(ctx);
      return loc.setValue(loc.getValue() | this.rhs.run(ctx));
    }
  });

  //----------------------------------------------------------------------
  // lhs => rhs
  var LambdaSyntax = Syntax.LambdaSyntax =
      BinSyntax.extend('LambdaSyntax', {
    constructor: function LambdaSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 170, op, lhs, rhs); },
    run: function run(ctx) {
      // TODO => Lambda syntax support
      throw new Error('TODO => Lambda syntax not supported');
    }
  });

  //----------------------------------------------------------------------
  // lhs || rhs
  var LogOrSyntax = Syntax.LogOrSyntax =
      BinSyntax.extend('LogOrSyntax', {
    constructor: function LogOrSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 140, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) || this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // lhs && rhs
  var LogAndSyntax = Syntax.LogAndSyntax =
      BinSyntax.extend('LogAndSyntax', {
    constructor: function LogAndSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 130, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) && this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // lhs & rhs
  var BitAndSyntax = Syntax.BitAndSyntax =
      BinSyntax.extend('BitAndSyntax', {
    constructor: function BitAndSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 100, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) & this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // lhs ^ rhs
  var BitXorSyntax = Syntax.BitXorSyntax =
      BinSyntax.extend('BitXorSyntax', {
    constructor: function BitXorSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 110, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) ^ this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // lhs | rhs
  var BitOrSyntax = Syntax.BitOrSyntax =
      BinSyntax.extend('BitOrSyntax', {
    constructor: function BitOrSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 120, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) | this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // ==
  var EqRelSyntax = Syntax.EqRelSyntax =
      BinSyntax.extend('EqRelSyntax', {
    constructor: function EqRelSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 90, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) == this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // ===
  var StrictEqRelSyntax = Syntax.StrictEqRelSyntax =
      BinSyntax.extend('StrictEqRelSyntax', {
    constructor: function StrictEqRelSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 90, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) === this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // !=
  var NotEqRelSyntax = Syntax.NotEqRelSyntax =
      BinSyntax.extend('NotEqRelSyntax', {
    constructor: function NotEqRelSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 90, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) != this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // !==
  var StrictNotEqRelSyntax = Syntax.StrictNotEqRelSyntax =
      BinSyntax.extend('StrictNotEqRelSyntax', {
    constructor: function StrictNotEqRelSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 90, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) !== this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var LtRelSyntax = Syntax.LtRelSyntax =
      BinSyntax.extend('LtRelSyntax', {
    constructor: function LtRelSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 80, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) < this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var LeRelSyntax = Syntax.LeRelSyntax =
      BinSyntax.extend('LeRelSyntax', {
    constructor: function LeRelSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 80, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) <= this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var GtRelSyntax = Syntax.GtRelSyntax =
      BinSyntax.extend('GtRelSyntax', {
    constructor: function GtRelSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 80, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) > this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var GeRelSyntax = Syntax.GeRelSyntax =
      BinSyntax.extend('GeRelSyntax', {
    constructor: function GeRelSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 80, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) >= this.rhs.run(ctx); }
  });
  
  //----------------------------------------------------------------------
  var LogShiftLeftSyntax = Syntax.LogShiftLeftSyntax =
      BinSyntax.extend('LogShiftLeftSyntax', {
    constructor: function LogShiftLeftSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 70, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) << this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var ArithShiftRightSyntax = Syntax.ArithShiftRightSyntax =
      BinSyntax.extend('ArithShiftRightSyntax', {
    constructor: function ArithShiftRightSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 70, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) >> this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var LogShiftRightSyntax = Syntax.LogShiftRightSyntax =
      BinSyntax.extend('LogShiftRightSyntax', {
    constructor: function LogShiftRightSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 70, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) >>> this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  // ?:
  var ElvisSyntax = Syntax.ElvisSyntax =
      BinSyntax.extend('ElvisSyntax', {
    constructor: function ElvisSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 150, op, lhs, rhs); },
    run: function run(ctx) {
      var val = this.lhs.run(ctx);
      return val != null ? val : this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var InSyntax = Syntax.InSyntax =
      BinSyntax.extend('InSyntax', {
    constructor: function InSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 80, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) in this.rhs.run(ctx); }
  });

  //----------------------------------------------------------------------
  var InstanceofSyntax = Syntax.InstanceofSyntax =
      BinSyntax.extend('InstanceofSyntax', {
    constructor: function InstanceofSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 80, op, lhs, rhs); },
    run: function run(ctx) {
      return this.lhs.run(ctx) instanceof this.rhs.run(ctx); }
  });

  //######################################################################
  var Cond3Syntax = Syntax.Cond3Syntax =
      ExpressionSyntax.extend('Cond3Syntax', {
    constructor: function Cond3Syntax(op1, op2, lhs, mhs, rhs) {
      ExpressionSyntax.call(this, 150);
      this.op1 = op1;
      this.op2 = op2;
      this.lhs = lhs;
      this.mhs = mhs;
      this.rhs = rhs;
    },
    run: function run(ctx) {
      return this.lhs.run(ctx) ? this.mhs.run(ctx) : this.rhs.run(ctx);
    },
    toString: function toString() {
      var op1 = this.op1.toString();
      var op2 = this.op2.toString();

      var lhs = this.lhs.toString();
      if (this.prio < this.lhs.prio) lhs = '(' + lhs + ')';
      var mhs = this.mhs.toString();
      if (this.prio < this.mhs.prio) mhs = '(' + mhs + ')';
      var rhs = this.rhs.toString();
      if (this.prio < this.rhs.prio) rhs = '(' + rhs + ')';
      return lhs + op1 + mhs + op2 + rhs;
    }
  });


  //######################################################################
  var FuncCallSyntax = Syntax.FuncCallSyntax =
      ExpressionSyntax.extend('FuncCallSyntax', {
    constructor: function FuncCallSyntax(func, args) {
      ExpressionSyntax.call(this, 20);
      this.func = func;
      this.args = args;
    },
    run: function run(ctx) {
      var func = this.func.run(ctx);
      var args = this.args;
      throw Error('FuncCallSyntax not supported');
    },
    toString: function toString() {
      var args = this.args;
      var s = this.func.toString();
      if (args.length === 0)
        return s + '()';

      s += '(';
      for (var i = 0, n = args.length; i < n; ++i) {
        var arg = args[i];
        if (arg.prio >= 180) s += '(';
        s += arg.toString();
        if (arg.prio >= 180) s += ')';
        if (i !== n - 1) s += ', ';
      }
      s += ')';
      return s;
    }
  });

  //######################################################################
  var AccessSyntax = Syntax.AccessSyntax =
      BinSyntax.extend('AccessSyntax', {
    constructor: function AccessSyntax(op, lhs, rhs) {
      BinSyntax.call(this, 10, op, lhs, rhs); },
  }, {
    createx: function createx(op, lhs, rhs) {
      var s = op + '';
      var ctor = this.ctors[s];
      if (ctor) return new ctor(op, lhs, rhs);
      throw TypeError('AccessSyntax Op: ' + op);
    }
  });

  //----------------------------------------------------------------------
  // .
  var AccessDotSyntax = Syntax.AccessDotSyntax =
      AccessSyntax.extend('AccessDotSyntax', {
    constructor: function AccessDotSyntax(op, lhs, rhs) {
      AccessSyntax.call(this, op, lhs, rhs); },
    locate: function locate(ctx) {
      var access = this.lhs.run(ctx);
      var propertyName = this.rhs + '';
      throw new Error('AccessDotSyntax not supported');
    }
  });

  //----------------------------------------------------------------------
  // ?.
  var AccessWeakDotSyntax = Syntax.AccessWeakDotSyntax =
      AccessSyntax.extend('AccessWeakDotSyntax', {
    constructor: function AccessWeakDotSyntax(op, lhs, rhs) {
      AccessSyntax.call(this, op, lhs, rhs); },
    locate: function locate(ctx) {
      var access = this.lhs.run(ctx);
      var propertyName = this.rhs + '';
      throw new Error('AccessWeakDotSyntax not supported');
    }
  });

  //----------------------------------------------------------------------
  // [
  var AccessGetSetSyntax = Syntax.AccessGetSetSyntax =
      AccessSyntax.extend('AccessGetSetSyntax', {
    constructor: function AccessGetSetSyntax(op, lhs, rhs) {
      AccessSyntax.call(this, op, lhs, rhs); },
    locate: function locate(ctx) {
      var access = this.lhs.run(ctx);
      var propertyName = this.rhs.run(ctx) + '';
      throw new Error('AccessGetSetSyntax not supported');
    }
  });

  //----------------------------------------------------------------------
  // ->
  var AccessThinArrowSyntax = Syntax.AccessThinArrowSyntax =
      AccessSyntax.extend('AccessThinArrowSyntax', {
    constructor: function AccessThinArrowSyntax(op, lhs, rhs) {
      AccessSyntax.call(this, op, lhs, rhs); },
    locate: function locate(ctx) {
      var access = this.lhs.run(ctx);
      var propertyName = this.rhs + '';
      throw new Error('AccessThinArrowSyntax not supported');
    }
  });

  //######################################################################
  var CoreSyntax = Syntax.CoreSyntax =
      ExpressionSyntax.extend('CoreSyntax', {
    constructor: function CoreSyntax(token) {
      ExpressionSyntax.call(this, 0);
      this.token = token; },
    toString: function toString() {
      return this.token.toString(); }
  }, {
    createx: function createx(token) {
      var ctor = this.ctors[token.constructor.name];
      if (ctor) return new ctor(token);
      throw new TypeError('CoreSyntax Token: ' + token);
    }
  });

  //----------------------------------------------------------------------
  var NumberSyntax = Syntax.NumberSyntax =
      CoreSyntax.extend('NumberSyntax', {
    constructor: function NumberSyntax(token) {
      CoreSyntax.call(this, token); },
    run: function run(ctx) {
      return this.token.getValue(); }
  });

  //----------------------------------------------------------------------
  var StringSyntax = Syntax.StringSyntax =
      CoreSyntax.extend('StringSyntax', {
    constructor: function StringSyntax(token) {
      CoreSyntax.call(this, token); },
    run: function run(ctx) {
      return this.token.getValue(); }
  });

  //----------------------------------------------------------------------
  var SymbolSyntax = Syntax.SymbolSyntax =
      CoreSyntax.extend('SymbolSyntax', {
    constructor: function SymbolSyntax(token) {
      CoreSyntax.call(this, token); },
    run: function run(ctx) {
      var s = this.token.toString();
      if (SymbolSyntax.reservedGlobalConstants[s] !== undefined || s in SymbolSyntax.reservedGlobalConstants)
        return SymbolSyntax.reservedGlobalConstants[s];

      return ctx.getSymbolValue(s);
    },
    locate: function locate(ctx) {
      var s = this.token.toString();
      if (SymbolSyntax.reservedGlobalConstants[s] !== undefined || s in SymbolSyntax.reservedGlobalConstants)
        throw new Error('reserved keyword locate not supported');

      return {
        getValue: function () { return ctx.getSymbolValue(s); },
        setValue: function (value) { return ctx.setSymbolValue(s, value), value; }
      };
    }
  }, {
    reservedGlobalConstants: dic({
    'null': null,
    'undefined': undefined,
    'true': true,
    'false': false,
    })
  });

  PrefixSyntax.ctors = dic({
    '++':     Syntax.PreIncSyntax,
    '--':     Syntax.PreDecSyntax,
    '+':      Syntax.PlusSyntax,
    '-':      Syntax.MinusSyntax,
    '!':      Syntax.LogNotSyntax,
    '~':      Syntax.BitNotSyntax,
    'new':    Syntax.NewSyntax,
    'typeof': Syntax.TyepofSyntax,
    'void':   Syntax.VoidSyntax,
    'delete': Syntax.DeleteSyntax,
    // sizeof
  });

  PostfixSyntax.ctors = dic({
    '++': Syntax.PostIncSyntax,
    '--': Syntax.PostDecSyntax,
  });

  BinSyntax.ctors = dic({
    '+':           Syntax.AddSyntax,
    '-':           Syntax.SubSyntax,
    '*':           Syntax.MulSyntax,
    '/':           Syntax.DivSyntax,
    '%':           Syntax.ModSyntax,
    '=':           Syntax.AssignSyntax,
    '+=':          Syntax.AssignAddSyntax,
    '-=':          Syntax.AssignSubSyntax,
    '*=':          Syntax.AssignMulSyntax,
    '/=':          Syntax.AssignDivSyntax,
    '%=':          Syntax.AssignModSyntax,
    '<<=':         Syntax.AssignLogShiftLeftSyntax,
    '>>=':         Syntax.AssignArithShiftRightSyntax,
    '>>>=':        Syntax.AssignLogShiftRightSyntax,
    '&=':          Syntax.AssignBitAndSyntax,
    '^=':          Syntax.AssignBitXorSyntax,
    '|=':          Syntax.AssignBitOrSyntax,
    '=>':          Syntax.LambdaSyntax,
    '||':          Syntax.LogOrSyntax,
    '&&':          Syntax.LogAndSyntax,
    '|':           Syntax.BitOrSyntax,
    '^':           Syntax.BitXorSyntax,
    '&':           Syntax.BitAndSyntax,
    '==':          Syntax.EqRelSyntax,
    '===':         Syntax.StrictEqRelSyntax,
    '!=':          Syntax.NotEqRelSyntax,
    '!==':         Syntax.StrictNotEqRelSyntax,
    '<':           Syntax.LtRelSyntax,
    '<=':          Syntax.LeRelSyntax,
    '>':           Syntax.GtRelSyntax,
    '>=':          Syntax.GeRelSyntax,
    '<<':          Syntax.LogShiftLeftSyntax,
    '>>':          Syntax.ArithShiftRightSyntax,
    '>>>':         Syntax.LogShiftRightSyntax,
    '?:':          Syntax.ElvisSyntax,
    '??':          Syntax.ElvisSyntax,
    'in':          Syntax.InSyntax,
    'instanceof':  Syntax.InstanceofSyntax,
  });

  AccessSyntax.ctors = dic({
    '.':  Syntax.AccessDotSyntax,
    '?.': Syntax.AccessWeakDotSyntax,
    '[':  Syntax.AccessGetSetSyntax,
    '->': Syntax.AccessThinArrowSyntax,
  });

  CoreSyntax.ctors = dic({
    'NumToken': Syntax.NumberSyntax,
    'StrToken': Syntax.StringSyntax,
    'SymToken': Syntax.SymbolSyntax,
  });

  return Syntax;

}();
