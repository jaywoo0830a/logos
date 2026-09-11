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
import { scene, point, circle, kit } from 'logos';
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
| `axes` | `true` | 축·눈금 |
| `equal` | `false` | 등비 스케일 |

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
---

## 5. 타이포그래피 — 행간과 자간

SVG 의 모든 텍스트는 `backend/fonts.js` 의 **`TYPE` 토큰**을 기본값으로 씁니다.

```js
import { typography } from 'logos';
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
| `examples/mpl_parity_9b.js` | Session 9B · **2D 기하 25 figure** (`example1.py` 재현) | `npm run parity9b` | `output/parity9b/` |
| `examples/mpl_parity_9c.js` | Session 9C · **3D 기하 35 figure** (`example2.py` 재현) | `npm run parity9c` | `output/parity9c/` |
| 둘 다 | — | `npm run examples` | `*/*.svg`, `*/*.png`, `*/index.html` |

두 스크립트는 라이브러리의 **회귀 기준**입니다. 즉 “matplotlib 급 그림을 정말 그릴 수 있는가”를
사람이 눈으로(갤러리) 그리고 기계가(`npm test`) 확인합니다.

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

---

## 8. 이번 리팩터링에서 달라진 점 (2026-09-11, 5차 요청)

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

| `ax.view_init(elev, azim)` | `camera({ elev, azim })` |
| `ax.set_box_aspect([4,4,3])` | `camera({ aspect: [1,1,0.75] })` |
| `ax.set_axis_off()` + 화살표 3개 | `.axes(false)` + `axes3()` |
| `ax.set_xlim/ylim/zlim` | `frame3([x0,x1],[y0,y1],[z0,z1])` |
| `ax.plot(x,y,z)` | `curve3.parametric(f).on([t0,t1])` / `curve3.through([P,…])` |
| `ax.quiver(...)` | `arrow3(from, to)` |
| `ax.plot_wireframe` | `quadrics.*.wire(nu, nv)` |
| `ax.plot_surface(cmap=…)` | `quadrics.*.solid(nu, nv).cmap('viridis')` |
| `ax.text(x, y, z, s)` | `annotate.text(point(x, y, z))` (자동 투영) |
| `fig.suptitle` / subplots | `subplots([...], { cols, title })` |

