export function pickStyle(c: any): {};
export class Circle extends Drawable {
    constructor(conf?: {});
    center(): any;
    radius(): any;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export namespace circle {
    function center(O: any): CenterStep;
    function through(A: any, B: any, C: any): Circle;
    function inscribed(tri: any): Circle;
    function unit(): Circle;
    /**
     * 방접원(傍接圓) — 변 `key` 반대쪽 꼭짓점을 기준으로 한다.
     * @param {*} tri triangle(연속) 또는 `.vertices` 를 가진 도형
     * @param {'a'|'b'|'c'|number} key 반대편 꼭짓점(기본 'a')
     */
    function excircle(tri: any, key?: "a" | "b" | "c" | number): Circle;
}
export default circle;
import { Drawable } from '../core/drawable.js';
declare class CenterStep {
    constructor(O: any);
    _O: any;
    radius(r: any): Circle;
    through(P: any): Circle;
    diameter(A: any, B: any): Circle;
}
