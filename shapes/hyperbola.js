// SENARIOS C3 — 쌍곡선 (hyperbola.center(O).semi(a,b)) : x²/a² − y²/b² = 1 둘(branch)
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';

function pickStyleH(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

function branchPath(c, cx, cy, a, b, h, n, signBran, ySign) {
  const ops = [];
  let started = false;
  const ang = c.angle || 0;
  const ca = Math.cos(ang),
    sa = Math.sin(ang);
  const rot = ([x, y]) => (ang ? [cx + (x - cx) * ca - (y - cy) * sa, cy + (x - cx) * sa + (y - cy) * ca] : [x, y]);
  for (let i = 0; i <= n; i++) {
    const x = a + ((h - a) * i) / n; // a ≤ x ≤ h
    const u = (x * x) / (a * a) - 1;
    if (u < 0) continue;
    const y = b * Math.sqrt(u) * ySign;
    const [px, py] = rot([cx + signBran * x, cy + y]);
    if (!Number.isFinite(px) || !Number.isFinite(py)) {
      started = false;
      continue;
    }
    ops.push({ op: started ? 'L' : 'M', x: px, y: py });
    started = true;
  }
  return node('path', {
    ops,
    color: c.color,
    stroke: c.stroke,
    dash: c.dash,
    opacity: c.opacity,
    style: pickStyleH(c),
  });
}

export class Hyperbola extends Drawable {
  constructor(conf = {}) {
    super('hyperbola', { ...conf });
  }
  get center() {
    return this._conf.center;
  }
  label(l, o) {
    return this.set({ label: l, labelOff: o });
  }

  toIR(ctx) {
    const c = this._conf;
    const [cx, cy] = c.center.coords;
    const a = c.semi[0],
      b = c.semi[1];
    const w = ctx.world;
    const h = Math.max(a * 1.05, Math.max(Math.abs(w.xmin - cx), Math.abs(w.xmax - cx)));
    const n = c.n || 160;
    // 좌우 2 branch, 각각 위/아래 반지
    const out = [];
    out.push(branchPath(c, cx, cy, a, b, h, n, 1, 1));
    out.push(branchPath(c, cx, cy, a, b, h, n, 1, -1));
    out.push(branchPath(c, cx, cy, a, b, h, n, -1, 1));
    out.push(branchPath(c, cx, cy, a, b, h, n, -1, -1));
    return out;
  }
}

export const hyperbola = {
  center(O) {
    return { semi: (a, b) => new Hyperbola({ center: O, semi: [a, b] }) };
  },
  /** `hyperbola.foci(F1, F2).distance(2a)` — 두 초점과 실축 길이(2a)로 정의 */
  foci(F1, F2) {
    return new FociStepH(F1, F2);
  },
};

class FociStepH {
  constructor(F1, F2) {
    this._F1 = F1;
    this._F2 = F2;
  }
  /** 2a (실축 길이). b = √(c² − a²). */
  distance(sum) {
    const [x1, y1] = this._F1.coords,
      [x2, y2] = this._F2.coords;
    const cx = (x1 + x2) / 2,
      cy = (y1 + y2) / 2;
    const c = Math.hypot(x2 - x1, y2 - y1) / 2;
    const a = sum / 2;
    const b = Math.sqrt(Math.max(1e-12, c * c - a * a));
    const angle = Math.atan2(y2 - y1, x2 - x1);
    return new Hyperbola({ center: pointH(cx, cy), semi: [a, b], angle });
  }
  /** 초점 간 거리(2c) 만 주고 a 는 `.semi(a)` 로 — 보조 경로 */
  focalDistance(d2) {
    const [x1, y1] = this._F1.coords,
      [x2, y2] = this._F2.coords;
    const d = Math.hypot(x2 - x1, y2 - y1);
    const k = d2 / (d || 1);
    return new FociStepH(pointH(x1, y1), pointH(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k));
  }
}

function pointH(x, y) {
  return { coords: [x, y], toCartesian: () => ({ x, y }) };
}

export default hyperbola;
