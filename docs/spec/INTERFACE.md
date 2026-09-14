# `logos` — 클라이언트 코드 미리보기

> "선생님이 칠판에 그리듯이, 저자는 원고지에 쓰듯이."
> 아래는 실제 사용자가 쓸 법한 코드들입니다. 타입·내부 구현은 안 보이고, 읽히는 것만 보입니다.

---

## 1. 첫 만남 — 점 하나 찍기

```js
import { scene, point } from '@jaywoo0830a/logos';

const A = point(1, 2).label('A').dot();

scene().axes().grid(1).add(A).compile().toSVG();
```

읽히는 그대로: "A라는 점을 (1,2)에 찍고, A라고 라벨 붙이고, 점으로 표시한다. 축과 격자 위에."

---

## 2. 중학교 — 삼각형의 내심

```js
import { scene, point, triangle, circle, segment, annotate } from '@jaywoo0830a/logos';

const A = point(0, 0).label('A').dot();
const B = point(5, 0).label('B').dot();
const C = point(1.5, 4).label('C').dot();

const tri = triangle(A, B, C).fill('#eef3ff').stroke(2);

scene()
  .equal()
  .axes()
  .theme('textbook')
  .add(
    tri,
    A,
    B,
    C,

    // 내심과 내접원
    circle.inscribed(tri).color('#e11').dash([4, 3]),

    // 각의 이등분선
    segment(A, point.incenter(tri)).dash([2, 2]).color('#888'),

    // 각도 표시
    annotate.angle(A, B, C).arc().degrees().label('α'),
    annotate.angle(B, C, A).arc().degrees().label('β'),
  )
  .compile()
  .toPNG({ dpi: 300 });
```

주석 하나 없이도 "선생님이 말로 설명하는 순서" 그대로 읽힙니다.

---

## 3. 고등학교 — 원과 접선

```js
import { scene, point, circle, line, segment, annotate, tex } from '@jaywoo0830a/logos';

const O = point.origin().label('O').dot();
const P = point(5, 0).label('P').dot();
const C = circle.center(O).radius(3);
const T = point.intersect(C, line.tangent(C).at(P));

scene()
  .view([-4, 6], [-4, 4])
  .equal()
  .axes()
  .theme('textbook')
  .add(
    C.stroke(2),
    O,
    P,
    T,

    // 접선과 반지름
    line.through(P, T).color('#c00'),
    segment(O, T).dash([3, 3]).color('#888'),

    // 직각 표시
    annotate.angle(O, T, P).rightAngle(),
    annotate
      .dimension(O, P)
      .label(tex`5`)
      .units('cm'),

    // 정리 설명
    annotate.caption(tex`OT \perp PT \;\Rightarrow\; PT = \sqrt{OP^2 - OT^2} = 4`),
  )
  .compile()
  .toTikZ({ standalone: true });
```

`tex` 태그드 템플릿은 LaTeX 그대로입니다. 수식은 KaTeX로 조판되고, TikZ로도 그대로 나갑니다.

---

## 4. 미적분 — 함수와 접선, 그리고 적분

```js
import { scene, point, line, curve, annotate, region, tex, tau } from '@jaywoo0830a/logos';

const f = tex`x^{2} - 1`;
const df = f.diff('x').simplify(); // 2x

const F = curve.fn(f).on([-3, 3]).color('crimson').stroke(2);
const T = line.tangent(F).at(1).dash([5, 3]).color('#666');

scene()
  .view([-3, 4], [-2, 9])
  .equal()
  .axes({ x: { label: 'x', ticks: 1 }, y: { label: 'y' } })
  .grid({ step: 1 })
  .theme('textbook')
  .add(
    F.label(tex`f(x) = x^2 - 1`),
    T,

    // 접점
    point
      .on(F, 1)
      .dot()
      .label(tex`(1, 0)`),

    // 리만합 영역
    region.riemann(f).on([0, 2]).n(8).left().fill('steelblue').opacity(0.35),

    // 정적분 결과
    annotate
      .integral(f)
      .from(0)
      .to(2)
      .label(tex`\int_0^2 f(x)\,dx = \tfrac{2}{3}`),
  )
  .compile()
  .toSVG();
```

`.diff()` `.simplify()`가 심볼릭이라는 게 코드에서 자연스럽게 읽힙니다.

---

## 5. 극좌표 — 장미 곡선

```js
import { scene, curve, annotate, tau, tex } from '@jaywoo0830a/logos';

scene()
  .equal()
  .polarGrid()
  .theme('textbook')
  .add(
    curve
      .polar((θ) => Math.cos(3 * θ))
      .on([0, tau])
      .stroke(2)
      .color('#3b82f6')
      .label(tex`r = \cos 3\theta`),

    curve
      .polar((θ) => Math.cos(3 * θ))
      .on([0, Math.PI / 2])
      .stroke(4)
      .color('#f59e0b')
      .opacity(0.6),
  )
  .compile();
```

극좌표계가 1급 시민이라 `curve.polar`가 특별 취급을 받지 않습니다. 데카르트 곡선과 똑같이 다룹니다.

---

## 6. 3D — 구와 평면의 교

```js
import { scene, point, sphere, plane, curve3, vector, tex } from '@jaywoo0830a/logos';

const O = point.origin();
const S = sphere.center(O).radius(1).opacity(0.25).color('#3b82f6');
const P = plane.coordinate('xy').opacity(0.4).color('#999');

scene()
  .dim(3)
  .view([-2, 2], [-2, 2], [-2, 2])
  .equal()
  .axes({ label: true })
  .sphericalGrid()
  .camera({ position: [3, 3, 2], projection: 'orthographic' })
  .light({ type: 'ambient', intensity: 0.7 })
  .theme('textbook')
  .add(
    S,
    P,
    curve3.intersect(S, P).stroke(2.5).color('crimson'),
    point(0, 0, 1)
      .dot()
      .label(tex`N`),
    annotate.caption(tex`S^2 \cap \{z = 0\} = S^1`),
  )
  .compile()
  .toSVG();
```

`curve3.intersect`가 3D 곡선을 만들어냅니다. 좌표를 직접 계산하지 않습니다.

---

## 7. 3D — 회전체

```js
import { scene, curve, line, surface, annotate, tex, pi } from '@jaywoo0830a/logos';

const f = tex`\sqrt{x}`;
const c = curve.fn(f).on([0, 4]);
const ax = line.horizontal(0);

scene()
  .dim(3)
  .camera({ position: [6, -6, 4], projection: 'perspective' })
  .light({ type: 'ambient', intensity: 0.6 })
  .light({ type: 'directional', direction: [1, -1, 1] })
  .theme('textbook')
  .add(
    surface.revolution(c).about(ax).color('#93c5fd').opacity(0.85),
    c.color('crimson').stroke(2),
    ax.color('#333'),

    annotate.caption(tex`V = \pi \int_0^4 x\,dx = 8\pi`),
  )
  .compile()
  .toSVG();
```

---

## 8. 심볼릭 방정식 풀이

```js
import { tex, scene, point, curve, annotate } from '@jaywoo0830a/logos';

const eq = tex`x^{2} - 5x + 6 = 0`;
const roots = eq.solve('x'); // [2, 3]

scene()
  .view([-1, 5], [-1, 5])
  .equal()
  .axes()
  .theme('textbook')
  .add(
    curve
      .fn(tex`x^2 - 5x + 6`)
      .on([-1, 5])
      .color('crimson'),

    ...roots.map((r, i) => point(Number(r), 0).dot().label(`$${r.toLatex()}$`)),

    annotate.caption(`근: ${roots.map((r) => `$${r.toLatex()}$`).join(', ')}`),
  )
  .compile();
```

`roots`는 `Sym` 배열이므로 `.toLatex()`로 바로 LaTeX가 나옵니다.

---

## 9. 조건부 제약 — 검증까지

```js
import { scene, point, line, segment, annotate } from '@jaywoo0830a/logos';

const A = point(0, 0);
const B = point(4, 0);
const C = point(2, 3);

scene()
  .equal()
  .add(triangle(A, B, C), segment(A, B), segment(B, C), segment(C, A))
  .assert(
    { kind: 'equal-length', items: [segment(A, B), segment(B, C)] },
    { kind: 'parallel', items: [line.through(A, B), line.horizontal(0)] },
  )
  .compile();
```

`assert`는 컴파일 단계에서 검증하고, 실패 시 어느 제약이 깨졌는지 알려줍니다.

---

## 10. 교과서 한 페이지 통째로

```js
import { scene, point, triangle, circle, line, curve, region, annotate, transform, tex, tau } from '@jaywoo0830a/logos';

// ─── 1) 원의 정의와 접선 ─────────────────────
const fig1 = scene()
  .equal()
  .axes()
  .theme('textbook')
  .add(
    circle.center(point.origin()).radius(2).stroke(2),
    point.origin().dot().label('O'),
    point(2, 0).dot().label('P'),
    line.tangent(circle.center(point.origin()).radius(2)).at(point(2, 0)).color('#c00'),
    annotate.angle(point.origin(), point(2, 0), point(2, 3)).rightAngle(),
  )
  .compile();

// ─── 2) 삼각함수 그래프 ─────────────────────
const fig2 = scene()
  .view([-tau / 2, tau], [-1.5, 1.5])
  .axes({ x: { label: 'x', ticks: 'π/2' }, y: { label: 'y' } })
  .theme('textbook')
  .add(
    curve
      .fn(Math.sin)
      .on([-tau / 2, tau])
      .color('crimson')
      .label(tex`\sin x`),
    curve
      .fn(Math.cos)
      .on([-tau / 2, tau])
      .color('steelblue')
      .label(tex`\cos x`),
  )
  .compile();

// ─── 3) 정적분의 정의 ───────────────────────
const f = tex`x^{2}`;
const fig3 = scene()
  .view([-0.5, 3], [-0.5, 10])
  .equal()
  .axes()
  .grid(1)
  .theme('textbook')
  .add(
    curve.fn(f).on([-0.5, 3]).color('crimson'),
    region.riemann(f).on([0, 2]).n(12).midpoint().fill('steelblue').opacity(0.4),
    annotate
      .integral(f)
      .from(0)
      .to(2)
      .label(tex`\int_0^2 x^2\,dx = \tfrac{8}{3}`),
  )
  .compile();

// ─── 4) 회전체 (3D) ─────────────────────────
const fig4 = scene()
  .dim(3)
  .camera({ position: [6, -6, 4] })
  .light({ type: 'ambient', intensity: 0.7 })
  .theme('textbook')
  .add(
    surface
      .revolution(curve.fn(tex`\sqrt{x}`).on([0, 4]))
      .about(line.horizontal(0))
      .opacity(0.8),
  )
  .compile();

// ─── 한 문서로 묶기 ─────────────────────────
export const chapter01 = {
  title: '미적분의 기초',
  figures: [fig1, fig2, fig3, fig4],
  toTikZ() {
    return this.figures.map((f) => f.toTikZ({ standalone: true })).join('\n\n');
  },
};
```

교사는 이 `chapter01`을 그대로 PDF 빌드 파이프라인에 넘기면 됩니다.

---

## 11. "쓰는 재미" — 체이닝의 리듬

```js
// 한 줄로 읽히는 문장
point(1, 2).label('A').dot().color('#e11');

circle.center(O).radius(3).dash([4, 2]).label('C');

curve
  .fn(tex`\sin x`)
  .on([0, tau])
  .stroke(2)
  .color('crimson');

triangle(A, B, C)
  .fill('#eef3ff')
  .stroke(2)
  .apply(transform.rotate(Math.PI / 4));

scene()
  .dim(3)
  .view([-2, 2], [-2, 2], [-2, 2])
  .camera({ position: [3, 3, 3] })
  .theme('textbook')
  .add(sphere.center(O).radius(1))
  .compile()
  .toTikZ();
```

**읽는 순서 = 생각하는 순서 = 그리는 순서.**

---

## 12. 실수 방지 — 이상한 조합은 컴파일에서 터짐

```js
// 3D 씬에 평면 위에 있지 않은 2D 원
scene()
  .dim(3)
  .add(circle.center(point(0, 0, 1)).radius(1));
// ❌ Error: 2D circle needs a plane in 3D scene.
//    Hint: .on(plane.coordinate('xy'))  또는  sphere 로 바꾸세요.

// 정의역이 없는 파라메트릭 곡선
curve.parametric((t) => [Math.cos(t), Math.sin(t)]);
// ⚠️ Warning: parametric curve without domain defaults to [-π, π].
```

에러 메시지가 **다음에 뭘 써야 하는지** 알려줍니다.

---

## 13. 한눈에 보는 클라이언트 API 지도

```
import { scene, point, vector, line, segment, ray,
         curve, circle, arc, sector,
         ellipse, parabola, hyperbola,
         polygon, triangle, quad, regular,
         plane, sphere, cylinder, cone, torus,
         surface, curve3, arrow3, surfaceParam,
         axes3, quadrics, circle3, frame3,      // 3D 도우미
         polyhedron, cube, prism, pyramid,
         region, vectorField,
         transform, annotate, tex, kit,         // kit = 그림 작성 키트
         mat, vec,                              // 행렬/벡터 수치 (linalg)
         cplx, Complex,                         // 복소수 수치 (complex)
         tau, pi, e } from '@jaywoo0830a/logos';
```

- **`scene()`** — 캔버스
- **`point` ~ `vectorField`** — 도형
- **`axes3` / `quadrics` / `circle3` / `frame3`** — 3D 도우미(mplot3d 대응)
- **`kit`** — 예제 작성 키트: `palette` · `plot2d` · `plot3d` · `subplots` ·
  `saveFigure` · `saveFigures` · `writeGallery` · `seg` · `poly3`
- **`mat` / `vec`** — 행렬·벡터 **계산** (linalg.js): `mat([[a,b],[c,d]])` 의
  `apply/det/inv/pow/mul/t/col/map` + `mat.rotation/reflection/shear/scaling`,
  `vec.dot/norm/unit/project/cross/areaOf/angleDeg`. 도형에 행렬을 씌우려면
  `transform.matrix(A)` + `.apply()`.
- **`cplx` / `Complex`** — 복소수 **계산** (complex.js): `cplx(3, 2)` = 3+2i 의
  `abs/arg/argDeg/conj/toPolar/toArray/toString`, `add/sub/mul/div/scale/neg/pow/roots`,
  `cplx.polar/unity/matrix`(→ `mat`). 복소수는 복소평면의 **점 `(a, b)`** 이므로
  그리기는 `point`/`segment`/`polygon` 이 그대로 담당합니다.
- **`transform`** — 변환 (회전·평행이동·반사·스케일·**행렬**)
- **`annotate`** — 주석
- **`tex`** — 심볼릭 수식 (LaTeX 그대로)

> 예제를 처음 쓴다면 [`KIT.md`](KIT.md) 부터 보세요 — 프리셋·저장·타이포그래피(행간/자간)까지
> 실제로 그림을 "만드는" 쪽 이야기가 정리돼 있습니다.

---

## 14. 마무리 — 이 DSL이 지향하는 것

```js
// 선생님이 말로 하는 설명
"원 O 위의 점 P에서의 접선은 OP에 수직이다."

// 선생님이 코드로 쓰는 설명
circle.center(O).radius(3),
point(3, 0).label('P'),
line.tangent(circle).at(P),
annotate.angle(O, P, /* 접선 방향 */).rightAngle(),
```

이 둘이 **같은 순서로 읽히면** 성공입니다.

- `.label()` `.dot()` `.color()` `.dash()` — 부가 설명
- `.diff()` `.integrate()` `.solve()` — 수학적 조작
- `.compile()` `.toSVG()` `.toTikZ()` — 출력

**"쓰는 사람이 수학을 다시 한 번 말로 설명하는 것처럼"** — 이게 `logos` 클라이언트 코드의 최종 목표입니다.

---

## 15. 확장 — 없는 기능은 코어를 고치지 않고 붙인다

그림을 그리다 보면 DSL 에 없는 것이 나옵니다. 그때 `core/` 를 고치는 대신 **플러그인 한 줄**을 씁니다.

```js
import { scene, point, circle, use, plugins } from '@jaywoo0830a/logos';
import geometryExtras from './plugins/geometry-extras.js';

use(geometryExtras, { watermark: true }); // ← 이 한 줄이 전부

scene()
  .equal()
  .axes()
  .theme('chalk')
  .add(
    plugins.ray(point(0, 0), point.byDeg(1, 30)).arrowTip().dashed(), // 플러그인 등록이 코어 기본값을 덮어씀
    plugins['arc.circular'](point(0, 0), 2, 30, 150), // 코어에도 기본 구현이 있고, 플러그인이 우선
    plugins.hatch(1, 1, 4, 1.6).text('A = ∫₀⁴ f(x) dx'), // 새 IR 노드(SVG+TikZ)
    circle.center(point.origin()).radius(1).tilt(15), // 새 체이닝 메서드
  )
  .compile()
  .toSVG();
```

읽히는 그대로입니다 — “이름을 등록하면 그 이름이 DSL 이 된다.” 새 메서드가 코어 메서드와
섞여도 체인이 끊기지 않고, 없는 이름을 부르면 **등록 방법을 알려주는 안내**가 나옵니다.

| 하고 싶은 것              | 한 줄                                                 |
| ------------------------- | ----------------------------------------------------- |
| 새 체이닝 메서드          | `api.chain('drawable', { name: (conf, …) => ({…}) })` |
| 새 도형                   | `api.define('name', factory, { ctor })`               |
| 새 IR 노드(백엔드 무수정) | `api.node('kind', { svg, tikz })`                     |
| 새 테마                   | `api.theme('name', tokens)`                           |
| 파이프라인 끼어들기       | `api.hook('svg', (svg) => …)`                         |
| 기존 동작 보강            | `api.around('scene', 'title', (orig, t) => …)`        |

전체 목록과 좌표 변환 규칙은 [`PLUGIN.md`](PLUGIN.md), 실제 8종 예시는
`plugins/geometry-extras.js`(`npm run plugin-demo` → `output/plugin-demo/`)에 있습니다.
