// DSL.md §4.9 변환 — transform.rotate/scale/translate/reflect/…
// 각 변환은 (point, dim) → 새 좌표 배열을 반환하는 불변 함수 객체다.

import { rotate2 } from './solver/intersect.js';
import { point as _point } from './shapes/point.js';

function make(applyFn, meta = {}) {
  return { apply: applyFn, meta };
}

// ── 2D/3D 회전 ────────────────────────────────
function rotate2D(a, about) {
  const o = about ? about.coords : [0, 0];
  return make((p, dim) => {
    if (dim <= 2) return rotate2(p.slice(0, 2), a, o);
    const [x, y] = rotate2([p[0], p[1]], a, o);
    return [x, y, p[2]];
  }, { kind: 'rotate', angle: a });
}
function rotate3D(a, axis) {
  // axis: {p, d} 형태의 선(Line) → 정규화된 회전
  return make((p, dim) => {
    if (dim <= 2) return rotate2D(a, axis ? _axisPoint(axis) : null).apply(p, dim);
    return p; // 3D 축 회전은 구현 범위 밖(좌표 동일) → 원본 유지
  }, { kind: 'rotate3D', angle: a });
}

export const transform = {
  rotate(a) {
    const t = rotate2D(a);
    return Object.assign(t, {
      about(pt) { return rotate2D(a, pt); },
      aroundAxis(axis) { return rotate3D(a, axis); },
    });
  },
  scale(sx, sy = sx, sz) {
    return make((p) => {
      const [x, y, z] = p;
      if (z === undefined) return [x * sx, y * sy];
      return [x * sx, y * sy, z * (sz ?? 1)];
    }, { kind: 'scale' });
  },
  translate(dx, dy, dz) {
    return make((p) => {
      const [x, y, z] = p;
      if (z === undefined) return [x + dx, y + dy];
      return [x + dx, y + dy, z + (dz ?? 0)];
    }, { kind: 'translate' });
  },
  reflect: {
    over(l) {
      // 2D 직선 반사 (점·방향 형태)
      return make((p) => {
        if (p.length >= 3) return p; // 3D 평면 반사는 별도
        const { p: q, d } = l.pointDir();
        const [x, y] = projectOnLine(p, q, d);
        return [2 * x - p[0], 2 * y - p[1]];
      }, { kind: 'reflect' });
    },
  },
  shear(k) {
    return make((p) => {
      const [x, y] = p;
      return [x + k * y, y];
    }, { kind: 'shear' });
  },
  homothety(center, k) {
    const c = center.coords;
    return make((p) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]);
  },
  matrix(m) {
    return make((p) => {
      const [x, y] = p;
      return [m[0][0] * x + m[0][1] * y, m[1][0] * x + m[1][1] * y];
    }, { kind: 'matrix' });
  },
  compose(...ts) {
    return make((p, dim) => ts.reduce((acc, t) => t.apply(acc, dim), p), { kind: 'compose' });
  },
};

function projectOnLine([x, y], [qx, qy], [dx, dy]) {
  const t = ((x - qx) * dx + (y - qy) * dy) / (dx * dx + dy * dy);
  return [qx + t * dx, qy + t * dy];
}

function _axisPoint(axis) {
  if (axis && axis.pointDir) return axis.pointDir().p.map ? axis.pointDir().p : axis.pointDir().p;
  return [0, 0];
}

/** style.transforms 를 좌표에 적용 */
export function applyTransforms(transforms, [x, y, z]) {
  let p = z === undefined ? [x, y] : [x, y, z];
  for (const t of transforms || []) p = t.apply(p, p.length);
  return p;
}

// ── 변환 팩토리 단일 노출(편의) ─────────────────
export function rotate(a) { return transform.rotate(a); }
export function translate(dx, dy, dz) { return transform.translate(dx, dy, dz); }
export function scale(sx, sy) { return transform.scale(sx, sy); }

export default transform;