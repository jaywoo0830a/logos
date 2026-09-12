#!/usr/bin/env bash
# scripts/build-image.sh — 단일 이미지 빌드만 따로 (CI/캐시 워밍용)
#
#   bash scripts/build-image.sh [--force] [--pull]
#   (--render / --dev / --both 는 이전 버전 호환 — 이제 이미지는 하나다)
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

usage() {
  cat <<'EOF'
사용법: bash scripts/build-image.sh [옵션]

      --force         캐시/기존 이미지 무시하고 재빌드
      --pull          베이스 이미지 최신화(--pull)
  -h, --help          이 도움말
EOF
}

FORCE=''; PULL=''
while (( $# )); do
  case "$1" in
    --force)  FORCE=--force; shift ;;
    --pull)   PULL=--pull; shift ;;
    --render|--dev|--both) shift ;;   # 이전 버전 호환(같은 이미지)
    -h|--help) usage; exit 0 ;;
    *) die "알 수 없는 옵션: $1  (--help)" ;;
  esac
done

require_linux
require_docker

step "이미지: $IMAGE_REF"
ensure_image "$IMAGE_REF" "$DOCKERFILE" "$FORCE"
ok "완료"

