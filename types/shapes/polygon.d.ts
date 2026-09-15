export function pickStyle(c: any): {};
export function polygon(...pts: any[]): Polygon;
export namespace polygon {
    function regular(O: any, n: any, r: any): Polygon;
}
export function triangle(A: any, B: any, C: any): Polygon;
export namespace triangle {
    function equilateral(B: any, C: any): {
        above(): Polygon;
    };
}
export function quad(A: any, B: any, C: any, D: any): Polygon;
export class Polygon extends Drawable {
    constructor(conf?: {});
    get vertices(): any;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export namespace regular {
    import polygon_1 = polygon.regular;
    export { polygon_1 as polygon };
    /**
     * 정별(正별) — `regular.star(5, 1, 0.4)` (꼭짓점 수, 바깥 반지름, 안쪽 반지름).
     * 꼭짓점을 번갈아 두 반지름으로 잡아 {n/2} 별 모양을 만든다.
     */
    export function star(n?: number, rOuter?: number, rInner?: number): Polygon;
    /**
     * 타일 깔기 — `regular.tessellation('hex').on(region)`.
     * 영역(직사각형 경계 또는 `region.*`) 안에 타일을 채운다. 각 타일은 Polygon.
     */
    export function tessellation(kind?: string): {
        on(region: any): Polygon[];
    };
}
export namespace square {
    function on(seg: any): Polygon;
}
export default polygon;
import { Drawable } from '../core/drawable.js';
