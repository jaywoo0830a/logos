// Scene IR — 컴파일 결과. 다중 백엔드 진입점.
import { emitSVG } from './svg.js';
import { emitTikZ } from './tikz.js';

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