export class ArcShape extends Drawable {
    constructor(conf?: {});
    from(a: any): this;
    to(a: any): this;
    cw(on?: boolean): this;
    n(k: any): this;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    _rel(P: any): number[];
    toIR(): Readonly<any>[];
}
export namespace arcCore {
    function circular(O: any, r: any, a0?: number, a1?: number): ArcShape;
    function circle(O: any, r: any): ArcShape;
    function ofCircle(c: any): {
        from: (A: any) => ArcShape;
        to: (A: any) => ArcShape;
    };
    /** 세 점을 지나는 원호 (A → B 를 지나 C 까지) */
    function through(A: any, B: any, C: any): ArcShape;
}
export namespace sectorCore {
    function ofCircle(c: any): {
        angle: (theta: any) => import("./region.js").Region;
        from: (a0: any) => {
            to: (a1: any) => import("./region.js").Region;
        };
    };
    function circular(O: any, r: any, a0?: number, a1?: number): import("./region.js").Region;
}
/** 반직선 — 시작점 + 방향. 뷰에 맞춰 잘라 그린다. */
export class RayShape extends Drawable {
    constructor(conf?: {});
    through(P: any): this;
    direction(d: any): this;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export function rayCore(A: any, B: any): RayShape | RayBuilder;
export namespace rayCore {
    function from(A: any): RayBuilder;
}
import { Drawable } from '../core/drawable.js';
declare class RayBuilder {
    constructor(A: any);
    _A: any;
    through(B: any): RayShape;
    direction(d: any): RayShape;
}
export {};
