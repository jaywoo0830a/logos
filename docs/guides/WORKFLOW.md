# `@jaywoo0830a/logos` — 워크플로우 (Docker + Bash · 리눅스 전용)

> **패키지 설치 → 지정한 폴더에 코드 작성 → 배시 스크립트 실행 → 원하는 디렉토리에 렌더.**
> 호스트에는 `bash` + `docker` 만 있으면 되고, Node/폰트/래스터라이저는 **이미지 안**에서 해결합니다.
> **리눅스만 지원합니다**(`uname -s` 가 `Linux` 가 아니면 즉시 중단 · 강제하려면 `LOGOS_FORCE_OS=1`).

설치 경로는 두 가지입니다 — **A. npm 패키지**(내 프로젝트에 의존성으로) / **B. 리포지토리 클론**(개발·예제).

```bash
# A. npm 으로 설치한 경우 (권장) ─ 스크립트는 패키지 안에 함께 옵니다
npm install @jaywoo0830a/logos
LOGO=pkg bash "$(npm root)/@jaywoo0830a/logos/scripts/render.sh" -p . -s sketches -o out
npx logos render sketches --out out            # CLI 직접 실행(호스트) — 워크플로 스크립트는 항상 도커

# B. 리포지토리를 클론한 경우
bash scripts/render.sh -p . -s sketches -o out
```

아래 예시는 편의상 **B(클론)** 기준으로 `bash scripts/…` 표기를 씁니다.
npm 설치(A)에서는 같은 자리에
`bash "$(npm root)/@jaywoo0830a/logos/scripts/…"`, CLI 는 `node bin/logos.mjs` → `npx logos` 입니다.

```
① 이미지 준비          bash scripts/install.sh             (단일 이미지 · 최초 1회)
② 코드 작성            sketches/hello.js          (logos new sketches 로 뼈대 생성)
③ 배시 스크립트 실행    bash scripts/render.sh -s sketches -o out
④ 산출물 렌더          out/{*.svg, *.png, index.html, manifest.json}
                       브라우저 확인: bash scripts/serve.sh out 18080
```

---

## 1. 5분 안에

```bash
git clone <repo> logos && cd logos

# ① 단일 이미지 빌드 (최초 1회, 2~3분) — 렌더·서빙·테스트에 필요한 모든 것이 안에 들어 있다
bash scripts/install.sh

# ② 스케치 폴더 만들기 (뼈대 + 예제 1장) — 이미지의 CLI 로(호스트 Node 불필요)
docker run --rm -u "$(id -u):$(id -g)" -v "$PWD":/work logos:0.4.0 new sketches

# ③ 렌더 — 항상 도커에서 실행, 산출물만 호스트로 나온다
bash scripts/render.sh -s sketches -o out

# ④ 확인
bash scripts/serve.sh out 18080        # → http://localhost:18080/
```

`out/` 안에는 항상 다음이 함께 나옵니다.

| 파일            | 내용                                                                  |
| --------------- | --------------------------------------------------------------------- |
| `<이름>.svg`    | 벡터 결과(브라우저·인쇄·LaTeX 삽입용)                                 |
| `<이름>.png`    | 래스터 미리보기(`@resvg/resvg-js` · 이미지에 포함)                    |
| `index.html`    | **갤러리** — 만든 figure 를 한 번에 훑어보기                          |
| `manifest.json` | 생성 시각 · figure 목록 · 실패 목록(CI 에서 파싱 · `--clean` 의 기준) |

---

## 2. 폴더 배치

```
my-project/
  sketches/            ← ② 여기에 .js 를 쓴다 (폴더 이름은 자유 · -s 로 지정)
    hello.js
    gallery.js
  out/                 ← ④ 산출물 (원하는 위치 · -o 로 지정, 절대경로도 가능)
  package.json         ← logos new 가 만들어 준다(패키지 의존성 포함)
```

`-s/-o` 는 **상대 경로면 프로젝트 루트(`-p`) 기준**입니다. 프로젝트 밖으로 내보내려면
절대경로를 주세요(컨테이너에서 `/out` 으로 따로 마운트됩니다).

```bash
bash scripts/render.sh -p ~/my-book -s figs -o /tmp/report --scale 2
```

---

## 3. 스케치 계약 (파일 하나 = 그림 1장 이상)

```js
import { scene, point, curve, annotate, tex, panels } from '@jaywoo0830a/logos';

// (선택) 갤러리에 보일 이름
export const title = '단위원과 각';

// ① 그림 1장 — Scene · SceneIR · () => Scene 모두 허용
export default scene().equal().axes().add(point(1, 1).dot());
```

한 파일에서 여러 장을 내려면:

```js
// ② 객체 형식 — 키가 파일 이름이 된다
export const figures = {
  'fig-a': () => scene().add(/* … */),
  'fig-b': scene().add(/* … */),
};

// ③ 배열 형식 — [이름, 그림, 제목]
export const figures = [['fig-c', () => panels([a, b], { cols: 2 }), '두 장 합치기']];
```

| 규칙          | 내용                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| 파일          | `.js` / `.mjs` · `_`·`.` 으로 시작하면 무시 · `*.test.js` 는 무시              |
| 하나도 없으면 | 경고만 남기고 건너뜀(다른 파일은 계속 렌더)                                    |
| 예외 발생     | 그 figure 만 실패로 집계(`manifest.errors`)하고 **나머지는 렌더** · 종료코드 1 |
| `-r`          | 하위 폴더까지 검색(`node_modules` 제외)                                        |

**코어 수정이 필요한 기능은 플러그인으로** 붙입니다 — [`PLUGIN.md`](../extend/PLUGIN.md).
패키지에 동봉된 플러그인은 subpath 로 바로 씁니다.

```js
import { use, plugins } from '@jaywoo0830a/logos';
import extras from '@jaywoo0830a/logos/plugins/geometry-extras.js'; // ray · arc.circular · hatch …
use(extras, { watermark: true });
```

---

## 4. 스크립트 레퍼런스

### `scripts/install.sh` — ① 이미지 준비 (단일 이미지)

```bash
bash scripts/install.sh                 # 단일 이미지 빌드 (렌더·서빙·테스트 공용 · Dockerfile)
bash scripts/install.sh --force         # 강제 재빌드
bash scripts/install.sh --project ~/my-book   # + 프로젝트에 logos 연결(node_modules/logos · 호스트 node)
bash scripts/install.sh --host-npm      # + 호스트에서도 npm install (기여자용)
```

> 이미지는 **하나**입니다(이전 `--docker` / `--dev` 는 같은 이미지를 빌드하는 호환 옵션).

### `scripts/render.sh` — ③ 렌더 (핵심)

```bash
bash scripts/render.sh [-p DIR] [-s DIR] [-o DIR] [옵션]
```

| 옵션                   | 뜻                                                                            |
| ---------------------- | ----------------------------------------------------------------------------- |
| `-p, --project DIR`    | 프로젝트 루트(기본: 현재 폴더). 상대 `-s/-o` 의 기준                          |
| `-s, --src DIR`        | 스케치 폴더(기본 `sketches`)                                                  |
| `-o, --out DIR`        | **출력 디렉토리**(기본 `out`) — 원하는 위치 지정                              |
| `--png` / `--no-png`   | PNG 생성 여부(기본 생성)                                                      |
| `--scale N`            | PNG 배율                                                                      |
| `--no-index`           | 갤러리 생략                                                                   |
| `--clean`              | 이전 생성물(manifest 기준) 삭제 후 렌더 · **사용자 파일은 보존**              |
| `--dry-run`            | 렌더 없이 figure 목록만                                                       |
| `--json`               | manifest JSON 을 stdout(순수 JSON · CI 용)                                    |
| `-r`, `-t TITLE`, `-q` | 하위 폴더 / 갤러리 제목 / 조용히                                              |
| `--build`              | 렌더 이미지 강제 재빌드                                                       |
| `--live-pkg`           | 패키지 루트를 `/opt/logos` 로 마운트(패키지 자체를 고치는 중 · 리빌드 불필요) |
| `--install`            | 컨테이너에서 `npm install` 도 실행(다른 의존성 필요 시)                       |
| `--serve [PORT]`       | 렌더 후 바로 서버 실행(기본 18080)                                            |

### `scripts/serve.sh` — ④ 확인 (항상 도커)

```bash
bash scripts/serve.sh [폴더] [포트] [--host H]
```

### `scripts/test.sh` — 테스트 (항상 도커)

```bash
bash scripts/test.sh [--build]
```

### `scripts/build-image.sh` — 단일 이미지 빌드만

```bash
bash scripts/build-image.sh [--force] [--pull]
```

---

## 5. 도커는 이렇게 돌아간다

```
                      호스트(리눅스)                 컨테이너 logos:0.4.0
  bash scripts/render.sh
        │
        ├─ docker build (없을 때만, Dockerfile)
        │
        └─ docker run --rm -u $(id -u):$(id -g) \
             -v "$PROJECT":/work -w /work \
             [-v "$OUT":/out]                     # 산출물이 프로젝트 밖이면 추가 마운트
             logos:0.4.0 sh -c '
               ① ln -s /opt/logos node_modules/logos   # 패키지 설치(오프라인)
               ② [--install] npm install
               ③ exec node /opt/logos/bin/logos.mjs render <src> --out <out>
             '
```

| 왜 이렇게 하는가                  | 설명                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `-u $(id -u):$(id -g)`            | 산출물이 **호스트 사용자 소유**로 나온다(권한 사고 방지)                                                                 |
| `node_modules/logos → /opt/logos` | 네트워크 없이 "패키지 설치"를 재현(npm `file:` 과 동일 결과) · **렌더 후 제거**해 프로젝트에 깨진 심링크를 남기지 않는다 |
| 이미지에 폰트 포함                | PNG 래스터에서 텍스트가 네모(□)로 깨지지 않게                                                                            |
| 패키지는 이미지에 스냅샷          | 재현성 확보. 패키지를 고쳤으면 `--build` 또는 `--live-pkg`                                                               |

`docker compose` 를 쓰는 환경이라면 `docker-compose.yml` 의 `render` / `render-serve` 서비스도 있습니다
(`UID=$(id -u) GID=$(id -g) docker compose run --rm render -s sketches -o out`).

---

## 6. 자주 겪는 것 (FAQ)

**Q. `Cannot find package '@jaywoo0830a/logos'` 가 난다** — 스케치 폴더에 패키지가 연결되지 않았습니다.
`bash scripts/install.sh --project <폴더>` 로 연결하거나, `bash scripts/render.sh`(도커)를 쓰면
컨테이너가 자동으로 연결합니다. (CLI 도 같은 안내를 출력합니다.)

**Q. PNG 가 안 나온다** — `@resvg/resvg-js` 가 없거나 플랫폼 바이너리가 없을 때입니다.
SVG 는 정상 생성되고 경고만 남습니다. 렌더 이미지에는 resvg 가 포함되어 있으니 `bash scripts/render.sh`(도커)를 쓰면 해결됩니다.

**Q. 산출물이 root 소유다** — compose 를 쓸 때 `user:` 를 지정하지 않았을 수 있습니다.
`UID=$(id -u) GID=$(id -g) docker compose run …` 또는 `bash scripts/render.sh`(기본 경로)를 쓰세요.

**Q. PNG 에서 한글이 □(네모)로 나온다** — 래스터(resvg)가 시스템 폰트를 못 찾은 경우입니다.
`backend/fonts.js` 가 `fontDirs: /usr/share/fonts` 를 넘겨 글리프 폴백을 켜고,
`Dockerfile` 는 `fonts-nanum`(한글)을 포함합니다. 이미지가 오래됐다면
`bash scripts/render.sh --build` 로 다시 빌드하세요. (SVG 는 폰트 폴백이 브라우저에 맡겨지므로 원래 정상입니다.)

**Q. 빌드를 다시 하고 싶다** — `bash scripts/render.sh --build`, `bash scripts/install.sh --force`,
`LOGOS_BUILDKIT=1`(캐시 활용) 중 아무거나. 패키지 **이름/버전이 바뀌면** 이미지가 stale 이 되어
스케치 `import` 가 깨지는데, 이미지 라벨(`logos.pkg`·`logos.version`)을 현재 패키지와 비교해
**자동으로 다시 빌드**합니다(그래서 이름을 바꿔도 그냥 실행하면 됩니다).
또는 `bash scripts/build-image.sh --force`.

**Q. 호스트에 Node 가 없다** — 그대로 두세요. 렌더·서빙·테스트 모두 도커에서 실행되므로
호스트엔 `bash` + `docker` 만 있으면 됩니다(Node·npm 불필요).

**Q. 오프라인/프록시 환경** — `scripts/install.sh` 는 `npm install` 을 호스트에서
한 번만 하고, 렌더는 오프라인으로 동작합니다(패키지 심링크).

**Q. CI 에서 쓰고 싶다** — `--json` 으로 결과를 받아 `fail` 을 검사하세요.

```bash
bash scripts/render.sh -s sketches -o out --json | jq -e '.fail == 0'
```

---

## 7. 검증된 것

- `test/cli.test.js`(8개) — `--help`/`--version`/오류코드, `new` 뼈대, **원하는 디렉토리 렌더**(SVG/갤러리/manifest),
  한 파일 다장(객체·배열), `logos/plugins/*` subpath, 예외 스케치의 부분 실패(exit 1),
  `--dry-run`·`--clean`(사용자 파일 보존), 스크립트 `--help`/문법.
- 수동 확인(리눅스) — `scripts/render.sh`(도커) 7 figure,
  산출물 소유권 `user:user`, SVG `NaN` 0, `scripts/serve.sh` → `GET /` 200 · `GET /hello.svg` 200.
- 예제 프로젝트 [`examples/workflow/`](../../examples/workflow/) 가 이 4단계를 그대로 재현합니다.
