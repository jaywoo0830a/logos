#!/usr/bin/env bash
# scripts/test.sh — 테스트를 도커에서 실행 (워크플로우: 호스트엔 bash+docker 만)
#
#   · 개발/테스트 이미지(Dockerfile · asympy/asymptote 포함)에서 `npm test` 를 돌린다.
#   · 소스는 호스트에서 마운트하고, node_modules 는 이미지에 구워진 것을 쓴다(익명 볼륨).
#   · 스냅샷 골든(test/fixtures)은 이미지에 복사되지 않아 자동으로 skip 된다.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

usage() {
  cat <<'EOF'
사용법: bash scripts/test.sh [옵션]

      --build         테스트 이미지 강제 재빌드
  -h, --help          이 도움말
EOF
}

FORCE=''
while (( $# )); do
  case "$1" in
    --build)   FORCE=--force; shift ;;
    -h|--help) usage; exit 0 ;;
    *)         die "알 수 없는 옵션: $1  (--help)" ;;
  esac
done

require_linux
require_docker

step "테스트 (docker · $IMAGE_REF)"
ensure_image "$IMAGE_REF" "$DOCKERFILE" "$FORCE"

# 단일 이미지의 ENTRYPOINT 는 `logos` CLI 이므로 npm 으로 덮어써 테스트를 돌린다.
#   · 소스는 이미지의 패키지 경로(/opt/logos)에 마운트하고,
#     node_modules 는 이미지에 구워진 것을 쓴다(익명 볼륨).
exec docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp -e npm_config_cache=/tmp/npm-cache \
  -e NO_COLOR="${NO_COLOR:-}" \
  -v "$REPO_ROOT":/opt/logos -w /opt/logos \
  -v /opt/logos/node_modules \
  --entrypoint npm \
  "$IMAGE_REF" run test:unit
