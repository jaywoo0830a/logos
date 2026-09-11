#!/usr/bin/env bash
# scripts/build-image.sh — 도커 이미지 빌드만 따로 (CI/캐시 워밍용)
#
#   bash scripts/build-image.sh            # 렌더 이미지 (Dockerfile.render)
#   bash scripts/build-image.sh --dev      # 개발/테스트 이미지 (Dockerfile)
#   bash scripts/build-image.sh --both --force
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

usage() {
  cat <<'EOF'
사용법: bash scripts/build-image.sh [옵션]

      --render        렌더 이미지 빌드  (기본 · Dockerfile.render)
      --dev           개발/테스트 이미지 (Dockerfile · BuildKit 필요)
      --both          둘 다
      --force         캐시/기존 이미지 무시하고 재빌드
      --pull          베이스 이미지 최신화(--pull)
  -h, --help          이 도움말
EOF
}

DO_RENDER=1; DO_DEV=0; FORCE=''; PULL=''
while (( $# )); do
  case "$1" in
    --render) DO_RENDER=1; DO_DEV=0; shift ;;
    --dev)    DO_DEV=1; DO_RENDER=0; shift ;;
    --both)   DO_DEV=1; DO_RENDER=1; shift ;;
    --force)  FORCE=--force; shift ;;
    --pull)   PULL=--pull; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "알 수 없는 옵션: $1  (--help)" ;;
  esac
done

require_linux
require_docker

if (( DO_RENDER )); then
  step "렌더 이미지: $IMAGE_REF"
  ensure_image "$IMAGE_REF" "$REPO_ROOT/Dockerfile.render" "$FORCE"
fi
if (( DO_DEV )); then
  step "개발 이미지: $BUILDER_IMAGE  (BuildKit 필요)"
  ensure_image "$BUILDER_IMAGE" "$REPO_ROOT/Dockerfile" "$FORCE"
fi
ok "완료"
