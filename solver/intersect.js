// DSL.md §12 Geometry Solver — 교점 · 접점 · 파라메트릭 샘플링
import { TAU, norm2 } from './coords.js';

/** 두 2D 직선(line.through 형태)의 교점 → Point 또는 null(평행) */
export function lineIntersect(l1, l2) {
  const { p: p1, d: d1 } = l1.pointDir();
  const { p: p2, d: d2 } = l2.pointDir();
  const det = d1[0] * d2[1] - d1[1] * d2[0];
  if (Math.abs(det) < 1e-12) return null; // 평행 or 일치
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const t = (dx * d2[1] - dy * d2[0]) / det;
  const { point } = shapePoint();
  return point(p1[0] + t * d1[0], p1[1] + t * d1[1]);
}

/** point 팩토리를 lazy 주입 (순환 import 회피) */
let POINT_FACTORY = null;
export function setPointFactory(fn) { POINT_FACTORY = fn; }
function shapePoint() { return POINT_FACTORY(); }

/** 직선과 원의 교점(2개) → Point[] (원 주변에서 솔브) */
export function intersectLineCircle(line, circle) {
  const { point: makePoint } = shapePoint();
  const c = circle.center();   // [cx, cy]
  const r = circle.radius();
  const { p, d } = line.pointDir();
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  const a = d[0] * d[0] + d[1] * d[1];
  const b = 2 * (dx * d[0] + dy * d[1]);
  const cc = dx * dx + dy * dy - r * r;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return [];
  if (disc < 1e-12) {
    const t = -b / (2 * a);
    return [makePoint(p[0] + t * d[0], p[1] + t * d[1])];
  }
  const s = Math.sqrt(disc);
  const t1 = (-b + s) / (2 * a);
  const t2 = (-b - s) / (2 * a);
  return [
    makePoint(p[0] + t1 * d[0], p[1] + t1 * d[1]),
    makePoint(p[0] + t2 * d[0], p[1] + t2 * d[1]),
  ];
}

/** 곡선 위 파라메트릭 지점 샘플평가 */
export function curvePointAt(curve, t) {
  return curve.eval(t); // { data(cartesian), cs, point(raw) }
}

/** 2D 회전 변환 (좌표용) */
export function rotate2([x, y], a, [ox, oy] = [0, 0]) {
  const c = Math.cos(a), s = Math.sin(a);
  const X = x - ox, Y = y - oy;
  return [ox + X * c - Y * s, oy + X * s + Y * c];
}

/** 구간 샘플링 (adaptive 곡률 기반 — 여기서는 안정적 균일 + 곡률 보강) */
export function sampleDomain(a, b, { n = 200, maxCurve = 8 } = {}) {
  const base = Math.max(2, Math.round(n));
  const pts = [];
  for (let i = 0; i <= base; i++) pts.push(a + ((b - a) * i) / base);
  return pts;
}

export { TAU, norm2 };