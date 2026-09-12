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
  for (let i = 0; i <= n; i++) {
    const x = a + ((h - a) * i) / n; // a ≤ x ≤ h
    const u = (x * x) / (a * a) - 1;
    if (u < 0) continue;
    const y = b * Math.sqrt(u) * ySign;
    const px = cx + signBran * x,
      py = cy + y;
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
};

export default hyperbola;
