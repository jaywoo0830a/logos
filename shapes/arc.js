// DSL.md §4.5 원호 · 부채꼴 · 반직선 — arc / sector / ray
//
//   플러그인도 같은 이름을 등록할 수 있다(index.js 의 dispatch/ns 가 플러그인을 우선).
//   여기 구현은 **플러그인 없이도** 문서대로 동작하게 하는 코어 기본값이다.
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { TAU } from '../solver/coords.js';
import { point as _point, toPoint } from './point.js';
import { circle as _circle } from './circle.js';
import { region as _region } from './region.js';

const asXY = (c) => [c[0] ?? 0, c[1] ?? 0];
const dirOf = (d) => (typeof d === 'number' ? [Math.cos(d), Math.sin(d)] : asXY(d));
const angleOf = (p) => Math.atan2(p[1] ?? 0, p[0] ?? 0);

function pickArc(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

export class ArcShape extends Drawable {
  constructor(conf = {}) {
    super('arc', { ...conf });
  }
  from(a) {
    return this.set({ a0: typeof a === 'number' ? a : angleOf(this._rel(toPoint(a))) });
  }
  to(a) {
    return this.set({ a1: typeof a === 'number' ? a : angleOf(this._rel(toPoint(a))) });
  }
  cw(on = true) {
    return this.set({ cw: on });
  }
  n(k) {
    return this.set({ n: k });
  }
  label(l, off) {
    return this.set({ label: l, labelOff: off });
  }
  _rel(P) {
    const [cx, cy] = this._conf.center.coords;
    return [P.coords[0] - cx, P.coords[1] - cy];
  }
  toIR() {
    const c = this._conf;
    const [cx, cy] = c.center.coords;
    const r = c.radius;
    let a0 = c.a0 ?? 0;
    let a1 = c.a1 ?? Math.PI / 2;
    if (c.cw && a1 > a0)
      a1 -= TAU; // 시계방향
    else if (!c.cw && a1 < a0) a1 += TAU;
    const n = Math.max(2, c.n || 64);
    const ops = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      ops.push({ op: i === 0 ? 'M' : 'L', x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    const out = [
      node('path', { ops, color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity, style: pickArc(c) }),
    ];
    if (c.label) {
      const am = (a0 + a1) / 2;
      out.push(
        node('text', {
          x: cx + r * Math.cos(am),
          y: cy + r * Math.sin(am),
          dxPx: 6,
          dyPx: -6,
          text: renderText(c.label),
          anchor: 'start',
          color: c.color,
        }),
      );
    }
    return out;
  }
}

/** 원호 네임스페이스 — `arc.circular(...)` / `arc.ofCircle(c).from(A).to(B)` / `arc.through(A,B,C)` */
export const arcCore = {
  circular(O, r, a0 = 0, a1 = Math.PI / 2) {
    return new ArcShape({ center: toPoint(O), radius: r, a0, a1 });
  },
  circle(O, r) {
    return new ArcShape({ center: toPoint(O), radius: r });
  },
  ofCircle(c) {
    const [cx, cy] = c.center();
    const center = _point(cx, cy);
    return {
      from: (A) => new ArcShape({ center, radius: c.radius(), a0: angleOf([A.coords[0] - cx, A.coords[1] - cy]) }),
      to: (A) => new ArcShape({ center, radius: c.radius(), a1: angleOf([A.coords[0] - cx, A.coords[1] - cy]) }),
    };
  },
  /** 세 점을 지나는 원호 (A → B 를 지나 C 까지) */
  through(A, B, C) {
    const cir = _circle.through(A, B, C);
    if (!cir) return null;
    const [cx, cy] = cir.center();
    const ang = (P) => angleOf([P.coords[0] - cx, P.coords[1] - cy]);
    const a0 = ang(A),
      a1 = ang(C),
      am = ang(B);
    const ccwSpan = (a1 - a0 + TAU) % TAU;
    const inCcw = (am - a0 + TAU) % TAU <= ccwSpan;
    return new ArcShape({ center: _point(cx, cy), radius: cir.radius(), a0, a1, cw: !inCcw });
  },
};

/** 부채꼴 — region.wedge 로 위임(채움 규칙 재사용) */
export const sectorCore = {
  ofCircle(c) {
    const [cx, cy] = c.center();
    const O = _point(cx, cy);
    return {
      angle: (theta) => _region.wedge(O, c.radius(), 0, theta),
      from: (a0) => ({ to: (a1) => _region.wedge(O, c.radius(), a0, a1) }),
    };
  },
  circular(O, r, a0 = 0, a1 = Math.PI / 2) {
    return _region.wedge(toPoint(O), r, a0, a1);
  },
};

/** 반직선 — 시작점 + 방향. 뷰에 맞춰 잘라 그린다. */
export class RayShape extends Drawable {
  constructor(conf = {}) {
    super('ray', { ...conf });
  }
  through(P) {
    const A = this._conf.from.coords;
    return this.set({ dir: dirOf([P.coords[0] - A[0], P.coords[1] - A[1]]) });
  }
  direction(d) {
    return this.set({ dir: dirOf(d) });
  }
  label(l, off) {
    return this.set({ label: l, labelOff: off });
  }
  toIR(ctx) {
    const c = this._conf;
    const [ax, ay] = c.from.coords;
    const d = c.dir || [1, 0];
    const L = Math.hypot(d[0], d[1]) || 1;
    const ux = d[0] / L,
      uy = d[1] / L;
    const w = ctx.world || { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
    let t = Infinity;
    if (ux > 1e-12) t = Math.min(t, (w.xmax - ax) / ux);
    if (ux < -1e-12) t = Math.min(t, (w.xmin - ax) / ux);
    if (uy > 1e-12) t = Math.min(t, (w.ymax - ay) / uy);
    if (uy < -1e-12) t = Math.min(t, (w.ymin - ay) / uy);
    if (!Number.isFinite(t) || t <= 0) t = 1;
    const bx = ax + ux * t,
      by = ay + uy * t;
    const out = [
      node('path', {
        ops: [
          { op: 'M', x: ax, y: ay },
          { op: 'L', x: bx, y: by },
        ],
        color: c.color,
        stroke: c.stroke,
        dash: c.dash,
        opacity: c.opacity,
        head: c.head !== false, // 화살촉(반직선 표시)
        style: pickArc(c),
      }),
    ];
    if (c.label) {
      out.push(
        node('text', {
          x: (ax + bx) / 2,
          y: (ay + by) / 2,
          dxPx: 6,
          dyPx: -6,
          text: renderText(c.label),
          anchor: 'start',
          color: c.color,
        }),
      );
    }
    return out;
  }
}

class RayBuilder {
  constructor(A) {
    this._A = A;
  }
  through(B) {
    const b = toPoint(B);
    return new RayShape({
      from: this._A,
      dir: dirOf([b.coords[0] - this._A.coords[0], b.coords[1] - this._A.coords[1]]),
    });
  }
  direction(d) {
    return new RayShape({ from: this._A, dir: dirOf(d) });
  }
}

/** `ray.from(A).through(B)` / `ray(A, B)` / `ray(O, direction)` */
export const rayCore = function ray(A, B) {
  if (B === undefined) return new RayBuilder(toPoint(A));
  const a = toPoint(A);
  if (typeof B === 'number') return new RayShape({ from: a, dir: dirOf(B) });
  const b = toPoint(B);
  return new RayShape({ from: a, dir: dirOf([b.coords[0] - a.coords[0], b.coords[1] - a.coords[1]]) });
};
rayCore.from = (A) => new RayBuilder(toPoint(A));
