#!/usr/bin/env bash
# scripts/render.sh — 스케치 폴더를 그림으로 렌더한다 (워크플로우의 3단계)
#
#   [1] 패키지 설치   scripts/install.sh           (호스트 의존성 / 렌더 이미지)
#   [2] 코드 작성     <project>/sketches/*.js      (`logos new sketches`)
#   [3] 실행          scripts/render.sh            ← 이 스크립트
#   [4] 산출물        <out>/*.svg · *.png · index.html · manifest.json
#
# 기본은 **도커**에서 실행해 호스트 환경을 건드리지 않는다(`--local` 이면 호스트 node).
# 리눅스 전용.
#
# 사용법
#   bash scripts/render.sh                       # ./sketches → ./out
#   bash scripts/render.sh -s src -o build/fig   # 원하는 폴더 지정
#   bash scripts/render.sh -p ~/my-book -s figs -o ~/my-book/pdf-out --serve
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

usage() {
  cat <<'EOF'
사용법: bash scripts/render.sh [옵션]

소스/출력
  -p, --project DIR   프로젝트 루트 (기본: 현재 디렉토리)
  -s, --src DIR       스케치 폴더  (기본: <project>/sketches)
  -o, --out DIR       출력 폴더    (기본: <project>/out)   ← 원하는 위치 지정 가능
  -r, --recursive     하위 폴더까지 검색
  -t, --title TEXT    갤러리 제목

렌더 옵션 (logos render 로 전달)
      --png / --no-png    PNG 생성 여부 (기본: 생성 · 도커 이미지에 resvg 포함)
      --scale N           PNG 배율 (기본 1)
      --no-index          index.html 갤러리 생략
      --clean             이전 생성물(manifest 기준) 삭제 후 렌더
      --dry-run           렌더 없이 figure 목록만
      --json              manifest JSON 을 stdout 으로
  -q, --quiet             진행 로그 최소

실행 환경
      --local             호스트 node 로 실행(도커 사용 안 함)
      --build             렌더 이미지 강제 재빌드
      --live-pkg          패키지 루트를 /opt/logos 로 그대로 마운트(패키지 개발 중 · 리빌드 불필요)
      --install           컨테이너에서 npm install 도 실행(네트워크 · 다른 의존성 필요 시)
      --serve [PORT]      렌더 후 그 자리에서 정적 서버 실행(기본 18080)
  -h, --help              이 도움말

예
  bash scripts/render.sh -s sketches -o out
  bash scripts/render.sh -p ~/my-book -s figs -o /tmp/report --scale 2
  bash scripts/render.sh --local -s . -o out          # 호스트에서 바로
EOF
}

# ── 인자 파싱 ──────────────────────────────────────────────
PROJECT="$PWD"; SRC=''; OUT=''; TITLE=''
RECURSIVE=0; QUIET=0; LOCAL=0; BUILD=0; DO_INSTALL=0; SERVE=0; SERVE_PORT=18080; LIVE_PKG=0
CLI_OPTS=()

# 상대 경로는 **프로젝트 루트 기준**으로 해석한다(`-p` 로 프로젝트를 옮기면 따라간다)
resolve_in_project() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *)  printf '%s\n' "$PROJECT/$1" ;;
  esac
}

while (( $# )); do
  case "$1" in
    -p|--project) PROJECT="$(abspath "$2")"; shift 2 ;;
    -s|--src)     SRC="$2"; shift 2 ;;
    -o|--out)     OUT="$2"; shift 2 ;;
    -t|--title)   TITLE="$2"; CLI_OPTS+=(--title "$2"); shift 2 ;;
    -r|--recursive) RECURSIVE=1; shift ;;
    -q|--quiet)   QUIET=1; CLI_OPTS+=(--quiet); shift ;;
    --png)        CLI_OPTS+=(--png); shift ;;
    --no-png)     CLI_OPTS+=(--no-png); shift ;;
    --scale)      CLI_OPTS+=(--scale "$2"); shift 2 ;;
    --no-index)   CLI_OPTS+=(--no-index); shift ;;
    --clean)      CLI_OPTS+=(--clean); shift ;;
    --dry-run)    CLI_OPTS+=(--dry-run); shift ;;
    --json)       CLI_OPTS+=(--json); shift ;;
    --local)      LOCAL=1; shift ;;
    --build)      BUILD=1; shift ;;
    --live-pkg)   LIVE_PKG=1; shift ;;
    --install)    DO_INSTALL=1; shift ;;
    --serve)      SERVE=1; if [[ "${2:-}" =~ ^[0-9]+$ ]]; then SERVE_PORT="$2"; shift; fi; shift ;;
    -h|--help)    usage; exit 0 ;;
    *)            die "알 수 없는 옵션: $1  (--help)" ;;
  esac
done

require_linux
[[ $RECURSIVE = 1 ]] && CLI_OPTS+=(--recursive)

SRC_ABS="$(resolve_in_project "${SRC:-sketches}")"
OUT_ABS="$(resolve_in_project "${OUT:-out}")"
[[ -d "$PROJECT" ]] || die "프로젝트 폴더가 없습니다: $PROJECT"
[[ -d "$SRC_ABS" ]] || die "스케치 폴더가 없습니다: $SRC_ABS  (bash scripts/install.sh 로 예제 뼈대를 만들 수 있습니다)"

# out 이 프로젝트 밖이면 컨테이너에서도 따로 마운트해야 한다
OUT_INSIDE=0; is_inside "$PROJECT" "$OUT_ABS" && OUT_INSIDE=1
if [[ $LOCAL = 0 && $OUT_INSIDE = 0 ]]; then
  dim "출력 폴더가 프로젝트 밖입니다 → 별도 마운트: $OUT_ABS"
fi
mkdir -p "$OUT_ABS"

SRC_REL="${SRC_ABS#"$PROJECT"/}"

# ── 렌더 ───────────────────────────────────────────────────
if [[ $LOCAL = 1 ]]; then
  # ── 호스트 실행 ──
  step "[3/4] 렌더 (호스트 node · $SRC_ABS → $OUT_ABS)"
  require_node
  link_package "$PROJECT" "$REPO_ROOT"
  if [[ $DO_INSTALL = 1 && -f "$PROJECT/package.json" && "$PROJECT" != "$REPO_ROOT" ]]; then
    dim "npm install ($PROJECT)"
    ( cd "$PROJECT" && npm install --no-audit --no-fund )
  fi
  ( cd "$PROJECT" && node "$REPO_ROOT/bin/logos.mjs" render "$SRC_ABS" --out "$OUT_ABS" "${CLI_OPTS[@]+"${CLI_OPTS[@]}"}" )
else
  # ── 도커 실행 ──
  require_docker
  [[ $BUILD = 1 ]] && FORCE=--force || FORCE=''
  step "[3/4] 렌더 (docker · $SRC_ABS → $OUT_ABS)"
  ensure_image "$IMAGE_REF" "$REPO_ROOT/Dockerfile.render" "${FORCE:-}"

  MOUNTS=(-v "$PROJECT":/work -w /work)
  if [[ $OUT_INSIDE = 1 ]]; then
    OUT_IN_CONTAINER="/work/${OUT_ABS#"$PROJECT"/}"
  else
    MOUNTS+=(-v "$OUT_ABS":/out)
    OUT_IN_CONTAINER=/out
  fi

  # 컨테이너 안에서 ① `logos` 패키지를 프로젝트에 연결(=패키지 설치 단계)하고
  # ② 필요하면 npm install(--install) 한 뒤 ③ CLI 를 실행한다.
  # --live-pkg: 이미지에 구워진 패키지 대신 호스트 패키지 루트를 마운트(패키지 개발용)
  if [[ $LIVE_PKG = 1 ]]; then MOUNTS+=(-v "$REPO_ROOT":/opt/logos); fi
  docker run --rm \
    -u "$(id -u):$(id -g)" \
    -e HOME=/tmp -e npm_config_cache=/tmp/npm-cache \
    -e NO_COLOR="${NO_COLOR:-}" \
    -e LOGOS_INSTALL="$DO_INSTALL" \
    "${MOUNTS[@]}" \
    --entrypoint sh "$IMAGE_REF" -c '
      set -e
      # ① 패키지 연결 (깨진 링크/미설치일 때만) — 이미지 안의 /opt/logos 를 가리킨다.
      #    우리가 만든 링크만 렌더 후 제거해 프로젝트를 깨끗하게 유지한다(깨진 심링크 잔재 방지).
      LINKED=0
      if [ ! -e node_modules/logos/index.js ]; then
        rm -rf node_modules/logos
        mkdir -p node_modules
        ln -sfn /opt/logos node_modules/logos
        LINKED=1
      fi
      # ② 다른 의존성이 필요하면(--install) 설치
      if [ "$LOGOS_INSTALL" = "1" ] && [ -f package.json ]; then
        npm install --no-audit --no-fund
      fi
      # ③ 렌더 (exec 하지 않는다 — 뒤처리로 만든 링크를 되돌려야 하므로)
      set +e
      node /opt/logos/bin/logos.mjs "$@"
      STATUS=$?
      set -e
      if [ "$LINKED" = "1" ]; then
        rm -f node_modules/logos
        rmdir node_modules 2>/dev/null || true
      fi
      exit $STATUS
    ' sh render "$SRC_REL" --out "$OUT_IN_CONTAINER" "${CLI_OPTS[@]+"${CLI_OPTS[@]}"}"
fi

# ── 결과 ───────────────────────────────────────────────────
step "[4/4] 산출물"
if [[ -f "$OUT_ABS/manifest.json" ]]; then
  node -e '
    const m = require(process.argv[1]);
    console.log(`  ${m.ok}개 figure · 형식 ${m.formats.join("/")} · 실패 ${m.fail}`);
    for (const e of m.figures.slice(0, 8)) console.log(`  · ${e.name}`);
    if (m.figures.length > 8) console.log(`  · … 외 ${m.figures.length - 8}개`);
  ' "$OUT_ABS/manifest.json"
fi
log ""
ok "출력 폴더: $OUT_ABS"
dim "  갤러리 열기 : bash scripts/serve.sh '$OUT_ABS' ${SERVE_PORT}"

if [[ $SERVE = 1 ]]; then
  exec bash "$REPO_ROOT/scripts/serve.sh" "$OUT_ABS" "$SERVE_PORT"
fi
