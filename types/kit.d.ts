/**
 * 2D 플롯 프리셋 — `view + grid + axes` 를 한 번에.
 * @param {number[]} xr x 범위 `[xmin, xmax]`
 * @param {number[]} yr y 범위 `[ymin, ymax]`
 * @param {Object} [o] { size, grid, axes, equal }
 * @returns {Scene}
 * @example plot2d([-3, 3], [-2, 2]).equal().title('t')
 */
export function plot2d(xr: number[], yr: number[], { size, grid, axes, equal }?: any): Scene;
/**
 * 3D 플롯 프리셋 — matplotlib `view_init(elev, azim)` + `box_aspect` 대응.
 * 3D 씬은 **자동 축을 끄고**(`axes(false)`) `axes3()` 로 직접 그리는 것을 기본으로 한다.
 * @param {Object} [o] { elev, azim, aspect, size, axes }
 * @returns {Scene}
 * @example plot3d({ elev: 25, azim: -50 }).title('3D')
 */
export function plot3d({ elev, azim, aspect, size, axes }?: any): Scene;
/**
 * 여러 figure 를 그리드로 합친다. `panels()` 의 **얇은 래퍼**로,
 *  - 원시 `Scene` 이면 자동으로 `compile()` 하고,
 *  - `cell` 을 주지 않으면 `panels()` 가 figure 들의 `.size()` **최댓값**을
 *    셀 크기로 삼는다(셀보다 큰 서브씬이 이웃 패널을 침범하는 사고 방지).
 * @param {(Scene|Object)[]} figures Scene 또는 SceneIR 목록
 * @param {Object} [opts] panels 옵션 { cols, rows, cell, gap, pad, title, tight, background }
 * @example subplots([a, b, c], { cols: 3, title: 'Step by step', tight: true })
 */
export function subplots(figures: (Scene | any)[], opts?: any): {
    width: number;
    height: number;
    toSVG(so?: {}): string;
    toTikZ(): string;
    toPNG(o?: {}): Promise<Buffer>;
};
/**
 * figure 하나를 파일로 저장한다(SVG, 그리고 가능하면 PNG).
 * 원시 `Scene` 을 주면 자동으로 `compile()` 한다.
 * @param {Object} fig `toSVG()`/`toPNG()` 를 가진 것(SceneIR/panels) 또는 `Scene`
 * @param {Object} o { dir, name, svg=true, png=true, scale=1, math='text', log=true }
 * @returns {Promise<{svg:string|null, png:string|null}>} 저장된 경로
 */
export function saveFigure(fig: any, { dir, name, svg, png, scale, math, log }?: any): Promise<{
    svg: string | null;
    png: string | null;
}>;
/**
 * figure 목록을 한 번에 렌더해 저장한다. 실패한 figure 는 로그만 남기고 계속한다.
 *
 * @param {Array} figures `[[name, factory, title?], …]` 또는 `{ name: factory }`
 *   — `factory` 는 `Scene`/`SceneIR`/`panels(...)` 를 돌려주는 함수(원시 `Scene` 은 자동 컴파일)
 * @param {Object} o { dir, png, scale, math, log, index, title }
 * @returns {Promise<{ok:number, fail:number, dir:string, entries:Array}>}
 * @example
 *   await saveFigures([
 *     ['ex-circle', () => scene().add(circle.center(point(0,0)).radius(1)).compile(), '원'],
 *   ], { dir: 'output/demo', index: true });
 */
export function saveFigures(figures: any[], { dir, png, scale, math, log, index, title }?: any): Promise<{
    ok: number;
    fail: number;
    dir: string;
    entries: any[];
}>;
/**
 * 렌더 결과 SVGs 를 브라우저에서 훑어볼 수 있는 `index.html` 갤러리를 만든다.
 * (SVG 는 `<object>` 로 임베드 — 파일을 직접 열어도, `node server.js` 로 서빙해도 동작)
 */
export function writeGallery(dir: any, entries: any, { title, file }?: {
    title?: string;
    file?: string;
}): any;
/**
 * 두 점을 지나는 선 — 2D 좌표면 `line.through`(**직선**), z 가 있으면
 * `curve3.through`(두 점을 잇는 선분)로 자동 분기한다.
 * 2D 선분이 필요하면 logos 의 `segment(A, B)` 를 쓰세요.
 * @param {import('./shapes/point.js').Point|number[]} A 시작 점 (Point 또는 `[x, y]`/`[x, y, z]`)
 * @param {import('./shapes/point.js').Point|number[]} B 끝 점 (Point 또는 `[x, y]`/`[x, y, z]`)
 * @param {{ color?: string, stroke?: number, dash?: number[]|string, opacity?: number }} [o]
 *   스타일 — 모두 선택. `dash` 는 `[4, 3]` 형태 또는 CSS 문자열
 * @example seg(point(0,0), point(3,4), { color: palette.blue, stroke: 2 })
 */
export function seg(A: import("./shapes/point.js").Point | number[], B: import("./shapes/point.js").Point | number[], { color, stroke, dash, opacity }?: {
    color?: string;
    stroke?: number;
    dash?: number[] | string;
    opacity?: number;
}): import("./shapes/line.js").Line | {
    _ref: any;
    direction(d: any): import("./shapes/line.js").Line;
    slope(m: any): import("./shapes/line.js").Line;
    through(p: any): import("./shapes/line.js").Line;
    perpendicular(): {
        through: (p: any) => import("./shapes/line.js").Line;
        direction: (d: any) => import("./shapes/line.js").Line;
    };
    parallel(): {
        through: (p: any) => import("./shapes/line.js").Line;
    };
} | import("./shapes/threeD3.js").Curve3;
/**
 * 3D 폴리라인 (꺾은선) — `curve3.through` 의 얇은 래퍼.
 * @param {number[][]} points `[x, y, z]` 점들의 배열
 * @param {{ color?: string, stroke?: number, dash?: number[]|string, opacity?: number }} [o]
 *   스타일 — 모두 선택. `dash` 는 `[4, 3]` 형태 또는 CSS 문자열
 * @example poly3([[0,0,0],[3,2,4]], { color: '#000', stroke: 0.8, dash: [4,3] })
 */
export function poly3(points: number[][], { color, stroke, dash, opacity }?: {
    color?: string;
    stroke?: number;
    dash?: number[] | string;
    opacity?: number;
}): import("./shapes/threeD3.js").Curve3;
export namespace palette {
    export let blue: string;
    export let red: string;
    export let green: string;
    export let magenta: string;
    export let orange: string;
    export let yellow: string;
    export let cyan: string;
    export let black: string;
    export let white: string;
    export let gray: string;
    export let navy: string;
    export let purple: string;
    export let darkgreen: string;
    export let darkred: string;
    export let crimson: string;
    export let steel: string;
    export let skyblue: string;
    export let coral: string;
    export let wheat: string;
    export let orangead: string;
    export let b: string;
    export let r: string;
    export let g: string;
    export let m: string;
    export let y: string;
    export let c: string;
    export let k: string;
    export let w: string;
    export let o: string;
    export { TAB10 as tab };
    export let tab10: string[];
}
declare namespace _default {
    export { palette };
    export { plot2d };
    export { plot3d };
    export { subplots };
    export { saveFigure };
    export { saveFigures };
    export { writeGallery };
    export { seg };
    export { poly3 };
}
export default _default;
import { Scene } from './core/scene.js';
declare namespace TAB10 {
    let blue_1: string;
    export { blue_1 as blue };
    let orange_1: string;
    export { orange_1 as orange };
    let green_1: string;
    export { green_1 as green };
    let red_1: string;
    export { red_1 as red };
    let purple_1: string;
    export { purple_1 as purple };
    export let brown: string;
    export let pink: string;
    let gray_1: string;
    export { gray_1 as gray };
    export let olive: string;
    let cyan_1: string;
    export { cyan_1 as cyan };
}
