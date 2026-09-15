/** 행렬 생성 — `mat([[a,b],[c,d]])` */
export function mat(rows: any): Matrix;
export namespace mat {
    /** 단위행렬 */
    function identity(n?: number): Matrix;
    /** 회전행렬 R(θ) — θ 는 도(반시계) */
    function rotation(deg: any): Matrix;
    /** 전단(밀기) — kx: x 방향, ky: y 방향 */
    function shear(kx?: number, ky?: number): Matrix;
    /** 스케일 */
    function scaling(sx: any, sy?: any): Matrix;
    /** 반사 — 'x'(x축) | 'y'(y축) | 'yx'(y=x) | 도(단위벡터 방향) */
    function reflection(axis: any): Matrix;
}
/** 행렬 — 행의 배열로 만든다. `mat([[a,b],[c,d]])` */
export class Matrix {
    /** @param {number[][]} rows */
    constructor(rows: number[][]);
    rows: number[][];
    n: number;
    m: number;
    /** 원시 행 배열 */
    toArray(): number[][];
    /** (i, j) 원소 */
    at(i: any, j: any): number;
    /** 정사각 행렬인가 */
    get square(): boolean;
    /** 행렬식 (2×2, 3×3) */
    get det(): number;
    /** 역행렬 (2×2, 3×3) — det=0 이면 예외 */
    get inv(): Matrix;
    /** 열 벡터 j */
    col(j: any): number[];
    /** 전치 */
    t(): Matrix;
    /** 행렬곱 `this · N` */
    mul(N: any): Matrix;
    /** `A^k` (k=0 → 단위행렬) */
    pow(k: any): Matrix;
    /** 점(벡터) 하나에 적용 — `A·x` */
    apply(p: any): number[];
    /** 점 배열에 적용 */
    map(pts: any): any;
    /** 사람이 읽는 형태 */
    toString(): string;
}
export namespace vec {
    function add(a: any, b: any): any;
    function sub(a: any, b: any): any;
    function scale(a: any, k: any): any;
    function dot(a: any, b: any): any;
    function norm(a: any): number;
    function unit(a: any): any;
    function project(a: any, b: any): any;
    function reject(a: any, b: any): any;
    function angleDeg(a: any, b: any): number;
    function cross(a: any, b: any): number[];
    function det2(a: any, b: any): number;
    function areaOf(a: any, b: any): number;
    function dist(a: any, b: any): number;
    function round(a: any, d?: number): any;
}
declare namespace _default {
    export { mat };
    export { vec };
    export { Matrix };
}
export default _default;
