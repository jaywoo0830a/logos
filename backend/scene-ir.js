// Scene IR — 컴파일 결과. 다중 백엔드 진입점.
import { emitSVG } from './svg.js';
import { emitTikZ } from './tikz.js';
import { irToAsymptote } from './asymptote.js';
import { buildJSXGraphHTML } from './jsxgraph.js';
import { katexRender, katexify, buildFigureHTML } from './katex.js';

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
    return emitSVG(this.o.nodes, {
      ...m, world: this.o.world,
      math: opts.math,
      bg: td.bg || '#ffffff',
      font: td.font || 'sans-serif',
      fontMath: td.fontMath || td.font,
      axisColor: td.axisColor, gridColor: td.gridColor,
      labelColor: td.labelColor, pointColor: td.pointColor,
      strokeDefault: td.strokeDefault,
    });
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
    const r = new Resvg(svg, { background: opts.background || 'white', fitTo: { mode: 'zoom', value: opts.scale || 1 } });
    return r.render().asPng();
  }
  toPDF() {
    throw new Error('toPDF() requires pdf-lib. Not bundled. Use toTikZ()/toSVG() instead.');
  }
  toCanvas() {
    throw new Error('toCanvas(ctx) requires a canvas implementation. Not bundled.');
  }
}

export default SceneIR;