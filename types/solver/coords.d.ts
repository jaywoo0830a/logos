/** 도(°) 문자열 / 라디안 숫자 / Sym(심볼릭 각도) → 라디안 숫자 */
export function parseAngle(a: any): number;
export function degToRad(d: any): number;
export function radToDeg(r: any): number;
export function polarToCart(r: any, t: any): number[];
export function cartToPolar(x: any, y: any): {
    r: number;
    theta: number;
};
/** cylindrical(r, θ, z) → cartesian [x, y, z] */
export function cylindricalToCart(r: any, t: any, z: any): any[];
/** spherical(r, θ(azimuth), φ(polar)) → cartesian [x, y, z] */
export function sphericalToCart(r: any, t: any, p: any): number[];
export function cartToSpherical(x: any, y: any, z: any): {
    r: number;
    theta: number;
    phi: number;
};
/** 2D 평면에서 벡터 노름 */
export function norm2(v: any): number;
/** 90° 회전 (데카르트 외적 영역) */
export function perp2([x, y]: [any, any]): any[];
export const TAU: number;
