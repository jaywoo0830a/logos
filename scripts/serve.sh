#!/usr/bin/env bash
# scripts/serve.sh — 워크플로우 4단계: 렌더 결과를 브라우저로 확인
#
#   bash scripts/serve.sh [폴더] [포트] [--host H]
#     폴더 기본 ./out, 포트 기본 18080
# 서빙도 컨테이너에서 실행한다 — 호스트엔 node 가 필요 없다.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

usage() {
  cat <<'EOF'
사용법: bash scripts/serve.sh [폴더] [포트] [옵션]

  폴더 (기본: ./out) · 포트 (기본: 18080)

      --host H        바인딩 주소(기본 0.0.0.0)
  -h, --help          이 도움말

예
  bash scripts/serve.sh out 18080
  bash scripts/serve.sh /tmp/report 8080
EOF
}

DIR=''; PORT=''; HOST=''
while (( $# )); do
  case "$1" in
    --host)   HOST="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        PORT="$1"
      elif [[ -z "$DIR" ]]; then
        DIR="$1"
      else
        die "알 수 없는 인자: $1"
      fi
      shift ;;
  esac
done
DIR="$(abspath "${DIR:-$PWD/out}")"
PORT="${PORT:-18080}"
[[ -d "$DIR" ]] || die "서빙할 폴더가 없습니다: $DIR  (먼저 렌더하세요: bash scripts/render.sh -o '$DIR')"
[[ -f "$DIR/index.html" ]] || warn "index.html 이 없습니다 — 갤러리 없이 파일만 서빙됩니다"

require_linux
require_docker
ensure_image "$IMAGE_REF" "$DOCKERFILE"
info "서빙: $DIR  →  http://localhost:$PORT/"
ENVV=(-e "PORT=$PORT")
[[ -n "$HOST" ]] && ENVV+=(-e "HOST=$HOST")
exec docker run --rm \
  -p "127.0.0.1:${PORT}:${PORT}" \
  "${ENVV[@]}" \
  -v "$DIR":/out:ro \
  --entrypoint node "$IMAGE_REF" /opt/logos/server.js /out
