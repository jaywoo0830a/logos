// 3D 입체 코어 (E1) — 정사영 후 2D IR 로 방출
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';

export function pick(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}
export const project3 = (ctx, p) => (ctx.project ? ctx.project(p) : [p[0], p[1]]);
export function polyline(pts, c, z, nodeImp = node, pickImp = pick) {
  const ops = [];
  let started = false;
  for (const [x, y] of pts) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) { started = false; continue; }
    ops.push({ op: started ? 'L' : 'M', x, y });
    started = true;
  }
  return nodeImp('path', { ops, color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity, z, style: pickImp(c) });
}

export class Sphere extends Drawable {
  constructor(conf = {}) { super('sphere', { ...conf }); }
  center() { return this._conf.center.coords; }
  radius() { return this._conf.radius; }
  label(l, o) { return this.set({ label: l, labelOff: o }); }
  toIR(ctx) {
    const [cx, cy, cz] = this._conf.center.coords;
    const r = this._conf.radius;
    const c = this._conf;
    const out = [];
    const CP = project3(ctx, [cx, cy, cz]);
    for (let k = 1; k < 8; k++) {
      const phi = (Math.PI * k) / 8;
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const th = (2 * Math.PI * i) / 48;
        pts.push(project3(ctx, [cx + r * Math.sin(phi) * Math.cos(th), cy + r * Math.sin(phi) * Math.sin(th), cz + r * Math.cos(phi)]));
      }
      out.push(polyline(pts, c, -1));
    }
    if (c.opacity != null || c.fill) out.push(node('fillcircle', { cx: CP[0], cy: CP[1], r: r * 0.97, fill: c.fill || '#3b82f6', opacity: c.opacity ?? 0.25, z: -2, style: pick(c) }));
    return out;
  }
}
export const sphere = {
  center(O) { return { radius: (r) => new Sphere({ center: O, radius: r }) }; },
};

export class Plane extends Drawable {
  constructor(conf = {}) { super('plane', { ...conf }); }
  toIR(ctx) {
    const c = this._conf;
    const half = c.half || 2.2;
    const pts = [[-half, -half, 0], [half, -half, 0], [half, half, 0], [-half, half, 0]].map((p) => project3(ctx, p));
    return [node('polygon', { pts, closed: true, fill: c.fill || '#eee', color: c.color, stroke: c.stroke, opacity: c.opacity ?? 0.4, z: -3, style: pick(c) })];
  }
}
export const plane = {
  coordinate(name) { return new Plane({ coord: name }); },
  normal(v) { return new Plane({ normal: v }); },
};