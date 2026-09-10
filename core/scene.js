// DSL.md §5 씬(Scene) + §12 Scene IR → 다중 백엔드
import { node } from './node.js';
import { SceneIR } from '../backend/scene-ir.js';

const THEMES = {
  textbook: { gridColor: '#cbd5e1', axisColor: '#444' },
  default: { gridColor: '#cbd5e1', axisColor: '#444' },
};

export class Scene {
  constructor(conf = {}) {
    this._conf = {
      dim: 2, equal: false, axes: null, grid: null, polarGrid: false, sphericalGrid: false,
      theme: 'default', camera: { position: [4, 3, 3], target: [0, 0, 0], up: [0, 0, 1] },
      lights: [], size: [600, 600], dpi: 96, view: null, shapes: [], asserts: [], ...conf,
    };
    this._conf.shapes = [...this._conf.shapes];
    this._conf.lights = [...this._conf.lights];
    this._conf.asserts = [...this._conf.asserts];
  }

  set(changes) {
    const merged = { ...this._conf, ...changes };
    for (const k of ['shapes', 'lights', 'asserts']) {
      if (changes[k]) merged[k] = [...changes[k]];
    }
    return new Scene(merged);
  }

  // ── 좌표계/캔버스 ──────────────────────────────
  dim(d) { return this.set({ dim: d }); }
  auto() { return this.set({ dim: 'auto' }); }
  view(...ranges) {
    const arr = ranges.map((r) => (Array.isArray(r) ? r : [r, r]));
    return this.set({ view: arr });
  }
  equal() { return this.set({ equal: true }); }
  axes(cfg = true) { return this.set({ axes: cfg }); }
  grid(cfg = true) { return this.set({ grid: cfg }); }
  polarGrid(cfg = true) { return this.set({ polarGrid: cfg }); }
  sphericalGrid(cfg = true) { return this.set({ sphericalGrid: cfg }); }
  size(w, h) { return this.set({ size: [w, h] }); }
  dpi(d) { return this.set({ dpi: d }); }
  theme(t) { return this.set({ theme: t }); }

  // ── 3D 카메라/조명 ─────────────────────────────
  camera(c) { return this.set({ camera: { ...this._conf.camera, ...c } }); }
  orbit(o) { return this.set({ camera: { ...this._conf.camera, ...o } }); }
  light(l) { return this.set({ lights: [...this._conf.lights, l] }); }

  // ── 도형 ───────────────────────────────────────
  add(...shapes) { return this.set({ shapes: [...this._conf.shapes, ...shapes] }); }
  addAll(shapes) { return this.set({ shapes: [...this._conf.shapes, ...shapes] }); }

  // ── 검증 ───────────────────────────────────────
  assert(...rules) { return this.set({ asserts: [...this._conf.asserts, ...rules] }); }

  // ── 컴파일 → Scene IR ──────────────────────────
  compile() {
    const conf = this._conf;
    const dim = conf.dim === 'auto' ? guessDim(conf.shapes) : conf.dim;
    const world = resolveWorld(conf, conf.shapes);
    const themeDef = THEMES[conf.theme] || THEMES.default;

    let project = null;
    if (dim === 3) project = makeProjection(conf.camera);
    const ctx = { world, dim, theme: conf.theme, project };

    let nodes = [];
    if (conf.grid) nodes = nodes.concat(gridIR(world, conf.grid, themeDef));
    if (conf.polarGrid) nodes = nodes.concat(polarGridIR(world, themeDef));
    if (conf.axes) nodes = nodes.concat(axesIR(world, conf.axes, themeDef));

    for (const shape of conf.shapes) {
      if (shape && typeof shape.toIR === 'function') {
        const sub = shape.toIR(ctx);
        (sub || []).forEach((n) => nodes.push(n));
      }
    }
    nodes = nodes.map((n, i) => ({ n, i })).sort((a, b) => rank(a) - rank(b)).map((x) => x.n);

    checkAsserts(conf.asserts);

    return new SceneIR({ nodes, world, dim, size: conf.size, equal: conf.equal, theme: conf.theme, dpi: conf.dpi });
  }
}

function rank({ n, i }) {
  const d = n.data || {};
  const z = (d.z !== undefined ? d.z : (d.style && d.style.z));
  return (z === undefined ? 0 : z) * 1000 + i / 100000;
}
// ── 세계 사각형 ──────────────────────────────────
function resolveWorld(conf, shapes) {
  if (conf.view) return { xmin: conf.view[0][0], xmax: conf.view[0][1], ymin: conf.view[1][0], ymax: conf.view[1][1] };
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const s of shapes) {
    for (const p of collect(s)) {
      if (p.length >= 1) { xmin = Math.min(xmin, p[0]); xmax = Math.max(xmax, p[0]); }
      if (p.length >= 2) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
    }
  }
  if (xmin === Infinity) { xmin = -5; xmax = 5; }
  if (ymin === Infinity) { ymin = -5; ymax = 5; }
  const xr = (xmax - xmin) || 1, yr = (ymax - ymin) || 1;
  return { xmin: xmin - xr * 0.1, xmax: xmax + xr * 0.1, ymin: ymin - yr * 0.1, ymax: ymax + yr * 0.1 };
}

function collect(s) {
  if (s == null) return [];
  const c = (typeof s.coords === 'function' && s.coords) || (Array.isArray(s.coords) ? s.coords : null);
  if (Array.isArray(s.coords)) return [s.coords];
  if (s.vertices && Array.isArray(s.vertices)) return s.vertices.map((v) => v.coords);
  if (typeof s.sample === 'function') return s.sample();
  if (typeof s.pointDir === 'function') { const { p, d } = s.pointDir(); return [p, [p[0] + d[0], p[1] + d[1]]]; }
  if (typeof s.center === 'function' && typeof s.radius === 'function') {
    const c2 = s.center();
    const r = s.radius();
    return [[c2[0] - r, c2[1] - r], [c2[0] + r, c2[1] + r]];
  }
  return [];
}

// ── 배경 IR ──────────────────────────────────────
function gridIR(world, cfg, theme) {
  const step = (typeof cfg === 'object' && cfg.step) ? cfg.step : (typeof cfg === 'number' ? cfg : 1);
  const color = theme.gridColor || '#cbd5e1';
  const out = [];
  const startX = Math.floor(world.xmin / step) * step;
  const startY = Math.floor(world.ymin / step) * step;
  for (let x = startX; x <= world.xmax + 1e-9; x += step) {
    out.push(node('path', { ops: [{ op: 'M', x, y: world.ymin }, { op: 'L', x, y: world.ymax }], z: -10, style: { color, stroke: 0.6 } }));
  }
  for (let y = startY; y <= world.ymax + 1e-9; y += step) {
    out.push(node('path', { ops: [{ op: 'M', x: world.xmin, y }, { op: 'L', x: world.xmax, y }], z: -10, style: { color, stroke: 0.6 } }));
  }
  return out;
}

function polarGridIR(world, theme) {
  const color = theme.gridColor || '#cbd5e1';
  const maxR = Math.hypot(Math.max(Math.abs(world.xmin), Math.abs(world.xmax)), Math.max(Math.abs(world.ymin), Math.abs(world.ymax)));
  const step = maxR / 4;
  const out = [];
  for (let r = step; r <= maxR; r += step) {
    out.push(node('circle', { cx: 0, cy: 0, r, z: -10, style: { color, stroke: 0.6 } }));
  }
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    out.push(node('path', { ops: [{ op: 'M', x: 0, y: 0 }, { op: 'L', x: Math.cos(a) * maxR, y: Math.sin(a) * maxR }], z: -10, style: { color, stroke: 0.6 } }));
  }
  return out;
}

function axesIR(world, cfg, theme) {
  const out = [];
  const c = theme.axisColor || '#444';
  const xLabel = (cfg === true || !cfg.x || cfg.x.label === undefined || cfg.x.label === true) ? (cfg && cfg.x && typeof cfg.x.label === 'string' ? cfg.x.label : 'x') : null;
  const yLabel = (cfg === true || !cfg.y || cfg.y.label === undefined || cfg.y.label === true) ? (cfg && cfg.y && typeof cfg.y.label === 'string' ? cfg.y.label : 'y') : null;
  if (world.ymin <= 0 && 0 <= world.ymax) {
    out.push(node('path', { ops: [{ op: 'M', x: world.xmin, y: 0 }, { op: 'L', x: world.xmax, y: 0 }], z: -5, style: { color: c, stroke: 1 } }));
    if (xLabel) out.push(node('text', { x: world.xmax, y: -(world.ymax - world.ymin) * 0.04, text: String(xLabel), anchor: 'end', color: c, z: -4 }));
  }
  if (world.xmin <= 0 && 0 <= world.xmax) {
    out.push(node('path', { ops: [{ op: 'M', x: 0, y: world.ymin }, { op: 'L', x: 0, y: world.ymax }], z: -5, style: { color: c, stroke: 1 } }));
    if (yLabel) out.push(node('text', { x: (world.xmax - world.xmin) * 0.04, y: world.ymax, text: String(yLabel), anchor: 'start', color: c, z: -4 }));
  }
  return out;
}

// ── 3D 정사영 프로젝션 ───────────────────────────
function makeProjection(camera) {
  const eye = camera.position;
  const target = camera.target || [0, 0, 0];
  const up = camera.up || [0, 0, 1];
  const f = sub(target, eye);
  const fl = len(f) || 1;
  const fn = [f[0] / fl, f[1] / fl, f[2] / fl];
  const r = cross(fn, up);
  const rl = len(r) || 1;
  const rn = [r[0] / rl, r[1] / rl, r[2] / rl];
  const u = cross(rn, fn);
  return (pos) => [dot(sub(pos, eye), rn), dot(sub(pos, eye), u)];
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ── 어설션 ───────────────────────────────────────
function checkAsserts(rules) {
  for (const r of rules) {
    if (!r || !r.kind) continue;
    if (r.kind === 'equal-length') {
      const [a, b] = r.items;
      const la = a && typeof a.length === 'function' ? a.length() : NaN;
      const lb = b && typeof b.length === 'function' ? b.length() : NaN;
      if (Math.abs(la - lb) > 1e-9) throw new Error(`Assertion failed: equal-length ${la} ≠ ${lb}`);
    }
    if (r.kind === 'parallel') {
      const [a, b] = r.items;
      if (a && b && typeof a.pointDir === 'function' && typeof b.pointDir === 'function') {
        const d1 = a.pointDir().d, d2 = b.pointDir().d;
        if (Math.abs(d1[0] * d2[1] - d1[1] * d2[0]) > 1e-9) throw new Error('Assertion failed: parallel');
      }
    }
  }
}

function guessDim(shapes) {
  for (const s of shapes) {
    if (s == null) continue;
    if (Array.isArray(s.coords) && s.coords.length >= 3) return 3;
    if (typeof s.dim === 'function' && s.dim() >= 3) return 3;
    if (s.vertices && s.vertices.some((v) => v.coords.length >= 3)) return 3;
  }
  return 2;
}

export default Scene;
export { SceneIR };