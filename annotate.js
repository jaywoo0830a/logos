// DSL.md §4.10 주석 — annotate.angle / caption / integral / arrow / dimension
import { Drawable, renderText } from './core/drawable.js';
import { node } from './core/node.js';
import { norm2, perp2 } from './solver/coords.js';
import { point as _point } from './shapes/point.js';

export function annotate() { return new _Annotate(); }
annotate.angle = (A, B, C) => new AngleAnno(A, B, C);
annotate.caption = (text) => new CaptionAnno(text);
annotate.integral = (f) => new IntegralAnno(f);
annotate.arrow = (A, B) => new ArrowAnno(A, B);
annotate.dimension = (A, B) => new DimensionAnno(A, B);
annotate.dot = (P) => new DotAnno(P);

class _Annotate extends Drawable { toIR() { return []; } }

// ── 각도 ─────────────────────────────────────────
export class AngleAnno extends Drawable {
  constructor(A, B, C) {
    super('annotation', { kind: 'angle', A, B, C, arc: { radius: null, double: false }, marker: 'arc' });
  }
  arc(opts = {}) { return this.set({ arc: { ...this._conf.arc, ...opts }, marker: 'arc' }); }
  rightAngle() { return this.set({ marker: 'right' }); }
  degrees() { return this.set({ degrees: true }); }
  radians() { return this.set({ degrees: false }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }

  toIR(ctx) {
    const c = this._conf;
    const w = ctx.world;
    const rad = c.arc.radius || (Math.min(w.xmax - w.xmin, w.ymax - w.ymin) / 8);
    const [bx, by] = c.B.coords;
    const aBA = Math.atan2(c.A.coords[1] - by, c.A.coords[0] - bx);
    const aBC = Math.atan2(c.C.coords[1] - by, c.C.coords[0] - bx);
    const out = [];

    if (c.marker === 'right') {
      const s = rad * 0.6;
      out.push(node('path', {
        ops: [
          { op: 'M', x: bx + Math.cos(aBA) * s, y: by + Math.sin(aBA) * s },
          { op: 'L', x: bx + Math.cos(aBA) * s + Math.cos(aBC) * s, y: by + Math.sin(aBA) * s + Math.sin(aBC) * s },
          { op: 'L', x: bx + Math.cos(aBC) * s, y: by + Math.sin(aBC) * s },
        ],
        color: c.color, stroke: c.stroke, style: pickStyle(c),
      }));
    } else {
      const pts = [];
      const n = 30;
      const start = aBA, spanA = normalizeAngle(aBC - aBA);
      for (let i = 0; i <= n; i++) {
        const a = start + spanA * (i / n);
        pts.push({ op: i === 0 ? 'M' : 'L', x: bx + Math.cos(a) * rad, y: by + Math.sin(a) * rad });
      }
      out.push(node('path', { ops: pts, color: c.color, stroke: c.stroke, style: pickStyle(c) }));
      if (c.degrees) {
        const mid = start + spanA / 2;
        out.push(node('text', { x: bx + Math.cos(mid) * rad * 1.5, y: by + Math.sin(mid) * rad * 1.5, text: '°', anchor: 'middle' }));
      }
    }
    return out;
  }
}
function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
// ── 캡션 ─────────────────────────────────────────
export class CaptionAnno extends Drawable {
  constructor(text) { super('annotation', { kind: 'caption', text }); }
  toIR(ctx) {
    const w = ctx.world;
    return [node('text', {
      x: (w.xmin + w.xmax) / 2, y: w.ymax - (w.ymax - w.ymin) * 0.06,
      text: renderText(this._conf.text), anchor: 'middle', caption: true, color: this._conf.color,
    })];
  }
}

// ── 정적분 ───────────────────────────────────────
export class IntegralAnno extends Drawable {
  constructor(f) { super('annotation', { kind: 'integral', fn: f }); }
  from(a) { return new IntegralAnno2({ ...this._conf, from: a }); }
  to(b) { return new IntegralAnno2({ ...this._conf, to: b }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }
  shade(color) { return this.set({ fill: color }); }
  toIR(ctx) { return this._conf.to !== undefined ? renderIntegral(this._conf, ctx) : []; }
}
class IntegralAnno2 extends IntegralAnno {
  constructor(conf) { super(conf.fn); this._conf = { ...conf }; }
  to(b) { return new IntegralAnno2({ ...this._conf, to: b }); }
  from(a) { return new IntegralAnno2({ ...this._conf, from: a }); }
}
function renderIntegral(c, ctx) {
  const w = ctx.world;
  const out = [];
  if (c.to === undefined) return out;
  const fn = typeof c.fn === 'function' ? c.fn : (c.fn && c.fn.toFunction ? c.fn.toFunction('x') : (() => NaN));
  if (c.fill) {
    const n = 200;
    const ops = [{ op: 'M', x: c.from, y: 0 }];
    for (let i = 0; i <= n; i++) {
      const x = c.from + ((c.to - c.from) * i) / n;
      ops.push({ op: 'L', x, y: fn(x) });
    }
    out.push(node('fillpath', { ops: [...ops, { op: 'L', x: c.to, y: 0 }, { op: 'Z' }], fill: c.fill, opacity: c.opacity || 0.35 }));
  }
  if (c.label) {
    const midX = (c.from + c.to) / 2;
    const y = Math.max(fn(c.from), fn(c.to), fn(midX), 0);
    out.push(node('text', { x: midX, y: y + (w.ymax - w.ymin) * 0.1, text: renderText(c.label), anchor: 'middle' }));
  }
  return out;
}

// ── 화살표 ───────────────────────────────────────
export class ArrowAnno extends Drawable {
  constructor(A, B) { super('annotation', { kind: 'arrow', A, B }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }
  toIR() {
    const c = this._conf;
    const [x1, y1] = c.A.coords, [x2, y2] = c.B.coords;
    return [node('arrow', {
      x1, y1, x2, y2, label: renderText(c.label),
      color: c.color, stroke: c.stroke, dash: c.dash, transforms: c.transforms,
      headless: c.headless,
    })];
  }
}

// ── 치수선 ───────────────────────────────────────
export class DimensionAnno extends Drawable {
  constructor(A, B) { super('annotation', { kind: 'dimension', A, B, offset: 0.5 }); }
  offset(o) { return this.set({ offset: o }); }
  units(u) { return this.set({ units: u }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }
  toIR(ctx) {
    const c = this._conf;
    const [x1, y1] = c.A.coords, [x2, y2] = c.B.coords;
    const len = norm2([x2 - x1, y2 - y1]) || 1;
    const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
    const off = c.offset;
    const [ox, oy] = perp2([ux, uy]);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const label = (c.label ? renderText(c.label) : '') + (c.units ? ` ${c.units}` : '');
    return [
      node('arrow', { x1: x1 + ox * off, y1: y1 + oy * off, x2: x2 + ox * off, y2: y2 + oy * off, color: c.color, headless: true }),
      node('path', { ops: [
        { op: 'M', x: x1, y: y1 }, { op: 'L', x: x1 + ox * off, y: y1 + oy * off },
        { op: 'M', x: x2, y: y2 }, { op: 'L', x: x2 + ox * off, y: y2 + oy * off },
      ], color: c.color }),
      ...(label ? [node('text', { x: mx + ox * off * 0.7, y: my + oy * off * 0.7, text: label, anchor: 'middle' })] : []),
    ];
  }
}

// ── 점 마킹 ──────────────────────────────────────
export class DotAnno extends Drawable {
  constructor(P) { super('annotation', { kind: 'dot', P }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }
  toIR(ctx) {
    return _point(ctx.world.xmin, ctx.world.ymin).label(this._conf.label).dot().toIR();
  }
}

function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}
export default annotate;