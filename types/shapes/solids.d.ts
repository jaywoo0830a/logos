/** 3D 면들을 IR 로 — 각 면은 꼭짓점 배열. */
export function facesIR(ctx: any, faces: any, c: any): Readonly<any>[];
/** 꼭짓점 + 면 인덱스로 정의되는 다면체 */
export class CustomPolyhedron extends Drawable {
    constructor(conf?: {});
    /** 면 인덱스 목록 — `faces([[0,1,2],[0,1,3]])` */
    faces(list: any): this;
    edges(on?: boolean): this;
    get vertices(): any;
    _faces(): any;
    toIR(ctx: any): Readonly<any>[];
}
export namespace cube {
    function center(O: any): {
        edge: (e: any) => Cube;
    };
}
export namespace prism {
    function base(poly: any): Prism;
}
export namespace pyramid {
    function base(poly: any): Pyramid;
}
export namespace torus {
    /** `torus.center(O).radii(R, r)` — 큰 반지름 R, 관 반지름 r */
    function center(O: any): {
        radii: (R?: number, r?: number) => import("./threeD3.js").ParamSurface;
    };
}
export namespace surfaceExtra {
    /** `surface.of((u,v) => [x,y,z]).on([u0,u1],[v0,v1])` — surfaceParam 과 같다 */
    function of(fn: any): import("./threeD3.js").ParamSurface;
    /** 두 3D 곡선 사이의 직선 보간 곡면(룰드) */
    function ruled(c1: any, c2: any): import("./threeD3.js").ParamSurface;
    /**
     * 음함수 곡면 `f(x,y,z) = 0` — marching tetrahedra 로 삼각형 면을 만든다.
     * `surface.implicit(f).on([x0,x1],[y0,y1],[z0,z1]).res(n)`
     */
    function implicit(f: any): ImplicitSurface;
}
export class ImplicitSurface extends Drawable {
    constructor(conf?: {});
    on(xr: any, yr: any, zr: any): this;
    res(n: any): this;
    _faces(): any[][][];
    toIR(ctx: any): Readonly<any>[];
}
import { Drawable } from '../core/drawable.js';
/** 정육면체 — `cube.center(O).edge(e)` */
declare class Cube extends Drawable {
    constructor(conf?: {});
    toIR(ctx: any): Readonly<any>[];
}
/** 밑면 다각형을 z 축으로 밀어 올린 기둥 — `prism.base(polygon).height(h)` */
declare class Prism extends Drawable {
    constructor(conf?: {});
    height(h: any): this;
    toIR(ctx: any): Readonly<any>[];
}
/** 밑면 다각형 + 꼭대기 점 — `pyramid.base(polygon).apex(P)` */
declare class Pyramid extends Drawable {
    constructor(conf?: {});
    apex(P: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export {};
