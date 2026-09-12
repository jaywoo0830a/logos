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

/**
 * B5 — 음함수 곡선: 표준 marching squares + 세그먼트 스티칭.
 * 셀별 2점 path 를 난발하던 이전 구현을 폴리라인(가능하면 폐합)으로 병합한다.
 * @param {number} [curve._conf.resolution] 그리드 해상도(기본 100)
 */
function implicitIR(curve, ctx) {
  const c = curve._conf;
  const f = typeof c.fn === 'function' ? c.fn : () => 0;
  const w = ctx.world;
  const res = c.resolution || 100;
  const xmin = w.xmin,
    xmax = w.xmax,
    ymin = w.ymin,
    ymax = w.ymax;
  const nx = res;
  const ny = Math.max(2, Math.round((res * (ymax - ymin)) / (xmax - xmin)));
  const dx = (xmax - xmin) / nx,
    dy = (ymax - ymin) / ny;
  const val = (i, j) => {
    const z = f(xmin + dx * i, ymin + dy * j);
    return Number.isFinite(z) ? z : 0;
  };
  const lerp = (va, vb) => {
    const t = va / (va - vb);
    return Number.isFinite(t) ? t : 0.5;
  };
  // 셀 코너: a=TL(bit0) b=TR(bit1) cc=BR(bit2) d=BL(bit3)
  // 엣지: 0=top 1=right 2=bottom 3=left
  const SEG = {
    1: [[3, 0]],
    2: [[0, 1]],
    3: [[3, 1]],
    4: [[1, 2]],
    5: [
      [3, 2],
      [0, 1],
    ],
    6: [[0, 2]],
    7: [[3, 2]],
    8: [[2, 3]],
    9: [[0, 2]],
    10: [
      [0, 3],
      [1, 2],
    ],
    11: [[1, 2]],
    12: [[3, 1]],
    13: [[0, 1]],
    14: [[3, 0]],
  };
  const edge = (i, j, e, a, b, cc, d) => {
    switch (e) {
      case 0: {
        const t = lerp(a, b);
        return [xmin + dx * (i + t), ymin + dy * j];
      }
      case 1: {
        const t = lerp(b, cc);
        return [xmin + dx * (i + 1), ymin + dy * (j + t)];
      }
      case 2: {
        const t = lerp(d, cc);
        return [xmin + dx * (i + t), ymin + dy * (j + 1)];
      }
      default: {
        const t = lerp(a, d);
        return [xmin + dx * i, ymin + dy * (j + t)];
      }
    }
  };
  const V = [];
  for (let j = 0; j <= ny; j++) {
    const row = [];
    for (let i = 0; i <= nx; i++) row.push(val(i, j));
    V.push(row);
  }
  const segs = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = V[j][i],
        b = V[j][i + 1],
        cc = V[j + 1][i + 1],
        d = V[j + 1][i];
      const idx = (a > 0 ? 1 : 0) | (b > 0 ? 2 : 0) | (cc > 0 ? 4 : 0) | (d > 0 ? 8 : 0);
      const cases = SEG[idx];
      if (!cases) continue;
      for (const [e1, e2] of cases) segs.push([edge(i, j, e1, a, b, cc, d), edge(i, j, e2, a, b, cc, d)]);
    }
  }
  // 스티칭 → 폴리라인
  const keyOf = (p) => `${Math.round((p[0] / dx) * 8)},${Math.round((p[1] / dy) * 8)}`;
  const adj = new Map();
  segs.forEach((s, si) => {
    for (const end of [0, 1]) {
      const k = keyOf(s[end]);
      if (!adj.has(k)) adj.set(k, []);
      adj.get(k).push({ si, end });
    }
  });
  const used = new Array(segs.length).fill(false);
  const out = [];
  for (let si = 0; si < segs.length; si++) {
    if (used[si]) continue;
    used[si] = true;
    const poly = [segs[si][0], segs[si][1]];
    for (const dir of ['tail', 'head']) {
      let ext = true;
      while (ext) {
        ext = false;
        const ref = dir === 'tail' ? poly[poly.length - 1] : poly[0];
        const lst = adj.get(keyOf(ref)) || [];
        for (const { si: sj, end } of lst) {
          if (used[sj]) continue;
          used[sj] = true;
          const other = segs[sj][1 - end];
          if (dir === 'tail') poly.push(other);
          else poly.unshift(other);
          ext = true;
          break;
        }
      }
    }
    if (poly.length < 2) continue;
    const ops = [{ op: 'M', x: poly[0][0], y: poly[0][1] }];
    for (let k = 1; k < poly.length; k++) ops.push({ op: 'L', x: poly[k][0], y: poly[k][1] });
    const first = poly[0],
      last = poly[poly.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) < Math.hypot(dx, dy) * 0.9) ops.push({ op: 'Z' });
    out.push(node('path', { ops, color: c.color, stroke: c.stroke, opacity: c.opacity, style: pickStyle(c) }));
  }
  return out;
}

export class Curve extends Drawable {
  constructor(conf = {}) {
    super('curve', { ...conf });
  }
  get kind() {
    return this._conf.kind;
  }
  get domain() {
    return this._conf.domain || [0, TAU];
  }
  label(l, off) {
    return this.set({ label: l, labelOff: off });
  }

  /** auto-framing 경계 (P1-2). implicit 은 사용자가 box 를 주지 않으면 [-2,2]² 로 가정. */
  bounds() {
    const c = this._conf;
    if (c.kind === KIND.IMPLICIT) return c.box || { xmin: -2, xmax: 2, ymin: -2, ymax: 2 };
    return null;
  }

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

  /** auto-framing 용: 균일 샘플(유한값만). */
  sample() {
    const [a, b] = this.domain;
    const n = this._conf.n || 120;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const v = this.eval(a + ((b - a) * i) / n);
      if (Number.isFinite(v.cart[0]) && Number.isFinite(v.cart[1])) pts.push(v.cart);
    }
    return pts;
  }

  /**
   * P2-1/P2-2: 곡률 기반 adaptive 세분화 + 화면공간 불연속 검출 →
   * 연속 구간(segment)들의 점 리스트.
   * @param {Object} [ctx] { world } — 있으면 점프 임계/허용오차를 화면 기준으로 잡는다.
   */
  segments(ctx) {
    const c = this._conf;
    const [a, b] = this.domain;
    const w = b - a;
    const view = ctx && ctx.world;
    const spanY = view ? Math.abs(view.ymax - view.ymin) : 0;
    const spanX = view ? Math.abs(view.xmax - view.xmin) : Math.abs(w) || 1;
    // 화면 기준: 뷰 높이의 절반을 넘는 y 점프는 불연속으로 본다(step·asymptote 공통 안전).
    const jumpThreshold = spanY > 0 ? spanY * 0.5 : Math.abs(w) || 1;
    const tol = (spanY > 0 ? spanY : Math.abs(w) || 1) / 1500; // ≈ 0.4px @600px
    const maxDepth = c.depth || 6;
    const fin = (p) => Number.isFinite(p[0]) && Number.isFinite(p[1]);
    const fAt = (t) => this.eval(t).cart;

    const out = [];
    let cur = null;
    const flush = () => {
      if (cur && cur.length >= 2) out.push(cur);
      cur = null;
    };
    const feed = (p) => {
      if (!fin(p)) {
        flush();
        return;
      }
      if (cur && cur.length) {
        const prev = cur[cur.length - 1];
        if (Math.abs(p[1] - prev[1]) > jumpThreshold || Math.abs(p[0] - prev[0]) > spanX * 2) flush();
      }
      if (!cur) cur = [];
      cur.push(p);
    };
    const rec = (t0, p0, t1, p1, depth) => {
      const tm = (t0 + t1) / 2;
      const pm = fAt(tm);
      if (!fin(pm)) {
        feed(p1);
        return;
      }
      const dev = Math.hypot(pm[0] - (p0[0] + p1[0]) / 2, pm[1] - (p0[1] + p1[1]) / 2);
      const segLen = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      if (depth > 0 && dev > tol && segLen > tol) {
        rec(t0, p0, tm, pm, depth - 1);
        rec(tm, pm, t1, p1, depth - 1);
      } else {
        feed(p1);
      }
    };

    const base = c.n || 64;
    let pt = fAt(a);
    feed(pt);
    let prevT = a;
    for (let i = 1; i <= base; i++) {
      const t = a + (w * i) / base;
      const p = fAt(t);
      if (fin(pt) && fin(p)) rec(prevT, pt, t, p, maxDepth);
      else feed(p);
      prevT = t;
      pt = p;
    }
    flush();
    return out.filter((s) => s.length >= 2);
  }

  toIR(ctx) {
    const c = this._conf;
    if (c.kind === KIND.IMPLICIT) return implicitIR(this, ctx);
    const out = [];
    const segs = this.segments(ctx);
    for (const pts of segs) {
      const ops = [{ op: 'M', x: pts[0][0], y: pts[0][1] }];
      for (let i = 1; i < pts.length; i++) ops.push({ op: 'L', x: pts[i][0], y: pts[i][1] });
      out.push(
        node('path', {
          ops,
          color: c.color,
          stroke: c.stroke,
          dash: c.dash,
          opacity: c.opacity,
          transforms: c.transforms,
          clip: c.clip,
          style: pickStyle(c),
        }),
      );
    }
    if (c.label && segs.length) {
      const L = c.label;
      const pts = segs[segs.length - 1];
      if (pts.length >= 2) {
        const last = pts[pts.length - 1],
          prev = pts[pts.length - 2];
        const ex = last[0] - prev[0],
          ey = last[1] - prev[1];
        const el = Math.hypot(ex, ey) || 1;
        const vw = ctx && ctx.world;
        const spanX = vw ? vw.xmax - vw.xmin : 1;
        const spanY = vw ? vw.ymax - vw.ymin : 1;
        out.push(
          node('text', {
            x: last[0] + (ex / el) * spanX * 0.01,
            y: last[1] + (ey / el) * spanY * 0.01,
            dxPx: 6,
            dyPx: -6,
            text: renderText(L),
            anchor: 'start',
            color: c.color,
            math: typeof L?.toLatex === 'function',
          }),
        );
      }
    }
    return out;
  }
}

// ── curve 네임스페이스 ───────────────────────────
export const curve = {
  fn(f, opts = {}) {
    return new Curve({ kind: KIND.FN, fn: f, var: opts.var });
  },
  polar(f) {
    return new Curve({ kind: KIND.POLAR, fn: f, domain: [0, TAU] });
  },
  parametric(f) {
    return new Curve({ kind: KIND.PARAM, fn: f });
  },
  implicit(f, opts = {}) {
    return new Curve({ kind: KIND.IMPLICIT, fn: f, resolution: opts.resolution });
  },
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
  on(domain) {
    return this.set({ domain });
  },
  n(count) {
    return this.set({ n: count });
  },
  resolution(r) {
    return this.set({ resolution: r });
  },
});

export default curve;
