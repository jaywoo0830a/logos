# `logos` — 수학 그림을 코드로 쓰는 DSL

> "선생님이 칠판에 그리듯이, 저자는 원고지에 쓰듯이."
>
> 점 하나 찍는 코드가 교과서 그림 한 장이 되고, 같은 코드가 SVG · PNG · TikZ ·
> Asymptote · JSXGraph 로 나옵니다. 순수 JavaScript(Node ESM), 3D 기하 포함.

```js
import { scene, point, circle, kit } from './index.js';

const fig = kit.plot2d([-3, 3], [-3, 3], { equal: true })
  .title('원 위의 점과 반지름')
  .add(
    circle.center(point(0, 0)).radius(2).color(kit.palette.blue).stroke(2),
    kit.seg(point(0, 0), point(2, 0), { dash: [4, 3] }),   // 반지름(직선)
    point(2, 0).dot().label('P'),
  );

await kit.saveFigures([['radius', () => fig, '원 위의 점과 반지름']],
  { dir: 'output/demo', index: true });
```

---

## 1. 문서 지도

| 문서 | 무엇을 담고 있나 |
|---|---|
| **`README.md`** (이 문서) | 저장소 안내 — 실행 방법·구조·검증 |
| [`KIT.md`](KIT.md) | **예제/그림 작성 가이드** — `kit.js`, 3D 도우미, 타이포그래피(행간·자간) |
| [`DSL.md`](DSL.md) | 언어 스펙 — Scene/도형/주석/영역, IR, 백엔드 파이프라인 |
| [`INTERFACE.md`](INTERFACE.md) | 사용자 코드 미리보기(읽히는 코드 모음) |
| [`SENARIOS.md`](SENARIOS.md) | 검증 시나리오 A–L (초·중·고 / 미적분 / 3D) |
| [`ADAPT.md`](ADAPT.md) | 외부엔진 어댑터 — SymPy · Asymptote · TikZJax · JSXGraph · KaTeX |
| [`0911-PLAN.md`](0911-PLAN.md) | 작업 계획·이력(무엇을 왜 바꿨는지) |
| [`test/COVERAGE.md`](test/COVERAGE.md) | 테스트 커버리지 매트릭스 |

---

## 2. 설치 · 실행

```bash
npm install
npm test              # 전체 테스트 (155개)
npm run examples      # 대표 예제 2개 렌더 → output/parity9b, output/parity9c
npm run serve         # http://localhost:18080/  (렌더 갤러리)
```

| 스크립트 | 설명 |
|---|---|
| `npm test` | 단위 + 시나리오 + 불변식 + 스냅샷 + 백엔드 (총 155) |
| `npm run parity9b` / `parity9c` | 2D 기하 25 / 3D 기하 35 figure 재현 |
| `npm run examples` | 위 둘을 연속 실행 |
| `npm run snap:update` | 골든 SVG 스냅샷 재생성(`test/fixtures/`, 로컬 전용) |
| `npm run serve` | `output/` 정적 서버(갤러리 + SVG/PNG) |
| `npm run test:svg` | SENARIOS SVG 문자열 회귀만 |

Docker(선택): `docker compose up web` → 같은 갤러리 서버,
`docker compose run --rm logos` → 컨테이너 안에서 `npm test`.

---

## 3. 예제 (`examples/`)

대표 예제 2개만 유지합니다 — 둘 다 “matplotlib 그림을 logos 로 재현”하는 회귀 기준입니다.

* **`mpl_parity_9b.js`** — Session 9B, 2D 기하 **25 figure**
  (직선의 다섯 표현 · 단계별 작도 · 평행/수직 · 원뿔곡선 · 매개곡선 · 신발끈 …)
* **`mpl_parity_9c.js`** — Session 9C, 3D 기하 **35 figure**
  (좌표계 · 평면/법선 · 구 · 등위곡선 · 이차곡면 총람 · 교선 · 단계별 작도 …)

```bash
npm run examples
open output/parity9c/index.html      # 35개 갤러리
```

작성 방법은 [`KIT.md`](KIT.md) 를 보세요.

---

## 4. 저장소 구조

```
index.js            공개 API 진입점 (scene/shapes/annotate/tex/kit …)
kit.js              예제 작성 키트 (palette·plot2d·plot3d·subplots·saveFigures…)
core/               Scene · IR 노드 · Drawable 프로토콜
shapes/             2D/3D 도형 — point line curve circle ellipse parabola …
                    threeD.js(x) threeD2.js(입체) threeD3.js(곡선/곡면: curve3·arrow3·
                    surfaceParam·axes3·quadrics·circle3·frame3)
solver/             좌표·교점 계산 (순수 함수)
symbolic/           sym·tex (심볼릭/LaTeX)
backend/            SVG · TikZ · Asymptote · TikZJax · JSXGraph · KaTeX · hidden-line …
annotate.js         각도·정적분·화살표·치수·텍스트 주석
transform.js        회전·평행이동·반사·스케일
test/               단위/시나리오/불변식/스냅샷/백엔드 + 공용 씬(scenes.js)
examples/           대표 예제 2개 (9B 2D · 9C 3D)
output/             렌더 산출물(재생성 가능, git 추적 제외)
```

---

## 5. 무엇이 검증되나

| 층 | 내용 |
|---|---|
| 결정성 | 같은 씬 → 같은 문자열(렌더 단위 id 리셋) |
| 기하 불변식 | 원/타원/implicit/영역/샘플링, 라벨이 캔버스 안 |
| 시나리오 | SENARIOS A–L(48) + 1.md(50) + `example1/2.py` 재현(25+35) |
| 백엔드 정합 | TikZ/Asymptote/JSXGraph/KaTeX/PNG |
| 스냅샷 | 골든 SVG 문자열 비교(`npm run snap:update`) |

---

## 6. 이번 정리에서 지운 것 (2026-09-11)

조잡했던 옛 예제(`adapters.js` `book.js` `gallery.js` `interface.js` `mpl_parity.js`
`v02.js` `visual.js`)을 삭제하고, 공통 부분을 `kit.js` 로 승격했습니다.
갤러리는 `kit.saveFigures({ index: true })` 가 대신 만듭니다. 자세한 내용은
[`KIT.md §8`](KIT.md) 참고.

## License

MIT
