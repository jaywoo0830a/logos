export function vector(...args: any[]): Vector;
export namespace vector {
    function between(A: any, B: any): Vector;
    function unit(angle: any): Vector;
    function normal(A: any, B: any, C: any): Vector;
    function from(A: any): {
        to: (B: any) => Vector;
    };
    function gradient(f: any): {
        at: (P: any) => Vector;
    };
    function div(F: any): {
        at: (P: any) => number;
    };
    function curl(F: any): {
        at: (P: any) => number | Vector;
    };
}
export class Vector extends Drawable {
    constructor(conf?: {});
    get v(): any;
    get dim(): any;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    toIR(): Readonly<any>[];
}
import { Drawable } from '../core/drawable.js';
