// 3D 추가 도형 — curve3 · arrow3 · surfaceParam (+ 간이 컬러맵)
// matplotlib 3D 의 plot / quiver / plot_surface / plot_wireframe 에 대응.
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';
import { project3, depthZ } from './threeD.js';
import { point } from './point.js';

// ── 간이 컬러맵 (matplotlib cmap 근사) ──────────────
const CMAPS = {
  viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'],
  plasma: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'],
  coolwarm: ['#3b4cc0', '#7396ea', '#dddddd', '#f6a582', '#b40426'],
  jet: ['#00007f', '#0000ff', '#00ffff', '#ffff00', '#ff0000', '#7f0000'],
  summer: ['#008066', '#37a06a', '#6fbf6f', '#a7dd73', '#ffff77'],
};
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return `#${((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).padStart(6, '0')}`; }
/** 컬러맵 t∈[0,1] → hex */
export function cmapColor(name, t) {
  const stops = CMAPS[name] || CMAPS.viridis;
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
  const a = hexToRgb(stops[i]), b = hexToRgb(stops[i + 1]);
  return rgbToHex(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
}
/** 밝기 배율 k 로 명암 조절 */
export function shade(hex, k) { const [r, g, b] = hexToRgb(hex); const cl = (x) => Math.max(0, Math.min(255, x * k)); return rgbToHex(cl(r), cl(g), cl(b)); }

const LIGHT = (() => { const v = [0.45, -0.6, 0.85]; const n = Math.hypot(...v); return v.map((x) => x / n); })();
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** 화면좌표 폴리라인(깊이 포함) — hidden-line 대상 여부 지정 */
function polyline3(pts, c, layer, hidden) {
  const ops = [];
  let started = false, ds = 0, dn = 0;
  for (const p of pts) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) { started = false; continue; }
    ds += p[2] || 0; dn++;
    ops.push({ op: started ? 'L' : 'M', x: p[0], y: p[1], depth: p[2] });
    started = true;
  }
  if (ops.length < 2) return null;
  return node('path', { ops, color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity, z: depthZ(dn ? ds / dn : 0, layer), hiddenTest: hidden });
}

const asCoords = (p) => (p && Array.isArray(p.coords) ? p.coords : p);

// ── curve3 — 3D 곡선/폴리라인 ────────────────────────
export class Curve3 extends Drawable {
  constructor(conf = {}) { super('curve3', { kind: 'parametric', domain: [0, 1], n: 200, ...conf }); }
  on(domain) { return this.set({ domain }); }
  label(t, off) { return this.set({ label: t, labelOff: off }); }
  get vertices() { return this._sample().map((v) => point(v[0], v[1], v[2] ?? 0)); }
  _sample() {
    const c = this._conf;
    if (c.kind === 'through') return (c.points || []).map(asCoords);
    const [a, b] = c.domain || [0, 1];
    const n = c.n || 200, out = [];
    for (let i = 0; i <= n; i++) { const v = c.fn(a + ((b - a) * i) / n); if (v && Number.isFinite(v[0])) out.push([v[0], v[1], v[2] ?? 0]); }
    return out;
  }
  toIR(ctx) {
    const c = this._conf;
    const pts = this._sample().map((v) => project3(ctx, v));
    const out = [];
    const l = polyline3(pts, c, 1, !!c.hiddenTest);
    if (l) out.push(l);
    if (c.label) {
      const p0 = pts[Math.floor(pts.length * 0.5)] || pts[0];
      if (p0 && Number.isFinite(p0[0])) {
        const off = typeof c.labelOff === 'object' && c.labelOff ? c.labelOff : {};
        out.push(node('text', { x: p0[0], y: p0[1], dxPx: off.dx ?? 6, dyPx: off.dy ?? -6, text: String(c.label), font: c.font || 12, color: c.color, z: depthZ(p0[2], 2) }));
      }
    }
    return out;
  }
}
export const curve3 = {
  parametric(f) { return new Curve3({ kind: 'parametric', fn: f }); },
  through(pts) { return new Curve3({ kind: 'through', points: pts }); },
};

// ── arrow3 — 3D 화살표(quiver) ───────────────────────
export class Arrow3 extends Drawable {
  constructor(conf = {}) { super('arrow3', { head: 9, ...conf }); }
  to(P) { return this.set({ to: asCoords(P) }); }
  label(t, off) { return this.set({ label: t, labelOff: off }); }
  get vertices() { return [this._conf.from, this._conf.to].map((v) => point(...v)); }
  toIR(ctx) {
    const c = this._conf;
    const W = asCoords(c.from), V = asCoords(c.to);
    const A = project3(ctx, W), B = project3(ctx, V);
    if (![A[0], A[1], B[0], B[1]].every(Number.isFinite)) return [];
    const col = c.color || '#1f77b4';
    const w = c.stroke ?? 1.8;
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const L = Math.hypot(dx, dy) || 1;
    // 머리 크기는 화살표 길이 비율 (matplotlib arrow_length_ratio 대응)
    const head = Math.min(c.ratio ?? 0.12, 0.45) * L;
    const bx = B[0] - (dx / L) * head, by = B[1] - (dy / L) * head;
    const ux = dx / L, uy = dy / L, px = -uy, py = ux;
    const out = [
      node('path', { ops: [{ op: 'M', x: A[0], y: A[1], depth: A[2] }, { op: 'L', x: bx, y: by, depth: B[2] }], color: col, stroke: w, dash: c.dash, opacity: c.opacity, z: depthZ((A[2] + B[2]) / 2), hiddenTest: !!c.hiddenTest }),
      node('polygon', { pts: [[B[0], B[1]], [bx + px * head * 0.45, by + py * head * 0.45], [bx - px * head * 0.45, by - py * head * 0.45]], closed: true, fill: col, opacity: c.opacity, z: depthZ(B[2]) }),
    ];
    if (c.label) {
      const off = typeof c.labelOff === 'object' && c.labelOff ? c.labelOff : {};
      out.push(node('text', { x: B[0], y: B[1], dxPx: off.dx ?? 6, dyPx: off.dy ?? -4, text: String(c.label), font: c.font || 12, color: c.color, z: depthZ(B[2], 2) }));
    }
    return out;
  }
}
export function arrow3(from, to) {
  const conf = { from: asCoords(from) };
  if (to !== undefined) conf.to = asCoords(to);
  return new Arrow3(conf);
}

// ── surfaceParam — 파라메트릭 곡면 (구·타원체·쌍곡면·원뿔·평면…) ──
export class ParamSurface extends Drawable {
  constructor(conf = {}) { super('surface', { ur: [0, 1], vr: [0, 1], nu: 24, nv: 24, mode: 'wire', opacity: 0.95, ...conf }); }
  on(ur, vr) { return this.set({ ur, vr }); }
  wire(nu, nv) { return this.set({ mode: 'wire', nu: nu ?? this._conf.nu, nv: nv ?? this._conf.nv }); }
  solid(nu, nv) { return this.set({ mode: 'solid', nu: nu ?? this._conf.nu, nv: nv ?? this._conf.nv }); }
  cmap(name) { return this.set({ cmap: name }); }
  get vertices() {
    const c = this._conf, [u0, u1] = c.ur, [v0, v1] = c.vr, out = [];
    for (const u of [u0, (u0 + u1) / 2, u1]) for (const v of [v0, (v0 + v1) / 2, v1]) {
      const w = c.fn(u, v); if (w && w.every(Number.isFinite)) out.push(point(w[0], w[1], w[2] ?? 0));
    }
    return out;
  }
  toIR(ctx) {
    const c = this._conf, f = c.fn;
    const [u0, u1] = c.ur, [v0, v1] = c.vr;
    const nu = c.nu, nv = c.nv;
    const W = (i, j) => f(u0 + ((u1 - u0) * i) / nu, v0 + ((v1 - v0) * j) / nv);
    const P = (i, j) => { const w = W(i, j); return w && w.every(Number.isFinite) ? project3(ctx, w) : null; };
    const base = c.color || '#93c5fd';
    const out = [];
    let zmin = Infinity, zmax = -Infinity;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const w = W(i, j); if (w && Number.isFinite(w[2])) { zmin = Math.min(zmin, w[2]); zmax = Math.max(zmax, w[2]); } }
    if (!Number.isFinite(zmin)) { zmin = 0; zmax = 1; }
    if (c.mode === 'solid') {
      const quads = [];
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const p = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
        if (p.some((q) => !q)) continue;
        const w00 = W(i, j), w10 = W(i + 1, j), w01 = W(i, j + 1), w11 = W(i + 1, j + 1);
        const nrm = cross(sub(w10, w00), sub(w01, w00));
        const nl = Math.hypot(...nrm) || 1;
        const bright = 0.62 + 0.38 * Math.abs(dot(nrm.map((x) => x / nl), LIGHT));
        const zc = (w00[2] + w10[2] + w01[2] + w11[2]) / 4;
        const depth = p.reduce((a, q) => a + q[2], 0) / 4;
        const col0 = c.cmap ? cmapColor(c.cmap, zmax > zmin ? (zc - zmin) / (zmax - zmin) : 0.5) : base;
        quads.push({ p, depth, col: shade(col0, bright) });
      }
      quads.sort((a, b) => b.depth - a.depth);
      for (const q of quads) {
        out.push(node('polygon', { pts: q.p.map((p) => [p[0], p[1]]), depths: q.p.map((p) => p[2]), closed: true, fill: q.col, color: q.col, stroke: 0.4, opacity: c.opacity, z: depthZ(q.depth), occluder: true }));
      }
    } else {
      const stroke = c.stroke ?? 0.6;
      const line = (pts) => { const l = polyline3(pts, { color: c.color || base, stroke, opacity: c.opacity }, 0, c.hidden !== false); if (l) out.push(l); };
      for (let j = 0; j <= nv; j++) line(Array.from({ length: nu + 1 }, (_, i) => P(i, j)).filter(Boolean));
      for (let i = 0; i <= nu; i++) line(Array.from({ length: nv + 1 }, (_, j) => P(i, j)).filter(Boolean));
    }
    return out;
  }
}
export const surfaceParam = (fn) => new ParamSurface({ fn });
