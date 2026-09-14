# logos — 단일 이미지 (렌더 · 서빙 · 테스트 · 개발 전부)
#
#   목적: "모든 걸 다 설치해 둔 하나의 이미지" — 사용자는 코드만 쓰고 렌더만 하면 된다.
#     ① 렌더/서빙/테스트에 필요한 런타임 + 폰트 + 수학 엔진(SymPy·Asymptote)을 모두 담는다
#     ② 사용자 작업 폴더는 /work 로 마운트
#     ③ ENTRYPOINT 가 `logos` CLI  (docker run ... logos:0.4.0 new sketches)
#
#   빌드   : bash scripts/install.sh          (또는 scripts/build-image.sh)
#   렌더   : bash scripts/render.sh -s sketches -o out
#   서빙   : bash scripts/serve.sh out 18080
#   테스트 : bash scripts/test.sh
FROM node:24.21.0-bookworm-slim

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    npm_config_cache=/tmp/npm-cache

# ── 렌더/서빙: 텍스트(PNG 래스터) 폰트 + CA 번들 ───────────────
#   · fonts-nanum                          — 한글(NanumGothic/Myeongjo). 없으면 라벨이 □(tofu)로 깨진다.
#   · fonts-dejavu-core / fonts-liberation — 라틴·그리스·수학 기호 기본
# ── 개발/테스트: docs/extend/ADAPT.md 외부엔진 ─────────────────────────────
#   · python3 + python3-sympy — 심볼릭 폴백(없으면 테스트가 skip)
#   · asymptote + dvisvgm + lmodern — 2D/3D 출판 SVG/PDF
#   (BuildKit cache mount 를 쓰지 않는다 — buildx 없는 환경에서도 빌드되도록)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-nanum \
    python3 \
    python3-sympy \
    asymptote \
    dvisvgm \
    lmodern \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/logos

# 의존성 레이어 캐시 — package*.json 만 먼저 복사.
#   · devDependencies 도 설치한다(테스트·포맷까지 이 이미지 하나로 해결).
#   · @resvg/resvg-js 는 optionalDependency(리눅스 prebuilt) → PNG 출력에 사용.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# 패키지 본체 + CLI
COPY . .
RUN chmod +x bin/logos.mjs scripts/*.sh && npm link >/dev/null 2>&1 || true

# 사용자 작업 폴더
VOLUME ["/work"]
WORKDIR /work
EXPOSE 18080

# 기본 진입점: logos CLI
ENTRYPOINT ["node", "/opt/logos/bin/logos.mjs"]
CMD ["--help"]
