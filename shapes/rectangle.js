// 1.md #45 — 이항분포 막대: rectangle.on([x0,x1],[y0,y1])
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';

export class Rectangle extends Drawable {
  constructor(conf = {}) { super('rectangle', { ...conf }); }
  label(l, o) { return this.set({ label: l, labelOff: o }); }
  bounds() {
    const c = this._conf;
    return { xmin: Math.min(c.x0, c.x1), xmax: Math.max(c.x0, c.x1), ymin: Math.min(0, c.y1), ymax: Math.max(0, c.y1) };
  }
  toIR() {
    const c = this._conf;
    return [node('fillrect', {
      x: Math.min(c.x0, c.x1), y1: c.y1, w: Math.abs(c.x1 - c.x0),
      fill: c.fill || 'steelblue', opacity: c.opacity || 0.7,
      transforms: c.transforms, style: pick(c),
    })];
  }
}
function pick(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

export const rectangle = {
  on(xRange, yRange) {
    const x0 = xRange[0], x1 = xRange[1], y0 = yRange[0], y1 = yRange[1];
    return new Rectangle({ x0, x1, y0, y1 });
  },
};

export default rectangle;