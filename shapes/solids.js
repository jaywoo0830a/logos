// DSL.md §4.8 3D 입체 — cube / prism / pyramid / torus / polyhedron.vertices / surface.of·implicit·ruled
//
//   · 면(face)을 투영해 깊이 정렬된 polygon 으로 방출한다(가림은 백엔드의 z 정렬이 처리).
//   · 기존 `polyhedron.platonic`(모서리+점)과 달리, 사용자가 정한 꼭짓점/면을 그대로 그린다.
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';
import { project3, depthZ } from './threeD.js';
import { point } from './point.js';
import { surfaceParam } from './threeD3.js';

/** 3D 면들을 IR 로 — 각 면은 꼭짓점 배열. */
export function facesIR(ctx, faces, c) {
  const out = [];
  for (const face of faces) {
    const pts = face.map((p) => project3(ctx, p));
    if (!pts.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))) continue;
    const depth = pts.reduce((a, p) => a + (p[2] || 0), 0) / pts.length;
    out.push(
      node('polygon', {
        pts: pts.map((p) => [p[0], p[1]]),
        closed: true,
        fill: c.fill || '#d0d7de',
        color: c.color,
        stroke: c.stroke,
        opacity: c.opacity ?? 0.35,
        z: depthZ(depth),
        style: {},
      }),
    );
  }
  return out;
}

const asXYZ = (p) => {
  const c = Array.isArray(p) ? p : (p?.coords ?? [0, 0, 0]);
  return [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0];
};

/** 꼭짓점 + 면 인덱스로 정의되는 다면체 */
export class CustomPolyhedron extends Drawable {
  constructor(conf = {}) {
    super('polyhedronCustom', { ...conf });
  }
  /** 면 인덱스 목록 — `faces([[0,1,2],[0,1,3]])` */
  faces(list) {
    return this.set({ faceIdx: list });
  }
  edges(on = true) {
    return this.set({ showEdges: on });
  }
  get vertices() {
    return (this._conf.vertices || []).map((v) => point(...v));
  }
  _faces() {
    return (this._conf.faceIdx || []).map((f) => f.map((i) => this._conf.vertices[i]));
  }
  toIR(ctx) {
    const c = this._conf;
    if (!c.faceIdx) {
      // 면이 주어지지 않으면 최단거리 모서리만 (platonic 과 같은 규칙)
      const V = c.vertices || [];
      const dist = (u, w) => Math.hypot(u[0] - w[0], u[1] - w[1], u[2] - w[2]);
      let minD = Infinity;
      for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) minD = Math.min(minD, dist(V[i], V[j]));
      const out = [];
      for (let i = 0; i < V.length; i++)
        for (let j = i + 1; j < V.length; j++) {
          if (Math.abs(dist(V[i], V[j]) - minD) > 1e-6) continue;
          const a = project3(ctx, V[i]),
            b = project3(ctx, V[j]);
          if (!Number.isFinite(a[0]) || !Number.isFinite(b[0])) continue;
          out.push(
            node('path', {
              ops: [
                { op: 'M', x: a[0], y: a[1] },
                { op: 'L', x: b[0], y: b[1] },
              ],
              color: c.color,
              stroke: c.stroke,
              z: depthZ((a[2] + b[2]) / 2),
            }),
          );
        }
      return out;
    }
    const out = facesIR(ctx, this._faces(), c);
    if (c.showEdges)
      for (const f of this._faces())
        for (let i = 0; i < f.length; i++) {
          const a = project3(ctx, f[i]),
            b = project3(ctx, f[(i + 1) % f.length]);
          if (!Number.isFinite(a[0]) || !Number.isFinite(b[0])) continue;
          out.push(
            node('path', {
              ops: [
                { op: 'M', x: a[0], y: a[1] },
                { op: 'L', x: b[0], y: b[1] },
              ],
              color: c.edgeColor || c.color || '#333',
              stroke: c.edgeStroke || 1.2,
              z: depthZ((a[2] + b[2]) / 2) + 1,
            }),
          );
        }
    return out;
  }
}

/** 정육면체 — `cube.center(O).edge(e)` */
class Cube extends Drawable {
  constructor(conf = {}) {
    super('cube', { ...conf });
  }
  toIR(ctx) {
    const c = this._conf;
    const [cx, cy, cz] = asXYZ(c.center);
    const e = (c.edge ?? 2) / 2;
    const V = [];
    for (const x of [-e, e]) for (const y of [-e, e]) for (const z of [-e, e]) V.push([cx + x, cy + y, cz + z]);
    const idx = (xi, yi, zi) => xi * 4 + yi * 2 + zi; // (x,y,z) 부호 조합 인덱스
    const faces = [
      [idx(0, 0, 0), idx(0, 1, 0), idx(0, 1, 1), idx(0, 0, 1)],
      [idx(1, 0, 0), idx(1, 0, 1), idx(1, 1, 1), idx(1, 1, 0)],
      [idx(0, 0, 0), idx(0, 0, 1), idx(1, 0, 1), idx(1, 0, 0)],
      [idx(0, 1, 0), idx(1, 1, 0), idx(1, 1, 1), idx(0, 1, 1)],
      [idx(0, 0, 0), idx(1, 0, 0), idx(1, 1, 0), idx(0, 1, 0)],
      [idx(0, 0, 1), idx(0, 1, 1), idx(1, 1, 1), idx(1, 0, 1)],
    ];
    return facesIR(
      ctx,
      faces.map((f) => f.map((i) => V[i])),
      c,
    );
  }
}

/** 밑면 다각형을 z 축으로 밀어 올린 기둥 — `prism.base(polygon).height(h)` */
class Prism extends Drawable {
  constructor(conf = {}) {
    super('prism', { ...conf });
  }
  height(h) {
    return this.set({ height: h });
  }
  toIR(ctx) {
    const c = this._conf;
    const base = (c.base?.vertices || []).map((p) => asXYZ(p));
    if (!base.length) return [];
    const h = c.height ?? 1;
    const top = base.map(([x, y, z]) => [x, y, z + h]);
    const faces = [base.slice().reverse(), top];
    for (let i = 0; i < base.length; i++) {
      const j = (i + 1) % base.length;
      faces.push([base[i], base[j], top[j], top[i]]);
    }
    return facesIR(ctx, faces, c);
  }
}

/** 밑면 다각형 + 꼭대기 점 — `pyramid.base(polygon).apex(P)` */
class Pyramid extends Drawable {
  constructor(conf = {}) {
    super('pyramid', { ...conf });
  }
  apex(P) {
    return this.set({ apex: asXYZ(P) });
  }
  toIR(ctx) {
    const c = this._conf;
    const base = (c.base?.vertices || []).map((p) => asXYZ(p));
    if (!base.length) return [];
    const mid = base.reduce(
      (a, p) => [a[0] + p[0] / base.length, a[1] + p[1] / base.length, a[2] + p[2] / base.length],
      [0, 0, 0],
    );
    const A = c.apex || [mid[0], mid[1], mid[2] + 2];
    const faces = [base.slice().reverse()];
    for (let i = 0; i < base.length; i++) faces.push([base[i], base[(i + 1) % base.length], A]);
    return facesIR(ctx, faces, c);
  }
}

export const cube = {
  center(O) {
    return { edge: (e) => new Cube({ center: O, edge: e }) };
  },
};

export const prism = {
  base(poly) {
    return new Prism({ base: poly });
  },
};

export const pyramid = {
  base(poly) {
    return new Pyramid({ base: poly });
  },
};

export const torus = {
  /** `torus.center(O).radii(R, r)` — 큰 반지름 R, 관 반지름 r */
  center(O) {
    return {
      radii: (R = 1, r = 0.35) => {
        const [cx, cy, cz] = asXYZ(O);
        return surfaceParam((u, v) => [
          cx + (R + r * Math.cos(v)) * Math.cos(u),
          cy + (R + r * Math.cos(v)) * Math.sin(u),
          cz + r * Math.sin(v),
        ]).on([0, 2 * Math.PI], [0, 2 * Math.PI]);
      },
    };
  },
};

// ── surface 확장: of / ruled / implicit ────────────────
export const surfaceExtra = {
  /** `surface.of((u,v) => [x,y,z]).on([u0,u1],[v0,v1])` — surfaceParam 과 같다 */
  of(fn) {
    return surfaceParam(fn);
  },
  /** 두 3D 곡선 사이의 직선 보간 곡면(룰드) */
  ruled(c1, c2) {
    const A = c1 && typeof c1._sample === 'function' ? c1._sample() : [];
    const B = c2 && typeof c2._sample === 'function' ? c2._sample() : [];
    const n = Math.min(A.length, B.length);
    return surfaceParam((u, v) => {
      const i = Math.min(n - 1, Math.max(0, Math.round(u * (n - 1))));
      const a = A[i],
        b = B[i];
      if (!a || !b) return [NaN, NaN, NaN];
      return [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v, a[2] + (b[2] - a[2]) * v];
    }).on([0, 1], [0, 1]);
  },
  /**
   * 음함수 곡면 `f(x,y,z) = 0` — marching tetrahedra 로 삼각형 면을 만든다.
   * `surface.implicit(f).on([x0,x1],[y0,y1],[z0,z1]).res(n)`
   */
  implicit(f) {
    return new ImplicitSurface({ fn: f });
  },
};

export class ImplicitSurface extends Drawable {
  constructor(conf = {}) {
    super('surfaceImplicit', {
      box: [
        [-1.5, 1.5],
        [-1.5, 1.5],
        [-1.5, 1.5],
      ],
      res: 14,
      ...conf,
    });
  }
  on(xr, yr, zr) {
    return this.set({ box: [xr, yr, zr] });
  }
  res(n) {
    return this.set({ res: n });
  }
  _faces() {
    const c = this._conf;
    const n = Math.max(4, Math.min(40, c.res || 14));
    const [[x0, x1], [y0, y1], [z0, z1]] = c.box;
    const gx = (x1 - x0) / n,
      gy = (y1 - y0) / n,
      gz = (z1 - z0) / n;
    const val = (x, y, z) => {
      const v = c.fn(x, y, z);
      return Number.isFinite(v) ? v : 0;
    };
    // 격자값 (i,j,k)
    const V = [];
    for (let i = 0; i <= n; i++) {
      V[i] = [];
      for (let j = 0; j <= n; j++) {
        V[i][j] = [];
        for (let k = 0; k <= n; k++) V[i][j][k] = val(x0 + gx * i, y0 + gy * j, z0 + gz * k);
      }
    }
    const P = (i, j, k) => [x0 + gx * i, y0 + gy * j, z0 + gz * k];
    const lerp = (pa, pb, va, vb) => {
      const t = va / (va - vb);
      return [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] + (pb[2] - pa[2]) * t];
    };
    // 정육면체 → 6 사면체 (모서리 대각선 0–6 기준)
    const TETRA = [
      [0, 5, 1, 6],
      [0, 1, 2, 6],
      [0, 2, 3, 6],
      [0, 3, 7, 6],
      [0, 7, 4, 6],
      [0, 4, 5, 6],
    ];
    const CORNER = [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ];
    const faces = [];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < n; k++) {
          for (const tet of TETRA) {
            const pts = tet.map((ci) => P(i + CORNER[ci][0], j + CORNER[ci][1], k + CORNER[ci][2]));
            const vals = tet.map((ci) => V[i + CORNER[ci][0]][j + CORNER[ci][1]][k + CORNER[ci][2]]);
            const ins = vals.map((v) => v <= 0);
            if (ins.every(Boolean) || !ins.some(Boolean)) continue;
            const cut = [];
            for (let a = 0; a < 4; a++)
              for (let b = a + 1; b < 4; b++) if (ins[a] !== ins[b]) cut.push(lerp(pts[a], pts[b], vals[a], vals[b]));
            if (cut.length === 3) faces.push(cut);
            else if (cut.length === 4) {
              faces.push([cut[0], cut[1], cut[2]]);
              faces.push([cut[0], cut[2], cut[3]]);
            }
          }
        }
    return faces;
  }
  toIR(ctx) {
    return facesIR(ctx, this._faces(), this._conf);
  }
}
