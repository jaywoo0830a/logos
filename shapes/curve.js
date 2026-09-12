// DSL.md §4.4 곡선 — curve.fn / parametric / polar / implicit / piecewise / spline / ode / taylor
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { TAU, polarToCart } from '../solver/coords.js';
import { point as _point } from './point.js';
import { line as _line } from './line.js';

const KIND = {
  FN: 'fn',
  PARAM: 'parametric',
  POLAR: 'polar',
  IMPLICIT: 'implicit',
  PIECEWISE: 'piecewise',
  SPLINE: 'spline',
  ODE: 'ode',
  TAYLOR: 'taylor',
};

/** 함수/심볼릭(Sym)·상수 어디든 1변수 함수로 만든다. */
export function asFn(f, v = 'x') {
  if (typeof f === 'function') return f;
  if (f && typeof f.toFunction === 'function') return f.toFunction(v);
  if (typeof f === 'number') return () => f;
  return () => NaN;
}

/** 2변수 함수(x, y)로 — ODE `dy` 용. Sym 은 y 를 수치 치환해 쓴다. */
function asFn2(g) {
  if (typeof g === 'function') return g;
  if (g && typeof g.substitute === 'function' && typeof g.toFunction === 'function')
    return (x, y) => g.substitute({ y }).toFunction('x')(x);
  if (g && typeof g.toFunction === 'function') return (x) => g.toFunction('x')(x);
  return () => NaN;
}

const xyOf = (p) =>
  p && Array.isArray(p.coords) ? p.coords.slice(0, 2) : Array.isArray(p) ? [p[0], p[1]] : [NaN, NaN];

/**
 * Catmull–Rom 스플라인 보간 — 점들을 **지나가는** 곡선.
 * @param {Array<[number,number]>} pts 정규화된 좌표열
 * @param {number} t [0, n-1] 구간의 매개변수
 * @param {number} tension 0.5 = 표준 Catmull–Rom (작을수록 팽팽)
 */
function splineAt(pts, t, tension = 0.5) {
  const n = pts.length;
  if (!n) return [NaN, NaN];
  if (n === 1) return pts[0];
  const i = Math.max(0, Math.min(Math.floor(t), n - 2));
  const u = t - i;
  const p0 = pts[Math.max(0, i - 1)],
    p1 = pts[i],
    p2 = pts[i + 1],
    p3 = pts[Math.min(n - 1, i + 2)];
  const m1 = [(p2[0] - p0[0]) * tension, (p2[1] - p0[1]) * tension];
  const m2 = [(p3[0] - p1[0]) * tension, (p3[1] - p1[1]) * tension];
  const u2 = u * u,
    u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1,
    h10 = u3 - 2 * u2 + u,
    h01 = -2 * u3 + 3 * u2,
    h11 = u3 - u2;
  return [h00 * p1[0] + h10 * m1[0] + h01 * p2[0] + h11 * m2[0], h00 * p1[1] + h10 * m1[1] + h01 * p2[1] + h11 * m2[1]];
}

/** 중심 차분으로 k계 도함수 → 테일러 계수(f^(k)(at)/k!) */
function fdTaylorCoeff(g, at, k, h) {
  // f^(k)(x) ≈ Σ (-1)^i C(k,i) f(x + (k/2 - i)h) / h^k
  let sum = 0;
  let binom = 1;
  for (let i = 0; i <= k; i++) {
    const v = g(at + (k / 2 - i) * h);
    sum += (i % 2 ? -1 : 1) * binom * (Number.isFinite(v) ? v : 0);
    binom = (binom * (k - i)) / (i + 1);
  }
  let fact = 1;
  for (let j = 2; j <= k; j++) fact *= j;
  return sum / h ** k / fact;
}

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
    // 구간별 함수 — 구간 밖은 NaN(불연속 → segments 가 끊어 그린다)
    if (c.kind === KIND.PIECEWISE) {
      for (const s of c.segs) if (t >= s.a - 1e-12 && t <= s.b + 1e-12) return { cart: [t, s.fn(t)], cs: 'cartesian' };
      return { cart: [t, NaN], cs: 'cartesian' };
    }
    if (c.kind === KIND.SPLINE) return { cart: splineAt(c.pts, t, c.tension ?? 0.5), cs: 'cartesian' };
    if (c.kind === KIND.ODE) return { cart: this._odeAt(t), cs: 'cartesian' };
    if (c.kind === KIND.TAYLOR) {
      const { at, coeffs } = c;
      let y = 0;
      for (let k = coeffs.length - 1; k >= 0; k--) y = y * (t - at) + coeffs[k]; // Horner
      return { cart: [t, y], cs: 'cartesian' };
    }
    return { cart: [t, this._fn()(t)], cs: 'cartesian' };
  }

  /**
   * `curve.ode({ dy, y0 })` — 고전 RUNGE–KUTTA 4차 적분.
   * 구간(domain)이 바뀌면 다시 푼다(곡선은 불변, 결과만 캐시).
   */
  _odeSolve() {
    const c = this._conf;
    const [a, b] = this.domain;
    const key = `${a}:${b}`;
    if (this._odeCache && this._odeCache.key === key) return this._odeCache.pts;
    const dy = asFn2(c.dy);
    const n = Math.max(4, c.n || 400);
    const h = (b - a) / n;
    let y = c.y0 ?? 0;
    const pts = [[a, y]];
    for (let i = 0; i < n; i++) {
      const x = a + h * i;
      const k1 = dy(x, y);
      const k2 = dy(x + h / 2, y + (h * k1) / 2);
      const k3 = dy(x + h / 2, y + (h * k2) / 2);
      const k4 = dy(x + h, y + h * k3);
      y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      pts.push([a + h * (i + 1), y]);
    }
    this._odeCache = { key, pts };
    return pts;
  }

  /** ODE 해 폴리라인의 선형 보간(구간 밖은 외삽하지 않고 NaN). */
  _odeAt(t) {
    const pts = this._odeSolve();
    const [a, b] = this.domain;
    if (!(t >= a && t <= b)) return [t, NaN];
    const n = pts.length - 1;
    const u = ((t - a) / (b - a)) * n;
    const i = Math.max(0, Math.min(Math.floor(u), n - 1));
    const f = u - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
  }

  /** 접선/법선용 — 매개변수에 대한 수치 미분(단위벡터). */
  _rate(t) {
    const [a, b] = this.domain;
    const h = Math.max(Math.abs(b - a) / 1000, 1e-9);
    const p0 = this.eval(Math.max(a, t - h)).cart;
    const p1 = this.eval(Math.min(b, t + h)).cart;
    const d = [p1[0] - p0[0], p1[1] - p0[1]];
    const L = Math.hypot(d[0], d[1]) || 1;
    return [d[0] / L, d[1] / L];
  }

  /** `t` 에서의 접선 (Line) */
  tangentAt(t) {
    const [x, y] = this.eval(t).cart;
    const [dx, dy] = this._rate(t);
    return _line.through(_point(x - dx, y - dy), _point(x + dx, y + dy));
  }

  /** `t` 에서의 법선 (Line) */
  normalAt(t) {
    const [x, y] = this.eval(t).cart;
    const [dx, dy] = this._rate(t);
    const nx = -dy,
      ny = dx;
    return _line.through(_point(x - nx, y - ny), _point(x + nx, y + ny));
  }

  /** 호 길이 — 수치 적분(정밀 샘플 합). 기본은 전체 구간. */
  arcLength(opts = {}) {
    const [a, b] = this.domain;
    const from = opts.from ?? a,
      to = opts.to ?? b;
    const n = Math.max(20, opts.n || 2000);
    let L = 0;
    let prev = this.eval(from).cart;
    for (let i = 1; i <= n; i++) {
      const p = this.eval(from + ((to - from) * i) / n).cart;
      if (Number.isFinite(prev[0]) && Number.isFinite(p[0])) L += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
    }
    return L;
  }

  /** 곡률 κ = |x′y″ − y′x″| / (x′² + y′²)^{3/2} (수치 미분). */
  curvature(t) {
    const [a, b] = this.domain;
    const h = Math.max(Math.abs(b - a) / 1000, 1e-9);
    const pm = this.eval(Math.max(a, t - h)).cart;
    const p0 = this.eval(t).cart;
    const pp = this.eval(Math.min(b, t + h)).cart;
    const dx = (pp[0] - pm[0]) / (2 * h),
      dy = (pp[1] - pm[1]) / (2 * h);
    const ddx = (pp[0] - 2 * p0[0] + pm[0]) / (h * h),
      ddy = (pp[1] - 2 * p0[1] + pm[1]) / (h * h);
    const den = (dx * dx + dy * dy) ** 1.5;
    return den ? Math.abs(dx * ddy - dy * ddx) / den : 0;
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
  /**
   * 구간별 함수 — `curve.piecewise([[0,1,f],[1,2,g]])` (구간 밖은 그리지 않음).
   * 각 조각은 `[a, b, f]` 또는 `{ a, b, fn }` 이다.
   */
  piecewise(pieces, opts = {}) {
    const segs = pieces.map((p) =>
      Array.isArray(p) ? { a: p[0], b: p[1], fn: asFn(p[2]) } : { a: p.a, b: p.b, fn: asFn(p.f ?? p.fn) },
    );
    const a = Math.min(...segs.map((s) => s.a)),
      b = Math.max(...segs.map((s) => s.b));
    return new Curve({ kind: KIND.PIECEWISE, segs, domain: opts.domain || [a, b] });
  },
  /** 주어진 점들을 **지나가는** Catmull–Rom 스플라인 (`.tension(k)` 로 팽팽함 조절). */
  spline(pts, opts = {}) {
    const P = (pts || []).map(xyOf);
    return new Curve({
      kind: KIND.SPLINE,
      pts: P,
      tension: opts.tension ?? 0.5,
      domain: opts.domain || [0, Math.max(1, P.length - 1)],
    });
  },
  /**
   * 상미분방정식 dy/dx = dy(x, y), 초기값 y0 — RK4 로 적분해 곡선으로.
   * `dy` 는 함수 또는 심볼릭(tex). 구간은 `.on([x0, x1])`.
   */
  ode(o = {}) {
    return new Curve({ kind: KIND.ODE, dy: o.dy, y0: o.y0 ?? 0, n: o.n, domain: o.domain || [0, 1] });
  },
  /**
   * `at` 근방 테일러 다항식(차수 `order`) — 심볼릭이면 정확한 도함수, 함수면 수치 미분.
   * @param {Function|*} f 함수 또는 tex 식
   * @param {{at?:number, order?:number, h?:number}} opts
   */
  taylor(f, opts = {}) {
    const at = opts.at ?? 0,
      order = opts.order ?? 5;
    const coeffs = [];
    if (f && typeof f.diff === 'function' && typeof f.toFunction === 'function') {
      let d = f,
        fact = 1;
      for (let k = 0; k <= order; k++) {
        coeffs.push(asFn(d)(at) / fact);
        d = d.diff('x');
        fact *= k + 1;
      }
    } else {
      const g = asFn(f);
      const h = opts.h ?? 1e-2;
      for (let k = 0; k <= order; k++) coeffs.push(fdTaylorCoeff(g, at, k, h));
    }
    return new Curve({ kind: KIND.TAYLOR, at, coeffs, domain: opts.domain || [at - 1, at + 1] });
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
  /** 스플라인 팽팽함(0.5 = 표준 Catmull–Rom) */
  tension(k) {
    return this.set({ tension: k });
  },
});

export default curve;
