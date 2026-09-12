# FEEDBACK — 모던 JS 로 더 유연하게 (구문 · DX 제안)

`learning`(mathbook) 저장소의 `math/graph/phase2` 에서 미분 해석(14D1) 그림 9장을 만들며 정리한
**구문·개발 경험 제안**입니다. 이 PR 의 나머지 커밋은 버그/기능 수정이고, 이 문서는 **코드 변경 없는 제안**입니다.

전제(저장소 원칙을 지킵니다):

1. 새 문법은 **얇은 별칭**이어야 합니다 — `kit.js` 처럼 "렌더링 규칙을 갖지 않고" 기존 API 위에만 얹습니다.
2. 출력은 **결정적**이어야 합니다(스냅샷 123 figure + `senarios*.test.js` 가 회귀 기준).
3. **의존성 0** — 아래 제안은 전부 Node 내장(`engines: >=24`, `package.json:85`)만 씁니다.
4. 학습자 대상이므로 **마법(Proxy·매크로)은 최소**로.

## 0. 요약

| 등급               | 항목                                                                                                                                                                         | 한 줄 효과                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **A. 지금 바로**   | A1 `import.meta.dirname` · A2 `readdir({recursive})` · A3 `toSorted` · A4 `set()` 중첩 clone · A5 `Set` 메서드 · A6 `AggregateError` · A7 `Symbol.iterator`/`inspect.custom` | 보일러플레이트 삭제 + 디버깅 DX  |
| **B. 구문 유연성** | B1 좌표 정규화(`toPoint`) · B2 게터/구조분해 · B3 태그드 템플릿 · B4 `.with()` · B5 `add` 평탄화 · B6 JSDoc + `tsc --noEmit`                                                 | "왜 이건 되고 저건 안 되지" 제거 |
| **C. 실험**        | C1 `using`/`AsyncDispose` · C2 비동기 이터레이터(`--watch`) · C3 import attributes                                                                                           | 렌더 세션·증분 렌더              |
| **D. 권하지 않음** | `Intl.NumberFormat` 눈금 · decorator · Proxy 과용                                                                                                                            | 결정성·이식성                    |

실측(Node v25.8, `engines >=24`): `using` ✓ `Iterator helpers` ✓ `Set.union` ✓ `fs.glob` ✓(실험적)
`readdir recursive` ✓ `RegExp.escape` ✓ `Promise.try` ✓ `Object.groupBy` ✓ `import.meta.dirname` ✓
`Array.fromAsync` ✓ `Promise.withResolvers` ✓ `Array#toSorted` ✓ `Error.isError` ✓ `structuredClone` ✓

---

## A. 지금 바로 (몇 줄, 위험 낮음)

### A1. `import.meta.dirname` — 10곳 보일러플레이트 제거

지금(예: `bin/logos.mjs:21`, `backend/fonts.js`, `test/*.test.js`, `examples/*`)은 전부:

```js
const HERE = dirname(fileURLToPath(import.meta.url));
```

`fileURLToPath(import.meta.url)` 는 저장소 전체 **10회** 등장합니다. Node 20.11+/24 에서는:

```js
const HERE = import.meta.dirname; // __dirname 대응
```

- 이득: import 2개(`fileURLToPath`, `dirname`) 삭제, 의도(`import.meta.url`)가 그대로 드러남.
- 리스크: 없음(`engines >=24` 이미 선언).

### A2. `fs.readdir(dir, { recursive: true })` — `findSketches` 재귀 20줄 → 5줄

`bin/logos.mjs:87` 의 수동 재귀 + 정렬 + 접두 필터는 Node 20.1+ 의 재귀 읽기로 대체 가능합니다.

```js
const ents = await readdir(srcDir, { recursive, withFileTypes: true });
const files = ents
  .filter((e) => SKETCH_EXT.has(extname(e.name)) && !e.name.startsWith('_') && !e.name.startsWith('.'))
  .filter((e) => !/\.(test|spec)\.(js|mjs)$/.test(e.name))
  .filter((e) => !e.parentPath.includes('node_modules')) // e.parentPath: Node 20.12+
  .map((e) => join(e.parentPath, e.name))
  .toSorted((a, b) => a.localeCompare(b)); // A3 과 함께
```

- 주의: 재귀 모드에서 `Dirent.name` 은 **상대 경로 전체**이고 `parentPath` 가 Node 20.12+ 입니다.
  지금의 "정렬은 이름 기준"·"`.`·`_` 접두 무시" 규칙을 그대로 옮길 수 있는지 테스트로 못박아야 합니다
  (`test/cli.test.js` 에 이미 `--recursive` 회귀가 있음).

### A3. `Array#toSorted` — 제자리 정렬 제거

`backend/layout.js:61` 의 `items.sort(...)` 는 **호출자가 넘긴 배열을 변형**합니다(현재는 지역 배열이라 무해).
Node 20+/24 에서는:

```js
for (const it of items.toSorted((a, b) => (b.rank - a.rank) || (a.sy - b.sy))) { … }
```

- 이득: "정렬이 원본을 바꾼다"는 함정 제거, IR 노드 배열에 대한 미래 리팩터가 안전해짐.
- 같은 이유로 `nodes.slice()` → `nodes.toSpliced(…)`/`.with()` 도 후보.

### A4. `set()` 의 **얕은 복사**로 공유되는 중첩 설정 — `structuredClone`/`freeze`

`core/drawable.js:34`:

```js
c._conf = { ...this._conf, ...changes }; // 1단계만 복사
```

`annotate.js:293` 의 `box(cfg)` 는 **호출자가 넘긴 객체를 그대로 보관**합니다. 그래서
`const BOX = { facecolor: 'white', alpha: 0.85 }` 같은 상수 하나를 여러 그림이 공유하면,
플러그인/훅이 `d.box.alpha = 0.5` 한 줄로 **모든 그림을 오염**시킵니다(찾기 어려운 버그).

```js
// 방법 1: 알려진 중첩 키만 복제 (비용 최소)
const NESTED = new Set(['box', 'marker', 'camera', 'labelOff', 'gradient']);
const merged = { ...this._conf, ...changes };
for (const k of NESTED) if (merged[k] && typeof merged[k] === 'object') merged[k] = structuredClone(merged[k]);

// 방법 2: 개발 모드에서 동결 (런타임 비용 0, 실수 즉시 발견)
if (process.env.LOGOS_STRICT) Object.freeze(merged[k]);
```

- 이득: 상수 공유가 안전해짐(`palette`/`BOX` 같은 상수를 kit 에서 내보내기 쉬워짐).
- 리스크: `structuredClone` 은 클래스 인스턴스/함수에서 throw → 화이트리스트 방식(방법 1)을 권장.

### A5. `Set` 메서드 (ES2025) — 중복/교집합

이 PR 에서 CLI 대상 dedupe 를 `[...new Set(found)]` 로 처리했습니다(그대로 유지).
Node 22+ 에서는 `Set.prototype.union/intersection/difference` 가 있어, 앞으로 테마·플러그인 목록을
합칠 때 `new Set(a).intersection(b)` 가 `filter(includes)` 보다 의도가 분명합니다.

### A6. `AggregateError` + `Error.cause` — 다중 실패 보고

CLI 는 이미 "한 figure 가 실패해도 계속" 렌더하고 `failed` 배열을 모읍니다(좋습니다).
이 배열을 `AggregateError` 로도 노출하면 호출자(도구/CI)가 `catch (e) { e.errors }` 로 받을 수 있습니다.

```js
if (failN)
  throw new AggregateError(
    failed.map((f) => new Error(f.error, { cause: f.src })),
    `${failN}개 figure 실패`,
  );
```

`Error.isError`(Node 24) 와 함께 쓰면 `instanceof` 의 cross-realm 함정도 피합니다.

### A7. `Symbol.iterator` + `node:util.inspect.custom` — 탐색/디버깅 DX

저장소 전체에서 두 심볼 사용이 **0회**입니다. 학습자는 자연스럽게 이렇게 씁니다:

```js
for (const n of scene.compile()) …          // 노드 순회
console.log(scene);                          // 지금은 내부 필드 덤프
```

```js
// backend/scene-ir.js
[Symbol.iterator]() { return this.o.nodes[Symbol.iterator](); }

// core/scene.js — REPL/로그에서 한 줄 요약
[inspect.custom]() {
  const c = this._conf;
  return `Scene(${c.dim === 3 ? '3D' : '2D'}, shapes: ${c.shapes.length}, view: ${JSON.stringify(c.view)})`;
}
```

- 이득: 3D 구를 그리다 "노드가 몇 개 나왔지" 를 확인하려고 `ir.o.nodes.length` 를 파야 했는데,
  `[...ir].length` 로 자연스러워집니다.
- 트레이드오프: `Symbol.iterator` 를 붙이면 `Scene` 이 **이터러블**이 되어 스프레드/구조분해 동작이
  새로 생깁니다(=`[...scene]`). 문서화만 하면 안전.

---

## B. 구문 유연성 (DSL 감각)

### B1. 좌표 정규화 `toPoint()` 한 곳으로 — "왜 여기선 Array 가 안 되지?"

오늘 실제로 부딪힌 3가지입니다(모두 같은 뿌리):

| 재현                                            | 원인                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `kit.seg([0,0],[3,4])` → 컴파일 시 `TypeError`  | `line.through` 가 `p.coords` 를 요구 (`shapes/line.js:19`) — 이 PR 에서 `seg` 는 수정 |
| `annotate.text([0.06, 0.6])` → `TypeError`      | `annotate.js:296` `const coords = c.P.coords` 가 `undefined`                          |
| `point([1, 2])` → 조용히 `[[1, 2]]` (경고 없음) | `shapes/point.js:78` `cart: args` (배열이 그대로 좌표가 됨)                           |

제안 — 코어에 정규화 함수를 두고 모든 좌표 진입점이 통과:

```js
/** 배열/객체/Point 를 Point 로. 허용: point(1,2) · [1,2] · {x,y} · 기존 Point */
export const toPoint = (v, ...rest) =>
  v?.coords
    ? v
    : Array.isArray(v)
      ? point(...v, ...rest)
      : v && typeof v === 'object' && 'x' in v
        ? 'z' in v
          ? point(v.x, v.y, v.z)
          : point(v.x, v.y)
        : point(v, ...rest);
```

- 이득: `annotate.text([x, y])`, `region.between([0, 1], …)`, `vector([1,2],[3,4])` 처럼 **배열이 자연스럽게** 됩니다.
  스케치마다 `P(...)` 같은 래퍼를 복제하는 이유(우리 `_helpers.mjs` 의 `P`)가 사라집니다.
- 리스크: `point([1,2])` 의 **기존 동작이 조용히 바뀜**(지금은 잘못된 그림) → CHANGELOG 로 알리면 됩니다.

### B2. 게터·구조 분해

```js
const p = point(3, 4);
const { x, y } = p; // p.x / p.y 게터
const [a, b] = segment(p, q).ends; // ends 게터 → [Point, Point]
```

- 이득: 계산 검증 코드(`p.coords[0]`)가 읽기 쉬워지고, 스프레드/구조분해가 자연스러워집니다.
- 주의: `Point` 는 이미 `system`(polar/cylindrical…)을 가지므로 게터는 **cartesian 기준**임을 문서화.

### B3. 태그드 템플릿 — 이미 태그드 템플릿 `tex` 가 있으니 같은 감각으로

`tex` 태그가 있는 DSL 이므로, 교재에서 자주 쓰는 **범위/좌표**를 같은 문법으로:

```js
const v = view`x∈[-3, 3]  y∈[-1, 4]`; // → [[-3, 3], [-1, 4]]
scene()
  .view(...v)
  .axes();

const P = xy`3, 4`; // → point(3, 4)
const R = range`0..10 step 2`; // → [0, 2, 4, 6, 8, 10]
```

- 이득: 세션 스케치에서 `view([-3,3],[-1,4])` 가 그림마다 반복되고 오타(괄호/쉼표)가 잦습니다.
  교재 문맥(`x∈[a,b]`)이 코드에 그대로 보입니다.
- 리스크: **파서를 만들지 말 것** — 허용 문법을 극단적으로 좁게(쉼표·`..`·`step`) 유지하고,
  실패 시 `Error` 에 "쓸 수 있는 형식"을 그대로 보여주세요.

### B4. `.with()` — `set()` 의 의도가 드러나는 별칭

`set({stroke: 2})` 는 불변 업데이트인데 이름이 "뮤테이션"처럼 들립니다.

```js
dotAt([1, 1], BLUE).with({ stroke: 2, dash: [4, 3] });
```

- `set` 은 유지(하위 호환) + `with` 를 1줄 별칭으로. `array.with(i, v)`(ES2023)와 감각이 같아 학습자에게 익숙.

### B5. `add()` 평탄화 — 오타가 조용한 버그가 되지 않게

`add(...shapes)` 와 `addAll(shapes)` 가 이미 있습니다(`core/scene.js`). 다만 `scene().add([a, b])`
처럼 **배열을 그대로** 넘기면 노드 대신 배열이 IR 로 들어가 나중에 이상한 실패를 냅니다.

```js
add(...shapes) { return this.set({ shapes: [...this._conf.shapes, ...shapes.flat(1)] }); }
```

- 이득: `add(figures)`(이터레이터/배열) 모두 허용. 실패가 "그림이 안 나옴"이 아니라 즉시 드러남.
- 참고: 이터러블 스프레드는 이미 되므로(`addAll(gen())` ✓) 제네레이터로 도형 묶음을 만드는 패턴을
  문서화해도 좋습니다.

### B6. JSDoc 타입 + `tsc --noEmit` — 체이닝 자동완성 (런타임 변화 0)

`jsconfig.json` 에 `checkJs: true` 가 있지만 `strict: false` 이고 `@ts-check` 는 **0회**, `tsc` 스크립트도 없어
사실상 아무도 돌리지 않습니다. 체이닝이 4~5단계인 DSL 에서 자동완성은 생산성 차이가 큽니다.

```js
/** @returns {this} */ set(changes) { … }
/** @returns {Scene} */ add(...shapes) { … }
```

- 이득: 편집기에서 `scene().equal().axes().grid().add(point(1,2).dot()).compile().toSVG()` 가
  전부 자동완성되고, `axes` 옵션 키(`decimals`/`format` 등)도 뜹니다.
- 제안: `"typecheck": "tsc --noEmit"` 스크립트 + CI 1줄, `target` 을 `ES2023` 으로,
  `include` 에 `annotate.js`·`kit.js` 추가. **런타임 산출물은 그대로**(타입만).

---

## C. 실험 (트레이드오프 있음)

### C1. `using` / `Symbol.asyncDispose` — 렌더 세션·임시 파일

```js
await using session = await render.session({ out: outDir, png: true });
// 예외가 나도 session[Symbol.asyncDispose]() 가 보장됨 (resvg/tikzjax 핸들 정리)
```

- 이득: `try/finally` 없이 자원 정리, `resvg`·`tikzjax`(WASM) 처럼 정리가 중요한 엔진에 유용.
- 리스크: 문법이 생소해 학습자 코드에서 혼란 → **내부 API 전용**으로만 쓰는 것을 권장.

### C2. 비동기 이터레이터 — `--watch` / 증분 렌더

```js
for await (const batch of render.watch(srcDir, { signal: AbortSignal.timeout(30_000) })) { … }
```

- 이득: 지금은 29장 전체를 매번 렌더(한 장 고칠 때도). `fs.watch` + `AsyncGenerator` 로
  "바뀐 스케치만" 렌더하는 CLI 플래그(`--watch`)를 우아하게 구현할 수 있습니다.
- `Iterator helpers`(Node 22+)로 파이프라인(`.filter().map().take()`)도 가능.

### C3. `import ... with { type: 'json' }` — 테마/팔레트

`THEMES` 를 JS 모듈로 두는 지금 방식도 좋습니다. JSON 을 쓰고 싶다면 import attributes 로
`assert` 없이 로드됩니다(의존성 0 유지).

---

## D. 권하지 않음 / 주의

- **`Intl.NumberFormat` 로 눈금 포매팅** — 이 PR 에서 눈금 자릿수를 고쳤는데, `Intl` 은 ICU 버전에 따라
  자릿수/구분자가 달라질 수 있어 **스냅샷 결정성**이 깨집니다. 현재의 산술 포매팅을 유지하세요.
- **decorator / 매크로** — 표준이어도 Node 기본 지원이 아니고 번들러 전제라 "의존성 0" 과 충돌.
- **Proxy 기반 동적 빌더(플러그인 자동 등록 등)** — 편하지만 스택트레이스·자동완성·"어디서 등록됐나" 추적이
  죽습니다. 학습용 라이브러리에서는 마법의 비용이 큽니다.
- **async 남용** — 지금의 "동기 컴파일 → 결정적 SVG/PNG" 구조가 강점입니다. `Promise.try`/`Array.fromAsync` 는
  정말 필요한 곳(외부 엔진)에만.

---

## 부록 — 한 장 요약

가장 값어치가 큰 3개만 고르면:

1. **B1 `toPoint` 정규화** — 배열/객체/Point 를 어디서나. 오늘 하루에만 3번 밟은 함정을 없앱니다.
2. **B6 JSDoc + `tsc --noEmit`** — 런타임 변화 0으로 DSL 전체 자동완성.
3. **A7 `Symbol.iterator` + `inspect.custom`** — 디버깅/탐색 비용이 눈에 띄게 줄어듭니다.

각 항목은 서로 독립적이라 **작은 PR 로 쪼개기 좋습니다**. 우선순위를 정해 주시면 개별 PR 로 올리겠습니다.

※ 이 문서의 코드 스케치는 실제로 실행해 확인했습니다(Node v25.8): A2 재귀 `readdir` + `Dirent.parentPath`,
B1 `toPoint`, B3 태그드 템플릿(`view`/`range`), A7 `inspect.custom`, 그리고 §0 의 기능 목록 전체.
