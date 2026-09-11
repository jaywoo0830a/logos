// Scene IR — 컴파일 결과. 다중 백엔드 진입점.
import { emitSVG } from './svg.js';
import { apply } from '../core/plugin.js';
import { emitTikZ } from './tikz.js';
import { irToAsymptote } from './asymptote.js';
import { buildJSXGraphHTML } from './jsxgraph.js';
import { katexRender, katexify, buildFigureHTML } from './katex.js';
import { relayout } from './layout.js';
import { applyHiddenLines } from './hidden.js';
import { STIX_STACK, STIX_LINK, resvgFontOptions } from './fonts.js';

const katexNs = { katexRender, katexify };

export class SceneIR {
  constructor(o) { this.o = o; }

  _map() {
    const { world, size, equal } = this.o;
    const [W, H] = size;
    const xr = world.xmax - world.xmin, yr = world.ymax - world.ymin;
    let ox = 0, oy = 0, sx, sy, scale;
    if (equal) {
      sx = W / xr; sy = H / yr;
      scale = Math.min(sx, sy);
      ox = (W - xr * scale) / 2;
      oy = (H - yr * scale) / 2;
      sx = scale; sy = scale;   // equal: 양축 동일 스케일
    } else {
      sx = W / xr; sy = H / yr;
      scale = Math.min(sx, sy);
    }
    const map = (x, y) => [
      ox + (x - world.xmin) * sx,
      oy + (world.ymax - y) * sy,
    ];
    return { map, scale, scaleX: sx, scaleY: sy, W, H };
  }

  toSVG(opts = {}) {
    const m = this._map();
    const td = this.o.themeDef || {};
    // 라벨 자동 배치(옵션) — world 좌표는 유지, 화면 오프셋만 조정.
    let nodes = this.o.nodes;
    if (this.o.dim === 3 && opts.hiddenLine !== false) nodes = applyHiddenLines(nodes, m.map, m.W, m.H);
    if (this.o.layout && opts.layout !== false) nodes = relayout(nodes, m.map, m.W, m.H);
    // 플러그인 훅 — 'ir:svg'(노드 손질) · 'svg'(완성된 SVG 문자열 후처리)
    nodes = apply('ir:svg', nodes, { ir: this, map: m.map, W: m.W, H: m.H }) || nodes;
    const svg = emitSVG(nodes, {
      ...m, world: this.o.world,
      math: opts.math,
      bg: td.bg || '#ffffff',
      font: opts.font || STIX_STACK,   // 모든 텍스트 = STIX Two Math
      fontMath: opts.fontMath || STIX_STACK,
      axisColor: td.axisColor, gridColor: td.gridColor,
      labelColor: td.labelColor, pointColor: td.pointColor,
      strokeDefault: td.strokeDefault,
    });
    return apply('svg', svg, { ir: this, map: m.map }) || svg;
  }

  toTikZ(opts = {}) {
    const tikz = emitTikZ(this.o.nodes, opts);
    return apply('tikz', tikz, { ir: this }) || tikz;
  }

  // ── ADAPT.md 외부엔진 어댑터 백엔드 ──────────────
  /** Asymptote 소스 생성 (2D) — ADAPT §2·3 */
  toAsymptote(opts = {}) { return irToAsymptote(this.o.nodes, opts); }

  /** node-tikzjax(WASM)로 TikZ → SVG — ADAPT §4 */
  async toTikZSVG(opts = {}) {
    const { irToTikZSVG } = await import('./tikzjax.js');
    return irToTikZSVG(this, opts);
  }

  /** JSXGraph 인터랙티브 HTML — ADAPT §2 (선택) */
  toJSXGraphHTML(opts = {}) { return buildJSXGraphHTML(this.o.nodes, opts); }

  /** KaTeX 조판된 <figure> HTML — ADAPT §4 (좌표는 world→screen 매핑 적용) */
  toHTML(opts = {}) {
    const { katexRender, katexify } = katexNs;
    const { map } = this._map();
    const rows = [];
    const renderText = (v) => (typeof v?.toLatex === 'function') ? katexRender(v.toLatex()) : katexify(v);
    for (const nd of this.o.nodes) {
      const d = nd.data;
      if (nd.kind === 'text') {
        const [x, y] = map(d.x, d.y);
        rows.push(`<div class="logos-text" style="position:absolute;left:${(x + (d.dxPx || 0)).toFixed(1)}px;top:${(y + (d.dyPx || 0)).toFixed(1)}px">${renderText(d.text)}</div>`);
      } else if (nd.kind === 'point' && d.label) {
        const [x, y] = map(d.x, d.y);
        rows.push(`<div class="logos-label" style="position:absolute;left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${renderText(d.label)}</div>`);
      }
    }
    return buildFigureHTML(rows);
  }

  toJSON() {
    return {
      dim: this.o.dim,
      world: this.o.world,
      size: this.o.size,
      nodes: this.o.nodes.map((n) => ({ kind: n.kind, data: n.data })),
    };
  }

  toReact() { return this.toSVG(); }

  /**
   * P0-4: SVG → PNG 래스터화. `@resvg/resvg-js` 가 설치돼 있으면 동작한다.
   * (없으면 명확히 안내). math 기본값은 폰트 비의존 'text' — foreignObject 는 래스터에서 소실되므로.
   */
  async toPNG(opts = {}) {
    let Resvg;
    try { ({ Resvg } = await import('@resvg/resvg-js')); }
    catch { throw new Error("toPNG() 는 @resvg/resvg-js 가 필요합니다. `npm i -D @resvg/resvg-js` 후 사용하세요. (대안: toSVG())"); }
    const svg = this.toSVG({ math: opts.math || 'text' });
    const r = new Resvg(svg, {
      background: opts.background || 'white',
      fitTo: { mode: 'zoom', value: opts.scale || 1 },
      ...resvgFontOptions(),
    });
    return r.render().asPng();
  }
  toPDF() {
    throw new Error('toPDF() requires pdf-lib. Not bundled. Use toTikZ()/toSVG() instead.');
  }
  toCanvas() {
    throw new Error('toCanvas(ctx) requires a canvas implementation. Not bundled.');
  }
}

// ── subplots / panels ────────────────────────────
const escAttr = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * 여러 figure(SceneIR)를 그리드로 합친다 (matplotlib subplots 대응).
 * 각 figure 는 중첩 <svg x,y> 로 배치되며 자체 viewBox 스케일을 유지한다.
 *
 * `cell` 을 생략하면 **figure 들의 `.size()` 중 최댓값을 셀 크기로 자동 사용**한다
 * (셀보다 큰 서브씬이 이웃 패널을 침범해 겹치는 사고 방지).
 * @param {SceneIR[]} figures
 * @param {Object} [opts] { cols, cell, gap, pad, title(suptitle), background, scale, math, tight }
 */
export function panels(figures, opts = {}) {
  const cols = opts.cols || figures.length || 1;
  const rows = Math.ceil(figures.length / cols);
  const sizes = figures.map((f) => f && f.o && Array.isArray(f.o.size) ? f.o.size : null).filter(Boolean);
  const auto = sizes.length ? [Math.max(...sizes.map((s) => s[0])), Math.max(...sizes.map((s) => s[1]))] : null;
  const [cw, ch] = opts.cell || auto || [600, 600];
  const tight = !!opts.tight;
  const gap = opts.gap ?? (tight ? 4 : 16);
  const outer = opts.pad ?? (tight ? 8 : gap);
  const titleH = opts.title ? (tight ? 34 : 44) : 0;
  const W = cols * cw + (cols - 1) * gap + 2 * outer;
  const H = rows * ch + (rows - 1) * gap + 2 * outer + titleH;
  const bg = opts.background || '#ffffff';
  return {
    width: W, height: H,
    toSVG(so = {}) {
      const parts = figures.map((f, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const x = outer + c * (cw + gap);
        const y = titleH + outer + r * (ch + gap);
        return f.toSVG(so).replace(/^<svg /, `<svg x="${x}" y="${y}" `);
      });
      const t = opts.title
        ? `<text x="${W / 2}" y="${titleH * 0.72}" font-size="20" font-weight="bold" text-anchor="middle" fill="#222">${escAttr(opts.title)}</text>`
        : '';
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${bg}"/>${t}${parts.join('\n')}</svg>`;
    },
    toTikZ() { return figures.map((f) => f.toTikZ({ standalone: true })).join('\n\n'); },
    async toPNG(o = {}) {
      let Resvg;
      try { ({ Resvg } = await import('@resvg/resvg-js')); }
      catch { throw new Error('toPNG() 는 @resvg/resvg-js 가 필요합니다. `npm i -D @resvg/resvg-js`'); }
      const r = new Resvg(this.toSVG({ math: o.math || 'text' }), {
        background: o.background || 'white', fitTo: { mode: 'zoom', value: o.scale || 1 },
        ...resvgFontOptions(),
      });
      return r.render().asPng();
    },
  };
}

export default SceneIR;