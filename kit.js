// kit.js — 그림 **작성 키트** (예제·스케치·테스트가 공유하는 얇은 헬퍼 계층)
//
// 왜 필요한가
//   예제/스케치를 쓰다 보면 매번 같은 4가지가 반복된다.
//     ① 색 팔레트(빨강·파랑·초록 …)  ② 축/그리드가 켜진 기본 씬
//     ③ 여러 씬을 subplot 으로 합치기  ④ SVG/PNG 로 저장 + 로그
//   이 4가지를 각 예제가 손으로 복사해 두면 값이 조금씩 어긋나고
//   (셀 크기 불일치로 패널이 겹치는 사고 등) 문서화도 흩어진다.
//   그래서 라이브러리 차원의 [작성 키트]로 옮겼다.
//
// 이 모듈은 **렌더링 규칙을 갖지 않는다** — 전부 기존 API(Scene/panels/SceneIR)
// 위에 얹힌 얇은 래퍼다. 즉 kit 을 안 써도 logos 는 동일하게 동작한다.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Scene } from './core/scene.js';
import { panels } from './backend/scene-ir.js';
import { curve3 } from './shapes/threeD3.js';
import { line } from './shapes/line.js';
import { point } from './shapes/point.js';

// ── ① 팔레트 ─────────────────────────────────────────
/**
 * matplotlib 의 한 글자 색 코드('b','r','g','m','y','c','k')와
 * 자주 쓰는 명명색을 hex 로 고정한 팔레트.
 * (이름을 그대로 쓰면 렌더러마다 색이 달라질 수 있으므로 hex 로 못박는다.)
 */
/** 이름 있는 10색 정성 팔레트 (tab10 근사) — `palette.tab.red` 처럼 이름으로 접근한다. */
const TAB10 = {
  blue: '#1f77b4',
  orange: '#ff7f0e',
  green: '#2ca02c',
  red: '#d62728',
  purple: '#9467bd',
  brown: '#8c564b',
  pink: '#e377c2',
  gray: '#7f7f7f',
  olive: '#bcbd22',
  cyan: '#17becf',
};
export const palette = {
  blue: '#0000ff',
  red: '#ff0000',
  green: '#008000',
  magenta: '#ff00ff',
  orange: '#ff8c00',
  yellow: '#bfbf00',
  cyan: '#00bfbf',
  black: '#000000',
  white: '#ffffff',
  gray: '#808080',
  navy: '#000080',
  purple: '#800080',
  darkgreen: '#006400',
  darkred: '#8b0000',
  crimson: '#dc143c',
  steel: '#4682b4',
  skyblue: '#87ceeb',
  coral: '#f08080',
  wheat: '#f5deb3',
  orangead: '#ffa500',
  /** 한 글자 단축 (matplotlib 호환) */
  b: '#0000ff',
  r: '#ff0000',
  g: '#008000',
  m: '#ff00ff',
  y: '#bfbf00',
  c: '#00bfbf',
  k: '#000000',
  w: '#ffffff',
  o: '#ff8c00',
  /** 이름 있는 10색 정성 팔레트 (tab10 근사) — palette.tab.red */
  tab: TAB10,
  /** 위 tab 의 값 배열 — palette.tab10[0] === palette.tab.blue (기존 사용처 호환) */
  tab10: Object.values(TAB10),
};

// ── ② 기본 씬 프리셋 ─────────────────────────────────
/**
 * 2D 플롯 프리셋 — `view + grid + axes` 를 한 번에.
 * @param {number[]} xr x 범위 `[xmin, xmax]`
 * @param {number[]} yr y 범위 `[ymin, ymax]`
 * @param {Object} [o] { size, grid, axes, equal }
 * @returns {Scene}
 * @example plot2d([-3, 3], [-2, 2]).equal().title('t')
 */
export function plot2d(xr, yr, { size = [560, 440], grid = { alpha: 0.3 }, axes = true, equal = false } = {}) {
  let sc = new Scene().size(size[0], size[1]).view(xr, yr);
  if (equal) sc = sc.equal();
  // axes 는 true/false 뿐 아니라 설정 객체도 받는다.
  //   plot2d(xr, yr, { axes: { x: { label: 'u' }, y: { ticks: false } } })
  if (axes) sc = sc.axes(axes);
  if (grid) sc = sc.grid(grid === true ? true : grid);
  return sc;
}

/**
 * 3D 플롯 프리셋 — matplotlib `view_init(elev, azim)` + `box_aspect` 대응.
 * 3D 씬은 **자동 축을 끄고**(`axes(false)`) `axes3()` 로 직접 그리는 것을 기본으로 한다.
 * @param {Object} [o] { elev, azim, aspect, size, axes }
 * @returns {Scene}
 * @example plot3d({ elev: 25, azim: -50 }).title('3D')
 */
export function plot3d({ elev = 20, azim = -50, aspect = [1, 1, 0.75], size = [480, 440], axes = false } = {}) {
  return new Scene().size(size[0], size[1]).dim(3).camera({ elev, azim, aspect }).axes(axes);
}

// ── ③ subplot 합성 ───────────────────────────────────
/**
 * 여러 figure 를 그리드로 합친다. `panels()` 의 **얇은 래퍼**로,
 *  - 원시 `Scene` 이면 자동으로 `compile()` 하고,
 *  - `cell` 을 주지 않으면 `panels()` 가 figure 들의 `.size()` **최댓값**을
 *    셀 크기로 삼는다(셀보다 큰 서브씬이 이웃 패널을 침범하는 사고 방지).
 * @param {(Scene|Object)[]} figures Scene 또는 SceneIR 목록
 * @param {Object} [opts] panels 옵션 { cols, rows, cell, gap, pad, title, tight, background }
 * @example subplots([a, b, c], { cols: 3, title: 'Step by step', tight: true })
 */
export function subplots(figures, opts = {}) {
  const compiled = figures.map((f) => (f && typeof f.compile === 'function' ? f.compile() : f));
  return panels(compiled, opts);
}

// ── ④ 저장 ───────────────────────────────────────────
const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * figure 하나를 파일로 저장한다(SVG, 그리고 가능하면 PNG).
 * 원시 `Scene` 을 주면 자동으로 `compile()` 한다.
 * @param {Object} fig `toSVG()`/`toPNG()` 를 가진 것(SceneIR/panels) 또는 `Scene`
 * @param {Object} o { dir, name, svg=true, png=true, scale=1, math='text', log=true }
 * @returns {Promise<{svg:string|null, png:string|null}>} 저장된 경로
 */
export async function saveFigure(
  fig,
  { dir, name, svg = true, png = true, scale = 1, math = 'text', log = true } = {},
) {
  if (!dir) throw new Error('saveFigure: opts.dir 이 필요합니다.');
  // 원시 Scene 이면 컴파일(호출자는 compile() 여부를 신경 쓰지 않아도 된다).
  const ir =
    fig && typeof fig.toSVG === 'function' ? fig : fig && typeof fig.compile === 'function' ? fig.compile() : fig;
  if (!ir || typeof ir.toSVG !== 'function')
    throw new Error(`saveFigure: ${name} 은 Scene 또는 SceneIR 이어야 합니다.`);
  mkdirSync(dir, { recursive: true });
  const out = { svg: null, png: null };
  if (svg) {
    out.svg = join(dir, `${name}.svg`);
    writeFileSync(out.svg, ir.toSVG());
  }
  if (png) {
    try {
      // math 기본값은 'text' — foreignObject(KaTeX)는 래스터에서 소실되므로.
      writeFileSync(join(dir, `${name}.png`), await ir.toPNG({ math, scale }));
      out.png = join(dir, `${name}.png`);
    } catch (e) {
      if (log) console.warn(`  (png) ${name}: ${e.message}`);
    }
  }
  return out;
}

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
export async function saveFigures(
  figures,
  { dir, png = true, scale = 1, math = 'text', log = true, index = false, title = 'logos · 렌더 갤러리' } = {},
) {
  if (!dir) throw new Error('saveFigures: opts.dir 이 필요합니다.');
  mkdirSync(dir, { recursive: true });
  const list = Array.isArray(figures) ? figures.map((f) => (Array.isArray(f) ? f : [f, f])) : Object.entries(figures);
  const entries = [];
  let ok = 0,
    fail = 0;
  for (const [name, factory, label] of list) {
    try {
      const fig = typeof factory === 'function' ? factory() : factory;
      await saveFigure(fig, { dir, name, png, scale, math, log });
      entries.push({ name, title: label || name });
      ok++;
      if (log) console.log(`✓ ${name}`);
    } catch (e) {
      fail++;
      if (log) console.error(`✗ ${name}: ${e.message}`, (e.stack || '').split('\n')[1] || '');
    }
  }
  if (index) writeGallery(dir, entries, { title });
  if (log) console.log(`→ ${ok}개 생성, ${fail}개 실패 → ${dir}`);
  return { ok, fail, dir, entries };
}

/**
 * 렌더 결과 SVGs 를 브라우저에서 훑어볼 수 있는 `index.html` 갤러리를 만든다.
 * (SVG 는 `<object>` 로 임베드 — 파일을 직접 열어도, `node server.js` 로 서빙해도 동작)
 */
export function writeGallery(dir, entries, { title = 'logos · 렌더 갤러리', file = 'index.html' } = {}) {
  const cards = entries
    .map((it) => {
      const h3 = it.title && it.title !== it.name ? `<h3>${escAttr(it.title)}</h3>` : '';
      return `<div class="card">${h3}<div class="svgwrap"><object data="${encodeURI(it.name)}.svg" type="image/svg+xml"></object></div><code>${escAttr(it.name)}.svg</code></div>`;
    })
    .join('');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escAttr(title)}</title>
<style>
:root{color-scheme:light}
body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;margin:0;background:#f5f6f8;color:#1f2937}
header{padding:22px 28px;background:linear-gradient(135deg,#1f4e79,#2f6db0);color:#fff}
header h1{margin:0;font-size:22px;letter-spacing:.01em}
header p{margin:6px 0 0;opacity:.85;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:18px;padding:22px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.card h3{margin:0;padding:12px 14px;font-size:14px;font-weight:600;border-bottom:1px solid #f0f0f0}
.svgwrap{display:flex;justify-content:center;padding:10px;background:#fff}
.svgwrap object{width:100%;height:auto;max-height:340px}
code{display:block;padding:8px 14px;font-size:11px;color:#6b7280;background:#fafafa;border-top:1px solid #f0f0f0}
</style></head><body>
<header><h1>${escAttr(title)}</h1><p>${entries.length}개 figure · SVG/PNG 는 같은 폴더에 있습니다</p></header>
<div class="grid">${cards}</div>
</body></html>`;
  const path = join(dir, file);
  writeFileSync(path, html);
  return path;
}

// ── ⑤ 선분/폴리라인 단축 ─────────────────────────────
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
export function seg(A, B, { color, stroke = 2, dash, opacity } = {}) {
  // 좌표 배열도 받는다 — 이전에는 2D 배열이 컴파일 때 line.pointDir 에서 죽었다(shapes/line.js:19).
  const toPt = (v) =>
    v && v.coords ? v : Array.isArray(v) ? (v.length >= 3 ? point(v[0], v[1], v[2]) : point(v[0], v[1])) : v;
  const a = toPt(A),
    b = toPt(B);
  const ca = a.coords || a,
    cb = b.coords || b;
  const is3 = ca.length >= 3 || cb.length >= 3;
  let s = is3 ? curve3.through([ca, cb]) : line.through(a, b);
  if (color !== undefined) s = s.color(color);
  if (stroke !== undefined) s = s.stroke(stroke);
  if (dash !== undefined) s = s.dash(dash);
  if (opacity !== undefined) s = s.opacity(opacity);
  return s;
}

/**
 * 3D 폴리라인 (꺾은선) — `curve3.through` 의 얇은 래퍼.
 * @param {number[][]} points `[x, y, z]` 점들의 배열
 * @param {{ color?: string, stroke?: number, dash?: number[]|string, opacity?: number }} [o]
 *   스타일 — 모두 선택. `dash` 는 `[4, 3]` 형태 또는 CSS 문자열
 * @example poly3([[0,0,0],[3,2,4]], { color: '#000', stroke: 0.8, dash: [4,3] })
 */
export function poly3(points, { color, stroke = 1, dash, opacity } = {}) {
  let c = curve3.through(points);
  if (color !== undefined) c = c.color(color);
  if (stroke !== undefined) c = c.stroke(stroke);
  if (dash !== undefined) c = c.dash(dash);
  if (opacity !== undefined) c = c.opacity(opacity);
  return c;
}

export default {
  palette,
  plot2d,
  plot3d,
  subplots,
  saveFigure,
  saveFigures,
  writeGallery,
  seg,
  poly3,
};
