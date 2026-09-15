export function annotate(): _Annotate;
export namespace annotate {
    /**
     * 각도 표식 ∠ABC — **가운데 인자가 각의 꼭짓점**이다.
     *
     * ```js
     * annotate.angle(A, B, C)                 // B 가 꼭짓점 (∠ABC)
     * annotate.angle({ from, vertex, to })    // 이름으로 지정 — 순서 헷갈림 방지, [x,y] 도 허용
     * ```
     * 꼭짓점을 첫 인자로 넣는 실수(=`annotate.angle(O, A, B)`)는 호가 엉뚱한 곳(점 A)에
     * 그려지므로, 헷갈리면 **이름 있는 형태**를 쓰세요.
     */
    function angle(A: any, B: any, C: any): AngleAnno;
    function caption(text: any): CaptionAnno;
    function integral(f: any): IntegralAnno;
    function arrow(A: any, B: any): ArrowAnno;
    function dimension(A: any, B: any): DimensionAnno;
    function dot(P: any): DotAnno;
    function tick(seg: any): TickAnno;
    function text(P: any): TextAnno;
    function shade(region: any): ShadeAnno;
    function brace(target: any): BraceAnno;
    function limit(f: any, ...args: any[]): LimitAnno;
    function legend(opts: any): LegendAnno;
}
export class AngleAnno extends Drawable {
    constructor(A: any, B: any, C: any);
    arc(opts?: {}): this;
    rightAngle(): this;
    degrees(): this;
    radians(): this;
    label(l: any, off: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export class CaptionAnno extends Drawable {
    constructor(text: any);
    toIR(ctx: any): Readonly<any>[];
}
export class IntegralAnno extends Drawable {
    constructor(f: any);
    from(a: any): IntegralAnno2;
    to(b: any): IntegralAnno2;
    label(l: any, off: any): this;
    shade(color: any): this;
    toIR(ctx: any): any[];
}
export class ArrowAnno extends Drawable {
    constructor(A: any, B: any);
    label(l: any, off: any): this;
    /**
     * 곡선 화살표 — mpl `connectionstyle='arc3,rad=…'` 대응.
     * `rad > 0` 이면 진행 방향 **오른쪽**으로 휜다(원호 화살표·순환 표시에 쓴다).
     * @param {number} rad 휨 정도(현 길이에 대한 비율)
     */
    bend(rad: number): this;
    toIR(): Readonly<any>[];
}
export class DimensionAnno extends Drawable {
    constructor(A: any, B: any);
    offset(o: any): this;
    units(u: any): this;
    label(l: any, off: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export class DotAnno extends Drawable {
    constructor(P: any);
    label(l: any, off: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export class TickAnno extends Drawable {
    constructor(seg: any);
    count(n: any): this;
    toIR(): Readonly<any>[];
}
export class TextAnno extends Drawable {
    constructor(P: any, text: any);
    label(l: any, opts: any): this;
    anchor(a: any): this;
    offset(dx: any, dy: any): this;
    font(f: any): this;
    bold(on?: boolean): this;
    rotate(deg: any): this;
    /** 텍스트 배경 상자 (matplotlib bbox). 예: .box({ facecolor:'wheat', alpha:0.8 }) */
    box(cfg?: {}): this;
    toIR(ctx: any): Readonly<any>[];
}
export default annotate;
declare class _Annotate extends Drawable {
    toIR(): any[];
}
/** 영역 채움 — region 을 주석처럼 색/투명도만 바꿔 그린다. */
declare class ShadeAnno extends Drawable {
    constructor(region: any);
    fill(f: any): this;
    color(c: any): this;
    opacity(o: any): this;
    toIR(ctx: any): any;
}
/** 곡선/선분 위에 중괄호(브레이스) — 현(chord)을 따라 깊이 depth 만큼 띄워 그린다. */
declare class BraceAnno extends Drawable {
    constructor(target: any);
    label(l: any): this;
    depth(d: any): this;
    toIR(ctx: any): Readonly<any>[];
}
/** 극한 표시 — y = lim f 의 점선 가이드 + 열린 점 + 라벨. */
declare class LimitAnno extends Drawable {
    constructor(f: any, ...args: any[]);
    label(l: any): this;
    toIR(ctx: any): Readonly<any>[];
}
/**
 * 범례 — 표시자(marker)만 방출하고, 실제 상자는 `SceneIR.toSVG` 가 라벨 있는 도형을 모아 만든다.
 * (그림 전체를 봐야 하므로 컴파일 단계에서 확장된다.)
 */
declare class LegendAnno extends Drawable {
    constructor(opts?: {});
    title(t: any): this;
    toIR(): Readonly<any>[];
}
import { Drawable } from './core/drawable.js';
declare class IntegralAnno2 extends IntegralAnno {
}
