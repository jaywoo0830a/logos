/** 컬러맵 t∈[0,1] → hex */
export function cmapColor(name: any, t: any): string;
/** 밝기 배율 k 로 명암 조절 */
export function shade(hex: any, k: any): string;
export function arrow3(from: any, to: any): Arrow3;
/**
 * mplot3d 관례의 3D 좌표축(화살표 3개 + x/y/z 라벨).
 *
 * logos 의 3D 씬은 `axes(false)` 로 자동 축을 끄고 직접 그리는 것을 권장한다
 * (matplotlib 에서 `ax.set_axis_off()` + 화살표 3개를 그리는 관용구와 같다).
 * 반환값이 **배열**이므로 `.add(...axes3({ length: 5 }))` 처럼 펼쳐 넣는다.
 *
 * @param {Object} [o]
 * @param {number[]} [o.origin=[0,0,0]] 화살표 시작점
 * @param {number}   [o.length=5]        각 축의 길이
 * @param {string}   [o.color='#808080'] 축 색
 * @param {number}   [o.width=1]         축 굵기
 * @param {string[]} [o.labels=['x','y','z']] 축 라벨(null 이면 생략)
 * @param {number}   [o.ratio=0.06]      머리 길이 비율. 축은 길어서 기본값을 `arrow3`(0.12)보다
 *                                       작게 잡는다(머리만 커 보이는 것 방지). `null` 이면 0.12.
 * @param {number}   [o.labelFont=12]    라벨 글자 크기
 * @param {number[]} [o.labelOffset]     라벨 오프셋(선택)
 * @returns {Arrow3[]} `.add(...)` 에 펼칠 수 있는 도형 배열
 * @example
 *   scene().dim(3).camera({ elev: 20, azim: -50 }).axes(false)
 *     .add(...axes3({ length: 4, color: '#808080', width: 0.8 }));
 */
export function axes3({ origin, length, color, width, labels, ratio, labelFont, labelOffset, }?: {
    origin?: number[];
    length?: number;
    color?: string;
    width?: number;
    labels?: string[];
    ratio?: number;
    labelFont?: number;
    labelOffset?: number[];
}): Arrow3[];
/** 원호 (z=cz 평면에 놓인 원) — `circle3(반지름, z, 중심)` */
export function circle3(r: any, z?: number, center?: number[]): Curve3;
/** 3D 프레이밍 상자 — `frame3([-2,2], [-2,2], [-2,2])` */
export function frame3(xlim: any, ylim: any, zlim: any): Frame3;
export class Curve3 extends Drawable {
    constructor(conf?: {});
    on(domain: any): this;
    label(t: any, off: any): this;
    get vertices(): any;
    _sample(): any;
    toIR(ctx: any): Readonly<any>[];
}
export namespace curve3 {
    function parametric(f: any): Curve3;
    function through(pts: any): Curve3;
    /**
     * 두 3D 곡선의 교차점(수치) — 각 곡선을 샘플해 가장 가까운 쌍이 tol 이내면 교점으로 본다.
     * 반환은 Point 배열(0개 이상). `curve3.intersect(c1, c2)` / `.tol(t)` 형태의 옵션.
     */
    function intersect(c1: any, c2: any, opts?: {}): import("./point.js").Point[];
}
export class Arrow3 extends Drawable {
    constructor(conf?: {});
    to(P: any): this;
    label(t: any, off: any): this;
    /** 머리 길이 비율 (matplotlib arrow_length_ratio; 기본 0.12) */
    ratio(r: any): this;
    get vertices(): import("./point.js").Point[];
    toIR(ctx: any): Readonly<any>[];
}
export class ParamSurface extends Drawable {
    constructor(conf?: {});
    on(ur: any, vr: any): this;
    wire(nu: any, nv: any): this;
    solid(nu: any, nv: any): this;
    cmap(name: any): this;
    get vertices(): import("./point.js").Point[];
    toIR(ctx: any): Readonly<any>[];
}
export function surfaceParam(fn: any): ParamSurface;
export namespace quadrics {
    /** z = f(x,y) 그래프 (matplotlib plot_surface 의 기본형) */
    function plane(f: any, xr: any, yr: any): ParamSurface;
    /** 타원체 x²/a² + y²/b² + z²/c² = 1 */
    function ellipsoid(a: any, b: any, c: any, center?: number[]): ParamSurface;
    /** 구 (반지름 r) */
    function ball(r: any, center?: number[]): ParamSurface;
    /** 한 겹 쌍곡면 x²/a² + y²/b² − z²/c² = 1 (v 범위로 z 절단) */
    function hyperboloid1(a: any, b: any, c: any, center?: number[], vr?: number[]): ParamSurface;
    /** 두 겹 쌍곡면 −x²/a² − y²/b² + z²/c² = 1 (v>0 한 겹; v<0 은 다른 겹) */
    function hyperboloid2(a: any, b: any, c: any, center?: number[], vr?: number[]): ParamSurface;
    /** 이중 원뿔 z² = k²(x²+y²) — v∈[-h,h] 두 뿔 */
    function cone(k: any, center?: number[], vr?: number[]): ParamSurface;
    /** 원기둥 x²+y²=r² — z∈zr */
    function cylinder(r: any, center?: number[], zr?: number[]): ParamSurface;
}
/**
 * 그리지 않지만 **프레이밍에만** 참여하는 상자.
 * matplotlib 의 `ax.set_xlim/set_ylim/set_zlim` 처럼 3D 뷰 범위를 고정한다
 * (도형이 점 하나뿐이거나 축만 보이고 싶을 때 유용).
 * `toIR()` 이 빈 배열이라 출력에는 아무것도 추가되지 않는다.
 */
export class Frame3 extends Drawable {
    constructor(conf: any);
    get vertices(): import("./point.js").Point[];
    toIR(): any[];
}
import { Drawable } from '../core/drawable.js';
