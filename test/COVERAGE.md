# 테스트 커버리지 매트릭스 (0911-PLAN Phase 5-2)

> 실행: `npm test` (전체) · `npm run test:svg` · `npm run snap:update` · `npm run test:visual`
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
| `test/scenes.js` | 공용 대표 씬(`figures` = SceneIR, `scenes` = SVG) | 공용 |

## 0911-PLAN Phase ↔ 검증

| Phase | 항목 | 검증 |
|---|---|---|
| 0 | P0-1 결정성 | `invariants.test.js` "같은 씬은 같은 SVG" |
| 0 | P0-2 린터 | `invariants.test.js` "라벨/중심이 캔버스 안" (증거 A 회귀 방지) |
| 0 | P0-3 골든 | `snapshots.test.js` + `test/fixtures/` (미생성 시 skip) |
| 0 | P0-4 toPNG/시각 | `examples/visual.js` → `output/png/`, `backend.test.js` PNG |
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

## 남은(부분) 항목

- **P3-3** 점 마커/stroke 정책과 dash px 공간화는 기존 통과 테스트 계약(`A4`, `I1`)과 충돌하므로 **보존**. 추후 옵션화.
- **P4-2** hidden-line/silhouette 는 painter 정렬(P4-1)까지만. 2D 곡선의 3D 곡면 가림은 미구현.
