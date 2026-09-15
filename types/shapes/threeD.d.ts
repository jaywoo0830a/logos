export function pick(c: any): {};
/** depth(시선거리) → z 키. 뒤(큰 depth)일수록 작은 z → 먼저 그려진다. layer 는 미세 우선순위. */
export function depthZ(depth: any, layer?: number): number;
export function polyline(pts: any, c: any, layer: any, nodeImp?: typeof node, pickImp?: typeof pick): Readonly<any>;
export function project3(ctx: any, p: any): any;
export class Sphere extends Drawable {
    constructor(conf?: {});
    center(): any;
    radius(): any;
    get vertices(): import("./point.js").Point[];
    label(l: any, o: any): this;
    /** 위도선 개수 — `rings(false|0)` 로 끄고, `rings(3)` 처럼 성기게. 기본 7. */
    rings(n?: number): this;
    /** 경선 개수 — 기본 0(안 그림). `meridians(4)` 면 세로 반원 4개. */
    meridians(n?: number): this;
    toIR(ctx: any): Readonly<any>[];
}
export namespace sphere {
    function center(O: any): {
        radius: (r: any) => Sphere;
        /** 중심 + 한 점 → 반지름이 |P−O| 인 구 */
        through: (P: any) => Sphere;
    };
    /** 네 점을 지나는 구 (구면 방정식 3원 연립) */
    function through(A: any, B: any, C: any, D: any): Sphere;
    function unit(): Sphere;
}
export class Plane extends Drawable {
    constructor(conf?: {});
    /** 평면을 법선 방향으로 d 만큼 평행이동 */
    offset(d: any): this;
    /** 단위 법선 */
    normal(): number[];
    /** 평면 위의 한 점 */
    anchor(): any[];
    _normal(): any[];
    _P0(): any[];
    get vertices(): import("./point.js").Point[];
    _corners3(half: any): any[][];
    toIR(ctx: any): Readonly<any>[];
}
export namespace plane {
    function coordinate(name: any): Plane;
    function normal(v: any): Plane;
    /** 세 점을 지나는 평면 (법선 = (B−A)×(C−A)) */
    function through(A: any, B: any, C: any): Plane;
    /** 점 + 법선 */
    function pointNormal(A: any, n: any): Plane;
    /** ax + by + cz = d */
    function standard(a: any, b: any, c: any, d: any): Plane;
}
import { node } from '../core/node.js';
import { Drawable } from '../core/drawable.js';
