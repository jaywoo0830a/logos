// DSL.md §5 씬(Scene) + §12 Scene IR → 다중 백엔드
import { node } from './node.js';
import { SceneIR } from '../backend/scene-ir.js';

const THEMES = {
  // ── textbook — 출판 교과서 수준(moz 크림 배경, 군청 축, 세련된 라벨)
  textbook: {
    bg: '#fdfdfb',
    gridColor: '#e6e6e2',
    gridMajor: '#d9d9d4',
    axisColor: '#34495e',
    axisWidth: 1.4,
    tickColor: '#5d6d7e',
    labelColor: '#2c3e50',
    font: 'Georgia, "Times New Roman", serif',
    fontMath: 'Latin Modern Math, Georgia, serif',
    pointColor: '#1f4e79',
    strokeDefault: '#1a2744',
  },
  // ── paper — 밝은 종이(논문)
  paper: {
    bg: '#ffffff',
    gridColor: '#eef1f4',
    gridMajor: '#dfe4ea',
    axisColor: '#2f3640',
    axisWidth: 1.2,
    tickColor: '#576574',
    labelColor: '#2f3640',
    font: 'Helvetica, Arial, sans-serif',
    fontMath: 'Latin Modern Math, Georgia, serif',
    pointColor: '#0a58ca',
    strokeDefault: '#222',
  },
  // ── dark — 어두운 프레젠테이션
  dark: {
    bg: '#14161a',
    gridColor: '#2a2e35',
    gridMajor: '#363b44',
    axisColor: '#9aa5b1',
    axisWidth: 1.4,
    tickColor: '#6b7684',
    labelColor: '#d3dae3',
    font: 'Helvetica, Arial, sans-serif',
    fontMath: 'Latin Modern Math, Georgia, serif',
    pointColor: '#64b5f6',
    strokeDefault: '#e0e0e0',
  },
  default: {
    bg: '#ffffff',
    gridColor: '#cbd5e1',
    axisColor: '#444',
    labelColor: '#333',
    font: 'sans-serif',
  },
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
    let world = resolveWorld(conf, conf.shapes, dim);
    // 극좌표 그리드는 원점 중심이므로, view 를 원점 대칭 정사각으로 맞춰야
    // 그리드/각도 라벨이 화면 밖으로 나가지 않는다.
    if (conf.polarGrid && dim === 2) world = squareWorld(world);
    const themeDef = THEMES[conf.theme] || THEMES.default;

    let project = null;
    if (dim === 3) project = makeProjection(conf.camera);
    // 3D 면 축이 view 안에 들도록, 세계사각형을 프로젝션 후로 계산한다.
    const effWorld = (dim === 3 && project && !conf.view) ? world3From(conf.shapes, project) : world;
    const ctx = { world: effWorld, dim, theme: conf.theme, project };

    let nodes = [];
    if (conf.grid) nodes = nodes.concat(gridIR(effWorld, conf.grid, themeDef));
    if (conf.polarGrid) nodes = nodes.concat(polarGridIR(effWorld, themeDef));
    if (conf.sphericalGrid) nodes = nodes.concat(sphericalGridIR(effWorld, project, themeDef));
    if (conf.axes && dim === 3) nodes = nodes.concat(axes3IR(effWorld, project, themeDef, conf.axes));
    else if (conf.axes) nodes = nodes.concat(axesIR(effWorld, conf.axes, themeDef));
    else if (dim === 3) nodes = nodes.concat(axes3IR(effWorld, project, themeDef, true));

    for (const shape of conf.shapes) {
      if (shape && typeof shape.toIR === 'function') {
        const sub = shape.toIR(ctx);
        (sub || []).forEach((n) => nodes.push(n));
      }
    }
    nodes = nodes.map((n, i) => ({ n, i })).sort((a, b) => rank(a) - rank(b)).map((x) => x.n);

    checkAsserts(conf.asserts);

    // 3D 씬은 좌표 왜곡을 막기 위해 정사각(equal) 렌더를 기본 활성화한다.
    const effectiveEqual = conf.equal || (dim === 3);

    return new SceneIR({ nodes, world: effWorld, dim, size: conf.size, equal: effectiveEqual, theme: conf.theme, themeDef, dpi: conf.dpi });
  }
}

function rank({ n, i }) {
  const d = n.data || {};
  const z = (d.z !== undefined ? d.z : (d.style && d.style.z));
  return (z === undefined ? 0 : z) * 1000 + i / 100000;
}
// ── 세계 사각형 ──────────────────────────────────
/** 3D 씬: 원점(0,0,0)을 중심으로 하여, 가장 먼 도형점까지 거리를 반경으로 사각 view 를 잡는다. */
function world3From(shapes, project) {
  const o = project([0, 0, 0]); // 원점의 화면 좌표
  let R2 = 1; // 반경의 제곱(여백 포함)
  const consider = (p) => {
    const [x, y] = project(p);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    R2 = Math.max(R2, (x - o[0]) ** 2 + (y - o[1]) ** 2);
  };
  for (const s of shapes) for (const p of collect3(s, 1)) consider(p);
  // 원점 중심으로 여백을 두어 축이 중심부에 놓이게 (축은 도형 위를 지나도 됨)
  const R = Math.sqrt(R2);
  const pad = R * 0.25;
  return { xmin: o[0] - R - pad, xmax: o[0] + R + pad, ymin: o[1] - R - pad, ymax: o[1] + R + pad };
}

/** 3D 형태의 좌표들만 추출 (2D 좌표는 무시). 구/회전체는 표면점(코너) 포함. */
function collect3(s, _ = 1) {
  if (s == null) return [];
  const out = [];
  if (Array.isArray(s.coords) && s.coords.length >= 3) out.push(s.coords);
  if (s.vertices && Array.isArray(s.vertices)) for (const v of s.vertices) if (v.coords.length >= 3) out.push(v.coords);
  if (typeof s.center === 'function') {
    const c = s.center(); if (c.length >= 3) out.push(c);
  }
  if (typeof s.center === 'function' && typeof s.radius === 'function') {
    const c = s.center(); const r = s.radius();
    if (c.length >= 3) for (const dx of [-r, r]) for (const dy of [-r, r]) for (const dz of [-r, r]) out.push([c[0] + dx, c[1] + dy, c[2] + dz]);
  }
  return out;
}

function resolveWorld(conf, shapes, dim = 2) {
  if (conf.view) return { xmin: conf.view[0][0], xmax: conf.view[0][1], ymin: conf.view[1][0], ymax: conf.view[1][1] };
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const s of shapes) {
    for (const p of collect(s)) {
      // 3D 점은 투영 좌표를 world 로 사용하되, 원점 포함 처리
      if (p.length >= 3 && dim === 3) continue; // 3D 축이 별도로 world 를 확장
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
  // P1-2: 도형이 bounds() 를 제공하면 최우선으로 사용한다(타원·사각형·영역·음함수 …).
  if (typeof s.bounds === 'function') {
    const b = s.bounds();
    if (b && Number.isFinite(b.xmin) && Number.isFinite(b.xmax) && Number.isFinite(b.ymin) && Number.isFinite(b.ymax)) {
      return [[b.xmin, b.ymin], [b.xmax, b.ymax]];
    }
  }
  if (Array.isArray(s.coords)) return [s.coords];
  if (s.vertices && Array.isArray(s.vertices)) return s.vertices.map((v) => v.coords);
  if (typeof s.sample === 'function') return s.sample();
  if (typeof s.pointDir === 'function') { const { p, d } = s.pointDir(); return [p, [p[0] + d[0], p[1] + d[1]]]; }
  const ctr = readCenter(s);
  const r = readRadius(s);
  if (ctr && r != null) return [[ctr[0] - r, ctr[1] - r], [ctr[0] + r, ctr[1] + r]];
  return [];
}

/** center 가 메서드든 getter(Point)든 좌표 배열을 읽는다. */
function readCenter(s) {
  const cand = typeof s.center === 'function' ? s.center() : s.center;
  if (Array.isArray(cand)) return cand;
  if (cand && Array.isArray(cand.coords)) return cand.coords;
  return null;
}
function readRadius(s) {
  if (typeof s.radius === 'function') return s.radius();
  if (typeof s.radius === 'number') return s.radius;
  return null;
}

// ── 배경 IR ──────────────────────────────────────
function gridIR(world, cfg, theme) {
  const step = (typeof cfg === 'object' && cfg.step) ? cfg.step : (typeof cfg === 'number' ? cfg : 1);
  const color = theme.gridColor || '#cbd5e1';
  const majorC = theme.gridMajor || (typeof cfg === 'object' && cfg.major) || color;
  const minor = (typeof cfg === 'object' && cfg.minor) ? cfg.minor : null;
  const out = [];
  // 마이너 그리드
  if (minor) {
    const mcol = theme.gridColor || color;
    const startX = Math.floor(world.xmin / minor) * minor;
    const startY = Math.floor(world.ymin / minor) * minor;
    for (let x = startX; x <= world.xmax + 1e-9; x += minor) {
      out.push(node('path', { ops: [{ op: 'M', x, y: world.ymin }, { op: 'L', x, y: world.ymax }], z: -11, style: { color: mcol, stroke: 0.4 } }));
    }
    for (let y = startY; y <= world.ymax + 1e-9; y += minor) {
      out.push(node('path', { ops: [{ op: 'M', x: world.xmin, y }, { op: 'L', x: world.xmax, y }], z: -11, style: { color: mcol, stroke: 0.4 } }));
    }
  }
  // 메이저 그리드 (step 배수에만, 원점 축은 생략해 깔끔하게)
  const startX = Math.ceil(world.xmin / step) * step;
  const startY = Math.ceil(world.ymin / step) * step;
  for (let x = startX; x <= world.xmax + 1e-9; x += step) {
    if (Math.abs(x) < step * 1e-6) continue;
    out.push(node('path', { ops: [{ op: 'M', x, y: world.ymin }, { op: 'L', x, y: world.ymax }], z: -10, style: { color: majorC, stroke: 0.6 } }));
  }
  for (let y = startY; y <= world.ymax + 1e-9; y += step) {
    if (Math.abs(y) < step * 1e-6) continue;
    out.push(node('path', { ops: [{ op: 'M', x: world.xmin, y }, { op: 'L', x: world.xmax, y }], z: -10, style: { color: majorC, stroke: 0.6 } }));
  }
  return out;
}

function squareWorld(world) {
  const half = Math.max(Math.abs(world.xmin), Math.abs(world.xmax), Math.abs(world.ymin), Math.abs(world.ymax)) * 1.2;
  return { xmin: -half, xmax: half, ymin: -half, ymax: half };
}

function polarGridIR(world, theme) {
  const color = theme.gridColor || '#cbd5e1';
  const axisC = theme.axisColor || '#34495e';
  const tcol = theme.tickColor || axisC;
  // 원점에서 각 변까지의 최소 거리 = 확실히 보이는 반지름.
  const fitR = Math.min(Math.max(Math.abs(world.xmin), Math.abs(world.xmax)), Math.max(Math.abs(world.ymin), Math.abs(world.ymax)));
  const maxR = fitR * 0.9;         // 그리드가 화면 안에 들어오도록
  const step = maxR / 4;
  const out = [];
  const pad = maxR * 0.06;
  // 동심원 + 반지름 눈금 숫자
  for (let r = step; r <= maxR + 1e-9; r += step) {
    out.push(node('circle', { cx: 0, cy: 0, r, z: -10, style: { color, stroke: 0.6 } }));
    out.push(node('text', { x: r + pad, y: 0, text: fmtTick(r), anchor: 'start', font: 11, color: tcol, z: -9 }));
  }
  // 방사선(각도선) + 각도 숫자
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * i) / 6;
    out.push(node('path', { ops: [{ op: 'M', x: 0, y: 0 }, { op: 'L', x: Math.cos(a) * maxR, y: Math.sin(a) * maxR }], z: -10, style: { color, stroke: 0.6 } }));
  }
  // 각도 라벨 — 0 과 π 만. 화면 오프셋은 px(dyPx)로.
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * i) / 6;
    if (i % 6 !== 0) continue;
    const txt = i === 0 ? '0' : 'π';
    const lr = maxR * 1.06;   // fitR 안쪽
    out.push(node('text', { x: Math.cos(a) * lr, y: Math.sin(a) * lr, dxPx: 0, dyPx: 4, text: txt, anchor: 'middle', font: 11, color: tcol, z: -9 }));
  }
  // 축 (x, y) — 원점을 지나는 주요 축 강조
  out.push(node('path', { ops: [{ op: 'M', x: -maxR, y: 0 }, { op: 'L', x: maxR, y: 0 }], z: -5, style: { color: axisC, stroke: 1 } }));
  out.push(node('path', { ops: [{ op: 'M', x: 0, y: -maxR }, { op: 'L', x: 0, y: maxR }], z: -5, style: { color: axisC, stroke: 1 } }));
  return out;
}

/** F2 — 구면격자: 위선 + 경선을 원점 중심 반지름 R 구에 투영 */
function sphericalGridIR(world, project, theme) {
  const color = theme.gridColor || '#cbd5e1';
  const R = 1.6;
  const out = [];
  const ring = (pts) => node('path', { ops: pts.map((p, i) => ({ op: i ? 'L' : 'M', x: p[0], y: p[1] })), z: -10, style: { color, stroke: 0.5 } });
  const projectPts = (pts) => pts.map((p) => project(p));
  // 위선 (latitude)
  for (let k = 1; k < 8; k++) {
    const phi = (Math.PI * k) / 8;
    const pts = [];
    for (let i = 0; i <= 48; i++) { const th = (2 * Math.PI * i) / 48; pts.push([R * Math.sin(phi) * Math.cos(th), R * Math.sin(phi) * Math.sin(th), R * Math.cos(phi)]); }
    out.push(ring(projectPts(pts)));
  }
  // 경선 (longitude)
  for (let k = 0; k < 12; k++) {
    const th = (Math.PI * k) / 6;
    const pts = [];
    for (let i = 0; i <= 48; i++) { const phi = (2 * Math.PI * i) / 48; pts.push([R * Math.sin(phi) * Math.cos(th), R * Math.sin(phi) * Math.sin(th), R * Math.cos(phi)]); }
    out.push(ring(projectPts(pts)));
  }
  return out;
}

function axesIR(world, cfg, theme) {
  const out = [];
  const c = theme.axisColor || '#444';
  const tcol = theme.tickColor || theme.labelColor || c;
  const spanX = world.xmax - world.xmin;
  const spanY = world.ymax - world.ymin;
  const padWorld = Math.max(spanX, spanY) * 0.02;

  const xLabel = (cfg === true || !cfg.x || cfg.x.label === undefined || cfg.x.label === true) ? (cfg && cfg.x && typeof cfg.x.label === 'string' ? cfg.x.label : 'x') : null;
  const yLabel = (cfg === true || !cfg.y || cfg.y.label === undefined || cfg.y.label === true) ? (cfg && cfg.y && typeof cfg.y.label === 'string' ? cfg.y.label : 'y') : null;
  const xStep = niceStep(world.xmin, world.xmax, cfg && cfg.x && cfg.x.tick ? cfg.x.tick : undefined);
  const yStep = niceStep(world.ymin, world.ymax, cfg && cfg.y && cfg.y.tick ? cfg.y.tick : undefined);
  const showTick = (cfg === true || cfg === undefined || cfg === 1 || cfg.x === undefined || cfg.x.ticks === undefined) ? true : !!cfg.x.ticks;

  // P1-1: 축의 위치를 world 로 정하되, 라벨이 화면 밖으로 나가지 않도록 가장자리에서 안쪽으로 inset.
  const marginY = spanY * 0.06;
  const marginX = spanX * 0.06;
  let axisY = (world.ymin <= 0 && 0 <= world.ymax) ? 0 : (world.ymin + marginY);
  axisY = Math.min(Math.max(axisY, world.ymin + marginY), world.ymax - marginY);
  let axisX = (world.xmin <= 0 && 0 <= world.xmax) ? 0 : (world.xmin + marginX);
  axisX = Math.min(Math.max(axisX, world.xmin + marginX), world.xmax - marginX);

  // ── x 축 (y = axisY 인 가로선) ──
  out.push(node('path', { ops: [{ op: 'M', x: world.xmin, y: axisY }, { op: 'L', x: world.xmax, y: axisY }], z: -6, style: { color: c, stroke: 1.1 } }));
  if (showTick) {
    for (let x = Math.ceil(world.xmin / xStep) * xStep; x <= world.xmax + 1e-9; x += xStep) {
      if (x <= world.xmin + spanX * 0.01 || x >= world.xmax - spanX * 0.01) continue; // 경계 라벨 제외(클립 방지)
      const nearOrigin = Math.abs(x - axisX) < xStep * 1e-6;
      out.push(node('path', { ops: [{ op: 'M', x, y: axisY - padWorld * 0.6 }, { op: 'L', x, y: axisY + padWorld * 0.6 }], z: -5, style: { color: tcol, stroke: 1 } }));
      // 화면 오프셋은 px(dyPx)로 — world 단위 오프셋 금지(증거 A 재발 방지).
      if (!nearOrigin) out.push(node('text', { x, y: axisY, dxPx: 0, dyPx: 16, text: fmtTick(x), anchor: 'middle', font: 12, italic: false, color: tcol, z: -5 }));
    }
  }
  if (xLabel) out.push(node('text', { x: world.xmax, y: axisY, dxPx: 0, dyPx: 18, text: String(xLabel), anchor: 'end', font: 13, italic: true, color: c, z: -4 }));

  // ── y 축 (x = axisX 인 세로선) ──
  out.push(node('path', { ops: [{ op: 'M', x: axisX, y: world.ymin }, { op: 'L', x: axisX, y: world.ymax }], z: -6, style: { color: c, stroke: 1.1 } }));
  if (showTick) {
    for (let y = Math.ceil(world.ymin / yStep) * yStep; y <= world.ymax + 1e-9; y += yStep) {
      if (y <= world.ymin + spanY * 0.01 || y >= world.ymax - spanY * 0.01) continue; // 경계 라벨 제외(클립 방지)
      const nearOrigin = Math.abs(y - axisY) < yStep * 1e-6;
      out.push(node('path', { ops: [{ op: 'M', x: axisX - padWorld * 0.6, y }, { op: 'L', x: axisX + padWorld * 0.6, y }], z: -5, style: { color: tcol, stroke: 1 } }));
      if (!nearOrigin) out.push(node('text', { x: axisX, y, dxPx: -8, dyPx: 4, text: fmtTick(y), anchor: 'end', font: 12, italic: false, color: tcol, z: -5 }));
    }
  }
  if (yLabel) out.push(node('text', { x: axisX, y: world.ymax, dxPx: -6, dyPx: 0, text: String(yLabel), anchor: 'end', font: 13, italic: true, color: c, z: -4 }));

  // 원점 "0" — 두 축이 모두 view 안일 때만.
  if ((world.ymin <= 0 && 0 <= world.ymax) && (world.xmin <= 0 && 0 <= world.xmax) && showTick) {
    out.push(node('text', { x: axisX, y: axisY, dxPx: -6, dyPx: 16, text: '0', anchor: 'end', font: 12, italic: false, color: tcol, z: -4 }));
  }
  return out;
}

/** 축 단위에 어울리는 눈금 간격 (Nice Number: 1·2·5 × 10^k) */
/** 3D 축라인 — x(빨) y(초) z(파) 를 원점으로, 눈금 + 라벨 */
function axes3IR(world, project, theme, cfg) {
  const out = [];
  if (!project) return out;
  // 축 길이: 세계(원점중심 project) 반경의 0.8 (여백 남겨 모서리 안 닿게)
  const radius = Math.max((world.xmax - world.xmin), (world.ymax - world.ymin)) / 2;
  const R = radius * 0.8;
  const axis = {
    x: { color: '#d62728' }, y: { color: '#2ca02c' }, z: { color: '#1f77b4' },
  };
  const step = niceStep(-R, R, cfg && cfg.tick ? cfg.tick : undefined);

  for (const [name, a] of Object.entries(axis)) {
    const idx = 'xyz'.indexOf(name);
    const neg = [0, 0, 0], pos = [0, 0, 0];
    neg[idx] = -R; pos[idx] = R;
    const pn = project(neg), pp = project(pos);
    out.push(node('path', { ops: [{ op: 'M', x: pn[0], y: pn[1] }, { op: 'L', x: pp[0], y: pp[1] }], z: -6, style: { color: a.color, stroke: 1.4 } }));
    // 축 방향 단위 벡터(오프셋 계산)
    const L = Math.hypot(pp[0] - pn[0], pp[1] - pn[1]) || 1;
    const ux = (pp[0] - pn[0]) / L, uy = (pp[1] - pn[1]) / L;
    // 양(+)축에만 눈금 (원점 지나며, 오프셋은 world 단위로 소량)
    for (let t = 0; t <= R + 1e-9; t += step) {
      if (Math.abs(t) < step * 1e-6) continue;
      const pt = [0, 0, 0]; pt[idx] = t;
      const p = project(pt);
      out.push(node('text', { x: p[0] + ux * 0.12, y: p[1] - uy * 0.12, text: fmtTick(t), font: 10, color: a.color, z: -5 }));
    }
    // 축 라벨은 끝점 살짝 위 (world 단위)
    out.push(node('text', { x: pp[0] + ux * 0.16, y: pp[1] - uy * 0.16, text: name, font: 13, italic: true, color: a.color, z: -4 }));
  }
  return out;
}

function niceStep(min, max, fixed) {
  if (fixed && fixed > 0) return fixed;
  const span = (max - min) || 1;
  const raw = span / 10;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / pow;
  let nice;
  if (frac < 1.5) nice = 1;
  else if (frac < 3.5) nice = 2;
  else if (frac < 7.5) nice = 5;
  else nice = 10;
  return nice * pow;
}
function fmtTick(v) {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e6 || (a > 0 && a < 1e-3)) return v.toExponential(1);
  const r = Math.round(v * 100) / 100;
  return String(r % 1 === 0 ? Math.round(r) : r);
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
  // [screenX, screenY, depth] — depth 는 시선(forward) 방향 거리(클수록 멀다).
  // 3D 도형은 이 depth 로 painter's algorithm 정렬에 쓴다(P4-1).
  return (pos) => {
    const d = sub(pos, eye);
    return [dot(d, rn), dot(d, u), dot(d, fn)];
  };
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