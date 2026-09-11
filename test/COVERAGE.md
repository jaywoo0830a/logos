# 테스트 커버리지 매트릭스 (0911-PLAN Phase 5-2)

> 실행: `npm test` (전체) · `npm run test:svg` · `npm run snap:update` · `npm run examples`
> 기준: SENARIOS A–L (48), 1.md 50 시나리오, 0911-PLAN Phase 0–5.

## 실행 파일 ↔ 담당 범위

| 파일 | 담당 | 성격 |
|---|---|---|
| `test/senarios.test.js` | SENARIOS v0.1 (A1–A4, B1–B3, C1, D1–D3, F1, G1–G4, H1–H2, I1–I2, I4, J1, J5, K1–K2, K5) | 시나리오 |
| `test/senarios2.test.js` | SENARIOS v0.2 (B4–B6, C2–C3, D4, E1–E4, F2–F3, G5, H3, I3, I5, J2–J4, J6, K3–K4) | 시나리오 |
| `test/textbook.test.js` | 1.md 50개 (Stewart/Strang/Ross/Serra 등) | 시나리오 |
| `test/scene.test.js`, `test/geometry.test.js`, `test/symbolic.test.js`, `test/render.test.js` | 씬/기하/심볼릭/TikZ 단위 | 단위 |
| `test/adapters.test.js`, `test/external.test.js`, `test/sympy.test.js` | ADAPT.md 외부엔진 어댑터 | 단위 |
| **`test/invariants.test.js`** | **P0-2 SVG 무결성 린터, P0-1 결정성, P0-5 기하 불변식** | **신규(Phase 0)** |
| **`test/snapshots.test.js`** | **P0-3 골든 스냅샷 (`test/fixtures/*.svg`, 로컬 전용·gitignore)** | **신규(Phase 0)** |
| **`test/backend.test.js`** | **P5-1 TikZ/Asymptote/JSXGraph/KaTeX/PNG 백엔드 정합** | **신규(Phase 5)** |
| **`test/features.test.js`** | **region.betweenX/barH/annulus/wedge · panels · surface.z(+cmap) · vectorField3 · scene.layout · curve3/arrow3/surfaceParam · 3D camera(elev/azim/aspect) · axes(false)/`axes({y:{ticks:false}})` · `axes3/quadrics/circle3/frame3` · `kit`(palette/plot2d/plot3d/subplots/saveFigures) · 타이포그래피(행간·자간) · `linalg`(mat/vec) · `transform.matrix` · 점선(arrow/polygon)** | **신규(§7·6차)** |
| `test/scenes.js` | 공용 대표 씬(`figures` = SceneIR, `scenes` = SVG) | 공용 |
| **`examples/mpl_parity_9b.js`** | Session 9B · 2D 기하 **25 figure** 재현 (`npm run parity9b`) | **대표 예제** |
| **`examples/mpl_parity_9c.js`** | Session 9C · 3D 기하 **35 figure** 재현 (`npm run parity9c`) | **대표 예제** |
| **`examples/mpl_parity_12a2.js`** | 12A2 · 행렬과 벡터 **20 figure** 재현 (`npm run parity12a2`) | **대표 예제(6차)** |

## 0911-PLAN Phase ↔ 검증

| Phase | 항목 | 검증 |
|---|---|---|
| 0 | P0-1 결정성 | `invariants.test.js` "같은 씬은 같은 SVG" |
| 0 | P0-2 린터 | `invariants.test.js` "라벨/중심이 캔버스 안" (증거 A 회귀 방지) |
| 0 | P0-3 골든 | `snapshots.test.js` + `test/fixtures/` (미생성 시 skip) |
| 0 | P0-4 toPNG/시각 | `kit.saveFigures({ png: true })` → `output/*/*.png` + `index.html` 갤러리, `backend.test.js` PNG |
| 0 | P0-5 불변식 | `invariants.test.js` (원·타원·implicit·영역·샘플링) |
| 1 | P1-1/1-4 px 오프셋·축 | `invariants.test.js` tight view + 스냅샷 |
| 1 | P1-2 bounds 기반 프레이밍 | `invariants.test.js` "auto-framing" |
| 1 | P1-3 비등방 스케일 | `invariants.test.js` "non-equal → 타원" |
| 2 | P2-1 adaptive | `invariants.test.js` "곡률에 비례" |
| 2 | P2-2 불연속 | `invariants.test.js` "step 점프" + `senarios2` B4 |
| 2 | P2-3 region domain | `invariants.test.js` "domain 상속" |
| 2 | P2-4 implicit 폐합 | `invariants.test.js` "닫힌 폴리라인" |
| 3 | P3-1 그라디언트 | 스냅샷(A3 평면 채움) |
| 3 | P3-2 수식 전략 | `scenes.js` G5(`math:'text'`) + `backend.test.js` |
| 4 | P4-1 depth 정렬 | 스냅샷(E1/E3) + `senarios2` E1–E4 |
| 5 | P5-1 백엔드 | `backend.test.js` |

## §7 신규 figure API (matplotlib 대응)

| 기능 | API |
|---|---|
| **폰트 (전역)** | **STIX Two Math — 텍스트·수식·축 전부** (`backend/fonts.js`, `assets/STIXTwoMath-Regular.ttf`) |
| 제목/축라벨/범례 | `scene.title()/xlabel()/ylabel()/legend(loc)` |
| 임의 텍스트 | `annotate.text(P).label().anchor().offset().font().bold()` |
| 텍스트 상자/회전 | `annotate.text(...).box({facecolor,alpha})` · `.rotate(deg)` |
| 점 마커 모양 | `point(x,y).marker('circle'\|'square'\|'triangle'\|'diamond'\|'star'\|'point'\|'plus'\|'cross', {size,open})` |
| 자동 라벨 배치 | `scene.layout()` → `backend/layout.js`(텍스트 충돌 회피, 축 눈금 제외) |
| subplots/패널 | `panels([fig1,fig2], { cols, cell, title, tight })` |
| grid/spine | `grid({ alpha, width, minor })` · `spines({ top:false, right:false })` |
| 수평 슬라이스 | `region.betweenX(f, g).on([y0,y1])` |
| 수평 막대 | `region.barH(y0,y1,x0,x1)` |
| 링/부채꼴 | `region.annulus(O,ri,ro)` · `region.wedge(O,r,a0,a1)` |
| 3D 곡면 | `surface.z((x,y)=>…).on(xr,yr).mesh(n)` / `.faces()` / `.cmap(name)` |
| 3D quiver | `vectorField3((x,y,z)=>[dx,dy,dz]).on(box)` |
| **3D 곡선/폴리라인** | **`curve3.parametric(f).on([t0,t1])` · `curve3.through([P,…])` (`.label()`, `.dash()`)** |
| **3D 화살표(quiver)** | **`arrow3(from, to)` — 머리 = 0.12·|화살표| (`arrow_length_ratio` 대응, `.label()`)** |
| **파라메트릭 곡면** | **`surfaceParam((u,v)=>[x,y,z]).on(ur,vr).wire(nu,nv)` / `.solid(nu,nv)` / `.cmap(name)`** |
| **컬러맵** | **`cmap('viridis'\|'plasma'\|'coolwarm'\|'jet'\|'summer')` (5–6 stop 보간)** |
| **3D 카메라 각도** | **`scene.camera({ elev, azim, distance })` (mplot3d `view_init` 대응)** |
| **box aspect** | **`scene.camera({ aspect:[1,1,0.75] })` (mplot3d `box_aspect` [4,4,3] 대응)** |
| **3D 자동축 끄기** | **`scene.axes(false)`** |
| **3D 텍스트** | **`annotate.text(point(x,y,z)).label(…)` (자동 투영)** |
| **3D hidden-line/실루엣** | `backend/hidden.js` (깊이 버퍼, `toSVG({ hiddenLine:false })` 로 해제) |
| **3D 축 도우미** | **`axes3({length,color,width,labels})` → `.add(...axes3())` (mplot3d 축, `labels:null` 로 라벨 생략)** |
| **이차곡면 팩토리** | **`quadrics.plane/ellipsoid/ball/hyperboloid1/hyperboloid2/cone/cylinder` (모두 `wire/solid/cmap` 상속)** |
| **3D 원호** | **`circle3(r, z, center)`** |
| **3D 프레이밍 상자** | **`frame3(xlim, ylim, zlim)` — 그리지 않고 뷰 범위만 고정(`set_xlim/ylim/zlim`)** |
| **화살표 머리 비율** | **`arrow3(...).ratio(r)` (`arrow_length_ratio`, 기본 0.12)** |
| **작성 키트** | **`kit.palette` · `plot2d(xr,yr,opts)` · `plot3d(opts)` · `subplots(figs,opts)` · `saveFigure/saveFigures/writeGallery` · `seg` · `poly3`** |
| **패널 셀 자동** | **`panels()/subplots()` — `cell` 미지정 시 figure `.size()` 최댓값** |
| **타이포그래피** | **`TYPE = { lineHeight: 1.32, letterSpacing: 0.01 }` (전역) · `Drawable.lineHeight(x)` / `.letterSpacing(px)` (개별)** |

## 남은(부분) 항목

- **P3-3** 점 마커/dash px 공간화는 기존 테스트 계약(`A4`, `I1`)과 충돌하므로 **보존**(`stroke(0)`/`opacity(0)` 버그는 수정됨).
- **hidden-line** 은 quad 단위 painter + 깊이버퍼 클리핑 — per-pixel 완전 정합은 아님. 2D 곡선의 3D 곡면 가림은 미지원.
- 라벨 자동 배치는 그리디(겹침 시 밀어내기) — 최적 배치/박스 충돌은 아님.
- 폰트: SVG 는 Google Fonts `@import`, PNG(resvg) 는 `assets/` 로컬 TTF 사용.
