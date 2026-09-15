/**
 * SVG emitter — `api.node('hatch', { svg })` 로 등록된다.
 * ctx: { map, scaleX, scaleY, theme, gradId, esc, style }
 *   ctx.map(d, x, y) → 화면 좌표, ctx.style(d) → { stroke, 'stroke-width', opacity, dash }
 */
export function hatchSvg(n: any, ctx: any): string;
/** TikZ emitter — 패턴 라이브러리로 같은 그림이 나간다 */
export function hatchTikz(n: any): string;
export class Ray extends Drawable {
    /** @param {Point} O 시작점 @param {Point} P 방향을 정하는 점 */
    constructor(O: Point, P: Point, conf?: {});
    get O(): any;
    get P(): any;
    /** O + t·(P − O) — t>1 이면 P 너머, t<0 이면 반대쪽 */
    at(t: any): import("../index.js").Point;
    /** 그려지는 구간 — 뒤로 tail, 앞으로 over 배(반직선처럼 보이게) */
    segment(tail: any, over: any): import("../index.js").Point[];
    length(): number;
    bounds(): {
        xmin: number;
        xmax: number;
        ymin: number;
        ymax: number;
    };
    toIR(): Readonly<any>[];
}
export class Arc extends Drawable {
    /** @param {Point} C 중심 @param {number} r 반지름 @param {number} a0,a1 각(기본 도) */
    constructor(C: Point, r: number, a0: number, a1: any, conf?: {});
    /** 끝점 */
    end(t: any): import("../index.js").Point;
    sweep(): number;
    bounds(): {
        xmin: number;
        xmax: any;
        ymin: number;
        ymax: any;
    };
    toIR(): Readonly<any>[];
}
/** 사선 음영 직사각형 — `.hatch({ gap, angle })` 로 밀도를 바꿀 수 있다 */
export class Hatched extends Drawable {
    constructor(x: any, y: any, w: any, h: any, conf?: {});
    hatch(o?: {}): this;
    text(t: any): this;
    bounds(): {
        xmin: any;
        xmax: any;
        ymin: any;
        ymax: any;
    };
    toIR(): Readonly<any>[];
}
export function ray(O: any, P: any, conf: any): Ray;
export function arcCircular(C: any, r: any, a0: any, a1: any, conf: any): Arc;
export function hatch(x: any, y: any, w: any, h: any, conf: any): Hatched;
export namespace chainables {
    function tilt(c: any, deg: any): {
        transforms: any[];
    };
    function dashed(c: any, d?: number[]): {
        dash: number[];
    };
}
/**
 * `.arrowTip()` — **임의의 도형** 끝에 화살촉을 붙인다.
 *
 * 코어 path emitter 는 노드 데이터에 `head: true` 가 있을 때만 marker-end 를 붙이는데,
 * 모든 코어 도형이 `head` 를 IR 로 넘기지는 않는다. 그래서 이 메서드는 패치가 아니라
 * **IR 을 감싸는 새 Drawable(TipMarked)** 을 돌려준다 — 플러그인 규칙 ③(Drawable 반환은
 * 그대로 통과) 덕분에 체이닝도 그대로 이어진다.
 *   `segment(A, B).arrowTip().color('#c00')`  ← 감싼 뒤에도 코어 메서드 사용 가능
 */
export class TipMarked extends Drawable {
    constructor(inner: any, conf?: {});
    get inner(): any;
    /** 감싼 도형의 경계 위임 — 씬의 자동 view 계산과 협력한다 */
    bounds(): any;
    toIR(ctx: any): any;
}
export namespace wrappers {
    function arrowTip(): TipMarked;
}
export namespace chalkTheme {
    let bg: string;
    let gridColor: string;
    let gridMajor: string;
    let axisColor: string;
    let axisWidth: number;
    let tickColor: string;
    let labelColor: string;
    let font: string;
    let fontMath: string;
    let pointColor: string;
    let strokeDefault: string;
}
export default geometryExtras;
export type Point = import("../shapes/point.js").Point;
import { Drawable } from '../index.js';
declare namespace geometryExtras {
    let name: string;
    let version: string;
    /**
     * @param {Object} api 플러그인 등록 API
     * @param {Object} opts { watermark=true, stampTitle=false }
     */
    function install(api: any, opts?: any): void;
}
