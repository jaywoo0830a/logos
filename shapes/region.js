// DSL.md §4.7 영역 — region.riemann / between / inside / intersect
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';

function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}
function toFn(f) { return typeof f === 'function' ? f : (f && f.toFunction ? f.toFunction('x') : (f && typeof f.eval === 'function' ? (x) => f.eval(x).cart[1] : (() => f))); }

/** between(두 수평선) 영역을 사각 클립 rect 로 → {xmin,ymin,xmax,ymax} 또는 null */
function horizontalStrip(a, b, world) {
  const read = (d) => {
    if (!d || typeof d.pointDir !== 'function') return null;
    const { p, d: dir } = d.pointDir();
    if (Math.abs(dir[1]) < 1e-9) return p[1]; // y = p[1] 수평선
    return null;
  };
  const ya = read(a), yb = read(b);
  if (ya == null || yb == null) return null;
  const ymin = Math.min(ya, yb), ymax = Math.max(ya, yb);
  return { xmin: world.xmin, xmax: world.xmax, ymin, ymax };
}

/** 곡선/도형의 clip 으로 쓰이는 Region 을 사각 rect 로 변환 (I5) */
export function regionRect(region, world) {
  const c = region && region._conf;
  if (!c) return null;
  if (c.mode === 'between') return horizontalStrip(c.a, c.b, world);
  if (c.mode === 'inside') {
    const sh = c.shape;
    if (sh && typeof sh.center === 'function') {
      const [cx, cy] = sh.center();
      const r = sh.radius();
      return { xmin: cx - r, xmax: cx + r, ymin: cy - r, ymax: cy + r };
    }
  }
  return null;
}

export class Region extends Drawable {
  constructor(conf = {}) { super('region', { ...conf }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }

  /** auto-framing 용 경계 (P1-2). 알 수 없으면 null. */
  bounds() {
    const c = this._conf;
    if (c.mode === 'riemann' || c.mode === 'below') {
      const [a, b] = (c.domain && c.domain.length === 2) ? c.domain : [NaN, NaN];
      if (!(b > a)) return null;
      const fn = (c.mode === 'below' && c.curve && typeof c.curve.eval === 'function')
        ? (x) => c.curve.eval(x).cart[1] : this._fn();
      let ymin = 0, ymax = 0;
      for (let i = 0; i <= 40; i++) { const y = fn(a + ((b - a) * i) / 40); if (Number.isFinite(y)) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); } }
      return { xmin: a, xmax: b, ymin, ymax };
    }
    if (c.mode === 'between') {
      const [a, b] = (c.domain && c.domain.length === 2) ? c.domain : [NaN, NaN];
      if (!(b > a)) return null;
      const fFn = toFn(c.a), gFn = toFn(c.b);
      let ymin = Infinity, ymax = -Infinity;
      for (let i = 0; i <= 40; i++) { const x = a + ((b - a) * i) / 40; for (const y of [fFn(x), gFn(x)]) if (Number.isFinite(y)) { ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); } }
      if (!Number.isFinite(ymin)) return null;
      return { xmin: a, xmax: b, ymin, ymax };
    }
    if (c.mode === 'bar') return { xmin: Math.min(c.x0, c.x1), xmax: Math.max(c.x0, c.x1), ymin: Math.min(0, c.y1), ymax: Math.max(0, c.y1) };
    if (c.mode === 'inside') {
      const sh = c.shape;
      if (sh && typeof sh.bounds === 'function') { const b = sh.bounds(); if (b) return b; }
      if (sh && typeof sh.center === 'function' && typeof sh.radius === 'function') { const [qx, qy] = sh.center(); const r = sh.radius(); return { xmin: qx - r, xmax: qx + r, ymin: qy - r, ymax: qy + r }; }
    }
    return null;
  }
  _fn() {
    const f = this._conf.fn;
    if (typeof f === 'function') return f;
    if (f && typeof f.toFunction === 'function') return f.toFunction(this._conf.var || 'x');
    return () => NaN;
  }

  toIR(ctx) {
    const c = this._conf;
    const w = ctx.world;
    if (c.mode === 'riemann') {
      const [a, b] = c.domain;
      const n = c.n || 8;
      const dw = (b - a) / n;
      const fn = this._fn();
      const rule = c.rule || 'left';
      const out = [];
      for (let i = 0; i < n; i++) {
        const x = a + i * dw;
        const sx = rule === 'midpoint' ? x + dw / 2 : (rule === 'right' ? x + dw : x);
        const y = fn(sx);
        if (!Number.isFinite(y)) continue;
        out.push(node('fillrect', { x, y1: y, w: dw, fill: c.fill || 'steelblue', opacity: c.opacity || 0.4, transforms: c.transforms, style: pickStyle(c) }));
      }
      return out;
    }
    if (c.mode === 'inside') {
      const sh = c.shape;
      if (sh && typeof sh.center === 'function' && typeof sh.radius === 'function') {
        const [cx, cy] = sh.center();
        return [node('fillcircle', { cx, cy, r: sh.radius(), fill: c.fill || 'steelblue', opacity: c.opacity || 0.4, style: pickStyle(c) })];
      }
      if (sh && sh.vertices) {
        const ops = sh.vertices.map((p, i) => ({ op: i === 0 ? 'M' : 'L', x: p.coords[0], y: p.coords[1] }));
        return [node('fillpath', { ops: [...ops, { op: 'Z' }], fill: c.fill || 'steelblue', opacity: c.opacity || 0.4, style: pickStyle(c) })];
      }
      return [];
    }
    if (c.mode === 'intersect') {
      const [r1, r2] = c.items;
      const disk = (r) => {
        if (r && r._conf && r._conf.mode === 'inside' && r._conf.shape && typeof r._conf.shape.center === 'function') {
          const [cx, cy] = r._conf.shape.center();
          return { cx, cy, r: r._conf.shape.radius() };
        }
        return null;
      };
      const d1 = disk(r1), d2 = disk(r2);
      if (d1 && d2) {
        return [node('clipfill', { fill: d1, clip: d2, fillColor: c.fill || 'steelblue', opacity: c.opacity || 0.4, style: pickStyle(c) })];
      }
      return [];
    }
    if (c.mode === 'between') {
      const strip = horizontalStrip(c.a, c.b, w);
      if (strip) return [node('cliprect', { ...strip, fill: c.fill, style: pickStyle(c) })];
      // 일반 between (두 곡선/함수 사이)
      const fFn = toFn(c.a), gFn = toFn(c.b);
      const [a, b] = (c.domain && c.domain.length === 2) ? c.domain : [w.xmin, w.xmax];
      const n = 200;
      const ops = [{ op: 'M', x: a, y: fFn(a) }];
      for (let i = 1; i <= n; i++) ops.push({ op: 'L', x: a + ((b - a) * i) / n, y: fFn(a + ((b - a) * i) / n) });
      const ops2 = [{ op: 'L', x: b, y: gFn(b) }];
      for (let i = n - 1; i >= 0; i--) ops2.push({ op: 'L', x: a + ((b - a) * i) / n, y: gFn(a + ((b - a) * i) / n) });
      return [node('fillpath', { ops: [...ops, ...ops2, { op: 'Z' }], fill: c.fill || 'steelblue', opacity: c.opacity || 0.4, style: pickStyle(c) })];
    }
    if (c.mode === 'below') {
      // 곡선 아래(x축 y=0) 음영
      const fn = c.curve && typeof c.curve.eval === 'function' ? (x) => c.curve.eval(x).cart[1] : toFn(c.fn || c.curve);
      const [a, b] = (c.domain && c.domain.length === 2) ? c.domain : [w.xmin, w.xmax];
      const n = 200;
      const ops = [{ op: 'M', x: a, y: 0 }];
      for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; const y = fn(x); ops.push({ op: 'L', x, y }); }
      ops.push({ op: 'L', x: b, y: 0 }, { op: 'Z' });
      return [node('fillpath', { ops, fill: c.fill || 'steelblue', opacity: c.opacity || 0.4, style: pickStyle(c) })];
    }
    if (c.mode === 'bar') {
      return [node('fillrect', { x: Math.min(c.x0, c.x1), y1: c.y1, w: Math.abs(c.x1 - c.x0), fill: c.fill || 'steelblue', opacity: c.opacity || 0.7, style: pickStyle(c) })];
    }
    return [];
  }
}

export const region = {
  riemann(f) { return new Region({ mode: 'riemann', fn: f, domain: [0, 0], rule: 'left', fill: 'steelblue', opacity: 0.4 }); },
  inside(shape) { return new Region({ mode: 'inside', shape, fill: 'steelblue', opacity: 0.4 }); },
  intersect(a, b) { return new Region({ mode: 'intersect', items: [a, b], fill: 'steelblue', opacity: 0.4 }); },
  between(a, b, domain) { return new Region({ mode: 'between', a, b, ...(Array.isArray(domain) ? { domain } : {}) }); },
  below(curveObj) {
    const d = curveObj && curveObj.domain;
    return new Region({ mode: 'below', curve: curveObj, ...(Array.isArray(d) ? { domain: d } : {}) });
  },
  bar(x0, x1, y0, y1) { return new Region({ mode: 'bar', x0, x1, y0, y1, fill: 'steelblue', opacity: 0.7 }); },
};

Object.assign(Region.prototype, {
  on(domain) { return this.set({ domain }); },
  n(count) { return this.set({ n: count }); },
  left() { return new Region({ ...this._conf, rule: 'left' }); },
  right() { return new Region({ ...this._conf, rule: 'right' }); },
  midpoint() { return new Region({ ...this._conf, rule: 'midpoint' }); },
  shade(color) { return this.set({ fill: color }); },
});

export default region;