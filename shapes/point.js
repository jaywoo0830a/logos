// docs/spec/DSL.md §4.1 점 — point / point.origin / point.polar / point.spherical … / point.intersect
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import {
  parseAngle,
  polarToCart,
  cylindricalToCart,
  sphericalToCart,
  cartToPolar,
  norm2,
  TAU,
} from '../solver/coords.js';
import { setPointFactory, lineIntersect, intersectLineCircle } from '../solver/intersect.js';

export class Point extends Drawable {
  constructor(conf = {}) {
    super('point', { system: 'cartesian', ...conf });
    if (!this._conf.cart) this._conf = { ...this._conf, cart: [0, 0] };
  }

  get coords() {
    return this._conf.cart;
  }
  get x() {
    return this._conf.cart[0];
  }
  get y() {
    return this._conf.cart[1];
  }
  get z() {
    return this._conf.cart[2];
  }
  get system() {
    return this._conf.system || 'cartesian';
  }
  dim() {
    return this._conf.cart.length;
  }

  label(l, off) {
    return this.set({ label: l, labelOff: off });
  }
  dot(marker = 'dot') {
    // dot({ open:true }) — 열린 점(빈 원 마커)
    if (marker && typeof marker === 'object') return this.set({ marker: 'dot', open: !!marker.open });
    return this.set({ marker });
  }

  /**
   * 마커 모양 지정 (matplotlib marker 대응).
   * @param {'circle'|'square'|'triangle'|'diamond'|'star'|'point'|'o'|'s'|'^'|'*'|'.'} shape
   * @param {Object} [opts] { open, size }
   */
  marker(shape = 'circle', opts = {}) {
    const set = { marker: shape };
    if (opts.open !== undefined) set.open = !!opts.open;
    if (opts.size !== undefined) set.size = opts.size;
    return this.set(set);
  }
  size(n) {
    return this.set({ size: n });
  }

  toCartesian() {
    return new Point({ system: 'cartesian', cart: [...this._conf.cart] });
  }
  toPolar() {
    return cartToPolar(this._conf.cart[0], this._conf.cart[1]);
  }

  // IR 렌더링
  toIR(ctx) {
    const c = this._conf;
    const [x, y, z] = c.cart;
    const proj = z !== undefined && ctx && ctx.project ? ctx.project([x, y, z]) : [x, y];
    const labelMath = typeof c.label?.toLatex === 'function';
    const off = c.labelOff && typeof c.labelOff === 'object' ? c.labelOff : {};
    return [
      node('point', {
        x: proj[0],
        y: proj[1],
        marker: c.marker || 'dot',
        open: c.open,
        size: c.size,
        label: renderText(c.label),
        labelMath,
        color: c.color,
        fill: c.fill,
        stroke: c.stroke,
        // 라벨 화면 오프셋은 px — layout(자동 배치)이 조정할 수 있도록 데이터로 둔다.
        dxPx: off.dx ?? (labelMath ? 8 : 7),
        dyPx: off.dy ?? (labelMath ? -24 : -7),
        transforms: c.transforms,
        style: pickStyle(c),
      }),
    ];
  }
}

// ── 팩토리 주입 (순환 import 회피) ───────────────
setPointFactory(() => ({ point }));

// ── 팩토리(함수 + 네임스페이스) ───────────────────
/**
 * 점 생성. `point(1, 2)` 는 물론 `point([1, 2])` · `point({ x: 1, y: 2 })` 도 받는다(B1).
 * (예전에는 `point([1, 2])` 가 조용히 `[[1, 2]]` 라는 잘못된 좌표가 됐다.)
 */
export function point(...args) {
  return new Point({ system: 'cartesian', cart: normalizeArgs(args) });
}
/** 단일 배열/`{x,y[,z]}` 인자를 좌표 배열로 편다 */
function normalizeArgs(args) {
  if (args.length === 1) {
    const v = args[0];
    if (Array.isArray(v)) return v.slice();
    if (v && typeof v === 'object' && 'x' in v) return v.z !== undefined ? [v.x, v.y, v.z] : [v.x, v.y];
  }
  return args;
}

/**
 * 배열 · `{x, y[, z]}` · 기존 Point 를 Point 로 정규화한다(B1).
 * 좌표를 받는 모든 진입점(annotate · segment · line · vector …)이 이 함수를 통과한다.
 * @param {*} v 좌표(배열/객체/Point)
 * @param {...number} rest 나머지 좌표(예: `toPoint(1, 2)`)
 * @returns {Point}
 * @example toPoint([1, 2]) · toPoint({ x: 1, y: 2 }) · toPoint(1, 2)
 */
export function toPoint(v, ...rest) {
  if (v && Array.isArray(v.coords)) return v;
  if (Array.isArray(v)) return point(...v, ...rest);
  if (v && typeof v === 'object' && 'x' in v) return v.z !== undefined ? point(v.x, v.y, v.z) : point(v.x, v.y);
  return point(v, ...rest);
}
point.origin = (z) => (z === undefined ? point(0, 0) : point(0, 0, z));
point.xyz = (x, y, z) => point(x, y, z);

point.polar = (r, theta) => {
  const t = parseAngle(theta);
  const [x, y] = polarToCart(r, t);
  return new Point({ system: 'polar', cart: [x, y], basis: { r, theta: t } });
};
point.cylindrical = (r, theta, z) => {
  const t = parseAngle(theta);
  const [x, y, cz] = cylindricalToCart(r, t, z);
  return new Point({ system: 'cylindrical', cart: [x, y, cz] });
};
point.spherical = (r, theta, phi) => {
  const [x, y, z] = sphericalToCart(r, parseAngle(theta), parseAngle(phi));
  return new Point({ system: 'spherical', cart: [x, y, z] });
};
point.complex = (re, im) => new Point({ system: 'complex', cart: [re, im] });

point.midpoint = (A, B) => {
  const d = Math.max(A.dim(), B.dim());
  return point(...Array.from({ length: d }, (_, i) => (A.coords[i] + B.coords[i]) / 2));
};
point.centroid = (...pts) => {
  const d = Math.max(...pts.map((p) => p.dim()));
  const n = pts.length;
  return point(...Array.from({ length: d }, (_, i) => pts.reduce((s, p) => s + p.coords[i], 0) / n));
};

/** 세 점 좌표 평균 (중점 일반화) */
point.center = (A, B, C) => point.centroid(A, B, C);

/** 교점 (두 직선, 또는 직선 ∩ 원) — K2: 원과 접선의 접점 */
point.intersect = (a, b) => {
  const A = a.kind,
    B = b.kind;
  if (A === 'circle' && B === 'line') return touchPoint(b, a);
  if (A === 'line' && B === 'circle') return touchPoint(a, b);
  return lineIntersect(a, b);
};

function touchPoint(line, circle) {
  const all = intersectLineCircle(line, circle);
  return all && all.length ? all[0] : null;
}

/** 원과 직선의 교점들 */
point.intersectAll = (shape1, shape2) => {
  if (shape1.kind === 'circle' || shape2.kind === 'circle') {
    const line = shape1.kind === 'line' ? shape1 : shape2;
    const circle = shape1.kind === 'circle' ? shape1 : shape2;
    return intersectLineCircle(line, circle);
  }
  return [];
};

/** 곡선 위 파라메트릭 지점 */
point.on = (curve, t) => {
  const v = curve.eval(t);
  return point(...v.cart);
};

/** 극좌표(도 단위) — `point.byDeg(1, 30)` */
point.byDeg = (r, deg) => point.polar(r, (deg * Math.PI) / 180);

/**
 * 반사 — `point.reflect(P).over(line)` (2D) / `.over(plane)` (3D).
 *   선: P 에서 선에 내린 발을 지나는 대칭점. 평면: 법선 방향 대칭.
 */
point.reflect = (P) => ({ over: (obj) => reflectOver(P, obj) });

function reflectOver(P, obj) {
  const c = P.coords;
  // 평면(plane.*) — normal()/anchor() 를 가진 객체
  if (obj && typeof obj.normal === 'function' && typeof obj.anchor === 'function') {
    const n = obj.normal();
    const A = obj.anchor();
    const v = [c[0] - A[0], (c[1] ?? 0) - A[1], (c[2] ?? 0) - A[2]];
    const dot = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
    return point(c[0] - 2 * dot * n[0], c[1] - 2 * dot * n[1], c[2] - 2 * dot * n[2]);
  }
  // 직선(Line) — pointDir() 를 가진 객체
  if (obj && typeof obj.pointDir === 'function') {
    const { p: Q, d } = obj.pointDir();
    const L2 = d[0] * d[0] + d[1] * d[1] || 1;
    const t = ((c[0] - Q[0]) * d[0] + (c[1] - Q[1]) * d[1]) / L2;
    const fx = Q[0] + d[0] * t,
      fy = Q[1] + d[1] * t;
    return point(2 * fx - c[0], 2 * fy - c[1]);
  }
  return P;
}

export function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity', 'z', 'label']) {
    if (c[k] !== undefined) s[k] = c[k];
  }
  return s;
}

/** 내심: 세 변 길이로 가중평균 */
export function triangleCenter(A, B, C) {
  const a = norm2([B.coords[0] - C.coords[0], B.coords[1] - C.coords[1]]);
  const b = norm2([A.coords[0] - C.coords[0], A.coords[1] - C.coords[1]]);
  const c = norm2([A.coords[0] - B.coords[0], A.coords[1] - B.coords[1]]);
  const sum = a + b + c;
  return point(
    (a * A.coords[0] + b * B.coords[0] + c * C.coords[0]) / sum,
    (a * A.coords[1] + b * B.coords[1] + c * C.coords[1]) / sum,
  );
}

point.incenter = (tri) => {
  const [A, B, C] = tri.vertices;
  return triangleCenter(A, B, C);
};

/** 외심: 세 수직이등분선의 교차 (원점에서 세 꼭짓점까지 거리 동일) */
point.circumcenter = (A, B, C) => {
  const ax = A.coords[0],
    ay = A.coords[1];
  const bx = B.coords[0],
    by = B.coords[1];
  const cx = C.coords[0],
    cy = C.coords[1];
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-12) return point((ax + bx + cx) / 3, (ay + by + cy) / 3);
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  return point(ux, uy);
};

/** 수심: (외심 + 무게중심 → 오일러선) — 세 수선의 교차 */
point.orthocenter = (A, B, C) => {
  // H = A + B + C - 2*O (2D 중심)
  const O = point.circumcenter(A, B, C);
  return point(
    A.coords[0] + B.coords[0] + C.coords[0] - 2 * O.coords[0],
    A.coords[1] + B.coords[1] + C.coords[1] - 2 * O.coords[1],
  );
};

/** 수선의 발 — point.foot(P).onto(line) */
point.foot = (P) => ({
  onto(line) {
    const { p, d } = line.pointDir();
    const px = P.coords[0] - p[0],
      py = P.coords[1] - p[1];
    const t = (px * d[0] + py * d[1]) / (d[0] * d[0] + d[1] * d[1]);
    return point(p[0] + t * d[0], p[1] + t * d[1]);
  },
});

export { TAU };
