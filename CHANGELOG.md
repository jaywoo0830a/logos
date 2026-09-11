# 변경 이력 (Changelog)

이 프로젝트는 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 규칙과
[유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

## [Unreleased]

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
  + `docker-compose.yml` 서비스. 설치 → 작성 → 실행 → 렌더 4단계.
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
