// DSL.md §4.1 점 — point / point.origin / point.polar / point.spherical … / point.intersect
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import {
  parseAngle, polarToCart, cylindricalToCart, sphericalToCart,
  cartToPolar, norm2, TAU,
} from '../solver/coords.js';
import { setPointFactory, lineIntersect, intersectLineCircle } from '../solver/intersect.js';

export class Point extends Drawable {
  constructor(conf = {}) {
    super('point', { system: 'cartesian', ...conf });
    if (!this._conf.cart) this._conf = { ...this._conf, cart: [0, 0] };
  }

  get coords() { return this._conf.cart; }
  get x() { return this._conf.cart[0]; }
  get y() { return this._conf.cart[1]; }
  get z() { return this._conf.cart[2]; }
  get system() { return this._conf.system || 'cartesian'; }
  dim() { return this._conf.cart.length; }

  label(l, off) { return this.set({ label: l, labelOff: off }); }
  dot(marker = 'dot') { return this.set({ marker }); }

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
    const proj = (z !== undefined && ctx && ctx.project) ? ctx.project([x, y, z]) : [x, y];
    return [node('point', {
      x: proj[0], y: proj[1],
      marker: c.marker || 'dot',
      label: renderText(c.label),
      color: c.color, fill: c.fill, stroke: c.stroke,
      labelOff: c.labelOff,
      transforms: c.transforms,
      style: pickStyle(c),
    })];
  }
}

// ── 팩토리 주입 (순환 import 회피) ───────────────
setPointFactory(() => ({ point }));

// ── 팩토리(함수 + 네임스페이스) ───────────────────
export function point(...args) {
  return new Point({ system: 'cartesian', cart: args });
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

/** 교점 (line.through 형태) */
point.intersect = (l1, l2) => lineIntersect(l1, l2);

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

export { TAU };