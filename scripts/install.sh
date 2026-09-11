#!/usr/bin/env bash
# scripts/install.sh — 워크플로우 1단계: 패키지 설치
#
#   · 기본        : 이 저장소(패키지)의 의존성 설치 + 스케치 폴더 준비 상태 점검
#   · --docker    : 렌더 이미지 빌드 (Dockerfile.render · 리눅스 슬림 · resvg 포함)
#   · --dev       : 개발 이미지 빌드 (Dockerfile · 테스트/서버 · asympy/asymptote 포함)
#   · --project D : 스케치 프로젝트 D 에 `logos` 를 연결(node_modules/logos 심링크)
#
# 리눅스 전용.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

usage() {
  cat <<'EOF'
사용법: bash scripts/install.sh [옵션]

      --project DIR   스케치 프로젝트 폴더(기본: 현재 디렉토리) 에 logos 를 연결
      --docker        렌더 이미지 빌드         (Dockerfile.render · 가벼움 · resvg 포함)
      --dev           개발/테스트 이미지 빌드  (Dockerfile · asympy/asymptote 포함)
      --force         이미지가 있어도 다시 빌드
      --skip-npm      호스트 npm install 생략(도커만 쓸 때)
  -h, --help          이 도움말

예
  bash scripts/install.sh                       # 호스트 의존성 + 점검
  bash scripts/install.sh --docker              # 렌더 이미지 만들기
  bash scripts/install.sh --project ~/my-book   # 프로젝트에 logos 연결
EOF
}

PROJECT=''; DO_DOCKER=0; DO_DEV=0; FORCE=''; SKIP_NPM=0
while (( $# )); do
  case "$1" in
    --project) PROJECT="$(abspath "$2")"; shift 2 ;;
    --docker)  DO_DOCKER=1; shift ;;
    --dev)     DO_DEV=1; shift ;;
    --force)   FORCE=--force; shift ;;
    --skip-npm) SKIP_NPM=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "알 수 없는 옵션: $1  (--help)" ;;
  esac
done

require_linux

# ── ① 호스트 의존성 ────────────────────────────────────────
if [[ $SKIP_NPM = 0 ]]; then
  step "[1/3] 호스트 의존성 설치"
  require_node
  dim "node $(node -v) · npm $(npm -v)"
  ( cd "$REPO_ROOT" && npm install --no-audit --no-fund )
  ok "npm install 완료 ($REPO_ROOT)"
else
  step "[1/3] 호스트 의존성 설치 — --skip-npm 으로 생략"
fi

# ── ② 스케치 프로젝트 연결 ─────────────────────────────────
step "[2/3] 스케치 프로젝트 준비"
PROJECT="${PROJECT:-$PWD}"
if [[ "$PROJECT" == "$REPO_ROOT" ]]; then
  ok "저장소 자체에서 실행 — self-reference 로 '$PKG_NAME' 를 바로 import 할 수 있습니다"
else
  link_package "$PROJECT" "$REPO_ROOT"
  name="$(project_name "$PROJECT" || true)"
  [[ -n "$name" ]] && dim "프로젝트: $name ($PROJECT)"
  if [[ ! -d "$PROJECT/sketches" ]]; then
    warn "스케치 폴더가 없습니다: $PROJECT/sketches"
    dim "  뼈대 생성: node '$REPO_ROOT/bin/logos.mjs' new '$PROJECT/sketches'"
  else
    ok "스케치 폴더 확인: $PROJECT/sketches"
  fi
fi

# ── ③ 도커 이미지(선택) ───────────────────────────────────
step "[3/3] 도커 이미지"
if (( DO_DOCKER || DO_DEV )); then
  require_docker
  if (( DO_DEV )); then
    ensure_image "$BUILDER_IMAGE" "$REPO_ROOT/Dockerfile" "$FORCE"
    dim "  · 테스트     : docker run --rm -v \"\$PWD\":/app $BUILDER_IMAGE npm test"
    dim "  · 갤러리 서버 : docker run --rm -p 18080:18080 -v \"\$PWD\":/app $BUILDER_IMAGE node server.js"
  fi
  if (( DO_DOCKER )); then
    ensure_image "$IMAGE_REF" "$REPO_ROOT/Dockerfile.render" "$FORCE"
    dim "  · 렌더 : bash scripts/render.sh -s sketches -o out"
  fi
else
  dim "  (건너뜀 — 필요하면 --docker / --dev)"
fi

step "완료"
ok "다음 단계: 스케치 작성 → bash scripts/render.sh -s sketches -o out"
