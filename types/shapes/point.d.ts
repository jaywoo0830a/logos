/**
 * 점 생성. `point(1, 2)` 는 물론 `point([1, 2])` · `point({ x: 1, y: 2 })` 도 받는다(B1).
 * (예전에는 `point([1, 2])` 가 조용히 `[[1, 2]]` 라는 잘못된 좌표가 됐다.)
 */
export function point(...args: any[]): Point;
export namespace point {
    function origin(z: any): Point;
    function xyz(x: any, y: any, z: any): Point;
    function polar(r: any, theta: any): Point;
    function cylindrical(r: any, theta: any, z: any): Point;
    function spherical(r: any, theta: any, phi: any): Point;
    function complex(re: any, im: any): Point;
    function midpoint(A: any, B: any): Point;
    function centroid(...pts: any[]): Point;
    /** 세 점 좌표 평균 (중점 일반화) */
    function center(A: any, B: any, C: any): Point;
    /** 교점 (두 직선, 또는 직선 ∩ 원) — K2: 원과 접선의 접점 */
    function intersect(a: any, b: any): any;
    /** 원과 직선의 교점들 */
    function intersectAll(shape1: any, shape2: any): any[];
    /** 곡선 위 파라메트릭 지점 */
    function on(curve: any, t: any): Point;
    /** 극좌표(도 단위) — `point.byDeg(1, 30)` */
    function byDeg(r: any, deg: any): Point;
    /**
     * 반사 — `point.reflect(P).over(line)` (2D) / `.over(plane)` (3D).
     *   선: P 에서 선에 내린 발을 지나는 대칭점. 평면: 법선 방향 대칭.
     */
    function reflect(P: any): {
        over: (obj: any) => any;
    };
    function incenter(tri: any): Point;
    /** 외심: 세 수직이등분선의 교차 (원점에서 세 꼭짓점까지 거리 동일) */
    function circumcenter(A: any, B: any, C: any): Point;
    /** 수심: (외심 + 무게중심 → 오일러선) — 세 수선의 교차 */
    function orthocenter(A: any, B: any, C: any): Point;
    /** 수선의 발 — point.foot(P).onto(line) */
    function foot(P: any): {
        onto(line: any): Point;
    };
}
/**
 * 배열 · `{x, y[, z]}` · 기존 Point 를 Point 로 정규화한다(B1).
 * 좌표를 받는 모든 진입점(annotate · segment · line · vector …)이 이 함수를 통과한다.
 * @param {*} v 좌표(배열/객체/Point)
 * @param {...number} rest 나머지 좌표(예: `toPoint(1, 2)`)
 * @returns {Point}
 * @example toPoint([1, 2]) · toPoint({ x: 1, y: 2 }) · toPoint(1, 2)
 */
export function toPoint(v: any, ...rest: number[]): Point;
export function pickStyle(c: any): {};
/** 내심: 세 변 길이로 가중평균 */
export function triangleCenter(A: any, B: any, C: any): Point;
export class Point extends Drawable {
    constructor(conf?: {});
    get coords(): any;
    get x(): any;
    get y(): any;
    get z(): any;
    get system(): any;
    dim(): any;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    dot(marker?: string): this;
    /**
     * 마커 모양 지정 (matplotlib marker 대응).
     * @param {'circle'|'square'|'triangle'|'diamond'|'star'|'point'|'o'|'s'|'^'|'*'|'.'} shape
     * @param {Object} [opts] { open, size }
     */
    marker(shape?: "circle" | "square" | "triangle" | "diamond" | "star" | "point" | "o" | "s" | "^" | "*" | ".", opts?: any): this;
    size(n: any): this;
    toCartesian(): Point;
    toPolar(): {
        r: number;
        theta: number;
    };
    toIR(ctx: any): Readonly<any>[];
}
export { TAU };
import { Drawable } from '../core/drawable.js';
import { TAU } from '../solver/coords.js';
