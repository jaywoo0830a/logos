# `logos` 가상 사양서 v1.0

> “수학적 객체를 선언하면, 교과서가 된다.”

---

## 0. 한 줄 정의

`logos`는 **Node.js 기반**, 수학적 객체(스칼라·벡터·행렬·함수·복소·기하·확률·미분방정식)를 **1급 시민**으로 취급하고, 그것들을 **정적(still)·동적(motion)** 장면으로 조판·렌더·내보내는 선언형 라이브러리다.

사용자는 **렌더러·캔버스·좌표계·애니메이션 루프·LaTeX 조판을 직접 만지지 않는다.**

---

## 1. 설계 철학

| 원칙 | 의미 |
|---|---|
| **선언 우선** | “무엇을 그릴지”만 쓰고 “어떻게 그릴지”는 쓰지 않는다. |
| **수학이 1급** | `number`가 아니라 `Real`, `[x,y]`가 아니라 `Vec2`, `Math.sin`이 아니라 `fn`. |
| **정적=동적** | `still`과 `motion`은 같은 DSL을 공유한다. `motion`은 시간축이 있는 `still`일 뿐이다. |
| **불변 객체** | 모든 수학 객체·장면 요소는 불변. 조합은 새 객체를 만든다. |
| **지연 평가** | 선언은 트리만 만들고, `.exportAs()`에서 실제 계산이 일어난다. |
| **구현 은닉** | 렌더러(Canvas2D/SVG/WebGL/WebGPU), 조판(KaTeX/MathJax), 인코더(ffmpeg/wasm)는 전부 교체 가능한 백엔드. |
| **교과서 우선** | 기본 테마는 “교과서에 실릴 만한” 인쇄 친화·고대비·그레이스케일 안전. |

---

## 2. 패키지 구조

```
logos/                     # 메타 패키지 (전부 re-export)
logos/math                 # 수학 객체
logos/math/scalar          # Real, Int, Rational, Complex
logos/math/vector          # Vec2, Vec3, VecN
logos/math/matrix          # Mat2, Mat3, Mat4, MatN
logos/math/function        # fn, fn2, fnN, piecewise, derivative, integral
logos/math/geometry        # Point, Segment, Line, Circle, Polygon, Triangle...
logos/math/probability     # Dist, sample, density
logos/math/ode             # ode, solve, field
logos/scene                # still, motion, layer, group, timeline
logos/scene/axes           # cartesian, polar, complex plane, log
logos/scene/3d             # surface, curve3d, camera, light
logos/tex                  # tex 태그드 템플릿
logos/theme                # textbook, chalkboard, dark, print, custom
logos/export               # svg, png, pdf, mp4, webm, gif, tex, json
logos/backend              # canvas2d, svg, webgl, webgpu (교체 가능)
logos/react                # <Scene />, useMotion()
logos/cli                  # logos build scene.js
```

**서브패스 import**가 기본. 트리 셰이킹이 자연스럽게 된다.

---

## 3. 핵심 개념 5개

### 3.1 Math Object
값 + 메타데이터(라벨, LaTeX, 도메인, 단위)를 가진 불변 객체.
```js
const f = fn`f(x)=\sin x`.of(Math.sin).on([-π, π]);
f.latex;   // "f(x)=\sin x"
f.at(0.5); // 0.479...
f.derivative(); // 새 fn
```

### 3.2 Scene
Math Object들을 담는 트리. `still`과 `motion` 두 종류.
```js
still({...}).add(...).add(...)
motion({duration, fps, loop}).add(...).add(...)
```

### 3.3 Time
`motion`에서만 등장. 모든 값이 `t => value` 꼴로 승격 가능.
```js
.add(point(t => [Math.cos(t), Math.sin(t)]))
```

### 3.4 Layer
z-order, opacity, blend, clip, mask를 가진 그룹.
```js
layer("annotation").opacity(0.8).add(tex`...`)
```

### 3.5 Exporter
장면 → 파일. `.exportAs(format, path, opts)`.
```js
await scene.exportAs("svg", "out.svg");
await scene.exportAs("mp4", "out.mp4", { codec: "h264", crf: 18 });
```

---

## 4. `logos/math` 상세

### 4.1 스칼라
```js
Real(2.5).latex()            // "2.5"
Int(3).factor()              // [3]
Rational(3, 4).latex()       // "\frac{3}{4}"
Complex(1, 2).abs()          // √5
```

### 4.2 벡터·행렬
```js
vec([1, 2, 3])               // Vec3
mat([[1,0],[0,1]])           // Mat2
A.mul(v), A.det(), A.inv(), A.eigen()
v.dot(w), v.cross(w), v.norm()
```

### 4.3 함수
```js
const f = fn`f(x)=x^2`.of(x => x*x).on([-3, 3]);
f.derivative()               // 수치/기호 미분
f.integral([0, 1])           // 정적분
f.inverse()
f.piecewise([[x => x, x => x < 0], [x => x*x, () => true]])
```

### 4.4 기하
```js
const A = point([0, 0]), B = point([1, 1]);
segment(A, B).midpoint()
triangle(A, B, C).circumcenter().incenter().orthocenter()
circle(O, r).tangentAt(P)
```

### 4.5 복소
```js
const { i, exp, log, sin } = logos.complex;
z.mul(z).add(1)
domainColoring(z => z.mul(z).add(1))
```

### 4.6 확률·통계
```js
Normal(0, 1).pdf(0.5)
Binomial(10, 0.5).sample(1000)
Histogram(data).bins(20)
```

### 4.7 미분방정식
```js
ode`y' = -k y`.solve({ y0: 1, k: 0.5, t: [0, 10] })
field(fn2`(x,y) -> (y, -x)`)
```

---

## 5. `logos/scene` 상세

### 5.1 `still(options)`
```js
still({
  size: [960, 540],           // px, 또는 "A4", "16:9"
  dpi: 300,                   // 인쇄용
  theme: "textbook",
  title: "sinc 함수",
  background: "#fff",
  padding: 24,
})
```

### 5.2 `motion(options)`
```js
motion({
  duration: 8,                // 초
  fps: 60,
  loop: true,
  easing: "easeInOutCubic",   // 전역 기본
  size: [800, 800],
  timeline: [                 // 선택적 키프레임
    { at: 0, name: "intro" },
    { at: 2, name: "rotate" },
    { at: 8, name: "outro" },
  ],
})
```

### 5.3 좌표계
```js
axes.cartesian({ x: [-5, 5], y: [-5, 5], grid: true, equal: true })
axes.polar({ r: [0, 2], theta: [0, 2*π] })
axes.complex({ x: [-2, 2], y: [-2, 2] })
axes.log({ base: 10, x: [0.1, 100] })
```

### 5.4 프리미티브
| 이름 | 설명 |
|---|---|
| `point` | 좌표 + 라벨 |
| `line` | 무한 직선, `line.tangent(f, {at})` |
| `segment` | 두 점 |
| `arrow` | 벡터 표현 |
| `circle` | 중심+반지름 |
| `triangle` | 세 점, 부가정보(각, 변라벨) |
| `polygon` | n각형 |
| `path` | 임의 곡선 |
| `region` | 부등식 영역 |
| `surface` | 3D 곡면 |
| `curve3d` | 3D 곡선 |
| `field` | 벡터장 |
| `slopeField` | 기울기장 |

### 5.5 레이어·그룹
```js
layer("annotations").behind(plot(f)).add(...)
group([pointA, pointB, pointC]).translate([1, 2])
```

### 5.6 카메라 (3D)
```js
camera.orbit({ target, radius, from, to, during })
camera.follow(path)
camera.zoom(t => 1 + 0.1*Math.sin(t))
```

---

## 6. `logos/tex`

태그드 템플릿. 문자열이 아니라 **노드**를 만든다.
```js
tex`f(x)=\frac{\sin x}{x}`          // TexNode
tex`f(x)=...`.at([4, 0.6])          // 위치 지정
tex(t => `\theta=${t.toFixed(2)}`)  // 시간 의존
tex`\begin{pmatrix}2&1\\1&2\end{pmatrix}`.scale(1.2)
```

- `at([x, y])` — 월드 좌표
- `at([x, y], "screen")` — 화면 좌표
- `.anchor("top-left" | "center" | ...)`
- `.color()`, `.size()`, `.background()`

---

## 7. 테마 & 스타일

```js
theme("textbook", {
  font: "STIX Two Text",
  mathFont: "Latin Modern Math",
  axis: { color: "#333", width: 1 },
  grid: { color: "#eee", dash: [2, 4] },
  plot: { width: 2.5, palette: ["#1f3a93", "#c0392b", "#27ae60"] },
  grayscaleSafe: true,
})
```

기본 제공: `textbook`, `chalkboard`, `dark`, `print`, `monochrome`, `korean-textbook`.

---

## 8. 시간 모델

모든 값은 다음 중 하나:
- **상수**: `[1, 2]`
- **함수**: `t => [Math.cos(t), Math.sin(t)]`
- **키프레임**: `keyframes([[0, [0,0]], [1, [1,1]]])`
- **보간**: `lerp(a, b, t)`, `smoothstep`, `easeInOut`

```js
.add(point(keyframes({
  0: [0, 0],
  1: [1, 0],
  2: [1, 1],
}, { easing: "easeInOutCubic" })))
```

---

## 9. 내보내기

```js
await scene.exportAs("svg",  "out.svg");
await scene.exportAs("png",  "out.png",  { dpi: 300 });
await scene.exportAs("pdf",  "out.pdf",  { page: "A4", margin: 20 });
await scene.exportAs("mp4",  "out.mp4",  { codec: "h264", crf: 18, preset: "slow" });
await scene.exportAs("webm", "out.webm", { codec: "vp9" });
await scene.exportAs("gif",  "out.gif",  { fps: 30, dither: true });
await scene.exportAs("tex",  "out.tex");       // TikZ/PGFPlots
await scene.exportAs("json", "out.json");      // 재현 가능한 IR
```

병렬:
```js
await Promise.all(scenes.map(s => s.exportAs("svg")));
```

---

## 10. 반응형 / 리액티브

```js
import { signal, computed } from "logos/react";

const k = signal(0.5);
const f = computed(() => fn`f(x)=e^{-${k()}x}`.of(x => Math.exp(-k()*x)));

motion({...}).add(plot(f)).add(tex`k=${k()}`);   // k 변경 시 자동 재렌더
```

React 바인딩:
```jsx
<Scene still={{ size: [800, 600] }} theme="textbook">
  <Plot fn={f} />
  <Tex>f(x)=e^{-kx}</Tex>
</Scene>
```

---

## 11. 플러그인 / 확장

```js
logos.use(myPlugin);
// myPlugin: { name, math?, scene?, export?, backend? }
```

백엔드 교체:
```js
logos.backend("webgpu", { antialias: true });
logos.backend("svg", { precision: 3 });
logos.backend("canvas2d", {});
```

커스텀 프리미티브:
```js
logos.define("spring", ({ from, to, coils }) => path(...));
```

---

## 12. 성능

- **IR 캐시**: 동일 장면은 해시로 캐시.
- **증분 렌더**: `motion`은 프레임 단위 diff.
- **WebWorker/Worker Threads**: 조판·인코딩 분리.
- **GPU 패스**: 3D·대량 점은 WebGPU.
- **스트리밍 인코딩**: ffmpeg 파이프.
- **`.freeze()`**: 완성된 장면을 최적화된 IR로 고정.

---

## 13. 접근성 & 국제화

- SVG/PDF에 `<title>`, `<desc>`, MathML 병기.
- 색맹 안전 팔레트, 그레이스케일 안전 모드.
- 한국어·영어·일본어·중국어 조판 프리셋.
- RTL 지원.
- 키보드 내비게이션용 인터랙티브 HTML 내보내기(`.exportAs("html")`).

---

## 14. 에러 모델

```js
try {
  await scene.exportAs("mp4", "out.mp4");
} catch (e) {
  if (e instanceof logos.DomainError) { /* 정의역 밖 */ }
  if (e instanceof logos.BackendError) { /* ffmpeg 없음 */ }
  if (e instanceof logos.TexError) { /* LaTeX 파싱 실패 */ }
}
```

- 경고는 `logos.warn()`으로 수집.
- `logos.strict()` 모드에서 경고를 에러로.

---

## 15. CLI

```bash
logos build scene.js                 # 선언 → 파일
logos watch scene.js --out dist/     # 변경 감지
logos preview scene.js --port 3000   # 브라우저 미리보기
logos fmt scene.js                   # 포맷
logos lint scene.js                  # 수학적 오류 검사
```

---

## 16. 테스트 & 문서

- **스냅샷 테스트**: SVG/PDF 해시.
- **비주얼 회귀**: 픽셀 diff.
- **수학 검증**: `f.derivative()`를 수치미분과 비교.
- **문서**: 모든 프리미티브에 라이브 예제 + 편집 가능한 playground.
- **타입**: 완전한 TypeScript 정의 + JSDoc.

---

## 17. 로드맵 (상상)

| 버전 | 내용 |
|---|---|
| 0.1 | still + SVG + 함수/벡터/행렬 |
| 0.3 | motion + mp4 + TeX |
| 0.5 | 3D surface + camera |
| 0.7 | 복소 + 확률 + ODE |
| 0.9 | React 바인딩, WebGPU |
| 1.0 | PDF/TeX 내보내기, 테마 생태계, 플러그인 API 안정화 |
| 1.x | 협업 편집, 클라우드 렌더, LLM 프롬프트 인터페이스 |

---

## 18. 최소 사용 예 (전체 사양의 축약)

```js
import { motion, axes, plot, tex } from "logos";
import { fn } from "logos/math";

const f = fn`f(x)=\sin x`.of(Math.sin).on([-π, π]);

await motion({ duration: 4, loop: true, theme: "textbook" })
  .add(axes.cartesian({ x: [-π, π], y: [-1, 1], grid: true }))
  .add(plot(f, { color: "navy" }))
  .add(tex(t => `t=${t.toFixed(1)}`))
  .exportAs("mp4", "sin.mp4");
```

이 한 조각이 `logos`의 전부다. 나머지는 이 문법을 **수학의 모든 객체**로 확장한 결과일 뿐이다.