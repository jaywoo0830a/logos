export class Cylinder extends Drawable {
    constructor(conf?: {});
    get vertices(): import("./point.js").Point[];
    toIR(ctx: any): Readonly<any>[];
}
export namespace cylinder {
    function center(O: any): {
        axis: (a: any) => {
            radius: (r: any) => {
                height: (h: any) => Cylinder;
            };
        };
        radius: (r: any) => {
            height: (h: any) => Cylinder;
        };
    };
    /** `cylinder.axis(l).radius(1).height(5)` — 축선(Line) 또는 방향벡터 */
    function axis(a: any): {
        radius: (r: any) => {
            height: (h: any) => Cylinder;
        };
    };
}
export class Cone extends Drawable {
    constructor(conf?: {});
    get vertices(): import("./point.js").Point[];
    toIR(ctx: any): Readonly<any>[];
}
export namespace cone {
    function vertex(V: any): {
        axis: (a: any) => {
            radius: (r: any) => {
                height: (h: any) => Cone;
            };
        };
        radius: (r: any) => {
            height: (h: any) => Cone;
        };
    };
}
export class Surface extends Drawable {
    constructor(conf?: {});
    get vertices(): import("./point.js").Point[];
    toIR(ctx: any): Readonly<any>[];
}
export class ZSurface extends Drawable {
    constructor(conf?: {});
    on(xr: any, yr: any): this;
    mesh(n: any): this;
    faces(on?: boolean): this;
    /** 면 색을 높이 z 로 컬러맵 적용 (matplotlib cmap 대응) */
    cmap(name: any): this;
    get vertices(): import("./point.js").Point[];
    toIR(ctx: any): Readonly<any>[];
}
export namespace surface {
    function revolution(curveObj: any): {
        about: () => Surface;
    };
    /** z = f(x,y).on([x0,x1],[y0,y1]).mesh(n) / .faces() */
    function z(fn: any): ZSurface;
}
export class VectorField3 extends Drawable {
    constructor(conf?: {});
    on(box: any): this;
    step(s: any): this;
    len(l: any): this;
    get vertices(): import("./point.js").Point[];
    toIR(ctx: any): Readonly<any>[];
}
export function vectorField3(fn: any): VectorField3;
export class Polyhedron extends Drawable {
    constructor(conf?: {});
    toIR(ctx: any): Readonly<any>[];
}
export namespace polyhedron {
    function platonic(name: any): {
        circumradius: (R: any) => Polyhedron;
    };
}
import { Drawable } from '../core/drawable.js';
