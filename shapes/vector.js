// DSL.md §4.2 벡터
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { cartToPolar } from '../solver/coords.js';
import { point, toPoint } from './point.js';

export class Vector extends Drawable {
  constructor(conf = {}) {
    super('vector', { ...conf });
    if (conf.raw) this._conf.raw = [...conf.raw];
  }
  get v() { return this._conf.raw; }
  get dim() { return this._conf.raw.length; }

  label(l, off) { return this.set({ label: l, labelOff: off }); }

  toIR() {
    const c = this._conf;
    const [x, y] = c.raw;
    const from = c.from || [0, 0];
    return [node('arrow', {
      x1: from[0], y1: from[1], x2: from[0] + x, y2: from[1] + y,
      label: renderText(c.label),
      color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity,
      transforms: c.transforms,
    })];
  }
}

export function vector(...args) {
  return new Vector({ raw: args });
}
vector.between = (A, B) => {
  const a = toPoint(A), b = toPoint(B);
  return vector(...b.coords.map((_, i) => b.coords[i] - a.coords[i]));
};
vector.unit = (angle) => vector(Math.cos(angle), Math.sin(angle));
vector.normal = (A, B, C) => {
  const ab = [B.coords[0] - A.coords[0], B.coords[1] - A.coords[1], (B.coords[2] ?? 0) - (A.coords[2] ?? 0)];
  const ac = [C.coords[0] - A.coords[0], C.coords[1] - A.coords[1], (C.coords[2] ?? 0) - (A.coords[2] ?? 0)];
  return vector(
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0],
  );
};
vector.from = (A) => ({ to: (B) => vector.between(A, B) });

// gradient/curl/div 는 심볼릭 미분 기반 (Sym 필요 시 lazy)
actualize(vector);
function actualize(ns) { return ns; }