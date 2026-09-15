/** 복소수 생성 — `cplx(3, 2)` = 3+2i */
export function cplx(re: any, im?: number): Complex;
export namespace cplx {
    /** 극형식 — `cplx.polar(2, 60)` = 2e^{i60°} (θ 는 도) */
    export function polar(r: any, deg: any): Complex;
    export { of };
    /** a + b */
    export function add(a: any, b: any): Complex;
    /** a − b */
    export function sub(a: any, b: any): Complex;
    /** a · b */
    export function mul(a: any, b: any): Complex;
    /** a / b */
    export function div(a: any, b: any): Complex;
    /** k·a */
    export function scale(a: any, k: any): Complex;
    /** −a */
    export function neg(a: any): Complex;
    /** 켤레 ā */
    export function conj(a: any): Complex;
    /** |a| */
    export function abs(a: any): number;
    /** arg a (라디안) */
    export function arg(a: any): number;
    /** arg a (도) */
    export function argDeg(a: any): number;
    /** 실수인가 */
    export function isReal(a: any): boolean;
    /** aⁿ */
    export function pow(a: any, n: any): Complex;
    /** a 의 n제곱근 n개 */
    export function roots(a: any, n: any): Complex[];
    /** 1의 n제곱근 (반지름 r) — 정n각형 꼭짓점, k=0…n−1 */
    export function unity(n: any, r?: number): Complex[];
    /** 성분별 반올림 (라벨/디버그용) */
    export function round(a: any, d?: number): Complex;
    /**
     * a+bi ↔ 회전·확대 행렬 [[a, −b], [b, a]] (12A2 의 `mat` 과 그대로 연결).
     * 곱셈 = 이 행렬의 곱, |z|² = det A, kz = kA.
     */
    export function matrix(a: any): import("./linalg.js").Matrix;
}
/** 복소수 — 실수부 `re`, 허수부 `im` */
export class Complex {
    /** 극형식 (r, θ)으로 생성 — θ 는 도 */
    static polar(r: any, deg: any): Complex;
    /**
     * @param {number} re 실수부
     * @param {number} im 허수부
     */
    constructor(re?: number, im?: number);
    re: number;
    im: number;
    /** `[x, y]` (=복소평면의 점) */
    toArray(): number[];
    /** |z| = √(a² + b²) */
    get abs(): number;
    /** arg z — 라디안 (−π, π] */
    get arg(): number;
    /** arg z — 도(degree) */
    get argDeg(): number;
    /** 켤레 z̄ = a − bi (실축 반사) */
    get conj(): Complex;
    /** 실수인가 (허수부 ≈ 0) */
    get isReal(): boolean;
    /** 극형식 { r, theta, thetaDeg } */
    toPolar(): {
        r: number;
        theta: number;
        thetaDeg: number;
    };
    /** z₁ + z₂ (벡터 덧셈과 동일) */
    add(z: any): Complex;
    /** z₁ − z₂ */
    sub(z: any): Complex;
    /** z₁ · z₂ — |z₁z₂| = |z₁||z₂|, arg(z₁z₂) = arg z₁ + arg z₂ */
    mul(z: any): Complex;
    /** z₁ / z₂ = z₁z̄₂ / |z₂|² (0 으로 나누면 예외) */
    div(z: any): Complex;
    /** k·z (실수배) */
    scale(k: any): Complex;
    /** −z (원점 대칭 = 180° 회전) */
    neg(): Complex;
    /** zⁿ — 음수 지수도 허용 (z=0 과 n≤0 은 예외) */
    pow(n: any): Complex;
    /** n제곱근 n개 (k = 0 … n−1) — 정n각형 꼭짓점 */
    roots(n: any): Complex[];
    /** 거의 같은가 (기본 1e-9) */
    equals(z: any, eps?: number): boolean;
    /** 사람이 읽는 형태 — `3+2i`, `3-2i`, `-i`, `i`, `2` */
    toString(): string;
}
declare namespace _default {
    export { cplx };
    export { Complex };
}
export default _default;
/** 입력을 `Complex` 로 정규화 — Complex / `[x, y]` / 실수 */
declare function of(v: any): Complex;
