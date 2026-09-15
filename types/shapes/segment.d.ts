export function segment(A: any, B: any): Segment;
export namespace segment {
    function ofLength(len: any): {
        from: (P: any) => {
            angle: (a: any) => Segment;
        };
    };
    function bisector(A: any, B: any): any;
}
export class Segment extends Drawable {
    constructor(conf?: {});
    get a(): any;
    get b(): any;
    /** 양 끝점 `[A, B]` — 구조 분해 `const [a, b] = seg.ends` (B2). */
    get ends(): any[];
    length(): number;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    bounds(): {
        xmin: number;
        xmax: number;
        ymin: number;
        ymax: number;
    };
    toIR(): Readonly<any>[];
}
export default segment;
import { Drawable } from '../core/drawable.js';
