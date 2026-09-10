// DSL.md §4.7 영역 — region.riemann / between …
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';

export class Region extends Drawable {
  constructor(conf = {}) { super('region', { ...conf }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }

  _fn() {
    const f = this._conf.fn;
    if (typeof f === 'function') return f;
    if (f && typeof f.toFunction === 'function') return f.toFunction(this._conf.var || 'x');
    return () => NaN;
  }

  toIR(ctx) {
    const c = this._conf;
    const out = [];
    if (c.mode === 'riemann') {
      const [a, b] = c.domain;
      const n = c.n || 8;
      const w = (b - a) / n;
      const fn = this._fn();
      const rule = c.rule || 'left';
      for (let i = 0; i < n; i++) {
        const x = a + i * w;
        const sx = rule === 'midpoint' ? x + w / 2 : (rule === 'right' ? x + w : x);
        const y = fn(sx);
        if (!Number.isFinite(y)) continue;
        out.push(node('fillrect', {
          x, y0: 0, y1: y, w, fill: c.fill || 'steelblue', opacity: c.opacity || 0.4,
          transforms: c.transforms, style: pickStyle(c),
        }));
      }
    } else if (c.mode === 'between') {
      const [a, b] = c.domain;
      const f = this._conf.f, g = this._conf.g;
      const fFn = toFn(f), gFn = toFn(g);
      const n = 200;
      const ops = [{ op: 'M', x: a, y: fFn(a) }];
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        ops.push({ op: 'L', x, y: fFn(x) });
      }
      const ops2 = [{ op: 'L', x: b, y: gFn(b) }];
      for (let i = n; i >= 0; i--) {
        const x = a + ((b - a) * i) / n;
        ops2.push({ op: 'L', x, y: gFn(x) });
      }
      out.push(node('fillpath', {
        ops: [...ops, ...ops2, { op: 'Z' }],
        fill: c.fill || 'steelblue', opacity: c.opacity || 0.4, style: pickStyle(c),
      }));
    }
    return out;
  }
}

function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}
function toFn(f) { return typeof f === 'function' ? f : (f && f.toFunction ? f.toFunction('x') : (() => f)); }

// ── region 네임스페이스 ───────────────────────────
const empty = { domain: [0, 0] };
export const region = {
  riemann(f) {
    const r = new Region({ mode: 'riemann', fn: f, domain: empty.domain, rule: 'left', fill: 'steelblue', opacity: 0.4 });
    return r;
  },
  between(f, g) { return new Region({ mode: 'between', f, g, domain: empty.domain }); },
};

// .on([a,b]) / .n / .left/.midpoint/.right 등 체이닝
Object.assign(Region.prototype, {
  on(domain) { return this.set({ domain }); },
  n(count) { return this.set({ n: count }); },
  left() { return new Region({ ...this._conf, rule: 'left' }); },
  right() { return new Region({ ...this._conf, rule: 'right' }); },
  midpoint() { return new Region({ ...this._conf, rule: 'midpoint' }); },
  shade(color) { return this.set({ fill: color }); },
});

export default region;