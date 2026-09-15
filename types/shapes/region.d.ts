/** 곡선/도형의 clip 으로 쓰이는 Region 을 사각 rect 로 변환 (I5) */
export function regionRect(region: any, world: any): {
    xmin: any;
    xmax: any;
    ymin: number;
    ymax: number;
} | {
    xmin: number;
    xmax: any;
    ymin: number;
    ymax: any;
};
/**
 * 영역 포함 판정(수치) — 부등식/합집합/차집합, 타일링의 기반.
 * @param {*} r Region
 * @param {number} x
 * @param {number} y
 */
export function contains(r: any, x: number, y: number): any;
export class Region extends Drawable {
    constructor(conf?: {});
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    /** auto-framing 용 경계 (P1-2). 알 수 없으면 null. */
    bounds(): any;
    _fn(): any;
    toIR(ctx: any): Readonly<any>[];
}
export namespace region {
    /** 부등식 영역 — `region.inequality((x,y) => y <= x*x).on([x0,x1],[y0,y1])` */
    function inequality(pred: any): Region;
    /** 합집합 — 두 영역 중 하나라도 포함 */
    function union(a: any, b: any): Region;
    /** 차집합 — a 에서 b 를 뺀 영역 */
    function difference(a: any, b: any): Region;
    function riemann(f: any): Region;
    function inside(shape: any): Region;
    function intersect(a: any, b: any): Region;
    function between(a: any, b: any, domain: any): Region;
    /** fill_betweenx: y 를 따라 x 두 곡선 사이 */
    function betweenX(a: any, b: any, domain: any): Region;
    /** barh: 수평 막대 [x0,x1]×[y0,y1] */
    function barH(y0: any, y1: any, x0: any, x1: any): Region;
    /** 링(도넛) */
    function annulus(O: any, rInner: any, rOuter: any): Region;
    /** 부채꼴 */
    function wedge(O: any, r: any, a0: any, a1: any): Region;
    function below(curveObj: any): Region;
    function bar(x0: any, x1: any, y0: any, y1: any): Region;
}
export default region;
import { Drawable } from '../core/drawable.js';
