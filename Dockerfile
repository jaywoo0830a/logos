# logos — 개발/테스트 컨테이너 (v24.21.0 LTS)
FROM node:24.21.0-bookworm-slim

ENV NODE_ENV=development \
    NPM_CONFIG_CACHE=/root/.npm

WORKDIR /app

# ADAPT.md 외부엔진: SymPy(심볼릭 폴백) + Asymptote(2D/3D 출판 SVG/PDF)
RUN --mount=type=cache,target=/var/lib/apt/lists \
    apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-sympy \
    asymptote \
    dvisvgm \
    lmodern \
    && rm -rf /var/lib/apt/lists/*

# 의존성 레이어 캐시를 위해 패키지 매니페스트를 먼저 복사
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# 소스 복사 (.dockerignore 에서 node_modules 제외)
COPY . .

EXPOSE 18080

CMD ["npm", "test"]