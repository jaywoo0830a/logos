// 3D 입체 (E2–E4, K3) — 원기둥/원뿔/회전체/다면체
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';
import { project3, polyline, pick, depthZ } from './threeD.js';

export class Cylinder extends Drawable {
  constructor(conf = {}) { super('cylinder', { ...conf }); }
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
export const surface = {
  revolution(curveObj) { return { about: () => new Surface({ curve: curveObj }) }; },
};

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