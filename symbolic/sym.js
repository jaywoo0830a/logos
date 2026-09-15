// docs/spec/DSL.md §7 심볼릭 — @cortex-js/compute-engine 어댑터
import { ComputeEngine } from '@cortex-js/compute-engine';

const ce = new ComputeEngine();

function toJson(v) {
  if (v instanceof Sym) return v.ast.json;
  return v;
}

export class Sym {
  #ast = null;

  constructor(latex) {
    this.latex = String(latex);
  }

  get ast() {
    if (this.#ast === null) this.#ast = ce.parse(this.latex);
    return this.#ast;
  }

  diff(v = 'x') {
    const d = ce.box(['D', this.ast.json, v]).evaluate();
    return new Sym(d.toLatex());
  }

  /**
   * 정적분 — 적분 구간을 주면 정적분값, 아니면 부정적분.
   * @param {{ from?: number, to?: number, var?: string }} [o] `from`/`to`: 적분 구간 · `var`: 변수(기본 'x')
   */
  integrate({ from, to, var: v = 'x' } = {}) {
    const cmd =
      from !== undefined ? ['Integrate', this.ast.json, ['Tuple', v, from, to]] : ['Integrate', this.ast.json, v];
    return new Sym(ce.box(cmd).evaluate().toLatex());
  }

  simplify() {
    return new Sym(this.ast.simplify().toLatex());
  }
  expand() {
    return new Sym(this.ast.expand().toLatex());
  }
  factor() {
    return new Sym(this.ast.factor().toLatex());
  }

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
    // compute-engine 의 치환은 `ast.subs()` 가 정확하다.
    //   이전 구현은 `['ReplaceAll', …, ['List', …]]` 을 넘겼는데 평가되지 않고 `y(2)` 처럼 왜곡됐다
    //   (값이 조용히 틀리는 버그 — ODE `dy` 심볼릭 경로에서 드러났다).
    const box = this.ast.subs(Object.fromEntries(Object.entries(map).map(([k, v]) => [k, toJson(v)])));
    const ev = box && typeof box.evaluate === 'function' ? box.evaluate() : box;
    return new Sym(ev.toLatex());
  }

  toFunction(v = 'x') {
    const self = this;
    // 공유 엔진 상태에 영향을 받지 않도록 호출마다 fresh parse (정확하지만 느린 경로)
    const slow = (x) => {
      try {
        const expr = ce
          .parse(self.latex)
          .subs({ [v]: x })
          .N();
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
    // 네이티브 JS 평가가 빠르다 — 다만 표현식 커버리지가 좁으므로 **CE 결과와 교차검증**한다.
    //   (검증 없이 쓰면 `x+1` 에서 x 항을 버리는 같은 종류의 **조용한 오답**이 곡선/영역에 그대로 흘러간다)
    const native = nativeFn(this.latex, v);
    if (native) {
      let trustworthy = true;
      for (const t of [0.37, 1.23, -0.61]) {
        const a = native(t),
          b = slow(t);
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(b))) {
          trustworthy = false;
          break;
        }
      }
      if (trustworthy) return native;
    }
    return slow;
  }

  toLatex() {
    return this.latex;
  }

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
  const s = String(latex)
    .replace(/\s/g, '')
    // 숫자 자릿수 구분(얇은 공백)을 **반드시** 제거한다.
    //   compute-engine 은 평가된 숫자를 `1.001\,25` 처럼 포맷하는데, 이를 남겨두면
    //   상수 파싱이 깨져 1.001+25=26.001 같은 **조용히 틀린 값**이 나온다.
    .replace(/\\[,;!]/g, '')
    .replace(/\\hspace\{[^}]*\}/g, '')
    .replace(/\\(?:left|right|,|;|!)/g, '');
  // 기호 정의
  const consts = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI };
  const reSym = new RegExp(`[a-z]{2,}|[A-Za-z]`);
  // 단순 삼각/지수/로그: \sin(x), sin(x), \cos(x), … (백슬래시 선택)
  const trig = s.match(/^\\?(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|log|ln|exp)\('?([a-z])'?\)$/);
  if (trig && trig[2] === v) {
    const m = {
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      log: Math.log,
      ln: Math.log,
      exp: Math.exp,
    };
    return (x) => m[trig[1]](x);
  }
  // 상수 (r = 3 등)
  const numConst = s.match(/^([0-9.]+)$/);
  if (numConst) {
    const c = parseFloat(numConst[1]);
    return () => c;
  }
  // 변수 자체
  if (s === v) return (x) => x;
  // 다항식: ax^n + bx^m ... + c  (x^k, x^k+c, a*x^k, a*x^k+b*x^j ...)
  const poly = parsePolynomial(s, v, consts);
  if (poly) return (x) => poly(x);
  return null;
}

/** 라디안/상수 매핑 아래 단일변수 다항식 파서 (덧셈/뺄셈, 곱, 거듭제곱) */
function parsePolynomial(s, v, consts) {
  const token = s.replace(/\\cdot/g, '*').replace(/\{|\}/g, '');
  // [부호][계수]*(x)^[지수] 또는 [계수]*x[지수] 형태 토큰으로 분리
  const termRe = /([+-]?)([0-9.]*(?:\*)?)([A-Za-z]+)?(?:\^?\{?(-?[0-9.]+)\}?)?/g;
  const terms = [];
  const body = token.replace(/[()]/g, '');
  let m;
  let acc = '';
  // 계수*변수^지수 패턴으로 파싱하는 간단 구현
  const termPat = /([+-]?)(?:([0-9.]+)?([A-Za-z]+)(?:\^?\{?(-?[0-9.]+)\}?)?|([0-9.]+))/g;
  let mm;
  while ((mm = termPat.exec(body)) !== null) {
    if (mm[3] !== undefined) {
      // [부호][계수][변수][^지수]  (지수 생략 = 1, 계수 생략 = 1)
      const sign = mm[1] === '-' ? -1 : 1;
      const coeff = mm[2] ? parseFloat(mm[2]) : 1;
      if (mm[3] === v) terms.push({ c: sign * coeff, e: mm[4] ? parseFloat(mm[4]) : 1 });
    } else if (mm[5] !== undefined) {
      // [부호][상수]
      const sign = mm[1] === '-' ? -1 : 1;
      terms.push({ c: sign * parseFloat(mm[5]), e: 0 });
    }
  }
  if (!terms.length) return null;
  return (x) => terms.reduce((sum, t) => sum + t.c * Math.pow(x, t.e), 0);
}
