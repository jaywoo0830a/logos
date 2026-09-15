// docs/spec/DSL.md §4.3 선 — line.through / slopeIntercept / horizontal / vertical / tangent …
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { norm2, perp2 } from '../solver/coords.js';
import { point as _point, toPoint } from './point.js';

export class Line extends Drawable {
  constructor(conf = {}) {
    super('line', { form: 'slope', ...conf });
  }

  /** 점-방향 표현 { p:[x,y], d:[dx,dy] } */
  pointDir() {
    const c = this._conf;
    const dim0 = (p) => p.coords;
    switch (c.form) {
      case 'two-point': {
        const A = dim0(c.a),
          B = dim0(c.b);
        return { p: [A[0], A[1]], d: [B[0] - A[0], B[1] - A[1]] };
      }
      case 'point-dir': {
        const P = dim0(c.p);
        return { p: [P[0], P[1]], d: [...c.d] };
      }
      case 'slope':
        return { p: [0, c.intercept], d: [1, c.m] };
      case 'horizontal':
        return { p: [0, c.y], d: [1, 0] };
      case 'vertical':
        return { p: [c.x, 0], d: [0, 1] };
      default:
        return { p: [0, 0], d: [1, c.m || 0] };
    }
  }

  /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
  label(l, off) {
    return this.set({ label: l, labelOff: off });
  }

  /** 세계 사각형과 클리핑한 양 끝점 → [ [x,y],[x,y] ] 또는 null */
  clipped(world) {
    const { p, d } = this.pointDir();
    const span = Math.max(world.xmax - world.xmin, world.ymax - world.ymin) * 2;
    const len = norm2(d);
    if (len < 1e-12) return null;
    const ux = d[0] / len,
      uy = d[1] / len;
    return clipSeg([p[0] - ux * span, p[1] - uy * span], [p[0] + ux * span, p[1] + uy * span], world);
  }

  toIR(ctx) {
    const c = this._conf;
    const seg = this.clipped(ctx.world);
    if (!seg) return [];
    const [[x1, y1], [x2, y2]] = seg;
    return [
      node('path', {
        ops: [
          { op: 'M', x: x1, y: y1 },
          { op: 'L', x: x2, y: y2 },
        ],
        color: c.color,
        stroke: c.stroke,
        dash: c.dash,
        opacity: c.opacity,
        transforms: c.transforms,
        style: pickStyle(c),
      }),
    ];
  }
}

export function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}
// ── Cohen–Sutherland clip ───────────────────────
function clipSeg([x0, y0], [x1, y1], w) {
  const INSIDE = 0,
    LEFT = 1,
    RIGHT = 2,
    BOTTOM = 4,
    TOP = 8;
  const code = (x, y) => {
    let c = INSIDE;
    if (x < w.xmin) c |= LEFT;
    else if (x > w.xmax) c |= RIGHT;
    if (y < w.ymin) c |= BOTTOM;
    else if (y > w.ymax) c |= TOP;
    return c;
  };
  let x0s = x0,
    y0s = y0,
    x1s = x1,
    y1s = y1;
  let c0 = code(x0s, y0s),
    c1 = code(x1s, y1s);
  let guard = 0;
  while (true) {
    if (!(c0 | c1))
      return [
        [x0s, y0s],
        [x1s, y1s],
      ];
    if (c0 & c1) return null;
    const c = c0 ? c0 : c1;
    let x, y;
    if (c & TOP) {
      x = x0s + ((x1s - x0s) * (w.ymax - y0s)) / (y1s - y0s);
      y = w.ymax;
    } else if (c & BOTTOM) {
      x = x0s + ((x1s - x0s) * (w.ymin - y0s)) / (y1s - y0s);
      y = w.ymin;
    } else if (c & RIGHT) {
      y = y0s + ((y1s - y0s) * (w.xmax - x0s)) / (x1s - x0s);
      x = w.xmax;
    } else {
      y = y0s + ((y1s - y0s) * (w.xmin - x0s)) / (x1s - x0s);
      x = w.xmin;
    }
    if (c === c0) {
      x0s = x;
      y0s = y;
      c0 = code(x0s, y0s);
    } else {
      x1s = x;
      y1s = y;
      c1 = code(x1s, y1s);
    }
    if (++guard > 100) return null;
  }
}

// ── line 네임스페이스 ────────────────────────────
export const line = {
  through(a, b) {
    if (b !== undefined) return new Line({ form: 'two-point', a: toPoint(a), b: toPoint(b) });
    return new Builder(a);
  },
  slopeIntercept(m, b) {
    return new Line({ form: 'slope', m, intercept: b });
  },
  horizontal(y = 0) {
    return new Line({ form: 'horizontal', y });
  },
  vertical(x = 0) {
    return new Line({ form: 'vertical', x });
  },
  intercepts(xi, yi) {
    return new Line({ form: 'two-point', a: _point(xi, 0), b: _point(0, yi) });
  },
  standard(a, b, c) {
    if (!b || Math.abs(b) < 1e-12) return new Line({ form: 'vertical', x: -c / a });
    return new Line({ form: 'slope', m: -a / b, intercept: -c / b });
  },
  perpendicular(l) {
    return new Builder(l).perpendicular();
  },
  parallel(l) {
    return new Builder(l).parallel();
  },
  tangent(circle) {
    return new TangentBuilder(circle);
  },
  angleBisector(A, B, C) {
    const BA = normalize2([A.coords[0] - B.coords[0], A.coords[1] - B.coords[1]]);
    const BC = normalize2([C.coords[0] - B.coords[0], C.coords[1] - B.coords[1]]);
    return new Line({ form: 'point-dir', p: B, d: [BA[0] + BC[0], BA[1] + BC[1]] });
  },
  /**
   * 극선(polar) — 원 `c` 에 대한 점 `P` 의 극선: (X−O)·(P−O) = r².
   *   P 가 원 위 → 접선, 원 밖 → 두 접점을 잇는 직선, 중심 → 정의되지 않음(null).
   */
  polar(c, P) {
    const O = circleCenter(c);
    const r = circleRadius(c);
    const px = P.coords[0] - O[0],
      py = P.coords[1] - O[1];
    const d2 = px * px + py * py;
    if (d2 < 1e-12) return null;
    const t = (r * r) / d2;
    return new Line({ form: 'point-dir', p: _point(O[0] + px * t, O[1] + py * t), d: [-py, px] });
  },
  /**
   * 두 원의 공통 접선 — 바깥 접선부터, 이어서 안쪽(교차) 접선.
   * 반환값에 `.all` 로 전체 목록이 붙는다(없으면 null).
   */
  commonTangent(c1, c2) {
    const list = commonTangents(c1, c2);
    if (!list.length) return null;
    return Object.assign(list[0], { all: list });
  },
};

function circleCenter(c) {
  return typeof c.center === 'function' ? c.center() : c._conf.center.coords;
}
function circleRadius(c) {
  return typeof c.radius === 'function' ? c.radius() : c._conf.radius;
}

/**
 * 공통 접선 계산 — 단위 법선 n 과 상수 k 로 직선 n·X = k 를 만든다.
 *   바깥 접선: n·(O2−O1) = r2 − r1,  k = n·O1 − r1
 *   안쪽 접선: n·(O2−O1) = r2 + r1
 */
function commonTangents(c1, c2) {
  const [x1, y1] = circleCenter(c1);
  const [x2, y2] = circleCenter(c2);
  const r1 = circleRadius(c1),
    r2 = circleRadius(c2);
  const dx = x2 - x1,
    dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  if (d < 1e-12) return [];
  const ux = dx / d,
    uy = dy / d;
  const out = [];
  const add = (alpha) => {
    if (Math.abs(alpha) > 1 + 1e-9) return;
    const beta = Math.sqrt(Math.max(0, 1 - alpha * alpha));
    for (const sgn of [1, -1]) {
      // n = α·u + β·u⊥   (u⊥ = (-uy, ux))
      const nx = alpha * ux + sgn * beta * -uy;
      const ny = alpha * uy + sgn * beta * ux;
      const k = nx * x1 + ny * y1 - r1; // 표준형: nx·x + ny·y − k = 0
      out.push(line.standard(nx, ny, -k));
    }
  };
  add((r2 - r1) / d); // 바깥 접선 2개
  add((r1 + r2) / d); // 안쪽 접선 2개
  return out;
}

function normalize2(v) {
  const l = norm2(v);
  return l > 0 ? [v[0] / l, v[1] / l] : v;
}

class Builder {
  constructor(ref) {
    this._ref = ref;
  }
  direction(d) {
    return new Line({ form: 'point-dir', p: _point(0, 0), d });
  }
  slope(m) {
    return new Line({ form: 'slope', m, intercept: 0 });
  }
  through(p) {
    return new Line({ form: 'point-dir', p: toPoint(p), d: refDir(this._ref) });
  }
  perpendicular() {
    return {
      through: (p) => new Line({ form: 'point-dir', p, d: perp2(refDir(this._ref)) }),
      direction: (d) => new Line({ form: 'point-dir', p: _point(0, 0), d: perp2(d) }),
    };
  }
  parallel() {
    return {
      through: (p) => new Line({ form: 'point-dir', p, d: refDir(this._ref) }),
    };
  }
}

function refDir(l) {
  if (typeof l === 'object' && typeof l.pointDir === 'function') return l.pointDir().d;
  if (Array.isArray(l)) return l;
  return [1, 0];
}

class TangentBuilder {
  constructor(target) {
    this._target = target;
  }
  get _isCircle() {
    const t = this._target;
    return !!t && typeof t.center === 'function' && typeof t.radius === 'function';
  }
  get _isCurve() {
    const t = this._target;
    return !!t && typeof t.eval === 'function' && typeof t.center !== 'function';
  }
  at(P) {
    if (this._isCurve) {
      const curve = this._target;
      const x = typeof P === 'number' ? P : P.coords[0];
      const fx = curve._fn()(x);
      const h = 1e-5;
      const fp = (curve._fn()(x + h) - curve._fn()(x - h)) / (2 * h);
      return new Line({
        form: 'point-dir',
        p: _point(x, Number.isFinite(fx) ? fx : 0),
        d: [1, Number.isFinite(fp) ? fp : 0],
      });
    }
    // 원
    const [cx, cy] = this._target.center();
    const r = this._target.radius();
    const d0 = [P.coords[0] - cx, P.coords[1] - cy];
    const dist = Math.hypot(d0[0], d0[1]);
    if (Math.abs(dist - r) < 1e-6) {
      // P 가 원 위 → 접선
      const d1 = perp2(d0);
      return new Line({ form: 'two-point', a: P, b: _point(P.coords[0] + d1[0], P.coords[1] + d1[1]) });
    }
    if (dist > r) {
      // 원 밖 점 P → 접점(아래쪽)을 지나는 접선
      const u = [d0[0] / dist, d0[1] / dist];
      const v = perp2(u);
      const ca = r / dist,
        sa = Math.sqrt(1 - ca * ca);
      const Tx = cx + r * (ca * u[0] + sa * v[0]);
      const Ty = cy + r * (ca * u[1] + sa * v[1]);
      return new Line({ form: 'two-point', a: P, b: _point(Tx, Ty) });
    }
    // P 가 원 안 → 접선 없음 (경고)
    if (typeof console !== 'undefined') console.warn('[logos] tangent.at(P): P is inside the circle — no tangent.');
    return new Line({ form: 'horizontal', y: P.coords[1] });
  }
  slope(m) {
    const [cx, cy] = this._target.center();
    const r = this._target.radius();
    const s = Math.sqrt(m * m + 1) * r;
    return new Line({ form: 'slope', m, intercept: cy - m * cx + s });
  }
}

export default line;
