// `logos` 공개 API — DSL.md §14 구조의 진입점
// 구현된 모듈과, 아직 미구현(스텁) 모듈을 함께 노출한다.
import { Scene } from './core/scene.js';
import { node } from './core/node.js';
import { point } from './shapes/point.js';
import { vector } from './shapes/vector.js';
import { line } from './shapes/line.js';
import { segment } from './shapes/segment.js';
import { curve } from './shapes/curve.js';
import { circle } from './shapes/circle.js';
import { polygon, triangle, quad, regular } from './shapes/polygon.js';
import { region } from './shapes/region.js';
import transform from './transform.js';
import annotate from './annotate.js';
import { tex } from './symbolic/tex.js';
import { Sym } from './symbolic/sym.js';
import { TAU } from './solver/coords.js';
// ── ADAPT.md 외부엔진 어댑터 ──────────────────────
import { SymPyAdapter, SageAdapter, createSymbolicAdapter, defaultAdapter } from './symbolic/adapter.js';
import irToAsymptote from './backend/asymptote.js';
import { tikzToSVG } from './backend/tikzjax.js';
import { irToJSXGraph, buildJSXGraphHTML } from './backend/jsxgraph.js';
import { katexRender, katexify } from './backend/katex.js';

export const tau = TAU;
export const pi = Math.PI;
export const e = Math.E;

export { Scene, scene, node, point, vector, line, segment, curve, circle,
         polygon, triangle, quad, regular, region, transform, annotate, tex, Sym };

// ── ADAPT.md 외부엔진 어댑터 API ───────────────────
export const adapt = {
  asymmetric: { SymPyAdapter, SageAdapter, createSymbolicAdapter, defaultAdapter },
  asymptote: irToAsymptote,
  tikzjax: tikzToSVG,
  jsxgraph: { irToJSXGraph, buildJSXGraphHTML },
  katex: { katexRender, katexify },
};

function scene() { return new Scene(); }
scene.cartesian = () => new Scene();

// ── 미구현 도형 (사용 시 명확한 안내) ──────────────
function todo(name, hint = '') {
  return () => { throw new Error(`logos: ${name} is not implemented yet. ${hint}`); };
}
function ns(name, hint) { return new Proxy({}, { get: (_, k) => (k === '$$' ? true : todo(`${name}.${k}`, hint)) }); }

export const ray = todo('ray', '직선(line) 등으로 대체하세요.');
export const arc = ns('arc', '원호. circle 위에서 표현하세요.');
export const sector = ns('sector');
export const ellipse = ns('ellipse');
export const parabola = ns('parabola');
export const hyperbola = ns('hyperbola');
export const plane = ns('plane');
export const sphere = ns('sphere');
export const cylinder = ns('cylinder');
export const cone = ns('cone');
export const torus = ns('torus');
export const surface = ns('surface');
export const curve3 = ns('curve3');
export const polyhedron = ns('polyhedron');
export const cube = ns('cube');
export const prism = ns('prism');
export const pyramid = ns('pyramid');
export const vectorField = ns('vectorField');

export default {
  scene, point, vector, line, segment, curve, circle, polygon, triangle,
  quad, regular, region, transform, annotate, tex, tau, pi, e,
};