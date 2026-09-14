// docs/testing/TEXTBOOK.md #48 — 기울기장(slope field): vectorField((x,y)=>[dx,dy]).on(region)
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';

export class VectorField extends Drawable {
  constructor(conf = {}) {
    super('vectorField', { ...conf });
  }
  on(region) {
    return this.set({ region });
  }
  step(s) {
    return this.set({ step: s });
  }
  len(l) {
    return this.set({ len: l });
  }
  toIR(ctx) {
    const c = this._conf;
    const w = ctx.world;
    const step = c.step || 0.5;
    const arrowLen = c.len || 0.28;
    const out = [];
    for (let x = Math.ceil(w.xmin / step) * step; x <= w.xmax; x += step) {
      for (let y = Math.ceil(w.ymin / step) * step; y <= w.ymax; y += step) {
        const dir = c.item(x, y);
        if (!dir || !Array.isArray(dir)) continue;
        const vx = dir[0],
          vy = dir[1];
        const mag = Math.hypot(vx, vy) || 1;
        const ux = vx / mag,
          uy = vy / mag;
        const half = arrowLen / 2;
        out.push(
          node('path', {
            ops: [
              { op: 'M', x: x - ux * half, y: y - uy * half },
              { op: 'L', x: x + ux * half, y: y + uy * half },
            ],
            color: c.color,
            stroke: c.stroke,
            opacity: c.opacity,
            style: pick(c),
          }),
        );
      }
    }
    return out;
  }
}
function pick(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

export const vectorField = (item) => new VectorField({ item });

export default vectorField;
