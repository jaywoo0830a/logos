// DSL.md §4.4 곡선 — curve.fn / parametric / polar / implicit
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { TAU, polarToCart } from '../solver/coords.js';

const KIND = { FN: 'fn', PARAM: 'parametric', POLAR: 'polar', IMPLICIT: 'implicit' };

export function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

/** B5 — 음함수 곡선: marching squares contour */
function implicitIR(curve, ctx) {
  const c = curve._conf;
  const f = typeof c.fn === 'function' ? c.fn : (() => 0);
  const w = ctx.world;
  const res = c.resolution || 80;
  const xmin = w.xmin, xmax = w.xmax, ymin = w.ymin, ymax = w.ymax;
  const nx = res;
  const ny = Math.max(2, Math.round(res * (ymax - ymin) / (xmax - xmin)));
  const dx = (xmax - xmin) / nx, dy = (ymax - ymin) / ny;
  const interp = (a, b, va, vb) => {
    const t = va / (va - vb);
    return a + (b - a) * (Number.isFinite(t) ? t : 0.5);
  };
  const segs = [];
  for (let j = 0; j < ny; j++) {
    const y = ymin + dy * j;
    for (let i = 0; i < nx; i++) {
      const x = xmin + dx * i;
      const v00 = f(x, y), v10 = f(x + dx, y), v11 = f(x + dx, y + dy), v01 = f(x, y + dy);
      const s = (z) => (Number.isNaN(z) ? 0 : Math.sign(z));
      const s00 = s(v00), s10 = s(v10), s11 = s(v11), s01 = s(v01);
      if (s00 !== s10) {
        const tx = interp(x, x + dx, v00, v10);
        if (s00 !== s01) { const ty = interp(y, y + dy, v00, v01); segs.push([[tx, y], [x, ty]]); }
        if (s11 !== s01) { const ty = interp(y, y + dy, v01, v11); segs.push([[tx, y], [x + dx, ty]]); }
      }
      if (s00 !== s01) {
        const ty = interp(y, y + dy, v00, v01);
        if (s10 !== s11) { const ty2 = interp(y, y + dy, v10, v11); segs.push([[x, ty], [x + dx, ty2]]); }
      }
    }
  }
  const nodes = [];
  for (const [[x1, y1], [x2, y2]] of segs) {
    nodes.push(node('path', {
      ops: [{ op: 'M', x: x1, y: y1 }, { op: 'L', x: x2, y: y2 }],
      color: c.color, stroke: c.stroke, opacity: c.opacity, style: pickStyle(c),
    }));
  }
  return nodes;
}

export class Curve extends Drawable {
  constructor(conf = {}) { super('curve', { ...conf }); }
  get kind() { return this._conf.kind; }
  get domain() { return this._conf.domain || [0, TAU]; }
  label(l, off) { return this.set({ label: l, labelOff: off }); }

  _fn() {
    const f = this._conf.fn;
    if (typeof f === 'function') return f;
    if (f && typeof f.toFunction === 'function') return f.toFunction(this._conf.var || 'x');
    if (typeof f === 'number') return () => f;
    return () => NaN;
  }

  eval(t) {
    const c = this._conf;
    if (c.kind === KIND.POLAR) {
      const r = this._fn()(t);
      const [x, y] = polarToCart(r, t);
      return { cart: [x, y], cs: 'polar', raw: { r, theta: t } };
    }
    if (c.kind === KIND.PARAM) {
      const [x, y] = c.fn(t);
      return { cart: [x, y], cs: 'cartesian' };
    }
    return { cart: [t, this._fn()(t)], cs: 'cartesian' };
  }

  sample() {
    const [a, b] = this.domain;
    const n = this._conf.n || 220;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const v = this.eval(a + ((b - a) * i) / n);
      if (Number.isFinite(v.cart[0]) && Number.isFinite(v.cart[1])) pts.push(v.cart);
    }
    return pts;
  }

  /** 불연속점에서 path 를 끊은 segment 배열 (B4) */
  segments() {
    const [a, b] = this.domain;
    const n = this._conf.n || 220;
    const w = b - a;
    const jumpThreshold = w;
    const out = [];
    let cur = null;
    const fin = (p) => Number.isFinite(p[0]) && Number.isFinite(p[1]);
    for (let i = 0; i <= n; i++) {
      const p = this.eval(a + (w * i) / n).cart;
      if (!fin(p)) { if (cur) { out.push(cur); cur = null; } continue; }
      if (cur && cur.length) {
        const prev = cur[cur.length - 1];
        if (Math.abs(p[1] - prev[1]) > jumpThreshold || Math.abs(p[0] - prev[0]) > w * 2) {
          out.push(cur); cur = [p]; continue;
        }
      }
      if (!cur) cur = [];
      cur.push(p);
    }
    if (cur) out.push(cur);
    return out.filter((s) => s.length >= 2);
  }

  toIR(ctx) {
    const c = this._conf;
    if (c.kind === KIND.IMPLICIT) return implicitIR(this, ctx);
    const out = [];
    for (const pts of this.segments()) {
      const ops = [{ op: 'M', x: pts[0][0], y: pts[0][1] }];
      for (let i = 1; i < pts.length; i++) ops.push({ op: 'L', x: pts[i][0], y: pts[i][1] });
      out.push(node('path', {
        ops, color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity,
        transforms: c.transforms, clip: c.clip, style: pickStyle(c),
      }));
    }
    if (c.label && this.segments().length) {
      const L = c.label;
      const segs = this.segments();
      const pts = segs[segs.length - 1];
      if (pts.length >= 2) {
        const last = pts[pts.length - 1], prev = pts[pts.length - 2];
        const ex = last[0] - prev[0], ey = last[1] - prev[1];
        const el = Math.hypot(ex, ey) || 1;
        out.push(node('text', {
          x: last[0] + (ex / el) * 0.3, y: last[1] + (ey / el) * 0.3 + 0.15,
          text: renderText(L), anchor: 'start',
          color: c.color, math: typeof L?.toLatex === 'function',
        }));
      }
    }
    return out;
  }
}

// ── curve 네임스페이스 ───────────────────────────
export const curve = {
  fn(f, opts = {}) { return new Curve({ kind: KIND.FN, fn: f, var: opts.var }); },
  polar(f) { return new Curve({ kind: KIND.POLAR, fn: f, domain: [0, TAU] }); },
  parametric(f) { return new Curve({ kind: KIND.PARAM, fn: f }); },
  implicit(f, opts = {}) { return new Curve({ kind: KIND.IMPLICIT, fn: f, resolution: opts.resolution }); },
  bezier(P0, P1, P2, P3) {
    return new Curve({
      kind: KIND.PARAM,
      fn: (t) => {
        const u = 1 - t;
        const b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
        const xx = b[0] * P0.coords[0] + b[1] * P1.coords[0] + b[2] * P2.coords[0] + b[3] * P3.coords[0];
        const yy = b[0] * P0.coords[1] + b[1] * P1.coords[1] + b[2] * P2.coords[1] + b[3] * P3.coords[1];
        return [xx, yy];
      },
      domain: [0, 1],
    });
  },
};

Object.assign(Curve.prototype, {
  on(domain) { return this.set({ domain }); },
  n(count) { return this.set({ n: count }); },
  resolution(r) { return this.set({ resolution: r }); },
});

export default curve;