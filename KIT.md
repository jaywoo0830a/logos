# `logos` 작성 키트 (`kit.js`) — 예제를 쓰는 사람을 위한 안내

> 이 문서는 **그림을 그리는 쪽(예제·스케치·강의자료)** 을 위한 문서입니다.
> 언어/도형 스펙은 [`DSL.md`](DSL.md), 사용자 코드 미리보기는 [`INTERFACE.md`](INTERFACE.md) 를 보세요.

---

## 1. 왜 키트가 필요한가

예제를 하나 쓰면 항상 같은 네 가지가 반복됩니다.

| 반복되는 일 | 예전 방식(예제마다 복사) | 이제(키트) |
|---|---|---|
| 색 정하기 | `const B = '#0000ff', R = '#ff0000', …` | `kit.palette.blue` |
| 기본 씬 만들기 | `.size(...).view(...).grid(...).axes()` | `kit.plot2d([-3,3], [-2,2])` |
| 여러 씬 합치기 | `panels([a.compile(), b.compile()], { cell, cols })` | `kit.subplots([a, b], { cols: 2 })` |
| 저장 + 로그 | `writeFileSync(...)` + `toPNG()` + `console.log` | `kit.saveFigures(figs, { dir })` |

복사-붙여넣기 방식의 진짜 문제는 **값이 조금씩 어긋난다**는 점입니다.
가장 잦았던 사고는 *패널이 서로 겹치는* 경우였습니다.
`panels()` 의 셀 크기와 각 서브 씬의 `.size()` 가 다르면, 큰 씬이 이웃 칸을 침범합니다.
키트는 이 함정을 **구조적으로** 없앱니다(`subplots()` → 셀 크기 자동).

> **중요**: `kit` 은 얇은 래퍼일 뿐, 렌더링 규칙을 갖지 않습니다.
> `kit` 없이 `Scene`/`panels`/`SceneIR` 만 써도 출력은 완전히 같습니다.

```js
import { scene, point, circle, kit } from '@jaywoo0830a/logos';
const { plot2d, subplots, saveFigures, palette } = kit;
```

---

## 2. 빠른 시작 — 3줄로 갤러리 만들기

```js
// examples/my_figs.js   →   node examples/my_figs.js
import { point, circle, kit } from '../index.js';

const figs = [
  ['c1-unit', () => kit.plot2d([-2, 2], [-2, 2], { equal: true })
    .title('Unit circle')
    .add(circle.center(point(0, 0)).radius(1).color(kit.palette.blue)), '단위원'],
];

await kit.saveFigures(figs, { dir: 'output/my', index: true, title: '내 그림 모음' });
```

결과: `output/my/c1-unit.svg`, `output/my/c1-unit.png`, `output/my/index.html`(갤러리).

---

## 3. API 레퍼런스

### 3.1 `palette` — 색

```js
kit.palette.blue      // '#0000ff'
kit.palette.b         // 위와 동일 (matplotlib 한 글자 코드)
kit.palette.tab10[3]  // tab10 팔레트
```

* 명명색: `blue red green magenta orange yellow cyan black white gray navy purple
  darkgreen darkred crimson steel skyblue coral wheat orangead`
* 한 글자: `b r g m y c k w o` (matplotlib 호환)
* 값은 전부 **hex 로 고정** → 브라우저와 resvg(래스터)가 같은 색을 냅니다.

### 3.2 `plot2d(xr, yr, opts?)` — 2D 씬 프리셋

```js
kit.plot2d([-3, 3], [-2, 2])                       // view + grid(alpha .3) + axes
kit.plot2d([-3, 3], [-2, 2], { equal: true })      // 축 비율 1:1
kit.plot2d([-3, 3], [-2, 2], { size: [480, 440], grid: false })
```

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `size` | `[560, 440]` | 캔버스(= 패널 셀) 크기 |
| `grid` | `{ alpha: 0.3 }` | `false` 면 그리드 없음, `true`/객체는 `scene.grid()` 로 전달 |
| `axes` | `true` | `false` 면 축 없음, **객체면 `scene.axes(cfg)` 로 그대로 전달** |
| `equal` | `false` | 등비 스케일 |

`axes` 에 객체를 주면 눈금·라벨을 축별로 제어할 수 있습니다(6차에서 전달되도록 수정).

```js
// x 축 라벨만 남기고 y 눈금·라벨은 끄기 ← mpl: ax.set_yticks([]) + set_xlabel(...)
kit.plot2d([-5, 6], [-1, 1], {
  axes: { x: { label: 'Projected coordinate' }, y: { label: false, ticks: false } },
});
```

### 3.3 `plot3d(opts?)` — 3D 씬 프리셋 (mplot3d 관례)

```js
kit.plot3d()                      // elev 20°, azim −50°, box aspect [1,1,0.75]
kit.plot3d({ elev: 25, azim: -55 })
```

| 옵션 | 기본값 | 대응 |
|---|---|---|
| `elev`, `azim` | `20`, `-50` | `ax.view_init(elev, azim)` |
| `aspect` | `[1, 1, 0.75]` | `ax.set_box_aspect([4, 4, 3])` |
| `size` | `[480, 440]` | 캔버스 크기 |
| `axes` | `false` | 3D 자동축. 끄고 `axes3()` 로 직접 그리는 걸 권장 |

### 3.4 `subplots(figures, opts?)` — 패널 합성

```js
kit.subplots([a, b, c], { cols: 3, title: 'Step by step', tight: true });
```

* 원시 `Scene` 을 자동으로 `compile()` 합니다(직접 `compile()` 할 필요 없음).
* **셀 크기 자동**: `cell` 을 주지 않으면 figure 들의 `.size()` **최댓값**을 씁니다.
  → 큰 서브씬이 이웃 패널을 침범하지 않습니다.
* `opts`: `cols`, `rows`(암묵), `cell`, `gap`, `pad`, `title`(suptitle), `tight`, `background`.
* `tight: true` 는 gap/pad/title 여백을 좁힙니다(`gap 4`, `pad 8`, `title 34px`).

### 3.5 `saveFigure` / `saveFigures` / `writeGallery`

```js
await kit.saveFigure(ir, { dir, name: 'fig1', png: true, scale: 2, math: 'text' });
await kit.saveFigures([['name', factory, '제목'], …], {
  dir, png: true, scale: 1, math: 'text', log: true, index: true,
});
```

* `factory` 는 `() => Scene | SceneIR | panels(...)` — **함수**여야 합니다(지연 생성).
* `png: true` 인데 `@resvg/resvg-js` 가 없으면 경고만 남기고 SVG 는 저장됩니다.
* `index: true` → 같은 폴더에 `index.html` 갤러리(`writeGallery`) 생성.
* 반환값 `{ ok, fail, dir, entries }` → CI 에서 실패 개수를 검사할 수 있습니다.
* 한 figure 가 예외를 던져도 **나머지는 계속** 렌더하고 마지막에 요약을 찍습니다.

### 3.6 `seg` / `poly3` — 선 단축

```js
kit.seg(point(0, 0), point(3, 4), { color: palette.red, stroke: 2, dash: [6, 4] });
kit.poly3([[0, 0, 0], [3, 2, 4]], { color: '#000', stroke: 0.8, dash: [4, 3] });
```

* `seg` 는 2D 좌표면 `line.through`(**직선**), z 가 있으면 `curve3.through`(선분)로 분기합니다.
  2D 선분은 `segment(A, B)` 를 쓰세요.
* `poly3` 는 3D 꺾은선(`curve3.through`)입니다.

### 3.7 `linalg` — 행렬·벡터 계산 (`mat` · `vec`)

그림은 `Scene`/도형이 담당하고, **"행렬과 벡터" 계산**은 `linalg.js` 가 담당합니다.
(`solver/` 와 같은 순수 함수 계층 — 렌더링 규칙을 갖지 않습니다.)

```js
import { mat, vec } from '@jaywoo0830a/logos';

const A = mat([[2, 1], [0.5, 1.5]]);   // 행의 배열 = 수학 표기 그대로
A.apply([1, 0]);     // [2, 0.5]   A·x  (= A 의 1열 = 기저벡터 e₁ 의 상)
A.det;               // 2.5
A.inv;               // 역행렬 (det=0 이면 예외)
A.pow(4);            // A⁴ (k=0 → I)
A.mul(B); A.t(); A.col(1); A.map([[0,0],[1,1]]);
```

| 팩토리 | 만드는 행렬 |
|---|---|
| `mat.identity(n)` | 단위행렬 |
| `mat.rotation(deg)` | 회전 R(θ) (반시계, 도 단위) |
| `mat.reflection('x'\|'y'\|'yx'\|deg)` | 반사 |
| `mat.shear(kx, ky)` | 전단 |
| `mat.scaling(sx, sy)` | 스케일 |

```js
vec.add/sub/scale/dot/norm/unit                    // 기본 연산
vec.project([4, 2], [2, 0.5])                      // b 에 정사영
vec.reject(a, b)                                   // 수직 성분
vec.cross([1, 0], [0, 1])                          // [0, 0, 1]  (2D 는 z=0 승격)
vec.areaOf(a, b) / vec.det2(a, b)                  // |a×b| = 평행사변형 넓이
vec.angleDeg([3, 1], [1, 3])                       // 53.13
```

도형에 행렬을 **그대로** 씌우려면 `transform.matrix()`:

```js
polygon(...).apply(transform.matrix(A));            // = A·x 로 좌표 매핑
annotate.arrow(point(0,0), point(1,0)).apply(transform.matrix(A));   // 변환된 기저벡터
```

> `transform.matrix()` 는 배열과 `mat()` 행렬을 **둘 다** 받습니다(6차에서 `Matrix` 지원 추가).
> 그림 예시는 [`examples/mpl_parity_12a2.js`](examples/mpl_parity_12a2.js) 참고.

### 3.8 `cplx` — 복소수 계산 (`complex.js`)

행렬이 `linalg` 라면 **복소수**는 `complex.js` 입니다(같은 성격의 순수 수치 계층).
복소평면 그림의 `|z|`·`arg z`·`z̄`·`z₁z₂`·`1/z`·`zⁿ`·n제곱근이 전부 여기 있습니다.

```js
import { cplx } from '@jaywoo0830a/logos';

const z = cplx(3, 2);            // 3+2i — 복소평면의 점 (3, 2)
z.abs;                           // 3.6055…   ← abs(z)
z.argDeg;                        // 33.69…    ← np.angle(z), deg
z.conj;                          // 3-2i      ← np.conj(z) = 실축 반사
z.toArray();                     // [3, 2]    ← 점 좌표로 그대로
z.toString();                    // '3 + 2i'  ← 라벨용

cplx.polar(2, 60);               // 2e^{i60°} (θ 는 **도**)
cplx.mul(z, w);                  // 곱 = (|z||w|)·(arg z + arg w) → 회전+확대
cplx.div(1, z);                  // 1/z = z̄/|z|²  (0 으로 나누면 예외)
z.pow(4); z.roots(3);            // zⁿ (음수 지수 허용) · n제곱근 n개
cplx.unity(6, 1.5);              // 반지름 1.5 인 1의 6제곱근 = 정육각형 꼭짓점
cplx.matrix(z).rows;             // [[3, -2], [2, 3]]  ← a+bi ↔ 회전·확대 행렬
```

| mpl / numpy | logos |
|---|---|
| `complex(3, 2)` | `cplx(3, 2)` |
| `abs(z)` / `np.angle(z)` | `z.abs` / `z.arg`, `z.argDeg` |
| `np.conj(z)` | `z.conj` |
| `z1 * z2` / `z1 / z2` | `cplx.mul(z1, z2)` / `cplx.div(z1, z2)` |
| `z ** n` | `z.pow(n)` |
| `np.roots` / 1의 n제곱근 | `z.roots(n)` / `cplx.unity(n, r)` |
| `np.array([a, -b, b, a]).reshape(2, 2)` | `cplx.matrix(z)` → `mat` |

> `cplx.matrix(z)` 는 `[[a, −b], [b, a]]` (`det = |z|²`). 그래서 **12A1(복소수)과 12A2(행렬과 벡터)가
> 같은 `mat`·`vec` 층을 공유**합니다 — `cplx.mul` 은 이 행렬의 곱과 같습니다.
> 그림 예시는 [`examples/mpl_parity_12a1.js`](examples/mpl_parity_12a1.js) 참고.

---

## 4. 3D 도우미 — `axes3` · `quadrics` · `circle3` · `frame3`

### 4.1 `axes3(opts)` — mplot3d 스타일 좌표축

```js
scene().dim(3).camera({ elev: 20, azim: -50 }).axes(false)
  .add(...axes3({ length: 5, color: '#808080', width: 0.8 }));
```

* 반환값이 **배열**(화살표 3개 + 라벨 3개)이라 `.add(...axes3(...))` 로 펼칩니다.
* `labels: null` 이면 라벨 생략(그림에서 직접 라벨을 달 때).
* `origin`, `ratio`(머리 길이 비율), `labelFont`, `labelOffset` 도 지정할 수 있습니다.
* **머리 촉(`ratio`) 기본값은 0.06** — 축은 길어서 `arrow3` 기본(0.12)을 그대로 쓰면 촉만
  커 보입니다. `ratio: null` 로 주면 `arrow3` 기본값(0.12)을 씁니다.

### 4.2 `quadrics` — 표준 이차곡면 팩토리

```js
const { plane, ellipsoid, ball, hyperboloid1, hyperboloid2, cone, cylinder } = quadrics;
```

| 팩토리 | 곡면 | 비고 |
|---|---|---|
| `plane(f, xr, yr)` | `z = f(x, y)` | `plot_surface` 의 기본형 |
| `ellipsoid(a, b, c, C?)` | `x²/a²+y²/b²+z²/c²=1` | `C` = 중심 |
| `ball(r, C?)` | 구 | `ellipsoid(r,r,r,C)` |
| `hyperboloid1(a,b,c,C?,vr?)` | 한 겹 | `vr` 로 z 절단 |
| `hyperboloid2(a,b,c,C?,vr?)` | 두 겹 | `vr` 부호로 위/아래 겹 |
| `cone(k, C?, vr?)` | 이중 원뿔 `z²=k²(x²+y²)` | |
| `cylinder(r, C?, zr?)` | 원기둥 | |

모두 `surfaceParam` 을 상속하므로 `.wire(nu,nv)` / `.solid(nu,nv)` / `.cmap('viridis')`
/ `.color()` / `.opacity()` 를 그대로 씁니다.

### 4.3 `circle3(r, z?, C?)` — 3D 원호

```js
circle3(2, 1)            // 반지름 2, 높이 z=1, 원점 중심
circle3(1.5, 0, [2, -3, 1])
```

### 4.4 `frame3(xlim, ylim, zlim)` — 보이지 않는 프레이밍 상자

```js
scene().dim(3).axes(false)
  .add(...axes3({ length: 2 }), frame3([-2, 2], [-2, 2], [-2, 2]), point(0, 0, 0).dot());
```

* `ax.set_xlim/ylim/zlim` 대응. **아무것도 그리지 않고** 뷰 범위에만 참여합니다
  (점 하나만 있는 그림에서 축이 화면 밖으로 나가는 걸 막는 용도).
* 상자 8개 꼭짓점을 프레이밍 후보로 씁니다(`toIR()` 이 빈 배열).

### 4.5 mplot3d 대응 요약

| matplotlib | logos |
|---|---|
| `add_subplot(projection='3d')` | `scene().dim(3)` / `kit.plot3d()` |
| `ax.view_init(elev, azim)` | `camera({ elev, azim })` |
| `ax.set_box_aspect([4,4,3])` | `camera({ aspect: [1,1,0.75] })` |
| `ax.set_axis_off()` + 화살표 3개 | `.axes(false)` + `axes3()` |
| `ax.set_xlim/ylim/zlim` | `frame3([x0,x1],[y0,y1],[z0,z1])` |
| `ax.plot(x,y,z)` | `curve3.parametric(f).on([t0,t1])` / `curve3.through([P,…])` |
| `ax.quiver(...)` | `arrow3(from, to)` |
| `ax.plot_wireframe` | `quadrics.*.wire(nu, nv)` |
| `ax.plot_surface(cmap=…)` | `quadrics.*.solid(nu, nv).cmap('viridis')` |
| `Poly3DCollection([face])` | `surfaceParam(...).solid(1, 1)` (이중선형 패치 1장) |
| `ax.text(x, y, z, s)` | `annotate.text(point(x, y, z))` (자동 투영) |
| `fig.suptitle` / subplots | `subplots([...], { cols, title })` |

---

## 5. 타이포그래피 — 행간과 자간

SVG 의 모든 텍스트는 `backend/fonts.js` 의 **`TYPE` 토큰**을 기본값으로 씁니다.

```js
import { typography } from '@jaywoo0830a/logos';
typography = { lineHeight: 1.32, letterSpacing: 0.01 };
```

| 값 | 의미 | 왜 이 값인가 |
|---|---|---|
| `lineHeight: 1.32` | 여러 줄 라벨(`'가\n나'`)의 줄 간격 배수 | 예전 값 1.15 는 두 줄이 붙어 보였고, matplotlib(≈1.2em)보다 살짝 넉넉하게 |
| `letterSpacing: 0.01em` | 자간(글자 사이) | STIX 세리프는 본문이 빽빽해 13px 글자에서 0.13px 정도의 미세 트래킹 |

적용 방식:

* `<style>` 로 `text,tspan{ letter-spacing:0.01em }` — 전역(수식 `foreignObject` 포함).
* 멀티라인은 `<tspan dy="{fontSize × lineHeight}">` 로 계산 → 글자 크기를 바꿔도 비율 유지.
* 텍스트 배경 상자(`annotate.text(...).box()`)의 높이도 같은 행간으로 계산되어
  **글자와 상자가 어긋나지 않습니다**.

개별 오버라이드(모든 텍스트 도형 공통):

```js
annotate.text(point(1, 1)).label('두 줄\n설명').lineHeight(1.5)   // 행간 배수
annotate.text(point(1, 1)).label('벌려 쓰기').letterSpacing(1.2)  // 자간(px)
```

> 래스터(resvg)에서는 `letter-spacing` 미지원이어도 무해합니다(무시될 뿐).
> 브라우저 SVG 출력이 기준입니다.

---

## 6. 대표 예제 — `examples/`

| 파일 | 내용 | 실행 | 출력 |
|---|---|---|---|
| `examples/mpl_parity_11ab.js` | 11AB · **삼각함수 31 figure**(11A 19 + 11B 12, `example5.py` 재현) | `npm run parity11ab` | `output/parity11a/`, `output/parity11b/` |
| `examples/mpl_parity_9b.js` | Session 9B · **2D 기하 25 figure** (`example1.py` 재현) | `npm run parity9b` | `output/parity9b/` |
| `examples/mpl_parity_9c.js` | Session 9C · **3D 기하 35 figure** (`example2.py` 재현) | `npm run parity9c` | `output/parity9c/` |
| `examples/mpl_parity_12a2.js` | 12A2 · **행렬과 벡터 20 figure** (`example3.py` 재현) | `npm run parity12a2` | `output/parity12a2/` |
| `examples/mpl_parity_12a1.js` | 12A1 · **복소수 12 figure** (`example4.py` 재현) | `npm run parity12a1` | `output/parity12a1/` |
| `examples/plugin_demo.js` + `plugins/geometry-extras.js` | **플러그인 데모 4 figure** — `ray`·`arc.circular`·`hatch` IR 노드·체이닝 확장·테마·훅 (코어 수정 0) | `npm run plugin-demo` | `output/plugin-demo/` |
| `examples/workflow/` | **워크플로우 예제 프로젝트** — `sketches/` 3개 → 7 figure (설치→작성→실행→렌더 · 도커+배시) | `npm run workflow` | `examples/workflow/out/` |
| 여섯 다 | — | `npm run examples` | `*/*.svg`, `*/*.png`, `*/index.html` |

여섯 스크립트는 라이브러리의 **회귀 기준**입니다. 즉 “matplotlib 급 그림을 정말 그릴 수 있는가”를
사람이 눈으로(갤러리) 그리고 기계가(`npm test`) 확인합니다.

`11AB` 는 삼각함수 그림이라 단위원(equal aspect)·`arcAt`/`wedge`·`branchCurves`(극점 절단)·
`curve.fn().on().n(N)`(고주파 샘플) 사용 예가 집중되어 있습니다 — “계산은 `Math`, 그리기는 `Scene`”
이라는 분리도 여기서 잘 보입니다.

`12A2` 는 행렬 그림이라 `mat`/`vec`/`transform.matrix` 사용 예가 집중되어 있습니다 —
“계산은 `linalg`, 그리기는 `Scene`” 이라는 분리도 이 예제에서 가장 잘 보입니다.

```js
// 예: 12A2 의 한 figure — A 의 상(image)과 행렬식을 한 번에
function matrixTransformation2d() {
  const A = mat([[2, 1], [0.5, 1.5]]);
  const quad = A.map(UNIT);                       // 단위정사각형 → 평행사변형
  const right = s2([-0.5, 4], [-0.5, 3.5])
    .title(`Parallelogram (After A), det=${A.det.toFixed(1)}`)
    .add(polyOf(quad, { fill: RED, color: RED_D, opacity: 0.35 }),
         arrowAt([0, 0], A.col(0), { color: RED, stroke: 2.5 }),   // A·e₁
         arrowAt([0, 0], A.col(1), { color: BLUE, stroke: 2.5 })); // A·e₂
  ...
}
```

읽는 순서 추천:

1. 상단 주석의 **figure 목록** → 어떤 그림을 다루는지 파악
2. `const figs = [...]` → 이름 ↔ 함수 대응
3. 각 함수의 첫 줄(`base = plot2d/plot3d`, `subplots`) → 그 figure 의 구성
4. 마지막 `saveFigures(figs, {...})` → 저장 규약

```js
// 예: 9C 의 한 figure — mplot3d 관용구가 그대로 보인다
function paraboloidDetails() {
  const left = plot3d({ elev: 20, azim: -50 }).title('Elliptic Paraboloid  z=x²+2y²')
    .add(...axes3({ length: 3, color: GRAY, width: 0.7 }),
         planeZ((x, y) => x * x + 2 * y * y, [-2, 2], [-2, 2]).wire(20, 20).color(B));
  ...
  return subplots([left, right], { cols: 2, title: 'Elliptic Paraboloid — The 3D Bowl', tight: true });
}
```

갤러리 서버로 훑어보기:

```bash
npm run examples && npm run serve     # http://localhost:18080/ → 대표 예제 갤러리
```

---

## 7. 자주 하는 실수 (FAQ)

**Q. 패널이 서로 겹쳐요.**
`subplots()`/`panels()` 를 쓰고 `cell` 을 직접 주지 마세요(자동 = 최댓값).
직접 주는 경우 셀 크기 ≥ 모든 서브씬 `.size()` 여야 합니다.

**Q. `panels()` 에 `Scene` 을 넣었더니 안 돼요.**
`panels()` 는 **컴파일된 SceneIR** 만 받습니다. `kit.subplots()` 를 쓰면 자동 컴파일됩니다.

**Q. PNG 에 수식이 안 보여요.**
KaTeX 는 SVG `foreignObject` 로 들어가는데 resvg 래스터에서는 사라집니다.
`saveFigures(..., { math: 'text' })`(기본값)로 두면 LaTeX 를 유니코드 텍스트로 근사합니다.
수식 품질이 필요하면 SVG 를 그대로 쓰세요.

**Q. 3D 그림이 이상하게 잘려요.**
프레이밍은 도형들의 투영 bbox + 8% 여백으로 자동 계산됩니다.
점 하나·축만 있는 그림처럼 “빈 상자”가 필요하면 `frame3(...)` 로 범위를 못박으세요.

**Q. 3D 자동축 눈금이 마음에 안 들어요.**
`.axes(false)` 로 끄고 `axes3()` 로 직접 그리는 편이 mplot3d 와 더 비슷합니다(예제의 기본).

**Q. 라벨이 서로 겹쳐요.**
`scene.layout()` 을 켜면 텍스트 충돌을 그리디하게 회피합니다(기본 꺼짐).
`annotate.text(...).offset(dx, dy)` 로 픽셀 단위 미세 조정도 가능합니다.

**Q. y 눈금만 끄고 싶어요.**
`axes({ y: { ticks: false } })` (6차에서 추가 — mpl `ax.set_yticks([])` 대응).
`x` 도 같은 방식으로 끌 수 있고, `label: false` 는 축 **라벨**만 끕니다.
`kit.plot2d(xr, yr, { axes: {...} })` 로도 그대로 전달됩니다.

**Q. 점선 화살표/테두리 다각형이 필요해요.**
`.dash([6, 4])` 를 쓰면 됩니다 — `annotate.arrow` · `vector` · `polygon` · `segment` ·
`curve` 전부 `stroke-dasharray` 로 나갑니다(6차에서 화살표·다각형 보완).

**Q. 행렬을 도형에 바로 적용할 수 있나요?**
`transform.matrix(A)` 를 `.apply()` 하세요. 배열·`mat()` 행렬 둘 다 받습니다.
좌표를 손으로(`A.apply(p)`) 옮겨 새 도형을 만드는 쪽이 프레이밍이 더 정확하지만,
강조 도형(변환된 정사각형·기저벡터)에는 `.apply()` 가 짧고 읽기 좋습니다.

**Q. 복소평면(z = a+bi) 그림은 어떻게 그리나요?**
복소수는 **점 `(a, b)`** 입니다 — 계산은 `cplx`, 그리기는 `point`/`segment`/`polygon` 입니다.

```js
const z = cplx(3, 2);
const P = (w) => point(w.re ?? w[0], w.im ?? w[1]);   // cplx → point
scene().view([-1, 5], [-1, 4]).equal().axes()
  .add(arrowAt([0, 0], P(z)),                          // z 를 벡터로
       circle.center(point(0, 0)).radius(z.abs),       // |z| 원
       annotate.angle({ from: [1, 0], vertex: [0, 0], to: P(z) }).arc({ radius: 0.6 }));  // arg z
```

`1/z`(반전+반사)·`zⁿ`(드무아브르)·n제곱근(정n각형)은 `cplx.div`·`z.pow`·`cplx.unity` 로 좌표를
얻은 뒤 그대로 그리면 됩니다 — [`examples/mpl_parity_12a1.js`](examples/mpl_parity_12a1.js) 참고.

**Q. 제목이 눈금 라벨과 겹쳐 보여요.**
7차에서 고쳤습니다. 제목/축 라벨은 데이터 영역 **바깥** 여백에 들어가는데, 예전에는 눈금 라벨과
격자까지 그 여백에 그려져 제목 위에 숫자(`6` 등)가 찍혔습니다. 지금은 눈금·격자가 **데이터 영역
안쪽에만** 그려지고, `y` 축 라벨도 데이터 영역 끝(여백과의 경계)에 붙습니다.
`view` 범위를 그대로 두면 보이는 결과만 달라집니다(코드 수정 불필요).

**Q. 각도 표식(호)이 엉뚱한 곳에 그려져요.**
`annotate.angle(A, B, C)` 는 **가운데 B 가 각의 꼭짓점**입니다(∠ABC). 꼭짓점을 첫 인자로
넘기면 호가 다른 점 위에 그려집니다. 헷갈릴 때는 이름 지정형을 쓰세요 — 순서 실수가 불가능합니다.

```js
annotate.angle({ from: A, vertex: O, to: B }).arc({ radius: 1 })   // 꼭짓점은 O
```

3D 축 화살표 촉이 커 보이면 `axes3({ ratio: 0.06 })`(기본값)보다 더 작게 조절하면 됩니다.
`arrow3` 로 축을 직접 그릴 때도 `.ratio(0.04)` 처럼 촉만 따로 줄일 수 있습니다.

**Q. 직각 표식(`rightAngle()`)이 빈 공간에 떠 보여요.**
직각 표식은 꼭짓점에서 두 광선 **사이**(각의 안쪽)에 그려집니다. 그래서 두 광선 중 하나가 그
지점에 실제로 그려져 있지 않으면 표식만 허공에 뜬 것처럼 보입니다 — 대표적으로 정사영 그림에서
**발(foot)이 벡터 화살표 끝보다 멀리 있는** 경우입니다(벡터 선이 발 너머로 이어져 있지 않음).

```js
const proj = vec.project(a, b);          // |proj| > |b| 이면 발이 b 화살표 끝을 넘어간다
// ① 발 너머까지 b 의 연장선을 그어 발을 '두 선의 모서리'로 만든다 (교과서의 연장선 표기)
segment(P(b), P(vec.add(proj, vec.scale(vec.unit(b), 0.45)))).color(BLUE).stroke(1).dash([3, 3]).opacity(0.5),
// ② 그 다음에 직각 표식 — 이제 두 선 사이에 제자리로 놓인다
annotate.angle({ from: a, vertex: proj, to: vec.add(proj, vec.unit(b)) }).arc({ radius: 0.35 }).rightAngle(),
```

연장선을 그리기 싫으면 **두 선이 모두 그려진 쪽 각**(예: 벡터가 있는 쪽 `to: [0, 0]`)을
표시하는 방법도 있습니다. 다만 그 쪽은 화살촉이 차지하고 있어 표식과 겹쳐 보일 수 있습니다.
실제 예는 [`examples/mpl_parity_12a2.js`](examples/mpl_parity_12a2.js) 11번(정사영) 참고.

---

## 8. 이력 — 무엇이 언제 바뀌었나

### 8.1 7차 요청 (2026-09-11) — 복소수 예제(12A1) + 복소수 계산 계층 `cplx`

* **예제 추가**: `examples/mpl_parity_12a1.js` (`example4.py` 재현, **12 figure**).
  복소평면·극형식 · i 의 거듭제곱 · 켤레 · 덧셈 · 곱(회전+확대) · a+bi ↔ 회전·확대 행렬 ·
  드무아브르 나선 · 1 의 n제곱근 · 1/z 반전+반사 · 이차방정식의 복소근 · 편각의 덧셈 · 복소평면 요약.
* **`complex.js` 신설**: `cplx()`/`Complex` (re·im, `abs`·`arg`·`argDeg`·`conj`·`toPolar`,
  `add/sub/mul/div/scale/neg/pow/roots/equals/toString`) + `cplx.polar/mul/div/pow/roots/unity/
  matrix/conj/abs/arg/round`. `index.js` 에서 `cplx`·`Complex` export.
* **`annotate.arrow().bend(rad)`** (mpl `arc3,rad`): 이차 베지어 `path` 로 그리고 **path 끝에
  화살촉**(`marker-end`)을 붙인다 — 순환/회전 화살표를 한 줄로.
* **`latexToText` 악센트**: `\bar`·`\overline`·`\vec`·`\hat`·`\dot`·`\tilde` 를 **결합 문자**로
  남긴다. 예전에는 중괄호만 벗겨져 `\bar{z}` 가 빈 `{z}`/`NaN` 으로 새어 래스터(PNG) 라벨이 깨졌다.
* **레이아웃: 눈금·격자는 데이터 영역 안쪽에만**(`core/scene.js`). 제목/축라벨용 여백
  (`withMargins`)까지 눈금·격자를 그려서 **제목 위에 눈금 숫자가 겹쳐 찍히던** 문제를 고쳤다.
  축 라벨(`y`)도 여백이 아니라 데이터 영역 끝에 붙는다.
* **7차 후속 수정(같은 날, 사용자 피드백)**:
  * **드무아브르 나선의 각 호가 허공에 떠 보이던 문제**(`12a1` 7번): mpl 은
    `Arc((0,0), 0.6·rⁿ, 0.6·rⁿ)` 인데 Arc 의 폭/높이는 **지름**이라 실제 반지름이 `0.3·rⁿ` —
    호가 나선팔에도 실수축에도 닿지 않았습니다. 호 반지름을 `|zⁿ|` 로 잡아 **호의 한 끝은
    실수축 `(rⁿ, 0)`, 다른 끝은 `zⁿ`** 에 붙게 하고(`mpl 대비`), 호 가운데에 `nθ` 를 라벨했습니다.
  * **`1/z` 반전 그림이 읽히지 않던 문제**(`12a1` 9번) — mpl 의 `ylim(-0.5, 3.5)` 안에 `1/z` 가
    **하나도 들어오지 않아서**(네 점 모두 허수부가 음수) 점들이 좌표축 밖으로 나갔고, 남은 점선만으로는
    규칙 `1/z = z̄/|z|²` 이 읽히지 않았습니다. 대표 점 `z = 2+0.5i` 하나로 **두 단계를 2×2 4컷**으로
    나눠 차례로 보여줍니다 — ① z(원점에서의 벡터, `|z|`·`arg z`) → ② 실축 대칭 `z̄`(길이 그대로,
    각도만 반대) → ③ 반지름만 `÷|z|²`(`z̄` 와 같은 반직선 위, 화살표로 줄어드는 길이 표시) →
    ④ 세 점에서 확인(`|z|·|1/z| = 1`, 밖 ↔ 안).
* **검증**: `npm test` **168 pass / 0 fail**, `npm run examples` 25+35+20+12 figure 생성.

### 8.2 6차 요청 (2026-09-11) — 행렬과 벡터 예제(12A2) + 선형대수 계산 계층

* **예제 추가**: `examples/mpl_parity_12a2.js` (`example3.py` 재현, **20 figure**).
  회전/반사/전단/합성/역행렬 · 내적·정사영·외적 · 3D 부피 · 연립방정식 ·
  행렬 거듭제곱 · 차원 축소 · 격자 변형.
* **`linalg.js` 신설**: `mat()` (apply·det·inv·pow·mul·t·col·map + identity/rotation/
  shear/scaling/reflection) 와 `vec` (add·sub·scale·dot·norm·unit·project·reject·
  cross·angleDeg·det2·areaOf). `index.js` 에서 `mat`·`vec`·`Matrix` export.
* **`transform.matrix()` 확장**: 배열뿐 아니라 `mat()` 이 만든 `Matrix` 도 받는다.
* **화살표·다각형 점선**: `arrow` 노드와 `polygon` 노드가 `stroke-dasharray` 를 방출
  (path/circle 만 지원하던 비대칭 해소).
* **`axes({ y: { ticks: false } })`**: y 눈금을 축별로 끌 수 있다.
* **`kit.plot2d` 버그 수정**: `axes` 옵션에 **객체**를 주면 무시되던 것을 그대로 전달.
* **6차 후속 수정(같은 날, 사용자 피드백)**:
  * **각도 표식 위치**: `annotate.angle(A, B, C)` 는 **가운데 B 가 꼭짓점**인데 꼭짓점을
    첫 인자로 넘겨 호가 엉뚱한 점에 그려지던 예제 실수를 수정. 같은 각을 이름으로 지정하는
    **`annotate.angle({ from, vertex, to })`** 를 추가(`[x, y]` 배열 허용 — 순서 실수 원천 차단),
    점이 아닌 값을 넘기면 즉시 명확한 예외를 던진다.
  * **축 화살표 촉 축소**: `axes3()` 의 `ratio` 기본값을 0.12 → **0.06**(`ratio: null` 이면 0.12).
    축은 길어서 촉만 커 보이는 문제 해소. `9c` 1번 그림의 직접 그린 축 화살표도 `.ratio(0.06)`.
  * **정사영 직각 표식이 빈 공간에 뜨던 문제**(`12a2` 11번): 발(foot)이 b 화살표 끝보다 멀리
    있어(`|b|≈2.06 < |proj|≈4.37`) 표식이 두 선 사이가 아니라 허공에 그려졌습니다. b 의 연장선
    (얇은 점선)을 그어 발을 '두 선의 모서리'로 만들었습니다(`mpl 대비` — 교과서의 연장선 표기).
* **검증**: `npm test` **162 pass / 0 fail**, `npm run examples` 25+35+20 figure 생성.

### 8.3 5차 요청 (2026-09-11) — 예제 정리 · `kit.js` 신설

* **예제 정리**: 대표 예제 2개(`mpl_parity_9b.js`, `mpl_parity_9c.js`)만 남기고
  `adapters.js`·`book.js`·`gallery.js`·`interface.js`·`mpl_parity.js`·`v02.js`·`visual.js` 삭제.
  (삭제된 기능은 `kit.saveFigures({ index: true })` 의 `index.html` 갤러리로 대체)
* **`kit.js` 신설**: `palette` · `plot2d` · `plot3d` · `subplots` · `saveFigure` · `saveFigures`
  · `writeGallery` · `seg` · `poly3`. `index.js` 에서 `export * as kit`.
* **3D 도우미 승격**(`shapes/threeD3.js`): `axes3()` · `quadrics.*` · `circle3()` · `frame3()`
  + `Arrow3.ratio()`.
* **`panels()` 셀 크기 자동화**: `cell` 미지정 시 figure `.size()` 최댓값 사용.
* **타이포그래피**: `TYPE = { lineHeight: 1.32, letterSpacing: 0.01 }` +
  `Drawable.lineHeight()/letterSpacing()` (기본 행간 1.15 → 1.32).
* **문서**: 이 `KIT.md` 신설, `README.md` 신설, `0911-PLAN.md` §7 · `test/COVERAGE.md` 갱신.

