// DSL.md §4.5 원 — circle.center(O).radius(r) / through / inscribed …
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { norm2 } from '../solver/coords.js';
import { point as _point, triangleCenter } from './point.js';

export class Circle extends Drawable {
  constructor(conf = {}) { super('circle', { ...conf }); }
  center() { return this._conf.center.coords; }
  radius() { return this._conf.radius; }
  label(l, off) { return this.set({ label: l, labelOff: off }); }

  toIR(ctx) {
    const c = this._conf;
    const [cx, cy] = c.center.coords;
    return [node('circle', {
      cx, cy, r: c.radius,
      color: c.color, stroke: c.stroke, fill: c.fill, dash: c.dash, opacity: c.opacity,
      gradient: c.gradient, transforms: c.transforms,
      label: renderText(c.label),
      style: pickStyle(c),
    })];
  }
}

export function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

// ── circle 네임스페이스 ───────────────────────────
export const circle = {
  center(O) {
    return new CircleBuilder(O).center();
  },
  through(A, B, C) {
    if (A && B && C) return circumcircle(A, B, C);
    return null;
  },
  inscribed(tri) {
    const [A, B, C] = tri.vertices;
    const I = triangleCenter(A, B, C);
    // 반지름 = 내심에서 한 변까지의 거리
    const r = distToSide(I, A, B);
    return new Circle({ center: I, radius: r });
  },
  unit() { return new Circle({ center: _point(0, 0), radius: 1 }); },
};

class CircleBuilder {
  constructor(O) { this._O = O; }
  center() { return new CenterStep(this._O); }
}
class CenterStep {
  constructor(O) { this._O = O; }
  radius(r) { return new Circle({ center: this._O, radius: r }); }
  through(P) {
    const r = norm2([P.coords[0] - this._O.coords[0], P.coords[1] - this._O.coords[1]]);
    return new Circle({ center: this._O, radius: r });
  }
  diameter(A, B) {
    return new Circle({ center: this._O, radius: norm2([B.coords[0] - A.coords[0], B.coords[1] - A.coords[1]]) / 2 });
  }
}

function distToSide(P, A, B) {
  const dx = B.coords[0] - A.coords[0], dy = B.coords[1] - A.coords[1];
  const px = P.coords[0] - A.coords[0], py = P.coords[1] - A.coords[1];
  return Math.abs(dx * py - px * dy) / (norm2([dx, dy]) || 1e-12);
}

/** 외접원 */
function circumcircle(A, B, C) {
  const x1 = A.coords[0], y1 = A.coords[1];
  const x2 = B.coords[0], y2 = B.coords[1];
  const x3 = C.coords[0], y3 = C.coords[1];
  const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
  if (Math.abs(d) < 1e-12) return null;
  const ux = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / d;
  const uy = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / d;
  const r = norm2([x1 - ux, y1 - uy]);
  return new Circle({ center: _point(ux, uy), radius: r });
}

export default circle;