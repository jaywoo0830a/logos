export function warnOutOfView(kinds: any): void;
/**
 * 여러 figure(SceneIR)를 그리드로 합친다 (matplotlib subplots 대응).
 * 각 figure 는 중첩 <svg x,y> 로 배치되며 자체 viewBox 스케일을 유지한다.
 *
 * `cell` 을 생략하면 **figure 들의 `.size()` 중 최댓값을 셀 크기로 자동 사용**한다
 * (셀보다 큰 서브씬이 이웃 패널을 침범해 겹치는 사고 방지).
 * @param {SceneIR[]} figures
 * @param {Object} [opts] { cols, cell, gap, pad, title(suptitle), background, scale, math, tight }
 */
export function panels(figures: SceneIR[], opts?: any): {
    width: number;
    height: number;
    toSVG(so?: {}): string;
    toTikZ(): string;
    toPNG(o?: {}): Promise<any>;
};
export class SceneIR {
    constructor(o: any);
    o: any;
    _map(): {
        map: (x: any, y: any) => number[];
        scale: number;
        scaleX: number;
        scaleY: number;
        W: any;
        H: any;
    };
    toSVG(opts?: {}): any;
    /** 마지막 `toSVG()`/`toPNG()` 에서 화면 밖이라 제외된 노드 종류 목록. */
    cullReport: any[];
    toTikZ(opts?: {}): any;
    /** Asymptote 소스 생성 (2D) — ADAPT §2·3 */
    toAsymptote(opts?: {}): string;
    /** node-tikzjax(WASM)로 TikZ → SVG — ADAPT §4 */
    toTikZSVG(opts?: {}): Promise<{
        tex: string;
        svg: any;
    }>;
    /** JSXGraph 인터랙티브 HTML — ADAPT §2 (선택) */
    toJSXGraphHTML(opts?: {}): string;
    /** KaTeX 조판된 <figure> HTML — ADAPT §4 (좌표는 world→screen 매핑 적용) */
    toHTML(opts?: {}): string;
    toJSON(): {
        dim: any;
        world: any;
        size: any;
        nodes: any;
    };
    toReact(): any;
    /**
     * P0-4: SVG → PNG 래스터화. `@resvg/resvg-js` 가 설치돼 있으면 동작한다.
     * (없으면 명확히 안내). math 기본값은 폰트 비의존 'text' — foreignObject 는 래스터에서 소실되므로.
     */
    toPNG(opts?: {}): Promise<any>;
    toPDF(): void;
    toCanvas(): void;
    /** IR 노드 순회 — `[...ir]` · `for (const n of ir)` 로 노드에 바로 접근한다(A7). */
    [Symbol.iterator](): any;
}
export default SceneIR;
