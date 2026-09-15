// docs/spec/DSL.md §4.2 벡터
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { cartToPolar } from '../solver/coords.js';
import { point, toPoint } from './point.js';

export class Vector extends Drawable {
  constructor(conf = {}) {
    super('vector', { ...conf });
    if (conf.raw) this._conf.raw = [...conf.raw];
  }
  get v() {
    return this._conf.raw;
  }
  get dim() {
    return this._conf.raw.length;
  }

  /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
  label(l, off) {
    return this.set({ label: l, labelOff: off });
  }

  toIR() {
    const c = this._conf;
    const [x, y] = c.raw;
    const from = c.from || [0, 0];
    return [
      node('arrow', {
        x1: from[0],
        y1: from[1],
        x2: from[0] + x,
        y2: from[1] + y,
        label: renderText(c.label),
        color: c.color,
        stroke: c.stroke,
        dash: c.dash,
        opacity: c.opacity,
        transforms: c.transforms,
      }),
    ];
  }
}

export function vector(...args) {
  return new Vector({ raw: args });
}
vector.between = (A, B) => {
  const a = toPoint(A),
    b = toPoint(B);
  return vector(...b.coords.map((_, i) => b.coords[i] - a.coords[i]));
};
vector.unit = (angle) => vector(Math.cos(angle), Math.sin(angle));
vector.normal = (A, B, C) => {
  const ab = [B.coords[0] - A.coords[0], B.coords[1] - A.coords[1], (B.coords[2] ?? 0) - (A.coords[2] ?? 0)];
  const ac = [C.coords[0] - A.coords[0], C.coords[1] - A.coords[1], (C.coords[2] ?? 0) - (A.coords[2] ?? 0)];
  return vector(ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]);
};
vector.from = (A) => ({ to: (B) => vector.between(A, B) });

// ── 미분 연산 (중심차분 수치 미분) ───────────────────────
//   심볼릭(Sym) 도 `toFunction` 을 거쳐 그대로 쓸 수 있다.
//   · gradient(f).at(P) → Vector      (∇f)
//   · div(F).at(P)      → number      (∇·F)
//   · curl(F).at(P)     → number(2D, 스칼라 회전) | Vector(3D)
const stepOf = (v) => 1e-5 * Math.max(1, Math.abs(v || 0));
function partialAt(f, X, i) {
  const h = stepOf(X[i]);
  const a = X.slice(),
    b = X.slice();
  a[i] += h;
  b[i] -= h;
  return (Number(f(...a)) - Number(f(...b))) / (2 * h);
}
vector.gradient = (f) => ({
  at: (P) => {
    const c = P.coords;
    return vector(...c.map((_, i) => partialAt(f, c, i)));
  },
});
vector.div = (F) => ({
  at: (P) => {
    const c = P.coords;
    let s = 0;
    for (let i = 0; i < c.length; i++) s += partialAt((...X) => F(...X)[i], c, i);
    return s;
  },
});
vector.curl = (F) => ({
  at: (P) => {
    const c = P.coords;
    const u = (...X) => F(...X)[0],
      v = (...X) => F(...X)[1];
    if (c.length === 2) return partialAt(v, c, 0) - partialAt(u, c, 1); // ∂v/∂x − ∂u/∂y
    const w = (...X) => F(...X)[2];
    return vector(
      partialAt(w, c, 1) - partialAt(v, c, 2),
      partialAt(u, c, 2) - partialAt(w, c, 0),
      partialAt(v, c, 0) - partialAt(u, c, 1),
    );
  },
});
