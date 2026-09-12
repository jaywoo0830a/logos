# 변경 이력 (Changelog)

이 프로젝트는 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 규칙과
[유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

## [Unreleased]

## [0.4.0] — 2026-09-12

**이미지를 하나로 통합**했습니다 — 렌더·서빙·테스트·개발이 모두 `logos:<버전>` **단일 이미지**에서
동작합니다. 사용자는 이미지를 한 번 받고 코드만 쓰면 됩니다.

> 참고: 통합 이미지는 이전 "렌더 슬림" 이미지보다 큽니다(한글/수학 폰트 + SymPy/Asymptote 포함).
> 대신 "설치 한 번 → 코드 작성 → 렌더" 로 단순해집니다.

### Changed

- **단일 `Dockerfile`** — 폰트(한글·수학) + SymPy/Asymptote + 모든 의존성(dev 포함)을 담아
  렌더·서빙·테스트·포맷을 한 이미지로 처리합니다.
- **이미지 이름** — `logos:<버전>`(기본). `LOGOS_IMAGE_NAME`·`LOGOS_IMAGE_TAG` 로 바꿀 수 있습니다.
- **`scripts/install.sh`** — 기본 동작이 "단일 이미지 빌드"가 되었습니다. 호스트 `npm install` 은
  `--host-npm` 로 선택(기여자용). `--docker`/`--dev`/`--skip-npm` 은 호환용으로 계속 받습니다.
- **`scripts/build-image.sh`** — 이미지 하나만 빌드(`--render`/`--dev`/`--both` 는 호환 옵션).
- **`docker-compose.yml`** — 4개 서비스(`web`·`logos`·`render`·`render-serve`)가 같은 이미지를 공유합니다.

### Removed

- **`Dockerfile.render`**(렌더 전용 슬림 이미지)와 `logos-builder` 개발 이미지 — 단일 `Dockerfile` 로 대체.
  `scripts/lib/common.sh` 의 `BUILDER_IMAGE` 도 제거.

## [0.3.0] — 2026-09-12

**워크플로우(테스트·렌더·서빙)를 전부 도커 컨테이너로 통일**하고, **prettier 3.9.6** 으로 저장소 전체를
포맷했습니다. 출력(그림) 자체는 변하지 않습니다 — 전체 테스트 통과.

### Changed

- **렌더 도커 전용** — `scripts/render.sh` 의 `--local`(호스트 node) 경로를 제거했습니다. 렌더는 항상
  `Dockerfile.render` 이미지에서 실행되어 Node·폰트·래스터라이저가 고정됩니다(결과가 일정).
- **서빙 도커 전용** — `scripts/serve.sh` 가 항상 컨테이너에서 서빙합니다(`--docker` 불필요, 호스트 node 불필요).
- **테스트도 도커** — `npm test` 가 `scripts/test.sh` 를 통해 개발 이미지에서 실행됩니다. 호스트에서 바로
  돌리려면 `npm run test:unit`.
- **공통 라이브러리** — `scripts/lib/common.sh` 가 package.json 을 `node` 없이(`sed`) 읽어 호스트 Node 의존을
  제거했고, 이미지 태그를 **패키지 버전**에서 자동 유도합니다(`logos-render:0.3.0`). 하드코딩 `0.1.0` 제거.
- **`docker-compose.yml`** 이미지 태그를 `LOGOS_IMAGE_TAG`(기본 0.3.0)로 정리, 테스트 서비스는 `test:unit` 사용.

### Added

- **`scripts/test.sh`** — 개발 이미지에서 테스트 실행(스냅샷 골든은 이미지에 없어 자동 skip).
- **prettier 3.9.6**(devDependency · 정확 버전) + `.prettierrc.json` + `.prettierignore`,
  `npm run format` / `npm run format:check`. 저장소 전체(.js·.mjs·.json·.md·.yml)를 포맷했습니다.
  런타임 의존성은 늘지 않습니다(의존성 0 원칙 유지).

## [0.2.0] — 2026-09-12

`FEEDBACK.md`(모던 JS 기반 구문·DX 제안)의 **A·B 항목**을 반영하고, 아직 배포되지 않았던
눈금 라벨 정밀도·축 눈금 길이 수정·CLI 다중 대상까지 함께 담은 마이너 릴리즈입니다.
출력은 결정적 그대로이며(스냅샷 123 figure 포함 전체 테스트 통과), 새 문법은 모두 기존 API 위의
얇은 별칭입니다. C(실험)·D(비권장) 항목은 반영하지 않았습니다.

mathbook(`math/graph/phase2` — 미분 해석) 실사용에서 올라온 피드백 반영. 기존 그림 출력은 변하지 않습니다
(스냅샷 포함 전체 테스트 통과).

### Added

- **`toPoint()` 좌표 정규화(B1)** — 배열 · `{x, y[, z]}` · `Point` 를 어디서나 받습니다.
  이제 `point([1,2])`(예전엔 조용히 `[[1,2]]` 로 뭉갰습니다), `annotate.text([x,y])`,
  `segment([x,y], [x,y])`, `line.through([x,y], [x,y])`, `vector.between([..], [..])` 가 자연스럽게 동작합니다.
- **태그드 템플릿 `xy` · `range` · `view`(B3)** — 교재 문맥을 코드에 그대로:
  `xy\`3, 4\``·`range\`0..10 step 2\``·`view\`x∈[-3, 3] y∈[-1, 4]\``. (파서 없음 — 좁은 문법, 실패 시 안내)
- **`Drawable#with(changes)`(B4)** — "뮤테이션"처럼 들리는 `set()` 의 별칭(불변 업데이트).
- **`Segment#ends`(B2)** — `const [a, b] = segment(A, B).ends`. (`Point#x/#y/#z` 게터는 기존)
- **`SceneIR` 이터레이터(A7)** — `[...ir]` · `for (const n of ir)` 로 IR 노드를 바로 순회합니다.
- **눈금 라벨 정밀도** — `fmtTick` 이 **눈금 간격(step)** 에서 소수 자릿수를 유도합니다.
  좁은 범위(예: y ∈ [2.019, 2.031], step 0.002)에서 눈금 12개가 전부 '2.02' 로 뭉개지던 문제가
  사라집니다(→ 2.02·2.021·…·2.03). 축별 재정의: `axes({ y: { decimals: 3 } })`,
  `axes({ y: { format: (v) => … } })`. step 을 못 주는 곳(극좌표 반지름)은 예전과 같은 2자리.
- **`sphere.rings(n|false)` · `sphere.meridians(n)`** — 위선(가로 원) 개수(기본 7)와
  경선(세로 반원) 개수(기본 0)를 제어합니다. 껍질·실루엣 도식에서 "동전 더미" 위선을 끌 수 있습니다.
- **CLI `render` 다중 대상** — 폴더뿐 아니라 **파일**도, 여러 대상도 받습니다
  (`logos render sketches/a.js sketches/b.js --out out`). 셸이 펼친 glob 도 그대로 동작합니다.
- **CLI `--layout`** — 컴파일 전에 `scene.layout()`(라벨 자동 배치)을 켭니다.
- **`kit.palette.tab`** — tab10 을 이름으로 접근합니다(`palette.tab.blue`). `palette.tab10` 배열은 그대로.

### Changed

- **`add()` / `addAll()` 평탄화(B5)** — `scene().add([a, b])` 처럼 배열을 통째로 넘겨도 됩니다.
  예전에는 배열이 그대로 IR 에 들어가 "그림이 안 나오는" 조용한 실패를 냈습니다.
- **중첩 설정 깊은 복사(A4)** — `box`·`marker`·`gradient`·`labelOff` 등은 `set()` 에서 복제합니다.
  `const BOX = {…}` 같은 상수를 여러 그림이 공유해도 한 곳의 변경이 전부를 오염시키지 않습니다.
- **CLI 스케치 탐색 단순화(A2)** — `fs.readdir(dir, { recursive })` 로 수동 재귀(20줄)를 대체했습니다.
  정렬은 상대 경로 기준으로 결정적이며, `node_modules`·`.`·`_` 접두 규칙은 그대로입니다.
- **비파괴 정렬(A3)** — `backend/layout.js` 가 `items.toSorted(...)` 를 써서 넘겨받은 배열을 변형하지 않습니다.
- **DX(A1 · A7 · B6)** — `import.meta.dirname` 로 보일러플레이트 정리(9곳), `inspect.custom` 한 줄 요약
  (`Scene(2D, shapes: 1, view: …)`), JSDoc `@returns {this}`, `jsconfig` target `ES2023` + `include` 확대.

### Fixed

- **축 눈금 길이가 데이터 종횡비에 끌려가던 문제** — `axesIR()` 이 x·y 눈금 길이를
  `max(spanX, spanY)` 하나로 잡아, 가로로 긴 플롯(예: x 0..50, y 0..1 급수 그림)에서
  세로 눈금이 캔버스 높이의 절반까지 자라 패널 밖으로 삐져나왔습니다.
  이제 눈금은 **자기 선분에 수직인 축**의 범위에 비례하며, 화면 길이는 데이터 범위와
  무관하게 캔버스 크기의 2.4% 로 고정됩니다. 회귀 테스트는 `test/invariants.test.js`
  “P0-6 축 눈금 길이가 데이터 종횡비와 무관”.
- **자동 라벨 배치가 눈금을 피합니다** — `backend/layout.js` 가 축 눈금·축 라벨(z<0)을 **고정 장애물**로
  취급합니다. 이전에는 회피 대상에서 빠져 있어 켜도 어노테이션이 눈금 위에 겹쳤습니다(눈금은 밀지 않습니다).
- **`kit.seg` 좌표 배열** — 2D 에서 `[x, y]` 배열을 주면 컴파일 때 `shapes/line.js` 의 `pointDir` 에서
  `TypeError` 로 죽던 문제를 고쳤습니다(`point` 객체와 동일한 출력).

## [0.1.0] — 2026-09-11

첫 공개 배포. `example1.py` ~ `example5.py`(2D 기하 · 3D 기하 · 행렬과 벡터 · 복소수 · 삼각함수)
재현 123 figure 와 검증 시나리오 A–L · 1.md 를 회귀 기준으로 삼았습니다.

### Added

- **DSL 코어** — `scene`(Scene/IR) · 도형 2D/3D(`point` `line` `curve` `circle` `ellipse`
  `parabola` `hyperbola` `polygon` `region` `vector` `vectorfield` `threeD`/`threeD2`/`threeD3`) ·
  주석(`annotate`: 각도·정적분·화살표·치수·텍스트) · 변환(`transform`) · 스프라이트(`sprite`).
- **백엔드** — SVG(기본) · PNG(resvg, 선택) · TikZ · Asymptote · TikZJax · JSXGraph · KaTeX ·
  은선 제거(hidden-line). 같은 씬에서 동시 출력.
- **작성 키트** `kit.js` — `palette` · `plot2d`/`plot3d` · `subplots` · `saveFigures`(갤러리
  `index.html` 자동 생성) · 타이포그래피(행간·자간).
- **계산 계층** — `linalg.js`(`mat`·`vec`) · `complex.js`(`cplx`·`Complex`) · `symbolic/`(`sym`·`tex`).
- **플러그인 아키텍처** `core/plugin.js` (의존성 0) — 8개 확장 지점
  (`extend`/`chain` · `define` · `node`(새 IR 노드 + SVG/TikZ emitter) · `theme` · `hook` · `around` ·
  `static` · `uninstall`). 예시 플러그인 `plugins/geometry-extras.js`
  (`ray` · `arc.circular` · `hatch` · 체이닝 확장 · `point.byDeg` · `chalk` 테마 · 워터마크 훅).
- **CLI** `bin/logos.mjs` (`logos`) — `new`(뼈대 생성) · `render`(스케치 폴더 → 출력 디렉토리) ·
  `serve` · `list` · `--out`/`--scale`/`--png`/`--json`/`--dry-run`/`--clean`/`--recursive`.
- **워크플로우(도커+배시, 리눅스)** `scripts/`(`install.sh` · `render.sh` · `serve.sh` ·
  `build-image.sh`) + `Dockerfile.render`(슬림 이미지 · 한글/수학 폰트 · resvg · ENTRYPOINT=`logos`)
  - `docker-compose.yml` 서비스. 설치 → 작성 → 실행 → 렌더 4단계.
- **문서** — `README.md` · `KIT.md`(그림 작성 가이드) · `DSL.md`(언어 스펙) · `INTERFACE.md` ·
  `PLUGIN.md` · `WORKFLOW.md`.
- **테스트 194개** (`node --test`) — 단위 · 시나리오(SENARIOS A–L · 1.md · py 재현) · 기하 불변식 ·
  백엔드 정합 · 플러그인 17 · CLI 8 · 골든 SVG 스냅샷.

### Fixed

- `equal: true` 인 패널에서 **원이 타원으로** 그려지던 문제.
- π 눈금 라벨이 패널 경계에서 **잘리던** 문제(`piTickAt` — 경계 라벨은 안쪽 정렬).
- 제목/축 라벨용 여백에 눈금·격자가 찍혀 **제목과 겹치던** 문제.
- 래스터 폴백 라벨의 `NaN`/`{z}` — `\bar`·`\vec` 등 악센트를 결합 문자로 변환.
- **도커에서 한글 라벨이 □(tofu)로 깨지던** 문제 — resvg 에 `fontDirs`
  (`/usr/share/fonts`)를 넘겨 글리프 폴백을 켜고 이미지에 `fonts-nanum` 추가.
- 각도 표식이 엉뚱한 위치에 그려지던 문제(이름 지정형 `annotate.angle({ from, vertex, to })` 추가).
- 도커 실행이 프로젝트에 컨테이너 경로 심링크(`node_modules/logos`)를 남기던 문제.
- CLI `--json` 출력에 진행 로그가 섞이던 문제, `process.exit()` 로 파이프 stdout 이 잘리던 문제,
  `-s/-o` 상대 경로가 cwd 기준이던 문제(→ 프로젝트 기준).

[Unreleased]: https://github.com/jaywoo0830a/logos/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jaywoo0830a/logos/releases/tag/v0.1.0
