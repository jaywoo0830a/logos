export function pickStyle(c: any): {};
export class Line extends Drawable {
    constructor(conf?: {});
    /** 점-방향 표현 { p:[x,y], d:[dx,dy] } */
    pointDir(): {
        p: any[];
        d: any[];
    };
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    /** 세계 사각형과 클리핑한 양 끝점 → [ [x,y],[x,y] ] 또는 null */
    clipped(world: any): any[][];
    toIR(ctx: any): Readonly<any>[];
}
export namespace line {
    function through(a: any, b: any): Line | Builder;
    function slopeIntercept(m: any, b: any): Line;
    function horizontal(y?: number): Line;
    function vertical(x?: number): Line;
    function intercepts(xi: any, yi: any): Line;
    function standard(a: any, b: any, c: any): Line;
    function perpendicular(l: any): {
        through: (p: any) => Line;
        direction: (d: any) => Line;
    };
    function parallel(l: any): {
        through: (p: any) => Line;
    };
    function tangent(circle: any): TangentBuilder;
    function angleBisector(A: any, B: any, C: any): Line;
    /**
     * 극선(polar) — 원 `c` 에 대한 점 `P` 의 극선: (X−O)·(P−O) = r².
     *   P 가 원 위 → 접선, 원 밖 → 두 접점을 잇는 직선, 중심 → 정의되지 않음(null).
     */
    function polar(c: any, P: any): Line;
    /**
     * 두 원의 공통 접선 — 바깥 접선부터, 이어서 안쪽(교차) 접선.
     * 반환값에 `.all` 로 전체 목록이 붙는다(없으면 null).
     */
    function commonTangent(c1: any, c2: any): any;
}
export default line;
import { Drawable } from '../core/drawable.js';
declare class Builder {
    constructor(ref: any);
    _ref: any;
    direction(d: any): Line;
    slope(m: any): Line;
    through(p: any): Line;
    perpendicular(): {
        through: (p: any) => Line;
        direction: (d: any) => Line;
    };
    parallel(): {
        through: (p: any) => Line;
    };
}
declare class TangentBuilder {
    constructor(target: any);
    _target: any;
    get _isCircle(): boolean;
    get _isCurve(): boolean;
    at(P: any): Line;
    slope(m: any): Line;
}
