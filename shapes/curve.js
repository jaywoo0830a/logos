// DSL.md §4.4 곡선 — curve.fn / parametric / polar …
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { TAU, polarToCart } from '../solver/coords.js';

const KIND = { FN: 'fn', PARAM: 'parametric', POLAR: 'polar' };

export class Curve extends Drawable {
  constructor(conf = {}) {
    super('curve', { ...conf });
  }

  get kind() { return this._conf.kind; }
  get domain() { return this._conf.domain || [0, TAU]; }
  label(l, off) { return this.set({ label: l, labelOff: off }); }

  /** 내부 함수 (Sym → toFunction) */
  _fn() {
    const f = this._conf.fn;
    if (typeof f === 'function') return f;
    if (f && typeof f.toFunction === 'function') return f.toFunction(this._conf.var || 'x');
    if (typeof f === 'number') return () => f;
    return () => NaN;
  }

  /** 파라메트릭 t 에서 한 점 → { cart, cs, raw } */
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
    // fn
    return { cart: [t, this._fn()(t)], cs: 'cartesian' };
  }

  /** 샘플링된 cartesian 점들 */
  sample() {
    const [a, b] = this.domain;
    const n = this._conf.n || 220;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = a + ((b - a) * i) / n;
      const v = this.eval(t);
      if (Number.isFinite(v.cart[0]) && Number.isFinite(v.cart[1])) pts.push(v.cart);
    }
    return pts;
  }

  toIR(ctx) {
    const c = this._conf;
    const pts = this.sample();
    if (pts.length < 2) return [];
    const ops = [{ op: 'M', x: pts[0][0], y: pts[0][1] }];
    for (let i = 1; i < pts.length; i++) ops.push({ op: 'L', x: pts[i][0], y: pts[i][1] });
    const out = [node('path', {
      ops,
      color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity,
      transforms: c.transforms,
      label: renderText(c.label),
      style: pickStyle(c),
    })];
    // 라벨은 끝점 근처에 배치
    if (c.label) {
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const ex = (last[0] - prev[0]), ey = (last[1] - prev[1]);
      const el = Math.hypot(ex, ey) || 1;
      out.push(node('text', {
        x: last[0] + (ex / el) * 0.3, y: last[1] + (ey / el) * 0.3 + 0.15,
        text: renderText(c.label), anchor: 'start',
        color: c.color,
      }));
    }
    return out;
  }
}

export function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

// ── curve 네임스페이스 ───────────────────────────
export const curve = {
  fn(f, opts = {}) { return new Curve({ kind: KIND.FN, fn: f, var: opts.var }); },
  polar(f) { return new Curve({ kind: KIND.POLAR, fn: f, domain: [0, TAU] }); },
  parametric(f) { return new Curve({ kind: KIND.PARAM, fn: f }); },
  bezier(P0, P1, P2, P3) {
    return new Curve({
      kind: KIND.PARAM,
      fn: (t) => {
        const u = 1 - t;
        const b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
        const x = b0 * P0.coords[0] + b1 * P1.coords[0] + b2 * P2.coords[0] + b3 * P3.coords[0];
        const y = b0 * P0.coords[1] + b1 * P1.coords[1] + b2 * P2.coords[1] + b3 * P3.coords[1];
        return [x, y];
      },
      domain: [0, 1],
    });
  },
};

// ── 체이닝: .on() / .n() ─────────────────────────
Object.assign(Curve.prototype, {
  on(domain) { return this.set({ domain }); },
  n(count) { return this.set({ n: count }); },
});

export default curve;