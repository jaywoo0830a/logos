/** 두 2D 직선(line.through 형태)의 교점 → Point 또는 null(평행) */
export function lineIntersect(l1: any, l2: any): any;
export function setPointFactory(fn: any): void;
/** 직선과 원의 교점(2개) → Point[] (원 주변에서 솔브) */
export function intersectLineCircle(line: any, circle: any): any[];
/** 곡선 위 파라메트릭 지점 샘플평가 */
export function curvePointAt(curve: any, t: any): any;
/** 2D 회전 변환 (좌표용) */
export function rotate2([x, y]: [any, any], a: any, [ox, oy]?: [number, number]): number[];
/** 구간 샘플링 (adaptive 곡률 기반 — 여기서는 안정적 균일 + 곡률 보강) */
export function sampleDomain(a: any, b: any, { n, maxCurve }?: {
    n?: number;
    maxCurve?: number;
}): any[];
import { TAU } from './coords.js';
import { norm2 } from './coords.js';
export { TAU, norm2 };
