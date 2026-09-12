# `logos` — DSL 정의서 v0.2 (Pure JS)

> Node.js ESM. TypeScript 없음. JSDoc으로 힌트만 제공. 2D · 3D · Polar · Spherical · Cylindrical 전부 1급 지원. 렌더링은 **출판사 교과서 / 논문 figure 수준**을 목표.

---

## 0. 왜 Pure JS로 가도 되는가

- 타입은 **런타임 스키마 + JSDoc** 으로 커버 (`@typedef`)
- 도형 종류가 많아도 **모두 `Drawable` 프로토콜 하나**만 따르면 됨
- 심볼릭은 compute-engine이 AST를 이미 관리 → JS에서 그대로 사용
- IDE 자동완성은 JSDoc + `jsconfig.json`의 `checkJs: true` 로 90% 확보

```json
// jsconfig.json
{
  "compilerOptions": {
    "checkJs": true,
    "target": "ES2022",
    "module": "NodeNext",
    "strict": false
  }
}
```

---

## 1. 좌표계 (Coordinate System) — 1급 시민

좌표계는 **씬에 붙는 속성**이 아니라 **점이 스스로 아는 속성**이다. 이게 핵심.

```js
import { point, scene } from '@jaywoo0830a/logos';

// ── Cartesian ────────────────────────────
point(1, 2)                              // 2D
point(1, 2, 3)                           // 3D
point.xyz(1, 2, 3)

// ── Polar (2D) ───────────────────────────
point.polar(2, Math.PI / 3)              // r, θ
point.polar(2, '60°')                    // 각도 문자열 허용
point.polar(2, tex`\frac{\pi}{3}`)       // 심볼릭 각도

// ── Cylindrical (3D) ─────────────────────
point.cylindrical(2, Math.PI/4, 3)       // r, θ, z

// ── Spherical (3D) ───────────────────────
point.spherical(1, Math.PI/4, Math.PI/2) // r, θ(azimuth), φ(polar)
point.spherical(1, '45°', '90°')

// ── 복소평면 ─────────────────────────────
point.complex(3, -4)                     // 3 - 4i

// ── 좌표계 변환 ─────────────────────────
const P = point.polar(2, Math.PI/3);
P.toCartesian();                          // point(1, √3)
P.toPolar();                              // { r: 2, theta: π/3 }

// ── 곡선도 좌표계를 안다 ────────────────
curve.polar(θ => 1 + Math.cos(θ))         // 극곡선
curve.cylindrical(t => [1, t, t])         // 원통곡선
curve.spherical(t => [1, t, t/2])         // 구면곡선
```

**씬 좌표계 vs 도형 좌표계**

```js
scene()
  .cartesian()        // 기본
  .polarGrid()        // 극좌표 눈금 (r 원 + θ 방사선)
  .add(
    curve.polar(θ => 2 * Math.cos(θ)),      // 도형은 자기 좌표계 유지
    curve.fn(x => x*x)                       // 데카르트 곡선도 함께
  );
```

씬은 **렌더링 좌표계**만 결정하고, 도형은 각자 좌표계를 유지한다. 컴파일 시점에 씬 좌표계로 정규화.

---

## 2. 2D / 3D / 혼합

```js
scene().dim(2)     // 2D 캔버스
scene().dim(3)     // 3D 카메라
scene().auto()     // 도형 보고 자동 결정
```

3D 씬에서 2D 도형을 넣으면:

```js
scene()
  .dim(3)
  .add(
    plane.coordinate('xy'),               // z=0 평면
    circle.center(O).radius(1),           // 자동으로 z=0 평면 위에 놓임
    point(0, 0, 1).label('P')             // 3D 점
  );
```

`circle`은 원래 2D 도형이지만, 3D 씬에서 특정 평면 위에 배치된다. 평면은 `.on(plane)` 으로 명시 가능.

```js
circle.center(O).radius(1).on(plane.coordinate('xy'));
circle.center(O).radius(1).on(plane.normal(vector(1,1,1)));
```

---

## 3. Drawable 프로토콜 (모든 도형 공통)

```js
/**
 * @typedef {Object} Drawable
 * @property {function(string): Drawable} color
 * @property {function(number): Drawable} stroke
 * @property {function(string): Drawable} fill
 * @property {function(number|number[]): Drawable} dash
 * @property {function(number): Drawable} opacity
 * @property {function(number): Drawable} z
 * @property {function(string, Object=): Drawable} label
 * @property {function(string): Drawable} as
 * @property {function(...Transform): Drawable} apply
 * @property {function(Sym): Drawable} symbolic
 */
```

모든 도형이 이걸 구현한다. 점이든, 적분 주석이든, 벡터장이든.

### 3.1 확장 — 코어를 고치지 않는 체이너블 플러그인

프로토콜은 **닫힌 목록이 아니다.** 사용자가 새 메서드·새 도형·새 IR 노드를 붙일 수 있고,
그것도 코어 파일 수정 없이 된다 → [`PLUGIN.md`](PLUGIN.md).

```js
import { point, use } from '@jaywoo0830a/logos';

use({ name: 'my-extras', install(api) {
  api.chain('drawable', { slope: (conf, m) => ({ slopeM: m }) });   // 모든 도형에 .slope()
  api.define('ray', (O, P) => new Ray(O, P), { ctor: Ray });        // logos.ray(…) 가 살아난다
  api.node('hatch', { svg: (n, ctx) => '…', tikz: (n) => '…' });    // 새 IR kind (백엔드 무수정)
}});

point(1, 2).slope(3).color('#c00').dot();     // 프로토콜 메서드와 섞여도 체인 유지
```

체이닝 규칙: 플러그인 메서드가 **패치 객체를 반환하면 자동 `this.set(patch)`**(불변 복제),
**Drawable 을 반환하면 그대로 통과**, 아무것도 반환하지 않으면 `this`.

---

## 4. 도형 카탈로그 (2D · 3D · 좌표계)

### 4.1 점

```js
point(1, 2)
point.origin()
point.polar(2, Math.PI/3)
point.cylindrical(2, Math.PI/4, 3)
point.spherical(1, Math.PI/4, Math.PI/2)
point.complex(3, -4)

point.midpoint(A, B)
point.centroid(A, B, C)
point.circumcenter(A, B, C)
point.incenter(tri)
point.orthocenter(tri)
point.foot(P).onto(l)
point.reflect(P).over(l)
point.reflect(P).over(plane)
point.intersect(l1, l2)
point.intersectAll(circle, line)
point.on(curve, 0.3)
```

### 4.2 벡터

```js
vector(3, 4)
vector.between(A, B)
vector.unit(Math.PI/6)
vector.normal(A, B, C)
vector.gradient(f).at(P)
vector.curl(F).at(P)
vector.div(F).at(P)
```

### 4.3 선 · 선분 · 반직선

```js
line.through(A, B)
line.through(A).direction(v)
line.through(A).slope(2)
line.slopeIntercept(2, -1)
line.intercepts(3, 4)
line.standard(2, 3, -6)
line.vertical(2)
line.horizontal(3)

line.perpendicular(l).through(P)
line.parallel(l).through(P)
line.angleBisector(A, B, C)
line.tangent(circle).at(P)
line.tangent(circle).slope(2)
line.polar(circle, P)
line.commonTangent(c1, c2)

segment(A, B)
segment.ofLength(5).from(A).angle(Math.PI/4)
segment.bisector(A, B)

ray.from(A).through(B)
ray.from(A).direction(Math.PI/3)
```

### 4.4 곡선 (함수 · 파라메트릭 · 극 · 암시적)

```js
curve.fn(x => x*x).on([-3, 3])
curve.fn(tex`\sin(x) + \frac{1}{2}`)         // 심볼릭
curve.parametric(t => [Math.cos(t), Math.sin(t)]).on([0, tau])
curve.polar(θ => 1 + Math.cos(θ)).on([0, tau])
curve.cylindrical(t => [1, t, t])
curve.spherical(t => [1, t, t/2])
curve.implicit((x, y) => x*x + y*y - 1)
curve.piecewise([[0, 1, f], [1, 2, g]])
curve.bezier(P0, P1, P2, P3)
curve.spline(pts).tension(0.5)
curve.ode({ dy: (x, y) => y, y0: 1 }).on([0, 10])
curve.taylor(f, { at: 0, order: 5 })

// 곡선 위 파생
curve.tangentAt(t)
curve.normalAt(t)
curve.arcLength({ from: 0, to: 1 })
curve.curvature(t)
```

### 4.5 원 · 호 · 부채꼴

```js
circle.center(O).radius(3)
circle.center(O).through(P)
circle.center(O).diameter(A, B)
circle.through(A, B, C)
circle.inscribed(tri)
circle.excircle(tri, 'a')
circle.unit()

arc.ofCircle(c).from(A).to(B)
arc.through(A, B, C)
arc.circle(O, 3).from(0).to(Math.PI/2).cw()

sector.ofCircle(c).angle(θ)
```

### 4.6 원뿔곡선

```js
ellipse.center(O).semi(3, 2)
ellipse.center(O).semiMajor(5).eccentricity(0.6)
ellipse.foci(F1, F2).major(10)
ellipse.directrix(l).eccentricity(0.5)

parabola.focus(F).directrix(l)
parabola.vertex(V).focus(F)
parabola.polynomial(1, 0, 0)

hyperbola.center(O).semi(3, 2)
hyperbola.foci(F1, F2).distance(10)
```

### 4.7 다각형 · 영역

```js
polygon(A, B, C, D)
triangle(A, B, C)
triangle.equilateral(B, C).above()
quad(A, B, C, D)
regular.polygon(O, 6, 1)
regular.star(5, 1, 0.4)
regular.tessellation('hex').on(region)

region.inside(circle)
region.below(curve)
region.between(f, g).on([0, 1])
region.inequality((x, y) => y <= x*x)
region.union(r1, r2)
region.difference(r1, r2)
region.intersect(r1, r2)
region.riemann(f).on([0, 2]).n(10).left()
```

### 4.8 3D — 평면 · 구 · 원기둥 · 원뿔 · 토러스 · 곡면 · 다면체

```js
plane.through(A, B, C)
plane.pointNormal(A, n)
plane.normal(n).offset(d)
plane.coordinate('xy')
plane.standard(a, b, c, d)

sphere.center(O).radius(2)
sphere.center(O).through(P)
sphere.through(A, B, C, D)
sphere.unit()
sphere.center(O).radius(2).rings(3)        // 위선(가로 원) 개수 — 기본 7, rings(false)면 실루엣만
sphere.center(O).radius(2).meridians(4)    // 경선(세로 반원) 개수 — 기본 0(안 그림)

cylinder.axis(l).radius(1)
cylinder.center(O).axis(v).radius(1).height(5)

cone.vertex(V).axis(v).angle(Math.PI/6)
cone.vertex(V).axis(v).radius(2).height(4)

torus.center(O).radii(2, 0.5)

surface.of((u, v) => [u, v, u*u - v*v]).on([-2,2], [-2,2])
surface.z((x, y) => x*x - y*y).on([-2,2], [-2,2])
surface.implicit((x, y, z) => x*x + y*y + z*z - 1)
surface.revolution(curve).about(axis)
surface.ruled(c1, c2)

curve3.parametric(t => [Math.cos(t), Math.sin(t), t]).on([0, 4*Math.PI])
curve3.through(points)

polyhedron.vertices(...).faces([[0,1,2],[0,1,3]])
polyhedron.platonic('tetra').circumradius(1)
polyhedron.platonic('dodeca')
cube.center(O).edge(2)
prism.base(polygon).height(3)
pyramid.base(polygon).apex(P)

vectorField((x, y, z) => [.., .., ..]).on(region)
```

### 4.9 변환

```js
transform.rotate(Math.PI/6).about(O)
transform.rotate(Math.PI/6).about(axis)      // 3D
transform.scale(2).about(O)
transform.scale(1, 2)
transform.translate(3, -1)
transform.translate(3, -1, 2)                // 3D
transform.reflect.over(l)
transform.reflect.over(plane)
transform.shear(0.5)
transform.homothety(O, 2)
transform.matrix([[1,2],[3,4]])
transform.compose(t1, t2)

triangle(A, B, C).apply(transform.rotate(Math.PI/4).about(O));
```

### 4.10 주석

```js
annotate.angle(A, B, C).arc({ radius: 22, double: true }).label('θ').degrees()
annotate.angle({ from: A, vertex: B, to: C }).arc({ radius: 22 })   // 같은 각 — 이름 지정형
annotate.angle(A, B, C).rightAngle()          // 꼭짓점 B 에 두 광선이 그려져 있어야 표식이 제자리
// (발이 화살표 끝을 넘어가는 정사영 등은 안 그려진 쪽 선을 연장해 '모서리'로 만든 뒤 표시)
annotate.dimension(A, B).offset(24).label('5').units('cm')
annotate.tick(segment(A, B)).count(2)
annotate.arrow(A, B).label('v')
annotate.arrow(A, B).bend(0.3)                // 곡선 화살표 (mpl annotate arc3,rad) — 순환 표시
                                              // rad>0 = 진행 방향 오른쪽으로 휨, 촉은 path 끝
annotate.brace(curve).label('arc')
annotate.shade(region).color('steelblue').opacity(.3)
annotate.dot(P).label('A')
annotate.integral(f).from(0).to(2).shade('steelblue').label(tex`\frac{8}{3}`)
annotate.limit(f, x, 0).label('L')
annotate.legend()
annotate.caption('그림 1. 원과 접선')
```

---

## 5. 씬 (Scene)

```js
const fig = scene()
  // 좌표계
  .dim(3)                                        // 또는 .dim(2) / .auto()
  .view([-5, 5], [-5, 5], [-5, 5])
  .equal()
  .axes({ x: { label: 'x', ticks: 1 }, y: { label: 'y' } })
  .grid({ step: 1, minor: 0.5 })
  .polarGrid()                                   // 극좌표 눈금
  // 눈금·격자·축선은 **데이터 영역 안쪽에만** 그려진다.
  // 제목·xlabel·ylabel 은 그 바깥 여백에 배치되므로 서로 겹치지 않는다(7차 수정).
  .sphericalGrid()                               // 3D 구면 격자

  // 3D 카메라
  .camera({
    position: [5, 5, 5],
    target: [0, 0, 0],
    up: [0, 0, 1],
    projection: 'perspective',   // 'orthographic' | 'isometric' | 'cabinet'
    fov: 45,
  })
  .orbit({ theta: 0.6, phi: 1.1 })

  // 조명
  .light({ type: 'ambient', intensity: 0.6 })
  .light({ type: 'directional', direction: [1, 1, 1], intensity: 0.4 })

  // 스타일
  .theme('textbook')
  .size(1200, 800)
  .dpi(300)                                       // 인쇄용
  .background('#ffffff')
  .font({ family: 'Latin Modern Math, STIX Two Math', size: 14 })

  // 도형
  .add(A, B, C)
  .addAll([tri, incircle, ann])
  .layer('under', axes)
  .layer('over', labels)

  .compile();

fig.toSVG();
fig.toPNG();
fig.toCanvas(ctx);
fig.toTikZ({ standalone: true });
fig.toPDF();                                      // 인쇄용 벡터
fig.toJSON();
fig.toReact();
```

---

## 6. 렌더링 품질 — "교과서가 싫어할 수준"

### 6.1 렌더러 스택

| 계층 | 기술 | 이유 |
|---|---|---|
| **기하 커널** | 자체 (2D) + `three.js` (3D) | 2D는 직접, 3D는 검증된 것 사용 |
| **경로 생성** | 자체 path builder | SVG/TikZ/PDF 동시 출력 |
| **텍스트/수식** | **KaTeX** (기본) → MathJax (fallback) | TeX 조판 품질 |
| **벡터 출력** | SVG → **PDF (pdf-lib)** | 인쇄 시 화질 |
| **래스터** | resvg (WASM) 또는 node-canvas | 300 DPI PNG |
| **TikZ** | 자체 emitter | 논문/책 직접 삽입 |

### 6.2 교과서급 디테일

```js
scene()
  .theme('textbook')     // 아래 프리셋 전부 활성화
```

**`textbook` 테마가 하는 일:**

- **스트로크**: hairline 방지, 인쇄 DPI에 맞춘 최소 0.4pt
- **폰트**: Latin Modern Math / STIX Two Math 우선, 폴백 STIXGeneral
- **수식**: 모든 `$...$` 자동 KaTeX 조판, baseline 정렬
- **화살표**: TikZ `Stealth` 스타일 화살촉 (기본 삼각형 아님)
- **점**: 옵션 — `dot`, `cross`, `open-circle`, `oplus`, `otimes`, `square`
- **합동 tick**: 각도·길이 합동 표시 자동 배치 (겹침 방지)
- **직각 표시**: 작은 정사각형, 변에 정렬
- **해칭**: 45° 대각선, 간격 DPI 인식
- **그림자**: 없음 (교과서 스타일), 3D는 soft shadow만
- **안티앨리어싱**: SVG는 브라우저에 위임, PNG는 4× 슈퍼샘플링 후 다운스케일
- **폰트 힌팅**: `text-rendering: geometricPrecision`

### 6.3 3D 품질

```js
scene()
  .camera({ projection: 'orthographic' })       // 수학 교과서는 보통 정사영
  .add(sphere.opacity(0.25))
  .add(plane.coordinate('xy').opacity(0.4))
  .add(curve3.intersect(sphere, plane).stroke(2.5).color('crimson'));
```

- **Hidden line removal**: 곡면 뒤 선 가리기 (depth buffer 기반)
- **Silhouette**: 실루엣 라인 자동 강조
- **Wireframe + fill**: 두 레이어 분리 가능
- **등고선 (contour)**: `surface.z(f).contours(10)`
- **벡터장**: 화살표 자동 스케일, 밀도 조절

### 6.4 TikZ 출력 예

```js
fig.toTikZ({ standalone: true });
```

출력:

```latex
\documentclass[tikz,border=2pt]{standalone}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\begin{document}
\begin{tikzpicture}[>=Stealth, line cap=round, line join=round]
  \draw[->] (-5,0) -- (5,0) node[right] {$x$};
  \draw[->] (0,-5) -- (0,5) node[above] {$y$};
  \draw[thick, crimson, smooth, samples=200, domain=-3:3]
    plot (\x, {\x*\x - 1}) node[right] {$f(x)=x^2-1$};
  \filldraw (1,0) circle (1.6pt) node[below right] {$(1,0)$};
  \draw[dashed] (1,0) -- (1,2);
  \fill[steelblue, opacity=0.3] (0,0) -- plot[domain=0:2] (\x, {\x*\x}) -- (2,0) -- cycle;
  \node at (1,-1) {$\displaystyle\int_0^2 x^2\,dx = \frac{8}{3}$};
\end{tikzpicture}
\end{document}
```

---

## 7. 심볼릭 (compute-engine 어댑터)

```js
import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();

export function tex(strings, ...values) {
  const latex = strings.reduce((a, s, i) => a + s + (values[i] ?? ''), '');
  return new Sym(latex);
}

class Sym {
  #ast = null;
  constructor(latex) { this.latex = latex; }

  get ast() {
    if (!this.#ast) this.#ast = ce.parse(this.latex);
    return this.#ast;
  }

  diff(v = 'x') {
    const d = ce.box(['D', this.ast.json, v]).evaluate();
    return new Sym(d.toLatex());
  }

  integrate({ from, to, var: v = 'x' } = {}) {
    const cmd = from !== undefined
      ? ['Integrate', this.ast.json, ['Tuple', v, from, to]]
      : ['Integrate', this.ast.json, v];
    return new Sym(ce.box(cmd).evaluate().toLatex());
  }

  simplify() { return new Sym(this.ast.simplify().toLatex()); }
  expand()   { return new Sym(this.ast.expand().toLatex()); }
  factor()   { return new Sym(this.ast.factor().toLatex()); }

  solve(v = 'x') {
    const r = ce.box(['Solve', this.ast.json, v]).evaluate();
    return (r.json ?? []).map(j => new Sym(ce.box(j).toLatex()));
  }

  substitute(map) {
    const m = Object.entries(map).map(([k, v]) => [k, toJson(v)]);
    return new Sym(ce.box(['ReplaceAll', this.ast.json, ['List', ...m]])
      .evaluate().toLatex());
  }

  toFunction(v = 'x') {
    const f = ce.box(['Function', [v], this.ast.json]);
    return (x) => Number(f.evaluate({ [v]: x }).numericValue ?? NaN);
  }

  toLatex() { return this.ast.toLatex(); }
  valueOf() { return Number(this.ast.N().numericValue ?? NaN); }
}

function toJson(v) {
  if (v instanceof Sym) return v.ast.json;
  return v;
}
```

---

## 8. 전체 예제 — 2D 교과서 그림

```js
import { scene, point, line, segment, curve, circle,
         annotate, region, tex, tau } from '@jaywoo0830a/logos';

// ── 심볼릭 ─────────────────────────────
const f  = tex`x^{2} - 1`;
const df = f.diff('x').simplify();            // 2x

// ── 도형 ───────────────────────────────
const A = point(-2, 3).label('A').dot();
const B = point(3, 8).label('B').dot();
const l = line.through(A, B).color('#334');

const F = curve.fn(f).on([-3, 3])
  .color('crimson').stroke(2)
  .label(`$f(x)=${f.toLatex()}$`);

const x0 = 1;
const y0 = f.toFunction('x')(x0);
const m  = df.toFunction('x')(x0);
const tangent = line.slopeIntercept(m, y0 - m * x0)
  .dash([5, 3]).color('#888');

// ── 씬 ─────────────────────────────────
const fig = scene()
  .dim(2)
  .view([-3, 4], [-2, 9])
  .equal()
  .axes({ x: { label: 'x', ticks: 1 }, y: { label: 'y' } })
  .grid({ step: 1, minor: 0.5 })
  .theme('textbook')
  .size(900, 700)
  .dpi(300)
  .add(
    F, tangent,
    A, B,
    point(x0, y0).dot().label('$(1,0)$'),
    annotate.integral(f).from(0).to(2).shade('steelblue')
      .label(tex`\displaystyle\int_0^2 x^2\,dx = \frac{8}{3}`),
    annotate.angle(A, point.origin(), B).arc().degrees().label('θ'),
  )
  .compile();

console.log(fig.toSVG());
console.log(fig.toTikZ({ standalone: true }));
```

---

## 9. 전체 예제 — 3D (구와 평면의 교)

```js
import { scene, point, plane, sphere, curve3, vector } from '@jaywoo0830a/logos';

const S  = sphere.center(point.origin()).radius(1).opacity(0.25);
const pl = plane.coordinate('xy').color('#999').opacity(0.5);

const fig = scene()
  .dim(3)
  .view([-2, 2], [-2, 2], [-2, 2])
  .equal()
  .axes({ label: true })
  .grid({ step: 1 })
  .sphericalGrid()
  .camera({
    position: [3, 3, 2],
    target: [0, 0, 0],
    projection: 'orthographic',
  })
  .light({ type: 'ambient', intensity: 0.7 })
  .light({ type: 'directional', direction: [1, 1, 1], intensity: 0.3 })
  .theme('textbook')
  .size(1000, 800)
  .add(S, pl, curve3.intersect(S, pl).stroke(2.5).color('crimson'))
  .compile();

fig.toSVG();
```

---

## 10. 전체 예제 — 극좌표 장미

```js
import { scene, curve, annotate, tau, tex } from '@jaywoo0830a/logos';

const rose = curve.polar(θ => Math.cos(3 * θ)).on([0, tau]);

const fig = scene()
  .dim(2)
  .view([-1.5, 1.5], [-1.5, 1.5])
  .equal()
  .polarGrid()
  .theme('textbook')
  .add(
    rose.stroke(1.8).color('#3b82f6').label(tex`r = \cos 3\theta`),
    annotate.angle(point.origin(),
                   point.polar(1, 0),
                   point.polar(1, Math.PI / 6)).arc().label(tex`\theta`),
  )
  .compile();

fig.toSVG();
```

---

## 11. API 요약 — 좌표계별 지원표

| 기능 | 2D Cartesian | Polar | 3D Cartesian | Cylindrical | Spherical | Complex |
|---|---|---|---|---|---|---|
| `point` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `vector` | ✅ | ✅ | ✅ | ✅ | ✅ | – |
| `line` | ✅ | ✅ (r, θ 형태) | ✅ | ✅ | ✅ | – |
| `curve` | ✅ | ✅ | ✅ | ✅ | ✅ | – |
| `circle` | ✅ | ✅ | ✅ (평면 위) | ✅ | ✅ | – |
| `ellipse` | ✅ | ✅ | – | – | – | – |
| `plane` | – | – | ✅ | ✅ | ✅ | – |
| `sphere` | – | – | ✅ | ✅ | ✅ | – |
| `cylinder` | – | – | ✅ | ✅ | ✅ | – |
| `cone` | – | – | ✅ | ✅ | ✅ | – |
| `torus` | – | – | ✅ | ✅ | ✅ | – |
| `surface` | – | – | ✅ | ✅ | ✅ | – |
| `polyhedron` | – | – | ✅ | – | – | – |
| `transform` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 12. 렌더러 파이프라인

```
 Builders (JS)
      │  불변 AST
      ▼
 Symbolic Layer (compute-engine)
      │  LaTeX ↔ MathJSON
      ▼
 Geometry Solver
      │  교점 · 접점 · 극선 · 파라메트릭 샘플링
      ▼
 Scene IR
      │  좌표계 정규화 · z-order · 스타일 병합
      ▼
 ┌────────┬────────┬────────┬────────┐
 │  SVG   │ TikZ   │  PDF   │ Canvas │
 │ emitter│ emitter│(pdf-lib)│(resvg) │
 └────────┴────────┴────────┴────────┘
```

**Geometry Solver가 담당하는 것**

- 2D ↔ 3D 자동 승격
- 좌표계 변환 (polar ↔ cartesian ↔ cylindrical ↔ spherical)
- 교점 / 접점 / 극선 계산
- 파라메트릭 곡선 adaptive sampling (곡률 기반)
- 심볼릭 값 유지 → TikZ 백엔드에서 `\sqrt{2}` 그대로
- 3D hidden line removal, silhouette 추출

---

## 13. 디자인 원칙 (재확인)

1. **왼쪽에서 오른쪽으로 읽힌다** — `circle.center(O).radius(3).label('C')`
2. **모든 것이 Drawable이다** — 점·주석·영역·벡터장까지 같은 프로토콜
3. **불변이 기본이다** — 모든 메서드는 새 노드 반환
4. **컴파일 전까지 lazy다** — 심볼릭 미분·적분도 `.compile()`에서 확정
5. **좌표계는 도형이 안다** — 씬은 렌더링만 결정
6. **LaTeX가 1급 시민** — `tex` 태그드 템플릿이 입구이자 출구
7. **IR 하나로 다중 백엔드** — TikZ(논문) · SVG(웹) · PDF(인쇄) · PNG(미리보기)
8. **품질은 기본값** — `theme('textbook')` 하나로 출판 수준
9. **코어는 훅만, 기능은 플러그인** — 없는 기능은 코어를 고치지 않고 `use(plugin)` 으로 붙인다.
   새 도형·체이닝 메서드·IR 노드·테마·백엔드 emitter 가 모두 등록 대상이다 ([`PLUGIN.md`](PLUGIN.md)).

---

이 정의를 그대로 `logos/` 디렉터리 구조로 옮기면:

```
logos/
  index.js
  core/
    drawable.js        # 프로토콜
    node.js            # 불변 AST
    scene.js
  shapes/
    point.js
    vector.js
    line.js
    segment.js
    curve.js           # fn, parametric, polar, cylindrical, spherical
    circle.js
    conic.js           # ellipse, parabola, hyperbola
    polygon.js
    region.js
    plane.js
    sphere.js
    cylinder.js
    cone.js
    torus.js
    surface.js
    curve3.js
    polyhedron.js
    vectorField.js
  transform.js
  annotate.js
  symbolic/
    sym.js             # compute-engine 어댑터
    tex.js             # 태그드 템플릿
  solver/
    intersect.js
    sample.js
    coords.js          # 좌표계 변환
    hidden.js          # 3D hidden line
  backend/
    svg.js
    tikz.js
    pdf.js
    canvas.js
    react.js
```

다음 단계로는 ① `core/drawable.js` + `core/node.js` 뼈대, ② `symbolic/sym.js` 어댑터, ③ `backend/svg.js` 최소 렌더러 — 이 셋을 먼저 구현하면 나머지는 도형별로 하나씩 추가하면 된다.