// Scene IR — 컴파일 결과. 다중 백엔드 진입점.
import { emitSVG } from './svg.js';
import { emitTikZ } from './tikz.js';
import { irToAsymptote } from './asymptote.js';
import { buildJSXGraphHTML } from './jsxgraph.js';
import { katexRender, katexify, buildFigureHTML } from './katex.js';

const katexNs = { katexRender, katexify };

const THEME_FONT = { textbook: 'Latin Modern Math', default: 'sans-serif' };

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
    } else {
      sx = W / xr; sy = H / yr;
      scale = Math.min(sx, sy);
    }
    const map = (x, y) => [
      ox + (x - world.xmin) * (equal ? scale : sx),
      oy + (world.ymax - y) * (equal ? scale : sy),
    ];
    return { map, scale, W, H };
  }

  toSVG() {
    const m = this._map();
    return emitSVG(this.o.nodes, { ...m, theme: THEME_FONT[this.o.theme] });
  }

  toTikZ(opts = {}) {
    return emitTikZ(this.o.nodes, opts);
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

  /** KaTeX 조판된 <figure> HTML — ADAPT §4 */
  toHTML(opts = {}) {
    const { katexRender, katexify } = katexNs;
    const rows = [];
    const renderText = (v) => (typeof v?.toLatex === 'function') ? katexRender(v.toLatex()) : katexify(v);
    for (const nd of this.o.nodes) {
      const d = nd.data;
      if (nd.kind === 'text') {
        rows.push(`<div class="logos-text" style="position:absolute;left:${d.x}px;top:${d.y}px">${renderText(d.text)}</div>`);
      } else if (nd.kind === 'point' && d.label) {
        rows.push(`<div class="logos-label" style="position:absolute;left:${d.x}px;top:${d.y}px">${renderText(d.label)}</div>`);
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

  toPNG() {
    throw new Error('toPNG() requires a raster backend (resvg/node-canvas). Not bundled. Use toSVG() instead.');
  }
  toPDF() {
    throw new Error('toPDF() requires pdf-lib. Not bundled. Use toTikZ()/toSVG() instead.');
  }
  toCanvas() {
    throw new Error('toCanvas(ctx) requires a canvas implementation. Not bundled.');
  }
}

export default SceneIR;