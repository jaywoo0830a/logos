// docs/spec/DSL.md §4.7 다각형 — polygon / triangle / regular …
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';
import { point as _point } from './point.js';
import { contains } from './region.js';

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
  /**
   * 정별(正별) — `regular.star(5, 1, 0.4)` (꼭짓점 수, 바깥 반지름, 안쪽 반지름).
   * 꼭짓점을 번갈아 두 반지름으로 잡아 {n/2} 별 모양을 만든다.
   */
  star(n = 5, rOuter = 1, rInner = 0.4) {
    const N = Math.max(3, Math.round(n));
    const verts = [];
    for (let i = 0; i < N * 2; i++) {
      const r = i % 2 ? rInner : rOuter;
      const a = (Math.PI * i) / N - Math.PI / 2; // 위쪽 꼭짓점부터
      verts.push(_point(r * Math.cos(a), r * Math.sin(a)));
    }
    return new Polygon({ vertices: verts, fill: '#dbeafe', opacity: 0.9 });
  },
  /**
   * 타일 깔기 — `regular.tessellation('hex').on(region)`.
   * 영역(직사각형 경계 또는 `region.*`) 안에 타일을 채운다. 각 타일은 Polygon.
   */
  tessellation(kind = 'square') {
    return {
      on(region) {
        const b = boxOf(region);
        const tiles = [];
        if (kind === 'hex' || kind === 'honeycomb') {
          const s = 0.5; // 변 길이
          const dx = 1.5 * s;
          const dy = Math.sqrt(3) * s;
          for (let row = 0; ; row++) {
            const cy = b.ymin + (row * dy) / 2;
            if (cy > b.ymax) break;
            for (let col = 0; ; col++) {
              const cx = b.xmin + col * dx + (row % 2 ? dx / 2 : 0);
              if (cx > b.xmax) break;
              const pts = [];
              for (let k = 0; k < 6; k++) {
                const a = (Math.PI / 3) * k;
                pts.push(_point(cx + s * Math.cos(a), cy + s * Math.sin(a)));
              }
              const tile = new Polygon({ vertices: pts, fill: 'none', stroke: 1 });
              if (inRegion(region, cx, cy)) tiles.push(tile);
            }
          }
        } else {
          const s = 0.5;
          for (let y = b.ymin; y <= b.ymax; y += s)
            for (let x = b.xmin; x <= b.xmax; x += s) {
              if (!inRegion(region, x + s / 2, y + s / 2)) continue;
              tiles.push(
                new Polygon({
                  vertices: [_point(x, y), _point(x + s, y), _point(x + s, y + s), _point(x, y + s)],
                  fill: 'none',
                  stroke: 1,
                }),
              );
            }
        }
        return tiles;
      },
    };
  },
};

/** 영역/박스에서 경계 사각형 얻기 */
function boxOf(region) {
  if (!region) return { xmin: 0, xmax: 4, ymin: 0, ymax: 4 };
  if (typeof region.bounds === 'function') {
    const b = region.bounds();
    if (b) return b;
  }
  if (region.xmin !== undefined) return region;
  return { xmin: 0, xmax: 4, ymin: 0, ymax: 4 };
}

/** 영역 내부 판정 — Region 이면 contains, 박스면 사각형 판정, 그 외는 통과. */
function inRegion(region, x, y) {
  if (!region) return true;
  if (region._conf) return contains(region, x, y);
  if (region.xmin !== undefined) return x >= region.xmin && x <= region.xmax && y >= region.ymin && y <= region.ymax;
  return true;
}

// docs/testing/TEXTBOOK.md #24 — square.on(segment(A,B)): 변을 한 변으로 하는 정사각형
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
