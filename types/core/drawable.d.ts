/**
 * Label 값(문자열 또는 Sym)을 화면에 그릴 문자열로 변환.
 * @param {*} v
 * @returns {string|null}
 */
export function renderText(v: any): string | null;
/**
 * v 가 수식 객체(Sym 등 — toLatex 보유)인지. IR 노드의 `math`/`labelMath` 플래그를
 * 만들 때 쓴다 — 플래그가 있어야 백엔드가 LaTeX 원문을 KaTeX 로 조판한다(평문과 구분).
 * @param {*} v
 * @returns {boolean}
 */
export function isMathText(v: any): boolean;
export class Drawable {
    /**
     * @param {string} kind  IR 종류
     * @param {Object} conf  도형별 초기 설정
     */
    constructor(kind: string, conf?: any);
    _kind: string;
    _conf: any;
    _order: number;
    /**
     * 불변 복제 — 모든 프로토콜 메서드의 공통 초석.
     * 중첩 설정(box·gradient·labelOff …)은 깊은 복사해 **상수 공유 오염**을 막는다(A4).
     * @param {Object} changes 바꿀 설정
     * @returns {this} 새 도형(원본 불변)
     */
    set(changes: any): this;
    /** `set()` 의 별칭 — "뮤테이션"처럼 들리는 이름 대신 불변 업데이트임을 드러낸다(B4). */
    with(changes: any): this;
    color(c: any): this;
    stroke(w: any): this;
    fill(f: any): this;
    dash(d: any): this;
    opacity(o: any): this;
    z(z: any): this;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    font(f: any): this;
    /** 행간(줄 간격 배수) — 여러 줄 텍스트의 'a\nb' 간격. 기본 1.32 (backend/fonts.js TYPE) */
    lineHeight(x: any): this;
    /** 자간(px) — 기본은 스타일시트 값(0.01em). 예: .letterSpacing(0.5) */
    letterSpacing(px: any): this;
    bold(on?: boolean): this;
    as(name: any): this;
    apply(...ts: any[]): this;
    symbolic(s: any): this;
    gradient(g: any): this;
    clip(r: any): this;
    get conf(): any;
    get order(): number;
    get kind(): string;
    /**
     * 플러그인이 등록한 메서드를 **이름으로** 호출하는 escape hatch.
     * 코어에 없는 기능을 이름만 알아도 쓸 수 있게 한다(`d.plugin('slope', 2)` ≡ `d.slope(2)`).
     * 미등록이면 "어떻게 등록하는지" 안내하는 PluginError 를 던진다.
     */
    plugin(name: any, ...args: any[]): any;
}
