#!/usr/bin/env bash
# scripts/lib/common.sh — 워크플로우 스크립트 공통(core) 라이브러리
#   · 로그/색/에러    · 리눅스 전용 가드   · 도커 확인   · 이미지 태그 규칙
#   · 패키지 심링크(node_modules/logos)  · 경로 유틸
# 이 파일은 직접 실행하지 않습니다 — 다른 스크립트가 `source` 합니다.
# 지원: Linux 전용(bash 4+, coreutils, GNU). macOS/Windows 는 지원하지 않습니다.

set -euo pipefail

# ── 색/로그 ────────────────────────────────────────────────
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  C_DIM=$'\033[2m'; C_RED=$'\033[31m'; C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'; C_CYAN=$'\033[36m'; C_BOLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_DIM=''; C_RED=''; C_GREEN=''; C_YELLOW=''; C_CYAN=''; C_BOLD=''; C_OFF=''
fi

log()  { printf '%s\n' "$*"; }
info() { printf '%s\n' "${C_CYAN}${*}$C_OFF"; }
dim()  { printf '%s\n' "${C_DIM}${*}$C_OFF"; }
ok()   { printf '%s %s\n' "${C_GREEN}✓${C_OFF}" "$*"; }
warn() { printf '%s %s\n' "${C_YELLOW}!${C_OFF}" "$*" >&2; }
die()  { printf '%s %s\n' "${C_RED}✗${C_OFF}" "$*" >&2; exit 1; }
step() { printf '\n%s\n' "${C_BOLD}${*}$C_OFF"; }

# ── 경로 ───────────────────────────────────────────────────
# 이 파일의 위치: <repo>/scripts/lib/common.sh → 저장소 루트는 두 단계 위
_common_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${_common_dir}/../.." && pwd)"
export REPO_ROOT

# 절대경로 정규화(존재하지 않아도 됨)
abspath() {
  local p="$1"
  if [[ "$p" = /* ]]; then printf '%s\n' "$p"; else printf '%s\n' "$(pwd)/$p"; fi
}

# $2 가 $1 안에 있는지(문자열 접두 검사 — 심볼릭 링크 없는 일반 경로 전제)
is_inside() { case "$2/" in "$1"/*) return 0 ;; *) return 1 ;; esac; }

# ── 환경 가드 ──────────────────────────────────────────────
require_linux() {
  local os; os="$(uname -s)"
  if [[ "$os" != "Linux" ]]; then
    if [[ "${LOGOS_FORCE_OS:-0}" = "1" ]]; then
      warn "리눅스가 아닙니다($os) — LOGOS_FORCE_OS=1 로 강제 실행합니다(동작 보장 없음)"
    else
      die "이 워크플로우는 리눅스 전용입니다(현재: $os). 그래도 실행하려면 LOGOS_FORCE_OS=1 bash $0 ..."
    fi
  fi
}

require_cmd() { command -v "$1" >/dev/null 2>&1 || die "'$1' 명령을 찾을 수 없습니다. 설치 후 다시 실행하세요."; }

require_node() {
  require_cmd node
  local v major
  v="$(node -v)"; major="${v#v}"; major="${major%%.*}"
  (( major >= 24 )) || die "Node 24+ 가 필요합니다(현재 $v). nvm 등으로 24 LTS 를 설치하세요."
}

require_docker() {
  require_cmd docker
  docker info >/dev/null 2>&1 || die "도커 데몬에 연결할 수 없습니다. 'sudo systemctl start docker' 또는 Docker Desktop 을 실행하세요."
}

# ── 도커 이미지 ────────────────────────────────────────────
IMAGE_NAME="${LOGOS_IMAGE_NAME:-logos-render}"
IMAGE_TAG="${LOGOS_IMAGE_TAG:-0.1.0}"
IMAGE_REF="${IMAGE_NAME}:${IMAGE_TAG}"
BUILDER_IMAGE="${LOGOS_BUILDER_IMAGE:-logos-builder:0.1.0}"

image_exists() { docker image inspect "$1" >/dev/null 2>&1; }

ensure_image() {   # ensure_image <ref> <dockerfile> [--force]
  local ref="$1" dockerfile="$2" force="${3:-}"
  image_exists "$ref" && [[ "$force" != "--force" ]] && return 0
  info "도커 이미지 빌드: $ref  (Dockerfile: ${dockerfile##*/})"
  # LOGOS_BUILDKIT=1 이면 BuildKit 을 쓴다(캐시에 유리 · buildx 필요).
  # 기본은 어디서나 동작하는 레거시 빌더.
  if [[ "${LOGOS_BUILDKIT:-0}" = "1" ]]; then
    DOCKER_BUILDKIT=1 docker build -f "$dockerfile" -t "$ref" "$REPO_ROOT" || die "이미지 빌드 실패: $ref"
  else
    docker build -f "$dockerfile" -t "$ref" "$REPO_ROOT" || die "이미지 빌드 실패: $ref"
  fi
  ok "이미지 준비 완료: $ref"
}

# ── 패키지 설치(스케치 폴더에 logos 연결) ──────────────────
#   npm 의 `file:` 의존성과 같은 결과를 네트워크 없이 만든다(node_modules/logos → 패키지 루트).
#   패키지 **안쪽** 폴더는 Node 의 self-reference 로 이미 `logos` 를 찾으므로 건드리지 않는다.
link_package() {   # link_package <project> <package_root>
  local project="$1" pkg="$2"
  if [[ "$project" == "$pkg" ]] || is_inside "$pkg" "$project"; then
    dim "패키지 내부 실행 — self-reference 로 'logos' 를 찾습니다(연결 생략)"
    return 0
  fi
  mkdir -p "$project/node_modules"
  ln -sfn "$pkg" "$project/node_modules/logos"
  ok "패키지 연결: $project/node_modules/logos → $pkg"
}

# 프로젝트 package.json 의 name (없으면 폴더명)
project_name() {
  local p="$1"
  if [[ -f "$p/package.json" ]]; then
    node -e 'try{const j=require(process.argv[1]);process.stdout.write(j.name||"")}catch{}' "$p/package.json" 2>/dev/null || true
  fi
}
