// DSL.md §7 심볼릭 — @cortex-js/compute-engine 어댑터
import { ComputeEngine } from '@cortex-js/compute-engine';

const ce = new ComputeEngine();

function toJson(v) {
  if (v instanceof Sym) return v.ast.json;
  return v;
}

export class Sym {
  #ast = null;

  constructor(latex) { this.latex = String(latex); }

  get ast() {
    if (this.#ast === null) this.#ast = ce.parse(this.latex);
    return this.#ast;
  }

  diff(v = 'x') {
    const d = ce.box(['D', this.ast.json, v]).evaluate();
    return new Sym(d.toLatex());
  }

  integrate({ from, to, var: v = 'x' } = {}) {
    const cmd = from !== undefined
      ? ['Integrate', this.ast.json, ['Tuple', v, from, to]]
      : ['Integrate', this.ast.json, v];
    return new Sym(ce.box(cmd).evaluate().toLatex());
  }

  simplify() { return new Sym(this.ast.simplify().toLatex()); }
  expand() { return new Sym(this.ast.expand().toLatex()); }
  factor() { return new Sym(this.ast.factor().toLatex()); }

  solve(v = 'x') {
    const r = this.ast.solve(v);
    if (Array.isArray(r)) return r.map((e) => new Sym(e.toLatex()));
    if (r && typeof r.each === 'function') {
      const out = [];
      r.each((e) => out.push(new Sym(e.toLatex())));
      return out;
    }
    return [];
  }

  substitute(map) {
    const m = Object.entries(map).map(([k, v2]) => [k, toJson(v2)]);
    return new Sym(ce.box(['ReplaceAll', this.ast.json, ['List', ...m]]).evaluate().toLatex());
  }

  toFunction(v = 'x') {
    const self = this;
    return (x) => {
      const val = self.ast.subs({ [v]: x }).N().numericValue;
      return val == null || Number.isNaN(Number(val)) ? NaN : Number(val);
    };
  }

  toLatex() { return this.latex; }

  valueOf() {
    const v = this.ast.N().numericValue;
    return v == null ? NaN : Number(v);
  }
}