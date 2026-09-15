/** 함수/심볼릭(Sym)·상수 어디든 1변수 함수로 만든다. */
export function asFn(f: any, v?: string): any;
export function pickStyle(c: any): {};
export class Curve extends Drawable {
    constructor(conf?: {});
    get kind(): any;
    get domain(): any;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    /** auto-framing 경계 (P1-2). implicit 은 사용자가 box 를 주지 않으면 [-2,2]² 로 가정. */
    bounds(): any;
    _fn(): any;
    eval(t: any): {
        cart: number[];
        cs: string;
        raw: {
            r: any;
            theta: any;
        };
    } | {
        cart: any[];
        cs: string;
        raw?: undefined;
    };
    /**
     * `curve.ode({ dy, y0 })` — 고전 RUNGE–KUTTA 4차 적분.
     * 구간(domain)이 바뀌면 다시 푼다(곡선은 불변, 결과만 캐시).
     */
    _odeSolve(): any[][];
    _odeCache: {
        key: string;
        pts: any[][];
    };
    /** ODE 해 폴리라인의 선형 보간(구간 밖은 외삽하지 않고 NaN). */
    _odeAt(t: any): any[];
    /** 접선/법선용 — 매개변수에 대한 수치 미분(단위벡터). */
    _rate(t: any): number[];
    /** `t` 에서의 접선 (Line) */
    tangentAt(t: any): import("./line.js").Line | {
        _ref: any;
        direction(d: any): import("./line.js").Line;
        slope(m: any): import("./line.js").Line;
        through(p: any): import("./line.js").Line;
        perpendicular(): {
            through: (p: any) => import("./line.js").Line;
            direction: (d: any) => import("./line.js").Line;
        };
        parallel(): {
            through: (p: any) => import("./line.js").Line;
        };
    };
    /** `t` 에서의 법선 (Line) */
    normalAt(t: any): import("./line.js").Line | {
        _ref: any;
        direction(d: any): import("./line.js").Line;
        slope(m: any): import("./line.js").Line;
        through(p: any): import("./line.js").Line;
        perpendicular(): {
            through: (p: any) => import("./line.js").Line;
            direction: (d: any) => import("./line.js").Line;
        };
        parallel(): {
            through: (p: any) => import("./line.js").Line;
        };
    };
    /** 호 길이 — 수치 적분(정밀 샘플 합). 기본은 전체 구간. */
    arcLength(opts?: {}): number;
    /** 곡률 κ = |x′y″ − y′x″| / (x′² + y′²)^{3/2} (수치 미분). */
    curvature(t: any): number;
    /** auto-framing 용: 균일 샘플(유한값만). */
    sample(): any[][];
    /**
     * P2-1/P2-2: 곡률 기반 adaptive 세분화 + 화면공간 불연속 검출 →
     * 연속 구간(segment)들의 점 리스트.
     * @param {Object} [ctx] { world } — 있으면 점프 임계/허용오차를 화면 기준으로 잡는다.
     */
    segments(ctx?: any): any[];
    toIR(ctx: any): Readonly<any>[];
}
export namespace curve {
    function fn(f: any, opts?: {}): Curve;
    function polar(f: any): Curve;
    function parametric(f: any): Curve;
    function implicit(f: any, opts?: {}): Curve;
    function bezier(P0: any, P1: any, P2: any, P3: any): Curve;
    /**
     * 구간별 함수 — `curve.piecewise([[0,1,f],[1,2,g]])` (구간 밖은 그리지 않음).
     * 각 조각은 `[a, b, f]` 또는 `{ a, b, fn }` 이다.
     */
    function piecewise(pieces: any, opts?: {}): Curve;
    /** 주어진 점들을 **지나가는** Catmull–Rom 스플라인 (`.tension(k)` 로 팽팽함 조절). */
    function spline(pts: any, opts?: {}): Curve;
    /**
     * 상미분방정식 dy/dx = dy(x, y), 초기값 y0 — RK4 로 적분해 곡선으로.
     * `dy` 는 함수 또는 심볼릭(tex). 구간은 `.on([x0, x1])`.
     */
    function ode(o?: {}): Curve;
    /**
     * `at` 근방 테일러 다항식(차수 `order`) — 심볼릭이면 정확한 도함수, 함수면 수치 미분.
     * @param {Function|*} f 함수 또는 tex 식
     * @param {{at?:number, order?:number, h?:number}} opts
     */
    function taylor(f: Function | any, opts?: {
        at?: number;
        order?: number;
        h?: number;
    }): Curve;
}
export default curve;
import { Drawable } from '../core/drawable.js';
