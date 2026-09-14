// `logos` 공개 API — docs/spec/DSL.md §14 구조의 진입점
// 구현된 모듈과, 아직 미구현(스텁) 모듈을 함께 노출한다.
import { Scene } from './core/scene.js';
import { panels } from './backend/scene-ir.js';
import { node } from './core/node.js';
import { Drawable } from './core/drawable.js';
import { point, Point, toPoint } from './shapes/point.js';
import { vector, Vector } from './shapes/vector.js';
import { line, Line } from './shapes/line.js';
import { segment, Segment } from './shapes/segment.js';
import { curve, Curve } from './shapes/curve.js';
import { circle, Circle } from './shapes/circle.js';
import { ellipse, Ellipse } from './shapes/ellipse.js';
import { parabola, Parabola } from './shapes/parabola.js';
import { hyperbola, Hyperbola } from './shapes/hyperbola.js';
import { polygon, triangle, quad, regular, square, Polygon } from './shapes/polygon.js';
import { rectangle, Rectangle } from './shapes/rectangle.js';
import { region, Region } from './shapes/region.js';
import { vectorField, VectorField } from './shapes/vectorfield.js';
import { sphere, plane, Sphere, Plane } from './shapes/threeD.js';
import {
  cylinder,
  cone,
  surface,
  polyhedron,
  vectorField3,
  Cylinder,
  Cone,
  Surface,
  Polyhedron,
} from './shapes/threeD2.js';
import { curve3, arrow3, surfaceParam, axes3, quadrics, circle3, frame3, Curve3 } from './shapes/threeD3.js';
import { cmapColor, shade } from './shapes/threeD3.js';
import { arcCore, sectorCore, rayCore, ArcShape, RayShape } from './shapes/arc.js';
import {
  cube as cubeCore,
  prism as prismCore,
  pyramid as pyramidCore,
  torus as torusCore,
  surfaceExtra,
  CustomPolyhedron,
} from './shapes/solids.js';
import { mat, vec, Matrix } from './linalg.js';
import { cplx, Complex } from './complex.js';
import transform from './transform.js';
import annotate from './annotate.js';
import { tex } from './symbolic/tex.js';
import { Sym } from './symbolic/sym.js';
import { xy, range, view } from './core/template.js';
import { TAU } from './solver/coords.js';
import { TYPE as typography } from './backend/fonts.js';
// ── docs/extend/ADAPT.md 외부엔진 어댑터 ──────────────────────
import { SymPyAdapter, SageAdapter, createSymbolicAdapter, defaultAdapter } from './symbolic/adapter.js';
import irToAsymptote from './backend/asymptote.js';
import { tikzToSVG } from './backend/tikzjax.js';
import { irToJSXGraph, buildJSXGraphHTML } from './backend/jsxgraph.js';
import { katexRender, katexify } from './backend/katex.js';

// ── 플러그인 (체이너블 확장) ───────────────────────
//   `use(p)` 한 번이면 새 빌더·체이닝 메서드·IR 노드·테마·훅이 **코어 수정 없이** 붙는다.
//   `plugins` Proxy 로 등록된 이름을 즉석에서 부를 수도 있다(`plugins.ray(O, P)`).
import {
  use,
  plugins,
  PluginError,
  unknownFeature,
  lookupFactory,
  registerNamespaceObject,
  registerTarget,
} from './core/plugin.js';

export { use, plugins, PluginError };
export * as plugin from './core/plugin.js';

export const tau = TAU;
export const pi = Math.PI;
export const e = Math.E;

export {
  Scene,
  scene,
  panels,
  node,
  point,
  toPoint,
  vector,
  line,
  segment,
  curve,
  circle,
  ellipse,
  parabola,
  hyperbola,
  polygon,
  triangle,
  quad,
  regular,
  square,
  rectangle,
  region,
  vectorField,
  vectorField3,
  sphere,
  plane,
  cylinder,
  cone,
  surface,
  polyhedron,
  curve3,
  arrow3,
  surfaceParam,
  axes3,
  quadrics,
  circle3,
  frame3,
  cmapColor,
  shade,
  mat,
  vec,
  Matrix,
  cplx,
  Complex,
  transform,
  annotate,
  tex,
  Sym,
  typography,
  xy,
  range,
  view,
};

// 도형 클래스 — 플러그인 대상/`instanceof` 검사용 (`api.extend(Point, …)`)
export {
  Point,
  Vector,
  Line,
  Segment,
  Curve,
  Circle,
  Ellipse,
  Parabola,
  Hyperbola,
  Polygon,
  Rectangle,
  Region,
  VectorField,
  Sphere,
  Plane,
  Cylinder,
  Cone,
  Surface,
  Polyhedron,
  Curve3,
};
// 플러그인이 새 도형을 정의할 때 필요한 기반 클래스
export { Drawable };
// 라벨 값(Sym/문자열)을 그릴 문자열로 — 커스텀 도형의 toIR 에서 코어와 동일하게 사용
export { renderText } from './core/drawable.js';

// ── 예제/스케치 공용 작성 키트 (kit.js) ─────────────
//   palette · plot2d · plot3d · subplots · saveFigure · saveFigures · writeGallery · seg · poly3
//   사용: `import { kit } from '@jaywoo0830a/logos'; const { plot3d, palette } = kit;`
export * as kit from './kit.js';

// ── docs/extend/ADAPT.md 외부엔진 어댑터 API ───────────────────
export const adapt = {
  asymmetric: { SymPyAdapter, SageAdapter, createSymbolicAdapter, defaultAdapter },
  asymptote: irToAsymptote,
  tikzjax: tikzToSVG,
  jsxgraph: { irToJSXGraph, buildJSXGraphHTML },
  katex: { katexRender, katexify },
};

function scene() {
  return new Scene();
}
scene.cartesian = () => new Scene();

// ── 확장 지점: 플러그인이 우선, 없으면 코어 기본 구현 ──────────────
//   `ray`/`arc`/`sector`/`torus`/`cube`/`prism`/`pyramid` 는 **코어 기본 구현**을 가진다
//   (docs/spec/DSL.md 대로 동작). 플러그인이 `api.define('ray', …)` 로 등록하면 그쪽이 우선되고,
//   `arc.semicircle` 처럼 코어에 없는 하위 이름은 아래 힌트와 함께 등록을 안내한다.
/** 코어에도 플러그인에도 없는 이름의 힌트 — 등록 안내에 함께 실린다 */
const TODO_HINT = {
  ray: '코어 기본값은 ray(A,B) / ray.from(A).through(B) 입니다. 더 필요하면 플러그인으로 등록하세요.',
  arc: '코어 기본값은 arc.circular / ofCircle / through / circle 입니다.',
  sector: '코어 기본값은 sector.ofCircle(c).angle(θ) / sector.circular(O,r,a0,a1) 입니다.',
  torus: '코어 기본값은 torus.center(O).radii(R, r) 입니다.',
  cube: '코어 기본값은 cube.center(O).edge(e) 입니다.',
  prism: '코어 기본값은 prism.base(polygon).height(h) 입니다.',
  pyramid: '코어 기본값은 pyramid.base(polygon).apex(P) 입니다.',
};

/** 레지스트리 우선 호출 — `api.define` 으로 등록된 이름이면 그것을 쓴다 */
function dispatch(name, args, fallback) {
  const f = lookupFactory(name);
  if (f) return f(...args);
  if (typeof fallback === 'function') return fallback(...args);
  const hint = TODO_HINT[name] || '';
  throw unknownFeature(name, hint);
}

/**
 * 네임스페이스형 스텁 — `arc.circular(...)` 처럼 하위 이름까지 레지스트리에서 찾는다.
 * 플러그인이 등록하면 **플러그인이 우선**하고, 없으면 코어 기본 구현(`core`)을 쓴다.
 */
function ns(name, hint, core) {
  const missing = (k) => () => {
    throw unknownFeature(`${name}.${k}`, hint || '');
  };
  const pick = (k) => {
    const hit = lookupFactory(`${name}.${k}`);
    if (hit) return (...a) => lookupFactory(`${name}.${k}`)(...a);
    if (core && typeof core[k] === 'function') return (...a) => core[k](...a);
    return missing(k);
  };
  return new Proxy(function () {}, {
    get: (_, k) => {
      if (k === '$$') return true;
      return pick(k);
    },
    apply: () => {
      const hit = lookupFactory(name);
      if (hit) return hit();
      if (typeof core === 'function') return core();
      throw unknownFeature(name, hint || '');
    },
  });
}

/** 플러그인 우선 + 코어 기본값(ray.from 등) */
const withFallback = (name, coreFn) =>
  Object.assign(
    (...a) => dispatch(name, a, coreFn),
    Object.fromEntries(
      Object.keys(coreFn).map((k) => [k, (...a) => (lookupFactory(`${name}.${k}`) || coreFn[k])(...a)]),
    ),
  );

export const ray = withFallback('ray', rayCore);
export const arc = ns('arc', TODO_HINT.arc, arcCore);
export const sector = ns('sector', TODO_HINT.sector, sectorCore);
export const torus = ns('torus', TODO_HINT.torus, torusCore);
export const cube = ns('cube', TODO_HINT.cube, cubeCore);
export const prism = ns('prism', TODO_HINT.prism, prismCore);
export const pyramid = ns('pyramid', TODO_HINT.pyramid, pyramidCore);

// 코어 기본값으로 문서 API 를 채운다(플러그인이 등록하면 그쪽이 우선한다).
Object.assign(surface, surfaceExtra); // surface.of / surface.ruled / surface.implicit
polyhedron.vertices = (...pts) =>
  new CustomPolyhedron({
    vertices: pts
      .map((p) => (Array.isArray(p) ? p : (p.coords ?? [0, 0, 0])))
      .map((c) => [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0]),
  });

// ── 플러그인 네임스페이스 공개 ─────────────────────
//   `api.static('point', 'hex', fn)` / `api.static('annotate', …)` 가 동작하도록
//   팩토리 함수들을 네임스페이스로 등록한다(코어 → 플러그인 방향의 확장 지점).
for (const [n, f] of Object.entries({
  point,
  curve,
  circle,
  line,
  segment,
  vector,
  ellipse,
  parabola,
  hyperbola,
  polygon,
  triangle,
  quad,
  regular,
  square,
  rectangle,
  region,
  vectorField,
  sphere,
  plane,
  cylinder,
  cone,
  surface,
  polyhedron,
  curve3,
  arrow3,
  surfaceParam,
  axes3,
  quadrics,
  circle3,
  frame3,
  mat,
  vec,
  cplx,
  transform,
  annotate,
  tex,
}))
  registerNamespaceObject(n, f);

// 도형 클래스도 플러그인 대상으로 공개 — `api.extend('curve', …)` · `api.extend('point', …)`.
// ('drawable' 은 모든 도형, 'scene' 은 씬. 클래스 이름으로 부분 확장도 가능하다.)
for (const [n, c] of Object.entries({
  point: Point,
  curve: Curve,
  circle: Circle,
  line: Line,
  segment: Segment,
  vector: Vector,
  ellipse: Ellipse,
  parabola: Parabola,
  hyperbola: Hyperbola,
  polygon: Polygon,
  rectangle: Rectangle,
  region: Region,
  vectorField: VectorField,
  sphere: Sphere,
  plane: Plane,
  cylinder: Cylinder,
  cone: Cone,
  surface: Surface,
  polyhedron: Polyhedron,
  curve3: Curve3,
}))
  registerTarget(n, c);

export default {
  scene,
  point,
  vector,
  line,
  segment,
  curve,
  circle,
  ellipse,
  parabola,
  hyperbola,
  polygon,
  triangle,
  quad,
  regular,
  square,
  rectangle,
  region,
  vectorField,
  sphere,
  plane,
  cylinder,
  cone,
  surface,
  polyhedron,
  curve3,
  arrow3,
  surfaceParam,
  axes3,
  quadrics,
  circle3,
  frame3,
  transform,
  annotate,
  tex,
  tau,
  pi,
  e,
  use,
  plugins,
  xy,
  range,
  view,
};
