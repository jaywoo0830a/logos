// DSL.md §1 「좌표계는 1급 시민」 — 좌표계 변환 · 각도 파싱

export const TAU = Math.PI * 2;

/** 도(°) 문자열 / 라디안 숫자 / Sym(심볼릭 각도) → 라디안 숫자 */
export function parseAngle(a) {
  if (a == null) return 0;
  if (typeof a === 'number') return a;
  if (typeof a === 'string') {
    const s = a.trim();
    if (s.endsWith('°') || s.endsWith('deg')) return degToRad(parseFloat(s));
    return Number(s);
  }
  if (typeof a.valueOf === 'function') return Number(a.valueOf());
  return Number(a);
}

export function degToRad(d) {
  return (d * Math.PI) / 180;
}
export function radToDeg(r) {
  return (r * 180) / Math.PI;
}

export function polarToCart(r, t) {
  return [r * Math.cos(t), r * Math.sin(t)];
}

export function cartToPolar(x, y) {
  return { r: Math.hypot(x, y), theta: Math.atan2(y, x) };
}

/** cylindrical(r, θ, z) → cartesian [x, y, z] */
export function cylindricalToCart(r, t, z) {
  const [x, y] = polarToCart(r, t);
  return [x, y, z];
}

/** spherical(r, θ(azimuth), φ(polar)) → cartesian [x, y, z] */
export function sphericalToCart(r, t, p) {
  return [r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t), r * Math.cos(p)];
}

export function cartToSpherical(x, y, z) {
  const r = Math.hypot(x, y, z);
  return { r, theta: Math.atan2(y, x), phi: Math.acos(z / (r || 1)) };
}

/** 2D 평면에서 벡터 노름 */
export function norm2(v) {
  return Math.hypot(v[0], v[1]);
}

/** 90° 회전 (데카르트 외적 영역) */
export function perp2([x, y]) {
  return [-y, x];
}
