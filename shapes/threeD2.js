// 3D 입체 (E2–E4, K3) — 원기둥/원뿔/회전체/다면체
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';
import { project3, polyline, pick, depthZ } from './threeD.js';
import { point } from './point.js';
import { cmapColor } from './threeD3.js';

export class Cylinder extends Drawable {
  constructor(conf = {}) { super('cylinder', { ...conf }); }
  get vertices() {
    const [cx, cy, cz] = this._conf.center.coords, r = this._conf.radius, h = this._conf.height;
    return [[cx - r, cy - r, cz], [cx + r, cy + r, cz + h]].map((v) => point(...v));
  }
  toIR(ctx) {
    const [cx, cy, cz] = this._conf.center.coords;
    const r = this._conf.radius, h = this._conf.height;
    const ring = (oz) => { const p = []; for (let i = 0; i <= 48; i++) { const a = (2 * Math.PI * i) / 48; p.push(project3(ctx, [cx + r * Math.cos(a), cy + r * Math.sin(a), oz])); } return p; };
    const out = [polyline(ring(cz + h), this._conf, 0), polyline(ring(cz), this._conf, -1)];
    for (const a of [0, Math.PI]) out.push(polyline([project3(ctx, [cx + r * Math.cos(a), cy + r * Math.sin(a), cz]), project3(ctx, [cx + r * Math.cos(a), cy + r * Math.sin(a), cz + h])], this._conf, 0));
    return out;
  }
}
export const cylinder = {
  center(O) { return { axis: () => ({ radius: (r) => ({ height: (h) => new Cylinder({ center: O, radius: r, height: h }) }) }) }; },
};

export class Cone extends Drawable {
  constructor(conf = {}) { super('cone', { ...conf }); }
  get vertices() {
    const [vx, vy, vz] = this._conf.vertex.coords, r = this._conf.radius, h = this._conf.height;
    const dir = this._conf.axis && this._conf.axis.v ? this._conf.axis.v : [0, 0, -1];
    return [[vx, vy, vz], [vx + dir[0] * h - r, vy + dir[1] * h - r, vz + dir[2] * h - r], [vx + dir[0] * h + r, vy + dir[1] * h + r, vz + dir[2] * h + r]].map((v) => point(...v));
  }
  toIR(ctx) {
    const [vx, vy, vz] = this._conf.vertex.coords;
    const r = this._conf.radius, h = this._conf.height;
    const dir = this._conf.axis && this._conf.axis.v ? this._conf.axis.v : [0, 0, -1];
    const bx = vx + dir[0] * h, by = vy + dir[1] * h, bz = vz + dir[2] * h;
    const ring = [];
    for (let i = 0; i <= 48; i++) { const a = (2 * Math.PI * i) / 48; ring.push(project3(ctx, [bx + r * Math.cos(a), by + r * Math.sin(a), bz])); }
    const out = [polyline(ring, this._conf, -1)];
    const ap = project3(ctx, [vx, vy, vz]);
    for (const a of [0, Math.PI]) out.push(polyline([ap, project3(ctx, [bx + r * Math.cos(a), by + r * Math.sin(a), bz])], this._conf, 0));
    return out;
  }
}
export const cone = {
  vertex(V) { return { axis: (a) => ({ radius: (r) => ({ height: (h) => new Cone({ vertex: V, axis: a, radius: r, height: h }) }) }), radius: (r) => ({ height: (h) => new Cone({ vertex: V, radius: r, height: h }) }) }; },
};

export class Surface extends Drawable {
  constructor(conf = {}) { super('surface', { ...conf }); }
  get vertices() {
    const curve = this._conf.curve, [a, b] = curve.domain, n = 8, out = [];
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n;
      const y = curve.eval(x).cart[1];
      if (!Number.isFinite(y)) continue;
      out.push(point(x, y, 0), point(x, -y, 0), point(x, 0, y), point(x, 0, -y));
    }
    return out;
  }
  toIR(ctx) {
    const c = this._conf, curve = this._conf.curve;
    const [a, b] = curve.domain;
    const n = c.n || 24;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n;
      const y = curve.eval(x).cart[1];
      if (!Number.isFinite(y)) continue;
      const ring = [];
      for (let j = 0; j <= 32; j++) { const th = (2 * Math.PI * j) / 32; ring.push(project3(ctx, [x, y * Math.cos(th), y * Math.sin(th)])); }
      out.push(polyline(ring, c, 0));
    }
    for (const s of [1, -1]) {
      const prof = [];
      for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; const y = curve.eval(x).cart[1]; if (!Number.isFinite(y)) continue; prof.push(project3(ctx, [x, y * s, 0])); }
      out.push(polyline(prof, c, 1));
    }
    return out;
  }
}
// ── z = f(x,y) 곡면 (mesh wireframe / shaded faces) ──
function shadeHex(hex, k) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const cl = (x) => Math.max(0, Math.min(255, Math.round(x * k)));
  return `#${((cl((n >> 16) & 255) << 16) | (cl((n >> 8) & 255) << 8) | cl(n & 255)).toString(16).padStart(6, '0')}`;
}

export class ZSurface extends Drawable {
  constructor(conf = {}) { super('surface', { xr: [-2, 2], yr: [-2, 2], n: 24, ...conf }); }
  on(xr, yr) { return this.set({ xr, yr }); }
  mesh(n) { return this.set({ n }); }
  faces(on = true) { return this.set({ faces: on }); }
  /** 면 색을 높이 z 로 컬러맵 적용 (matplotlib cmap 대응) */
  cmap(name) { return this.set({ cmap: name }); }
  // 3D 자동 프레이밍용 코너점(collect3 가 사용)
  get vertices() {
    const c = this._conf, f = c.fn, [x0, x1] = c.xr, [y0, y1] = c.yr;
    const z = (x, y) => { const v = f(x, y); return Number.isFinite(v) ? v : 0; };
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => point(x, y, z(x, y)));
  }
  toIR(ctx) {
    const c = this._conf, f = c.fn;
    const [x0, x1] = c.xr, [y0, y1] = c.yr, n = c.n;
    const P = (i, j) => {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * j) / n;
      return project3(ctx, [x, y, f(x, y)]);
    };
    const base = c.color || '#93c5fd';
    // cmap 정규화용 높이 범위
    let zmin = Infinity, zmax = -Infinity;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const zv = f(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * j) / n);
      if (Number.isFinite(zv)) { zmin = Math.min(zmin, zv); zmax = Math.max(zmax, zv); }
    }
    if (!Number.isFinite(zmin)) { zmin = 0; zmax = 1; }
    const out = [];
    // 깊이 포함 선(path) — hidden-line 대상
    const line3 = (pts, stroke, color, hidden) => {
      if (pts.some((p) => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) return null;
      const depth = pts.reduce((a, p) => a + p[2], 0) / pts.length;
      return node('path', {
        ops: pts.map((p, i) => ({ op: i ? 'L' : 'M', x: p[0], y: p[1], depth: p[2] })),
        color, stroke, z: depthZ(depth), hiddenTest: hidden,
      });
    };
    if (c.faces) {
      const quads = [];
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const p = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
          if (p.some((q) => !Number.isFinite(q[0]) || !Number.isFinite(q[1]))) continue;
          const zc = (f(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * j) / n)
            + f(x0 + ((x1 - x0) * (i + 1)) / n, y0 + ((y1 - y0) * j) / n)
            + f(x0 + ((x1 - x0) * (i + 1)) / n, y0 + ((y1 - y0) * (j + 1)) / n)
            + f(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * (j + 1)) / n)) / 4;
          quads.push({ p, depth: p.reduce((a, q) => a + q[2], 0) / 4, zc });
        }
      }
      quads.sort((a, b) => b.depth - a.depth);   // 먼 것부터(painter)
      const dmin = Math.min(...quads.map((q) => q.depth));
      const dmax = Math.max(...quads.map((q) => q.depth));
      for (const q of quads) {
        const t = dmax > dmin ? (q.depth - dmin) / (dmax - dmin) : 0.5;   // 가까울수록 밝게
        const colBase = c.cmap ? cmapColor(c.cmap, zmax > zmin ? (q.zc - zmin) / (zmax - zmin) : 0.5) : base;
        const col = shadeHex(colBase, 1.18 - t * 0.4);
        out.push(node('polygon', {
          pts: q.p.map((p) => [p[0], p[1]]), depths: q.p.map((p) => p[2]), closed: true,
          fill: col, color: col, stroke: 0.4, opacity: c.opacity ?? 0.96, z: depthZ(q.depth),
          occluder: true,   // hidden-line 용 깊이 버퍼 소스
        }));
      }
    } else {
      for (let j = 0; j <= n; j++) { const pts = []; for (let i = 0; i <= n; i++) pts.push(P(i, j)); const l = line3(pts, c.stroke ?? 1, c.color || base, true); if (l) out.push(l); }
      for (let i = 0; i <= n; i++) { const pts = []; for (let j = 0; j <= n; j++) pts.push(P(i, j)); const l = line3(pts, c.stroke ?? 1, c.color || base, true); if (l) out.push(l); }
    }
    // 실루엣: 정의역 경계 4변은 항상 표시(강한 선)
    const boundary = [
      Array.from({ length: n + 1 }, (_, i) => P(i, 0)),
      Array.from({ length: n + 1 }, (_, i) => P(i, n)),
      Array.from({ length: n + 1 }, (_, j) => P(0, j)),
      Array.from({ length: n + 1 }, (_, j) => P(n, j)),
    ];
    for (const b of boundary) { const l = line3(b, 1.4, shadeHex(base, 0.7), false); if (l) out.push(l); }
    return out;
  }
}

export const surface = {
  revolution(curveObj) { return { about: () => new Surface({ curve: curveObj }) }; },
  /** z = f(x,y).on([x0,x1],[y0,y1]).mesh(n) / .faces() */
  z(fn) { return new ZSurface({ fn }); },
};

// ── 3D 벡터장(quiver) ────────────────────────────
export class VectorField3 extends Drawable {
  constructor(conf = {}) { super('vectorField3', { box: [-2, 2, -2, 2, -2, 2], step: 1, len: 0.7, ...conf }); }
  on(box) { return this.set({ box }); }
  step(s) { return this.set({ step: s }); }
  len(l) { return this.set({ len: l }); }
  get vertices() {
    const [ax, bx, ay, by, az, bz] = this._conf.box;
    return [[ax, ay, az], [bx, by, bz]].map((v) => point(...v));
  }
  toIR(ctx) {
    const c = this._conf;
    const [ax, bx, ay, by, az, bz] = c.box;
    const st = c.step, out = [];
    const head = c.len * 0.4;
    for (let x = Math.ceil(ax / st) * st; x <= bx + 1e-9; x += st) {
      for (let y = Math.ceil(ay / st) * st; y <= by + 1e-9; y += st) {
        for (let z = Math.ceil(az / st) * st; z <= bz + 1e-9; z += st) {
          const v = c.fn(x, y, z);
          if (!v || !v.every(Number.isFinite)) continue;
          const m = Math.hypot(v[0], v[1], v[2]);
          if (m < 1e-9) continue;
          const u = [v[0] / m, v[1] / m, v[2] / m];
          const base = project3(ctx, [x, y, z]);
          const tip = project3(ctx, [x + u[0] * c.len, y + u[1] * c.len, z + u[2] * c.len]);
          if (![base[0], base[1], tip[0], tip[1]].every(Number.isFinite)) continue;
          const col = c.color || '#1971c2';
          out.push(node('path', {
            ops: [{ op: 'M', x: base[0], y: base[1], depth: base[2] }, { op: 'L', x: tip[0], y: tip[1], depth: tip[2] }],
            color: col, stroke: c.stroke || 1.6, z: depthZ(base[2]), hiddenTest: true,
          }));
          const dx = tip[0] - base[0], dy = tip[1] - base[1];
          const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux;
          out.push(node('polygon', {
            pts: [[tip[0], tip[1]], [tip[0] - ux * head + px * head * 0.5, tip[1] - uy * head + py * head * 0.5], [tip[0] - ux * head - px * head * 0.5, tip[1] - uy * head - py * head * 0.5]],
            closed: true, fill: col, z: depthZ(tip[2]),
          }));
        }
      }
    }
    return out;
  }
}

export const vectorField3 = (fn) => new VectorField3({ fn });

export class Polyhedron extends Drawable {
  constructor(conf = {}) { super('polyhedron', { ...conf }); }
  toIR(ctx) {
    const c = this._conf;
    const out = [];
    for (const [i, j] of c.edges || []) out.push(polyline([project3(ctx, c.vertices[i]), project3(ctx, c.vertices[j])], c, 0));
    for (const v of c.vertices || []) { const p = project3(ctx, v); out.push(node('point', { x: p[0], y: p[1], marker: 'dot', z: depthZ(p[2], 1), style: { color: c.color || '#000' } })); }
    return out;
  }
}
export const polyhedron = {
  platonic(name) { return { circumradius: (R) => new Polyhedron(buildPoly(name, R)) }; },
};

function buildPoly(name, R) {
  const phi = (1 + Math.sqrt(5)) / 2;
  let verts;
  if (name === 'dodeca' || name === 'dodecahedron') {
    const s = 1;
    verts = [
      [s, s, s], [s, s, -s], [s, -s, s], [s, -s, -s], [-s, s, s], [-s, s, -s], [-s, -s, s], [-s, -s, -s],
      [0, s / phi, s * phi], [0, s / phi, -s * phi], [0, -s / phi, s * phi], [0, -s / phi, -s * phi],
      [s / phi, s * phi, 0], [s / phi, -s * phi, 0], [-s / phi, s * phi, 0], [-s / phi, -s * phi, 0],
      [s * phi, 0, s / phi], [s * phi, 0, -s / phi], [-s * phi, 0, s / phi], [-s * phi, 0, -s / phi],
    ];
  } else if (name === 'cube') {
    const s = 1; verts = [];
    for (const x of [-s, s]) for (const y of [-s, s]) for (const z of [-s, s]) verts.push([x, y, z]);
  } else if (name === 'tetra' || name === 'tetrahedron') {
    verts = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  } else {
    verts = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]];
  }
  const maxNorm = Math.max(...verts.map((v) => Math.hypot(...v)));
  const sc = (R || 1) / (maxNorm || 1);
  verts = verts.map((v) => v.map((x) => x * sc));
  const dist = (u, w) => Math.hypot(u[0] - w[0], u[1] - w[1], u[2] - w[2]);
  let minD = Infinity;
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) minD = Math.min(minD, dist(verts[i], verts[j]));
  const edges = [];
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) if (Math.abs(dist(verts[i], verts[j]) - minD) < 1e-6) edges.push([i, j]);
  return { vertices: verts, edges, counts: { V: verts.length, E: edges.length, F: 2 - verts.length + edges.length } };
}