# `logos` — 수학 그림을 코드로 쓰는 DSL

> "선생님이 칠판에 그리듯이, 저자는 원고지에 쓰듯이."
>
> 점 하나 찍는 코드가 교과서 그림 한 장이 되고, 같은 코드가 SVG · PNG · TikZ ·
> Asymptote · JSXGraph 로 나옵니다. 순수 JavaScript(Node ESM), 3D 기하 포함.

```js
import { scene, point, circle, kit } from './index.js';

const fig = kit.plot2d([-3, 3], [-3, 3], { equal: true })
  .title('원 위의 점과 반지름')
  .add(
    circle.center(point(0, 0)).radius(2).color(kit.palette.blue).stroke(2),
    kit.seg(point(0, 0), point(2, 0), { dash: [4, 3] }),   // 반지름(직선)
    point(2, 0).dot().label('P'),
  );

await kit.saveFigures([['radius', () => fig, '원 위의 점과 반지름']],
  { dir: 'output/demo', index: true });
```

---

## 1. 문서 지도

| 문서 | 무엇을 담고 있나 |
|---|---|
| **`README.md`** (이 문서) | 저장소 안내 — 실행 방법·구조·검증 |
| [`KIT.md`](KIT.md) | **예제/그림 작성 가이드** — `kit.js`, 3D 도우미, `linalg`(행렬·벡터), 타이포그래피(행간·자간) |
| [`DSL.md`](DSL.md) | 언어 스펙 — Scene/도형/주석/영역, IR, 백엔드 파이프라인 |
| [`INTERFACE.md`](INTERFACE.md) | 사용자 코드 미리보기(읽히는 코드 모음) |
| [`SENARIOS.md`](SENARIOS.md) | 검증 시나리오 A–L (초·중·고 / 미적분 / 3D) |
| [`ADAPT.md`](ADAPT.md) | 외부엔진 어댑터 — SymPy · Asymptote · TikZJax · JSXGraph · KaTeX |
| [`PLUGIN.md`](PLUGIN.md) | **플러그인(체이너블 확장) 아키텍처** — 코어 수정 없이 기능을 붙이는 8가지 확장 지점 |
| [`0911-PLAN.md`](0911-PLAN.md) | 작업 계획·이력(무엇을 왜 바꿨는지) |
| [`test/COVERAGE.md`](test/COVERAGE.md) | 테스트 커버리지 매트릭스 |

---

## 2. 설치 · 실행

```bash
npm install
npm test              # 전체 테스트 (185개)
npm run examples      # 대표 예제 5개 + 플러그인 데모 → output/parity11a, parity11b, parity9b, parity9c, parity12a2, parity12a1, plugin-demo
npm run serve         # http://localhost:18080/  (렌더 갤러리)
```

| 스크립트 | 설명 |
|---|---|
| `npm test` | 단위 + 시나리오 + 불변식 + 스냅샷 + 백엔드 + 플러그인 (총 185) |
| `npm run parity11ab` | 삼각함수 **31 figure**(11A 19 + 11B 12) 재현 — `output/parity11a`, `output/parity11b` |
| `npm run parity9b` / `parity9c` / `parity12a2` / `parity12a1` | 2D 기하 25 / 3D 기하 35 / 행렬과 벡터 20 / 복소수 12 figure 재현 |
| `npm run plugin-demo` | **플러그인 데모 4 figure**(코어 수정 0 — `ray`·`arc.circular`·`hatch` 노드·체이닝 확장) — `output/plugin-demo` |
| `npm run examples` | 위 여섯을 연속 실행 |
| `npm run snap:update` | 골든 SVG 스냅샷 재생성(`test/fixtures/`, 로컬 전용) |
| `npm run serve` | `output/` 정적 서버(갤러리 + SVG/PNG) |
| `npm run test:svg` | SENARIOS SVG 문자열 회귀만 |

Docker(선택): `docker compose up web` → 같은 갤러리 서버,
`docker compose run --rm logos` → 컨테이너 안에서 `npm test`.

---

## 3. 예제 (`examples/`)

대표 예제 5개 + 플러그인 데모 1개만 유지합니다 — 전부 "matplotlib 그림을 logos 로 재현"하거나
"코어 수정 없이 확장"하는 회귀 기준입니다.

* **`plugin_demo.js`** — **플러그인 데모 4 figure**. `plugins/geometry-extras.js` 를 `use()` 한 것만으로
  `ray`(반직선) · `arc.circular`(원호) · `hatch`(사선 음영 — 새 IR 노드, SVG+TikZ) ·
  체이닝 확장(`.tilt/.dashed/.arrowTip`) · `point.byDeg` · `theme('chalk')` ·
  SVG 훅(워터마크) · `scene.title` 래핑을 씁니다. **코어 파일 수정 0줄** → [`PLUGIN.md`](PLUGIN.md)

* **`mpl_parity_11ab.js`** — 삼각함수 **31 figure** (`example5.py` 재현 · 11A 19 + 11B 12)
  (라디안 정의 · 특수각 · 단위원에서 sin/cos/tan · 그래프 4종 · 역삼각함수 ·
   변환 5단계 · arcsin(sin θ) · 합공식 기하 · 조화합성 · 맥놀이 · 오일러 공식 ·
   바이어슈트라스 치환 · 체비쇼프 · 삼각방정식 · 사인/코사인 법칙 …)

* **`mpl_parity_9b.js`** — Session 9B, 2D 기하 **25 figure**
  (직선의 다섯 표현 · 단계별 작도 · 평행/수직 · 원뿔곡선 · 매개곡선 · 신발끈 …)
* **`mpl_parity_9c.js`** — Session 9C, 3D 기하 **35 figure**
  (좌표계 · 평면/법선 · 구 · 등위곡선 · 이차곡면 총람 · 교선 · 단계별 작도 …)
* **`mpl_parity_12a2.js`** — 12A2, **행렬과 벡터** **20 figure**
  (선형변환 · 행렬식 · 합성/역행렬 · 회전/반사/전단 · 내적/정사영/외적 ·
  3D 부피 · 연립방정식 · 행렬의 거듭제곱 · 차원 축소 · 격자 변형 …)
* **`mpl_parity_12a1.js`** — 12A1, **복소수** **12 figure**
  (복소평면·극형식 · i 의 거듭제곱 · 켤레 · 덧셈 · 곱 = 회전+확대 ·
  a+bi ↔ 회전·확대 행렬 · 드무아브르 나선 · 1 의 n제곱근 · 1/z 반전+반사 ·
  이차방정식의 복소근 · 편각의 덧셈 · 복소평면 요약)

```bash
npm run examples
open output/parity11a/index.html    # 19개 갤러리 (삼각함수 11A)
open output/parity11b/index.html    # 12개 갤러리 (삼각함수 11B)
open output/parity12a2/index.html    # 20개 갤러리 (행렬과 벡터)
open output/parity12a1/index.html    # 12개 갤러리 (복소수)
```

작성 방법은 [`KIT.md`](KIT.md) 를 보세요.

---

## 4. 저장소 구조

```
index.js            공개 API 진입점 (scene/shapes/annotate/tex/kit/use/plugins …)
kit.js              예제 작성 키트 (palette·plot2d·plot3d·subplots·saveFigures…)
plugin_demo.js →    플러그인 데모 (examples/) · plugins/geometry-extras.js (코어 수정 0 확장 예시)
linalg.js           행렬 · 벡터 수치 도우미 (mat · vec) — 행렬과 벡터 그림의 계산
complex.js          복소수 수치 도우미 (cplx · Complex) — 복소평면 그림의 계산
core/               Scene · IR 노드 · Drawable 프로토콜 · plugin.js(체이너블 확장 레지스트리)
shapes/             2D/3D 도형 — point line curve circle ellipse parabola …
                    threeD.js(x) threeD2.js(입체) threeD3.js(곡선/곡면: curve3·arrow3·
                    surfaceParam·axes3·quadrics·circle3·frame3)
solver/             좌표·교점 계산 (순수 함수)
symbolic/           sym·tex (심볼릭/LaTeX)
backend/            SVG · TikZ · Asymptote · TikZJax · JSXGraph · KaTeX · hidden-line …
annotate.js         각도·정적분·화살표·치수·텍스트 주석
transform.js        회전·평행이동·반사·스케일·행렬(matrix)
plugins/            배포/예시 플러그인 (geometry-extras.js — ray·arc·hatch·체이닝·테마·훅)
test/               단위/시나리오/불변식/스냅샷/백엔드/플러그인 + 공용 씬(scenes.js)
examples/           대표 예제 5개 + 플러그인 데모 (11AB 삼각함수 · 9B 2D · 9C 3D · 12A2 · 12A1 · plugin-demo)
output/             렌더 산출물(재생성 가능, git 추적 제외)
```

---

## 5. 무엇이 검증되나

| 층 | 내용 |
|---|---|
| 결정성 | 같은 씬 → 같은 문자열(렌더 단위 id 리셋) |
| 기하 불변식 | 원/타원/implicit/영역/샘플링, 라벨이 캔버스 안 |
| 시나리오 | SENARIOS A–L(48) + 1.md(50) + `example1/2/3/4/5.py` 재현(25+35+20+12+31) |
| 백엔드 정합 | TikZ/Asymptote/JSXGraph/KaTeX/PNG |
| 확장성 | 플러그인 8종(빌더·체이닝·IR 노드·테마·훅·래핑·정적·되돌리기) + 미등록 안내 + 원복 격리 |
| 스냅샷 | 골든 SVG 문자열 비교(`npm run snap:update`) |

---

## 6. 정리 이력 (2026-09-11)

**9차** — **플러그인(체이너블 확장) 아키텍처** `core/plugin.js` 신설. 기능이 없거나 부족할 때
코어를 고치는 대신 `use(plugin)` 한 줄로 붙입니다 — ① 체이닝 메서드(`extend`/`chain`)
② 새 빌더(`define` — `index.js` 의 미구현 스텁 `ray`·`arc`·`sector` 가 등록 즉시 살아남)
③ **새 IR 노드 + SVG/TikZ emitter(`node` — 백엔드 무수정)** ④ 테마 ⑤ 파이프라인 훅
(`ir`·`ir:svg`·`svg`·`tikz`) ⑥ 기존 메서드 래핑(`around`) ⑦ 네임스페이스 정적 ⑧ 되돌리기.
체이닝 규칙은 **"패치 객체를 반환하면 자동 `this.set()` / Drawable 을 반환하면 그대로 통과"** 라
`this.set` 을 몰라도 체인이 끊기지 않습니다. 미등록 이름은 등록 방법을 안내하는 `PluginError` 로
실패하고(`ray(...)`), 예시 플러그인 `plugins/geometry-extras.js`(8종 전부)와
`npm run plugin-demo`(**4 figure**, 코어 수정 0줄), `test/plugin.test.js`(**17개**)를 함께 넣었습니다.
자세한 내용은 [`PLUGIN.md`](PLUGIN.md) 참고.

**8차** — `example5.py`(삼각함수 11A·11B) 재현 예제 `examples/mpl_parity_11ab.js` 추가 —
**31 figure**(11A 19 + 11B 12). 단위원 그림에서 **원이 타원으로 그려지던 문제**(패널 4곳의
`equal: true` 누락)를 고쳤고, π 눈금 라벨이 패널 경계에서 잘리던 문제는 `piTickAt(xr, k, y)`
헬퍼(경계 라벨은 안쪽 정렬)로 해결했습니다. 라벨 겹침 4곳(11A 9·16, 11B 2·3)은 mpl도 겹치는
자리라 읽히도록 이동했습니다. mpl→logos 번역 규칙 4개(유니코드 평문 라벨 · `legendAt` 색 라벨 ·
`branchCurves()`(극점 구간 절단 + ±8 클램프) · 고주파 `curveOf(..., { n: 400~600 })`)를
예제 헤더에 문서화했습니다. 자세한 내용은 [`KIT.md §6`](KIT.md) 참고.

**7차** — `example4.py`(12A1 복소수) 재현 예제 `examples/mpl_parity_12a1.js`(**12 figure**) 추가,
계산 계층 `complex.js`(`cplx`·`Complex`) 신설 — `cplx.matrix(z)` 가 `[[a, −b], [b, a]]` 를 돌려주므로
12A1(복소수)과 12A2(행렬과 벡터)가 같은 `mat`/`vec` 층을 공유합니다.
`annotate.arrow().bend(rad)`(mpl `arc3,rad`) 곡선 화살표 — path 끝 화살촉(`marker-end`),
`latexToText` 가 `\bar`·`\vec` 같은 악센트를 결합 문자로 남기도록 수정(래스터 폴백 라벨의 `NaN`/`{z}` 제거).
레이아웃 수정 — 제목/축라벨용 여백(`withMargins`)에 눈금 라벨·격자가 찍혀 **제목과 겹치던 문제**를
고쳤습니다(눈금·격자는 데이터 영역 안쪽에만). `12a1` 9번(`1/z` 반전+반사)은 규칙이 읽히지 않던
mpl 원본을 **2×2 4컷 단계별**(① z → ② 실축 대칭 → ③ 반지름 반전 → ④ 확인)로 다시 그렸습니다.
자세한 내용은 [`KIT.md §8`](KIT.md) 참고.

**6차** — `example3.py`(12A2 행렬과 벡터) 재현 예제 `examples/mpl_parity_12a2.js`(**20 figure**) 추가,
계산 계층 `linalg.js`(`mat`·`vec`) 신설, `transform.matrix()` 가 `mat()` 행렬도 받도록 확장,
`arrow`/`polygon` 노드의 점선(`stroke-dasharray`) 보완, `axes({ y: { ticks: false } })` 추가,
`kit.plot2d` 의 `axes` 객체 옵션 버그 수정.
후속 수정 — 각도 표식이 엉뚱한 곳에 그려지던 문제를 고치고 이름 지정형
`annotate.angle({ from, vertex, to })` 를 추가, 3D 축 화살표 촉(`axes3` 의 `ratio`) 기본값을
0.12 → 0.06 으로 줄였습니다. 정사영 그림(11번)의 직각 표식이 빈 공간에 떠 보이던 것은
발(foot) 너머로 b 의 연장선을 그어 고쳤습니다. 자세한 내용은 [`KIT.md §8`](KIT.md) 참고.

**5차** — 조잡했던 옛 예제(`adapters.js` `book.js` `gallery.js` `interface.js` `mpl_parity.js`
`v02.js` `visual.js`)을 삭제하고, 공통 부분을 `kit.js` 로 승격했습니다.
갤러리는 `kit.saveFigures({ index: true })` 가 대신 만듭니다. 자세한 내용은
[`KIT.md §8`](KIT.md) 참고.

## License

MIT
