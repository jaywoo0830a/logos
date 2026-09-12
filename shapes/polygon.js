// DSL.md §4.7 다각형 — polygon / triangle / regular …
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { point as _point } from './point.js';

export class Polygon extends Drawable {
  constructor(conf = {}) {
    super('polygon', { ...conf, vertices: [...conf.vertices] });
  }
  get vertices() {
    return this._conf.vertices;
  }

  label(l, off) {
    return this.set({ label: l, labelOff: off });
  }

  toIR(ctx) {
    const c = this._conf;
    const pts = c.vertices.map((p) => p.coords);
    const ops = [];
    for (let i = 0; i < pts.length; i++) ops.push({ op: i === 0 ? 'M' : 'L', x: pts[i][0], y: pts[i][1] });
    ops.push({ op: 'Z' });
    return [
      node('polygon', {
        pts,
        closed: true,
        color: c.color,
        stroke: c.stroke,
        fill: c.fill,
        dash: c.dash,
        opacity: c.opacity,
        transforms: c.transforms,
        style: pickStyle(c),
        label: renderText(c.label),
        marker: c.markers ? c.markers : !!c.dot,
      }),
    ];
  }
}

export function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity', 'dot']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

export function polygon(...pts) {
  return new Polygon({ vertices: pts, fill: 'none' });
}
polygon.regular = (O, n, r) => {
  const verts = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    verts.push(_point(O.coords[0] + r * Math.cos(a), O.coords[1] + r * Math.sin(a)));
  }
  return new Polygon({ vertices: verts, fill: 'none' });
};

export function triangle(A, B, C) {
  return new Polygon({ vertices: [A, B, C], fill: 'none' });
}
triangle.equilateral = (B, C) => equalTriangle(B, C);

function equalTriangle(B, C) {
  const d = Math.hypot(C.coords[0] - B.coords[0], C.coords[1] - B.coords[1]);
  const mx = (B.coords[0] + C.coords[0]) / 2,
    my = (B.coords[1] + C.coords[1]) / 2;
  const h = (d * Math.sqrt(3)) / 2;
  const A = _point(mx, my + h);
  return {
    above() {
      return new Polygon({ vertices: [A, B, C], fill: 'none' }).O
        ? null
        : new Polygon({ vertices: [A, B, C], fill: 'none' });
    },
  };
}

export function quad(A, B, C, D) {
  return new Polygon({ vertices: [A, B, C, D], fill: 'none' });
}

export const regular = {
  polygon: polygon.regular,
};

// 1.md #24 — square.on(segment(A,B)): 변을 한 변으로 하는 정사각형
export const square = {
  on(seg) {
    const A = seg.a.coords,
      B = seg.b.coords;
    const dx = B[0] - A[0],
      dy = B[1] - A[1];
    // AB 를 한 변으로, 왼쪽(perp)으로 정사각형
    const C = _point(B[0] - dy, B[1] + dx);
    const D = _point(A[0] - dy, A[1] + dx);
    return new Polygon({ vertices: [A && _point(A[0], A[1]), B && _point(B[0], B[1]), C, D], fill: 'none' });
  },
};

export default polygon;
