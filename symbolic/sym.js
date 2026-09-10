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
    // 네이티브 JS 평가 fallback (compute-engine 상태와 무관하게 신뢰)
    const native = nativeFn(this.latex, v);
    if (native) return native;
    // 공유 엔진 상태에 영향을 받지 않도록 호출마다 fresh parse
    return (x) => {
      try {
        const expr = ce.parse(self.latex).subs({ [v]: x }).N();
        let nv = expr.numericValue;
        if (nv == null) {
          const j = expr.json;
          if (typeof j === 'number' || typeof j === 'bigint') nv = j;
          else if (Array.isArray(j) && j.length === 1 && typeof j[0] === 'number') nv = j[0];
        }
        return nv == null ? NaN : Number(nv);
      } catch {
        return NaN;
      }
    };
  }

  toLatex() { return this.latex; }

  valueOf() {
    const v = this.ast.N().numericValue;
    return v == null ? NaN : Number(v);
  }
}

/**
 * LaTeX 한 변수 표현식을 네이티브 JS 함수로 해석(불가능 시 null).
 * compute-engine 상태와 무관하게 곡선/영역 샘플링을 견고하게 만든다.
 */
function nativeFn(latex, v = 'x') {
  const s = String(latex).replace(/\s/g, '');
  // 기호 정의
  const consts = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI };
  const reSym = new RegExp(`[a-z]{2,}|[A-Za-z]`);
  // 단순 삼각/지수/로그: \sin(x), sin(x), \cos(x), … (백슬래시 선택)
  const trig = s.match(/^\\?(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|log|ln|exp)\('?([a-z])'?\)$/);
  if (trig && trig[2] === v) {
    const m = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, log: Math.log, ln: Math.log, exp: Math.exp };
    return (x) => m[trig[1]](x);
  }
  // 상수 (r = 3 등)
  const numConst = s.match(/^([0-9.]+)$/);
  if (numConst) { const c = parseFloat(numConst[1]); return () => c; }
  // 변수 자체
  if (s === v) return (x) => x;
  // 다항식: ax^n + bx^m ... + c  (x^k, x^k+c, a*x^k, a*x^k+b*x^j ...)
  const poly = parsePolynomial(s, v, consts);
  if (poly) return (x) => poly(x);
  return null;
}

/** 라디안/상수 매핑 아래 단일변수 다항식 파서 (덧셈/뺄셈, 곱, 거듭제곱) */
function parsePolynomial(s, v, consts) {
  const token = s
    .replace(/\\cdot/g, '*')
    .replace(/\{|\}/g, '');
  // [부호][계수]*(x)^[지수] 또는 [계수]*x[지수] 형태 토큰으로 분리
  const termRe = /([+-]?)([0-9.]*(?:\*)?)([A-Za-z]+)?(?:\^?\{?(-?[0-9.]+)\}?)?/g;
  const terms = [];
  const body = token.replace(/[()]/g, '');
  let m; let acc = '';
  // 계수*변수^지수 패턴으로 파싱하는 간단 구현
  const termPat = /([+-]?)(?:([0-9.]+)\*)?([A-Za-z]+)\^?\{?(-?[0-9.]+)\}?|([+-]?)([0-9.]+)/g;
  let mm;
  while ((mm = termPat.exec(body)) !== null) {
    if (mm[1] !== undefined && mm[3] !== undefined) {
      // a*x^k
      const sign = mm[1] === '-' ? -1 : 1;
      const coeff = mm[2] ? parseFloat(mm[2]) : 1;
      const base = mm[3];
      const exp = mm[4] ? parseFloat(mm[4]) : 1;
      if (base === v) terms.push({ c: sign * coeff, e: exp });
    } else if (mm[5] !== undefined && mm[6] !== undefined) {
      // 상수
      const sign = mm[5] === '-' ? -1 : 1;
      terms.push({ c: sign * parseFloat(mm[6]), e: 0 });
    }
  }
  if (!terms.length) return null;
  return (x) => terms.reduce((sum, t) => sum + t.c * Math.pow(x, t.e), 0);
}