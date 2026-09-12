#!/usr/bin/env bash
# scripts/install.sh — 워크플로우 1단계: 설치 (이미지 하나로 끝)
#
#   · 기본        : 단일 이미지(`logos:버전`)를 빌드한다. 렌더·서빙·테스트에 필요한
#                   폰트 + 수학 엔진(SymPy·Asymptote) + 의존성이 모두 안에 들어 있다.
#   · --project D : 스케치 프로젝트 D 에 `logos` 를 연결(node_modules/logos 심링크 · 호스트용)
#   · --host-npm  : 호스트에서도 npm install (기여자용 · 보통 불필요)
#   · --force     : 이미지가 있어도 다시 빌드
#
# 리눅스 전용.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

usage() {
  cat <<EOF
사용법: bash scripts/install.sh [옵션]

      --project DIR   스케치 프로젝트 폴더에 logos 를 연결(호스트 node 필요)
      --host-npm      호스트에서도 npm install (기여자용)
      --force         이미지가 있어도 다시 빌드
  -h, --help          이 도움말

예
  bash scripts/install.sh                       # 이미지 빌드(렌더·서빙·테스트 공용)
  bash scripts/install.sh --project ~/my-book   # + 프로젝트에 logos 연결
EOF
}

PROJECT=''; FORCE=''; HOST_NPM=0; HAS_PROJECT=0
while (( $# )); do
  case "$1" in
    --project)  PROJECT="$(abspath "$2")"; HAS_PROJECT=1; shift 2 ;;
    --force)    FORCE=--force; shift ;;
    --host-npm) HOST_NPM=1; shift ;;
    --docker|--dev) shift ;;   # (호환) 이제 이미지는 하나 — 같은 이미지를 빌드한다
    --skip-npm) shift ;;       # (호환) 호스트 npm install 은 기본적으로 하지 않는다
    -h|--help)  usage; exit 0 ;;
    *) die "알 수 없는 옵션: $1  (--help)" ;;
  esac
done

require_linux
require_docker

# ── ① 단일 이미지 ──────────────────────────────────────────
step "[1/3] 이미지 준비 (렌더 · 서빙 · 테스트)"
ensure_image "$IMAGE_REF" "$DOCKERFILE" "$FORCE"
dim "  · 렌더   : bash scripts/render.sh -s sketches -o out"
dim "  · 서빙   : bash scripts/serve.sh out 18080"
dim "  · 테스트 : bash scripts/test.sh"
dim "  · 뼈대   : docker run --rm -u \"\$(id -u):\$(id -g)\" -v \"\$PWD\":/work $IMAGE_REF new sketches"

# ── ② 호스트 의존성(선택) ──────────────────────────────────
step "[2/3] 호스트 의존성 (선택)"
if [[ $HOST_NPM = 1 ]]; then
  require_node
  dim "node $(node -v) · npm $(npm -v)"
  ( cd "$REPO_ROOT" && npm install --no-audit --no-fund )
  ok "npm install 완료 ($REPO_ROOT)"
else
  dim "  (건너뜀 — 도커만 쓰면 불필요. 호스트에서 직접 테스트/포맷하려면 --host-npm)"
fi

# ── ③ 스케치 프로젝트 ──────────────────────────────────────
step "[3/3] 스케치 프로젝트"
PROJECT="${PROJECT:-$PWD}"
if [[ "$PROJECT" == "$REPO_ROOT" ]]; then
  ok "저장소 자체에서 실행 — self-reference 로 '$PKG_NAME' 를 바로 import 할 수 있습니다"
elif [[ $HAS_PROJECT = 1 ]]; then
  require_node
  link_package "$PROJECT" "$REPO_ROOT"
  name="$(project_name "$PROJECT" || true)"
  [[ -n "$name" ]] && dim "프로젝트: $name ($PROJECT)"
fi

if [[ ! -d "$PROJECT/sketches" ]]; then
  dim "스케치 폴더가 없습니다 → 뼈대 생성:"
  dim "  docker run --rm -u \"\$(id -u):\$(id -g)\" -v \"$PROJECT\":/work $IMAGE_REF new sketches"
else
  ok "스케치 폴더 확인: $PROJECT/sketches"
fi

step "완료"
ok "다음 단계: 스케치 작성 → bash scripts/render.sh -s sketches -o out"

