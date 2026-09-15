# `@jaywoo0830a/logos` — 수학 그림을 코드로 쓰는 DSL

[![npm](https://img.shields.io/npm/v/@jaywoo0830a/logos.svg)](https://www.npmjs.com/package/@jaywoo0830a/logos)
[![license](https://img.shields.io/npm/l/@jaywoo0830a/logos.svg)](LICENSE)
![node](https://img.shields.io/node/v/@jaywoo0830a/logos.svg)

> "선생님이 칠판에 그리듯이, 저자는 원고지에 쓰듯이."
>
> 점 하나 찍는 코드가 교과서 그림 한 장이 되고, 같은 코드가 SVG · PNG · TikZ ·
> Asymptote · JSXGraph 로 나옵니다. 순수 JavaScript(Node ESM), 3D 기하 포함.

```js
import { scene, point, circle, kit } from '@jaywoo0830a/logos';

const fig = kit
  .plot2d([-3, 3], [-3, 3], { equal: true })
  .title('원 위의 점과 반지름')
  .add(
    circle.center(point(0, 0)).radius(2).color(kit.palette.blue).stroke(2),
    kit.seg(point(0, 0), point(2, 0), { dash: [4, 3] }), // 반지름(직선)
    point(2, 0).dot().label('P'),
  );

await kit.saveFigures([['radius', () => fig, '원 위의 점과 반지름']], { dir: 'output/demo', index: true });
```

---

## 1. 문서 지도

문서는 **성격별로 `docs/` 아래 다섯 갈래**로 나뉩니다. 스펙·가이드는 안정 문서, `process/` 는
일회성 이력·제안입니다.

```
docs/
  guides/   KIT.md · WORKFLOW.md        ← 그림을 쓰는 법 (작성·실행)
  spec/     DSL.md · INTERFACE.md       ← 언어 · API 계약 (무엇이 있는가)
  extend/   PLUGIN.md · ADAPT.md        ← 코어 밖 확장 (플러그인 · 외부엔진)
  testing/  SCENARIOS.md · TEXTBOOK.md · COVERAGE.md
                                        ← 검증 기준 (무엇을 통과해야 하는가)
  process/  0911-PLAN.md · FEEDBACK.md  ← 작업 이력 · DX 제안 (비-스펙)
```

| 문서                                                     | 무엇을 담고 있나                                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **`README.md`** (이 문서)                                | 저장소 안내 — 실행 방법·구조·검증                                                               |
| [`docs/guides/KIT.md`](docs/guides/KIT.md)               | **예제/그림 작성 가이드** — `kit.js`, 3D 도우미, `linalg`(행렬·벡터), 타이포그래피(행간·자간)   |
| [`docs/guides/WORKFLOW.md`](docs/guides/WORKFLOW.md)     | **워크플로우(도커+배시, 리눅스 전용)** — 설치 → 작성 → 실행 → 렌더 4단계, CLI/스크립트 레퍼런스 |
| [`docs/spec/DSL.md`](docs/spec/DSL.md)                   | 언어 스펙 — Scene/도형/주석/영역, IR, 백엔드 파이프라인                                         |
| [`docs/spec/INTERFACE.md`](docs/spec/INTERFACE.md)       | 사용자 코드 미리보기(읽히는 코드 모음)                                                          |
| [`docs/extend/PLUGIN.md`](docs/extend/PLUGIN.md)         | **플러그인(체이너블 확장) 아키텍처** — 코어 수정 없이 기능을 붙이는 8가지 확장 지점             |
| [`docs/extend/ADAPT.md`](docs/extend/ADAPT.md)           | 외부엔진 어댑터 — SymPy · Asymptote · TikZJax · JSXGraph · KaTeX                                |
| [`docs/testing/SCENARIOS.md`](docs/testing/SCENARIOS.md) | 검증 시나리오 A–L (초·중·고 / 미적분 / 3D)                                                      |
| [`docs/testing/TEXTBOOK.md`](docs/testing/TEXTBOOK.md)   | 수학 원서 50 시나리오 (Stewart / Strang / Ross / Serra …)                                       |
| [`docs/testing/COVERAGE.md`](docs/testing/COVERAGE.md)   | 테스트 커버리지 매트릭스                                                                        |
| [`docs/process/0911-PLAN.md`](docs/process/0911-PLAN.md) | 작업 계획·이력(무엇을 왜 바꿨는지)                                                              |
| [`docs/process/FEEDBACK.md`](docs/process/FEEDBACK.md)   | 구문·DX 제안(코드 변경 없는 제안 모음)                                                          |
| [`CHANGELOG.md`](CHANGELOG.md)                           | 버전별 변경 이력 (Keep a Changelog)                                                             |
| [`LICENSE`](LICENSE)                                     | MIT                                                                                             |

---

## 2. 설치 · 실행

### 2.1 라이브러리로 쓰기 (npm · 권장)

```bash
npm install @jaywoo0830a/logos         # Node ≥ 24 · ESM 전용 (CommonJS require 불가)
npx logos new sketches                 # 스케치 뼈대 생성 (sketch.js + package.json)
npx logos render sketches --out out    # → out/{*.svg, *.png, index.html, manifest.json}
npx logos render sketches --out out --scale 2 --no-png --clean
```

```js
// sketches/sketch.js — 폴더 안의 *.js 를 전부 렌더합니다
import { kit, point, circle } from '@jaywoo0830a/logos';

export const figures = [
  [
    'radius',
    () =>
      kit
        .plot2d([-3, 3], [-3, 3], { equal: true })
        .add(circle.center(point(0, 0)).radius(2), point(2, 0).dot().label('P')),
  ],
];
```

- PNG 출력은 선택입니다 — `@resvg/resvg-js`(선택 의존성)가 설치돼 있으면 자동으로 켜집니다
  (`--no-png` 로 끌 수 있습니다). SVG 는 의존성 없이 항상 나옵니다.
- 플러그인은 `@jaywoo0830a/logos/plugins/geometry-extras.js` 처럼 하위 경로로 가져옵니다.
- **에디터 자동완성** — 패키지에 타입 정의(`types/`, JSDoc 에서 생성)가 포함돼 있어
  VS Code 등에서 `kit.` · `circle.` · `annotate.` 뒤에 붙을 메서드가 툴팁과 함께
  자동완성으로 보입니다. TS 프로젝트는 물론 순수 JS(`checkJs` 없이)에서도 동작합니다.
- **런타임 안내 `help()`** — 코드에서 바로 물어보세요. `help()` 는 모듈 지도와
  "직접 만들기 전에 확인할 대조표"를, `help('circle')` 은 그 이름의 정적 메서드와
  확장 지점을 보여줍니다. `api()` 는 같은 내용을 객체로 돌려줍니다.

### 2.2 리포지토리에서 (개발 · 예제 재현 · 도커 워크플로)

```bash
git clone https://github.com/jaywoo0830a/logos.git && cd logos
npm install
npm test              # 전체 테스트를 도커에서 (210개)
npm run format        # prettier 3.9.6 로 전체 포맷
npm run examples      # 대표 예제 5개 + 플러그인 데모 → output/…
npm run workflow      # 워크플로우 4단계(도커+배시) → examples/workflow/out
npm run serve         # http://localhost:18080/  (렌더 갤러리 · 도커)
```

| 스크립트                                                      | 설명                                                                                                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                    | **도커에서** 단위 + 시나리오 + 불변식 + 스냅샷 + 백엔드 + 플러그인 + CLI (총 210) · 호스트에서 돌리려면 `npm run test:unit`                  |
| `npm run format`                                              | prettier 3.9.6 로 전체 포맷 (`format:check` 는 검사만)                                                                                       |
| `npm run parity11ab`                                          | 삼각함수 **31 figure**(11A 19 + 11B 12) 재현 — `output/parity11a`, `output/parity11b`                                                        |
| `npm run parity9b` / `parity9c` / `parity12a2` / `parity12a1` | 2D 기하 25 / 3D 기하 35 / 행렬과 벡터 20 / 복소수 12 figure 재현                                                                             |
| `npm run plugin-demo`                                         | **플러그인 데모 4 figure**(코어 수정 0 — `ray`·`arc.circular`·`hatch` 노드·체이닝 확장) — `output/plugin-demo`                               |
| `npm run clean-code`                                          | **API별 최소 예제 30개**(`examples/clean-code/` · 각 예제는 별도 프로세스) — `output/clean-code/<예제이름>/`                                 |
| `npm run workflow`                                            | **워크플로우 4단계**(도커+배시 · 리눅스) — `examples/workflow/sketches` → `examples/workflow/out` ([`WORKFLOW.md`](docs/guides/WORKFLOW.md)) |
| `npm run render`                                              | `bash scripts/render.sh` (스케치 폴더 → 원하는 출력 디렉토리)                                                                                |
| `npm run serve:out`                                           | `bash scripts/serve.sh out 18080` (렌더 결과를 브라우저로)                                                                                   |
| `npm run examples`                                            | 위 여섯을 연속 실행                                                                                                                          |
| `npm run snap:update`                                         | 골든 SVG 스냅샷 재생성(`test/fixtures/`, 로컬 전용)                                                                                          |
| `npm run serve`                                               | `output/` 정적 서버(갤러리 + SVG/PNG · 도커)                                                                                                 |
| `npm run test:svg`                                            | SCENARIOS SVG 문자열 회귀만                                                                                                                  |

Docker(선택): **이미지 하나**로 전부 처리합니다 — `docker compose up web`(갤러리 서버),
`docker compose run --rm logos`(테스트), `docker compose run --rm render`(렌더).

npm 설치 사용자도 패키지에 `scripts/` · `Dockerfile` 이 함께 오므로 4단계 워크플로를
그대로 쓸 수 있습니다 — `bash "$(npm root)/@jaywoo0830a/logos/scripts/render.sh" -p . -s sketches -o out`
([`WORKFLOW.md`](docs/guides/WORKFLOW.md)).

---

## 3. 예제 (`examples/`)

`examples/` 는 **목적별 네 폴더**로 나뉩니다 — 회귀 기준(parity·plugin)과 학습용(clean-code·
workflow)이 섞이지 않습니다.

```
examples/
  parity/      mpl_parity_*.js       ← matplotlib 그림 재현 (회귀 기준 123 figure)
  plugin/      plugin_demo.js        ← 플러그인 데모 (코어 수정 0)
  clean-code/  01…30 … + run-all.js  ← API별 최소 사용 예 (학습 · `npm run clean-code`)
  workflow/    sketches/             ← 설치→작성→실행→렌더 재현 프로젝트
```

- **`examples/plugin/plugin_demo.js`** — **플러그인 데모 4 figure**. `plugins/geometry-extras.js` 를 `use()` 한 것만으로
  `ray`(반직선) · `arc.circular`(원호) · `hatch`(사선 음영 — 새 IR 노드, SVG+TikZ) ·
  체이닝 확장(`.tilt/.dashed/.arrowTip`) · `point.byDeg` · `theme('chalk')` ·
  SVG 훅(워터마크) · `scene.title` 래핑을 씁니다. **코어 파일 수정 0줄** → [`PLUGIN.md`](docs/extend/PLUGIN.md)

- **`examples/parity/mpl_parity_11ab.js`** — 삼각함수 **31 figure** (`example5.py` 재현 · 11A 19 + 11B 12)
  (라디안 정의 · 특수각 · 단위원에서 sin/cos/tan · 그래프 4종 · 역삼각함수 ·
  변환 5단계 · arcsin(sin θ) · 합공식 기하 · 조화합성 · 맥놀이 · 오일러 공식 ·
  바이어슈트라스 치환 · 체비쇼프 · 삼각방정식 · 사인/코사인 법칙 …)

- **`examples/parity/mpl_parity_9b.js`** — Session 9B, 2D 기하 **25 figure**
  (직선의 다섯 표현 · 단계별 작도 · 평행/수직 · 원뿔곡선 · 매개곡선 · 신발끈 …)
- **`examples/parity/mpl_parity_9c.js`** — Session 9C, 3D 기하 **35 figure**
  (좌표계 · 평면/법선 · 구 · 등위곡선 · 이차곡면 총람 · 교선 · 단계별 작도 …)
- **`examples/parity/mpl_parity_12a2.js`** — 12A2, **행렬과 벡터** **20 figure**
  (선형변환 · 행렬식 · 합성/역행렬 · 회전/반사/전단 · 내적/정사영/외적 ·
  3D 부피 · 연립방정식 · 행렬의 거듭제곱 · 차원 축소 · 격자 변형 …)
- **`examples/parity/mpl_parity_12a1.js`** — 12A1, **복소수** **12 figure**
  (복소평면·극형식 · i 의 거듭제곱 · 켤레 · 덧셈 · 곱 = 회전+확대 ·
  a+bi ↔ 회전·확대 행렬 · 드무아브르 나선 · 1 의 n제곱근 · 1/z 반전+반사 ·
  이차방정식의 복소근 · 편각의 덧셈 · 복소평면 요약)
- **`examples/clean-code/`** — API를 하나씩 익히는 **최소 예제 30개**(`01-point-and-coords.js` …
  `30-plugins-extend.js`)와 러너. `npm run clean-code` 로 전부 실행 → `output/clean-code/`.

```bash
npm run examples
open output/parity11a/index.html    # 19개 갤러리 (삼각함수 11A)
open output/parity11b/index.html    # 12개 갤러리 (삼각함수 11B)
open output/parity12a2/index.html    # 20개 갤러리 (행렬과 벡터)
open output/parity12a1/index.html    # 12개 갤러리 (복소수)
```

작성 방법은 [`KIT.md`](docs/guides/KIT.md) 를 보세요.

---

## 4. 저장소 구조

```
index.js            공개 API 진입점 (scene/shapes/annotate/tex/kit/use/plugins …)
bin/logos.mjs       CLI — new(뼈대) · render(스케치 폴더 → 출력 디렉토리) · serve · list
scripts/            배시 워크플로우(리눅스) — install.sh · render.sh · serve.sh · test.sh · build-image.sh
Dockerfile          단일 이미지 — 폰트(한글/수학)+SymPy/Asymptote+의존성 · /opt/logos · ENTRYPOINT = logos
kit.js              예제 작성 키트 (palette·plot2d·plot3d·subplots·saveFigures…)
docs/               문서 — guides/(작성·워크플로) · spec/(언어·API) · extend/(플러그인·어댑터)
                    · testing/(시나리오·커버리지) · process/(계획·제안)
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
examples/           목적별 4폴더 — parity/(mpl 재현 123) · plugin/(데모) · clean-code/(학습 30)
                    · workflow/(설치→렌더 재현)
output/             렌더 산출물(재생성 가능, git 추적 제외)
```

---

## 5. 무엇이 검증되나

| 층          | 내용                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------- |
| 결정성      | 같은 씬 → 같은 문자열(렌더 단위 id 리셋)                                                           |
| 기하 불변식 | 원/타원/implicit/영역/샘플링, 라벨이 캔버스 안                                                     |
| 시나리오    | SCENARIOS A–L(48) + TEXTBOOK(50) + `example1/2/3/4/5.py` 재현(25+35+20+12+31)                      |
| 백엔드 정합 | TikZ/Asymptote/JSXGraph/KaTeX/PNG                                                                  |
| 확장성      | 플러그인 8종(빌더·체이닝·IR 노드·테마·훅·래핑·정적·되돌리기) + 미등록 안내 + 원복 격리             |
| 워크플로우  | CLI(`new`/`render`/`serve`) + 배시·도커 4단계(설치 → 작성 → 실행 → 렌더) — 임시 프로젝트 실제 실행 |
| 스냅샷      | 골든 SVG 문자열 비교(`npm run snap:update`)                                                        |

---

## 6. 정리 이력 (2026-09-11)

**11차** — **npm 배포 준비**(스코프 패키지 `@jaywoo0830a/logos`). npm 의 `logos` 는 이미 선점되어
(`logos@1.0.4`) 스코프로 배포합니다. `package.json` 메타데이터(영문 설명 · keywords · author ·
repository/bugs/homepage · `publishConfig.access=public` · `prepublishOnly: npm test` ·
`prepack`(비스코프 이름 배포 차단))와 `LICENSE`(MIT) · `CHANGELOG.md`(Keep a Changelog),
`exports`(`kit.js`·`linalg.js`·`core/*.js`·`backend/*.js` …)와 `files` 화이트리스트를 보강했습니다.
이름 하드코딩을 걷어내 `bin/logos.mjs` 가 `package.json` 의 name 으로 뼈대(`new`)의 import 경로 ·
의존성 키 · 안내문을 만들고, `scripts/`·`render.sh`(컨테이너) · `test/cli.test.js` 의 심링크 경로도
패키지 이름 기준입니다. **실제 tarball 설치**(`npm i ./…tgz` → `npx logos new/render`)로
SVG+PNG+갤러리+manifest 까지 검증했습니다(68 files · 719 kB). 자세한 절차는 [`README.md §7`](README.md).

**10차** — **워크플로우(도커+배시, 리눅스 전용)** 를 넣었습니다 — “패키지 설치 → 지정 폴더에 코드 작성
→ 배시 스크립트 실행 → 원하는 디렉토리에 렌더”. `bin/logos.mjs` CLI(`new` 뼈대 생성 ·
`render` 스케치 폴더 → 출력 디렉토리 · `serve` · `list` · `--json`/`--dry-run`/`--clean`)와
`scripts/` 4종(`install.sh` · `render.sh` · `serve.sh` · `build-image.sh`, 공통 `lib/common.sh`),
`Dockerfile`(단일 이미지 · 폰트+SymPy/Asymptote+resvg · `/opt/logos` · ENTRYPOINT = `logos`), 예제 프로젝트
`examples/workflow/`(스케치 3개 → 7 figure), 테스트 `test/cli.test.js`(8개)를 추가했습니다.
도커 실행은 `-u $(id -u):$(id -g)` 로 산출물 소유권을 유지하고, 컨테이너 안에서
`node_modules/logos → /opt/logos` 심링크로 “패키지 설치”를 오프라인 재현합니다.
산출물은 `<out>/{*.svg, *.png, index.html, manifest.json}`. 자세한 내용은 [`WORKFLOW.md`](docs/guides/WORKFLOW.md) 참고.

**9차** — **플러그인(체이너블 확장) 아키텍처** `core/plugin.js` 신설. 기능이 없거나 부족할 때
코어를 고치는 대신 `use(plugin)` 한 줄로 붙입니다 — ① 체이닝 메서드(`extend`/`chain`)
② 새 빌더(`define` — `index.js` 의 미구현 스텁 `ray`·`arc`·`sector` 가 등록 즉시 살아남)
③ **새 IR 노드 + SVG/TikZ emitter(`node` — 백엔드 무수정)** ④ 테마 ⑤ 파이프라인 훅
(`ir`·`ir:svg`·`svg`·`tikz`) ⑥ 기존 메서드 래핑(`around`) ⑦ 네임스페이스 정적 ⑧ 되돌리기.
체이닝 규칙은 **"패치 객체를 반환하면 자동 `this.set()` / Drawable 을 반환하면 그대로 통과"** 라
`this.set` 을 몰라도 체인이 끊기지 않습니다. 미등록 이름은 등록 방법을 안내하는 `PluginError` 로
실패하고(`ray(...)`), 예시 플러그인 `plugins/geometry-extras.js`(8종 전부)와
`npm run plugin-demo`(**4 figure**, 코어 수정 0줄), `test/plugin.test.js`(**17개**)를 함께 넣었습니다.
자세한 내용은 [`PLUGIN.md`](docs/extend/PLUGIN.md) 참고.

**8차** — `example5.py`(삼각함수 11A·11B) 재현 예제 `examples/parity/mpl_parity_11ab.js` 추가 —
**31 figure**(11A 19 + 11B 12). 단위원 그림에서 **원이 타원으로 그려지던 문제**(패널 4곳의
`equal: true` 누락)를 고쳤고, π 눈금 라벨이 패널 경계에서 잘리던 문제는 `piTickAt(xr, k, y)`
헬퍼(경계 라벨은 안쪽 정렬)로 해결했습니다. 라벨 겹침 4곳(11A 9·16, 11B 2·3)은 mpl도 겹치는
자리라 읽히도록 이동했습니다. mpl→logos 번역 규칙 4개(유니코드 평문 라벨 · `legendAt` 색 라벨 ·
`branchCurves()`(극점 구간 절단 + ±8 클램프) · 고주파 `curveOf(..., { n: 400~600 })`)를
예제 헤더에 문서화했습니다. 자세한 내용은 [`KIT.md §6`](docs/guides/KIT.md) 참고.

**7차** — `example4.py`(12A1 복소수) 재현 예제 `examples/parity/mpl_parity_12a1.js`(**12 figure**) 추가,
계산 계층 `complex.js`(`cplx`·`Complex`) 신설 — `cplx.matrix(z)` 가 `[[a, −b], [b, a]]` 를 돌려주므로
12A1(복소수)과 12A2(행렬과 벡터)가 같은 `mat`/`vec` 층을 공유합니다.
`annotate.arrow().bend(rad)`(mpl `arc3,rad`) 곡선 화살표 — path 끝 화살촉(`marker-end`),
`latexToText` 가 `\bar`·`\vec` 같은 악센트를 결합 문자로 남기도록 수정(래스터 폴백 라벨의 `NaN`/`{z}` 제거).
레이아웃 수정 — 제목/축라벨용 여백(`withMargins`)에 눈금 라벨·격자가 찍혀 **제목과 겹치던 문제**를
고쳤습니다(눈금·격자는 데이터 영역 안쪽에만). `12a1` 9번(`1/z` 반전+반사)은 규칙이 읽히지 않던
mpl 원본을 **2×2 4컷 단계별**(① z → ② 실축 대칭 → ③ 반지름 반전 → ④ 확인)로 다시 그렸습니다.
자세한 내용은 [`KIT.md §8`](docs/guides/KIT.md) 참고.

**6차** — `example3.py`(12A2 행렬과 벡터) 재현 예제 `examples/parity/mpl_parity_12a2.js`(**20 figure**) 추가,
계산 계층 `linalg.js`(`mat`·`vec`) 신설, `transform.matrix()` 가 `mat()` 행렬도 받도록 확장,
`arrow`/`polygon` 노드의 점선(`stroke-dasharray`) 보완, `axes({ y: { ticks: false } })` 추가,
`kit.plot2d` 의 `axes` 객체 옵션 버그 수정.
후속 수정 — 각도 표식이 엉뚱한 곳에 그려지던 문제를 고치고 이름 지정형
`annotate.angle({ from, vertex, to })` 를 추가, 3D 축 화살표 촉(`axes3` 의 `ratio`) 기본값을
0.12 → 0.06 으로 줄였습니다. 정사영 그림(11번)의 직각 표식이 빈 공간에 떠 보이던 것은
발(foot) 너머로 b 의 연장선을 그어 고쳤습니다. 자세한 내용은 [`KIT.md §8`](docs/guides/KIT.md) 참고.

**5차** — 조잡했던 옛 예제(`adapters.js` `book.js` `gallery.js` `interface.js` `mpl_parity.js`
`v02.js` `visual.js`)을 삭제하고, 공통 부분을 `kit.js` 로 승격했습니다.
갤러리는 `kit.saveFigures({ index: true })` 가 대신 만듭니다. 자세한 내용은
[`KIT.md §8`](docs/guides/KIT.md) 참고.

## License

[MIT](LICENSE) © 2026 jaywoo0830a

---

## 7. 배포 (메인테이너)

```bash
npm login                        # @jaywoo0830a 스코프를 소유한 계정
npm test                         # prepublishOnly 가 자동 실행
npm pack --dry-run               # tarball 포함 파일 미리보기 (files 화이트리스트)
npm version patch                # 버전 · 태그 (CHANGELOG.md 도 함께 갱신)
npm publish                      # publishConfig.access=public (스코프 패키지 공개 배포)
```

- 이름이 `@jaywoo0830a/logos` 인 이유 — npm 의 `logos` 는 이미 선점되어 있습니다.
- `prepack` 훅이 스코프 이름이 아닌 상태에서의 배포를 차단합니다.
- 배포 전 체크리스트: `README.md` 상단 예시 import 경로 · `CHANGELOG.md` 최신 항목 ·
  `files` 에 새 디렉토리 포함 여부 · `npm pack --dry-run` 파일 수.
