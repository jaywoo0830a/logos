// DSL.md §4.3 선분 — segment(A, B)
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { point } from './point.js';
import { line } from './line.js';

export class Segment extends Drawable {
  constructor(conf = {}) { super('segment', { ...conf }); }
  get a() { return this._conf.a; }
  get b() { return this._conf.b; }
  length() {
    const A = this._conf.a.coords, B = this._conf.b.coords;
    return Math.hypot(B[0] - A[0], B[1] - A[1]);
  }
  label(l, off) { return this.set({ label: l, labelOff: off }); }

  toIR() {
    const c = this._conf;
    const A = c.a.coords, B = c.b.coords;
    return [node('path', {
      ops: [
        { op: 'M', x: A[0], y: A[1] },
        { op: 'L', x: B[0], y: B[1] },
      ],
      color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity,
      transforms: c.transforms,
      style: pickStyle2(c),
    })];
  }
}

function pickStyle2(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

export function segment(A, B) {
  return new Segment({ a: A, b: B });
}
segment.ofLength = (len) => ({
  from: (P) => ({
    angle: (a) => segment(P, point(P.coords[0] + Math.cos(a) * len, P.coords[1] + Math.sin(a) * len)),
  }),
});
segment.bisector = (A, B) => {
  const mid = point.midpoint(A, B);
  const dx = B.coords[0] - A.coords[0], dy = B.coords[1] - A.coords[1];
  return line.through(mid).direction([-dy, dx]);
};

export default segment;