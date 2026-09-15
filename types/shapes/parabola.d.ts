/** 초점 F, 준선(수평선) d 로 정의된 포물선 — 수직축 (위로/아래로 열림) */
export class Parabola extends Drawable {
    constructor(conf?: {});
    label(l: any, o: any): this;
    params(): {
        horizontal: boolean;
        p: number;
        vx: any;
        vy: number;
    } | {
        horizontal: boolean;
        p: number;
        vx: number;
        vy: any;
    };
    toIR(ctx: any): Readonly<any>[];
}
export namespace parabola {
    function focus(F: any): ParabolaBuilder;
    /** 꼭짓점과 초점으로 정의 (축은 두 점을 잇는 방향) */
    function vertex(V: any): VertexStep;
    /** y = a x² + b x + c (또는 x = a y² + b y + c) */
    function polynomial(a: any, b: any, c?: number, opts?: {}): Parabola;
    function standard(p: any): Parabola;
}
export default parabola;
import { Drawable } from '../core/drawable.js';
declare class ParabolaBuilder {
    constructor(F: any);
    _F: any;
    directrix(d: any): Parabola;
}
/** 꼭짓점 + 초점 → 준선은 초점의 거울상 (축은 두 점을 잇는 방향) */
declare class VertexStep {
    constructor(V: any);
    _V: any;
    focus(F: any): Parabola;
}
