# `logos` — 플러그인 (체이너블 확장 아키텍처)

> **코어를 고치지 않고 기능을 붙인다.** 기능이 없거나 부족할 때 사용자가 `core/`·`shapes/`·
> `backend/` 를 직접 수정하면 (a) 배포본을 못 쓰고 (b) 업스트림과 충돌하고 (c) 무엇을 바꿨는지
> 추적이 안 됩니다. `logos` 는 그 3가지를 **플러그인 등록**으로 대체합니다.

구현: **`core/plugin.js`** (476줄, 의존성 0) · 코어 쪽 훅은 파일당 3~8줄 · 테스트 **`test/plugin.test.js`**(17개) ·
예시 플러그인 **`plugins/geometry-extras.js`**(273줄, 8종 확장 전부).

---

## 1. 30초 예제

```js
import { point, use } from '@jaywoo0830a/logos';

use({
  name: 'my-slope',
  install(api) {
    api.chain('drawable', { slope: (conf, m) => ({ slopeM: m }) }); // 새 체이닝 메서드
  },
});

point(1, 2).slope(3).color('#c00').dot(); // 체인이 끊기지 않는다
```

`api.chain` 에 넘긴 함수는 **패치 객체**를 돌려주기만 하면 됩니다. 플러그인 아키텍처가
`this.set(patch)` 를 대신 호출하므로 불변 복제(=새 인스턴스)가 자동으로 일어나고,
그 결과 **`this.set` 을 몰라도 체이닝이 유지**됩니다.

---

## 2. 확장 지점 8가지

| #   | API                                               | 붙이는 것                       | 사용 예                             | 코어 쪽 훅(파일)                                        |
| --- | ------------------------------------------------- | ------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| ①   | `api.extend(target, {…})`                         | 체이닝 메서드(명령형)           | `.mark('A')`                        | `core/drawable.js` · `core/scene.js` `registerTarget`   |
| ②   | `api.chain(target, {…})`                          | 체이닝 메서드(선언형)           | `.slope(3)`, `.tilt(30)`            | 〃                                                      |
| ③   | `api.define(name, fn, {ctor})`                    | 최상위 빌더                     | `logos.ray(O, P)`, `plugins.ray(…)` | `index.js` `lookupFactory` (스텁까지 살아남)            |
| ④   | `api.node(kind, {svg, tikz})`                     | **새 IR 노드 + 백엔드 emitter** | 사선 음영 `hatch`                   | `backend/svg.js` · `backend/tikz.js` default 분기       |
| ⑤   | `api.theme(name, tokens)`                         | 테마                            | `.theme('chalk')`                   | `core/scene.js` `themeOf`                               |
| ⑥   | `api.hook(event, fn)`                             | 파이프라인 후처리               | SVG 워터마크                        | `scene.js`('ir') · `scene-ir.js`('ir:svg'·'svg'·'tikz') |
| ⑦   | `api.around(target, m, fn)`                       | 기존 메서드 보강                | `scene.title` 접두어                | 대상 메서드 자체                                        |
| ⑧   | `api.static(target, n, fn)` · `api.ns(name, obj)` | 네임스페이스 정적               | `point.byDeg(r, 30)`                | `index.js` `registerNamespaceObject`                    |
| —   | `plugins.uninstall/reset`                         | 되돌리기(테스트 격리)           | —                                   | —                                                       |

**대상(target) 표기**: `'drawable'`(모든 도형) · `'scene'` · `'point'`·`'curve'` 등 도형 이름 ·
클래스(`Point`) · 등록한 빌더 이름. 모두 `core/plugin.js` 의 `resolveTarget` 이 해석합니다.

---

## 3. 체이닝 규칙 — 플러그인 메서드의 반환값 3가지

| 반환값               | 결과                                | 쓰임                             |
| -------------------- | ----------------------------------- | -------------------------------- |
| `undefined` / `null` | `this` (체인 유지)                  | 부수 효과만 있는 메서드          |
| **일반 객체**        | **`this.set(patch)`** → 새 인스턴스 | 스타일·설정 추가 (가장 흔함)     |
| `Drawable`/`Scene`   | 그대로 통과                         | **IR 을 감싸는 새 도형** 만들 때 |

세 번째 규칙이 강력합니다 — 아래 `arrowTip()` 처럼 "임의 도형을 감싸는" 확장을 만들 수 있습니다.

```js
class TipMarked extends Drawable {
  // 예: plugins/geometry-extras.js
  toIR(ctx) {
    const irs = this.inner.toIR(ctx);
    return irs.map((n, i) =>
      i === irs.length - 1 && n.kind === 'path' ? { ...n, data: { ...n.data, head: true } } : n,
    );
  }
}
api.extend('drawable', {
  arrowTip() {
    return new TipMarked(this);
  },
});
// segment(A, B).arrowTip().color('#c00')  ← 감싼 뒤에도 코어 메서드 그대로
```

**escape hatch**: 이름만 알면 `d.plugin('slope', 3)` ≡ `d.slope(3)`. 등록 여부를 모르는 코드에서도
쓸 수 있고, 미등록이면 등록 방법을 안내하는 `PluginError` 가 납니다.

---

## 4. API 레퍼런스

### ① ② 체이닝 메서드

```js
api.extend(target, { name(...args) { return this.set({...}); } });   // 명령형 (this 사용)
api.chain(target,  { name(conf, ...args) { return {...}; } });       // 선언형 (패치 반환)
```

- 같은 이름을 다시 설치하면 **코어 메서드까지 덮어쓸 수 있습니다**(되돌리기 가능).
- 설치된 메서드에는 `fn.pluginOf = '플러그인 이름'` 메타가 붙습니다.

### ③ 새 빌더

```js
api.define('ray', (O, P, conf) => new Ray(O, P, conf), { ctor: Ray, aliases: ['half-line'] });
```

- `ctor` 를 주면 나중에 `api.extend('ray', {…})` 로 그 클래스만 확장할 수 있습니다.
- **`index.js` 의 미구현 스텁(`ray`·`arc`·`sector`·`torus`·`cube`·`prism`·`pyramid`)은
  그 이름을 등록하는 순간 살아납니다.** 예: `api.define('arc.circular', fn)` → `arc.circular(C, r, 0, 90)`.

### ④ 새 IR 노드 + emitter (백엔드 무수정)

```js
api.node('hatch', {
  svg: (n, ctx) => `<rect ... fill="url(#${id})"/>`,
  tikz: (n) => `\\fill[pattern=north east lines] (${n.data.x},${n.data.y}) rectangle ...;`,
});
```

`svg` emitter 가 받는 `ctx`:

| 키                         | 설명                                                           |
| -------------------------- | -------------------------------------------------------------- |
| `ctx.map(data, x, y)`      | world → 화면 좌표(변환·클립 반영). `[px, py]` 반환             |
| `ctx.style(data)`          | `{ stroke, 'stroke-width', opacity, dash }` (테마 기본값 병합) |
| `ctx.theme`                | 테마 토큰                                                      |
| `ctx.esc(s)`               | SVG 문자열 이스케이프                                          |
| `ctx.scaleX/scaleY/gradId` | 비율·그라디언트 id (특수한 그림용)                             |

문자열을 반환하면 그대로 SVG 본문에, `null` 을 반환하면 "아무것도 그리지 않음"입니다.
**라벨까지 직접 그리지 말고** 코어 `text` 노드를 함께 내보내면 KaTeX 조판·자동 배치를 그대로 물려받습니다
(`Hatched.toIR()` 이 그 예).

### ⑤ 테마

```js
api.theme('chalk', { bg: '#2f3e3a', axisColor: '#e9f2ee', labelColor: '#f4faf7' /* … */ });
```

토큰: `bg` · `gridColor` · `gridMajor` · `axisColor` · `axisWidth` · `tickColor` · `labelColor` ·
`font` · `fontMath` · `pointColor` · `strokeDefault`.

### ⑥ 파이프라인 훅

| 이벤트     | 값                         | ctx                                     |
| ---------- | -------------------------- | --------------------------------------- |
| `'ir'`     | IR 노드 배열               | `{ conf, dim, theme, themeDef, world }` |
| `'ir:svg'` | IR 노드 배열(화면 매핑 후) | `{ ir, map, W, H }`                     |
| `'svg'`    | **완성된 SVG 문자열**      | `{ ir, map }`                           |
| `'tikz'`   | TikZ 문자열                | `{ ir }`                                |

값을 반환하면 다음 훅/최종 출력으로 전달되고, 반환하지 않으면 무시됩니다(부수 효과 훅).

### ⑦ 기존 메서드 보강

```js
api.around('scene', 'title', (orig, t) => orig(`[draft] ${t}`));
api.around('point', 'label', (orig, l, off) => orig(String(l).toUpperCase(), off)); // 라벨 대문자화
api.around('curve', 'eval', (orig, t) => orig(t)); // 곡선 평가 가로채기
```

### ⑧ 정적 / 네임스페이스

```js
api.static('point', 'byDeg', (r, deg) => point(r * Math.cos(deg * Math.PI / 180), …));  // point.byDeg
const myNs = api.ns('areas');                       // 새 네임스페이스
myNs.riemann = (f) => …;                            // areas.riemann(...)
```

---

## 5. 조회 · 디버깅

```js
import { plugins, plugin } from '@jaywoo0830a/logos';

plugins.list();        // ['geometry-extras', …]      설치된 플러그인
plugins.has('x');      // 설치 여부
plugins.info('x');     // { name, version, methods, factories, nodes, themes, warnings }
plugins.help();        // { plugins, targets, factories, nodes, themes, hooks, methods } 한눈에
plugins.targets();     // ['drawable','scene','point','curve',…]
plugins.nodeKinds();   // ['hatch', …]
'ray' in plugins;      // 등록된 빌더 이름은 `in` 으로 확인 가능
plugins.ray(…)         // 코어 export 목록을 고치지 않고도 호출 가능 (Proxy)
```

`api.extend` 로 설치한 메서드가 코어 메서드를 **의도치 않게 덮었는지**는
`plugins.info(name).warnings` 와 `api.node` 덮어쓰기 경고로 확인할 수 있습니다.

---

## 6. 미등록 이름은 "안내"로 실패한다

플러그인이 없을 때 `ray(...)` 는 그냥 죽지 않고 **등록 방법**을 알려줍니다.

```
PluginError: logos: 'ray' 은 코어에 없습니다. (직선(line) 등으로 대체할 수 있습니다.)
hint: 코어를 고치지 말고 플러그인으로 추가하세요:
  import { use } from '@jaywoo0830a/logos';
  use({ name: 'my-extras', install(api) {
    api.define('ray', (...args) => new MyShape(...args), { ctor: MyShape });
    api.node('mynode', { svg: (n, ctx) => '<path .../>' });
  } });
  등록된 이름: …
```

`arc.semicircle()` 같은 **네임스페이스 스텁**도 호출 시점에 같은 안내를 냅니다
(`index.js` 의 `ns()` Proxy 가 레지스트리를 먼저 확인).

---

## 7. 실제 예제 — `plugins/geometry-extras.js` (8종 확장 전부)

`npm run plugin-demo` → `output/plugin-demo/` (4 figure + 갤러리). 코어 파일 수정 **0줄**.

| 확장          | 플러그인 코드                                                                  | 결과                                                 |
| ------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| ① 새 빌더     | `api.define('ray', …)`                                                         | `ray(O, P)`, `plugins.ray(…)`                        |
| ② 스텁 채우기 | `api.define('arc.circular', …)`                                                | `arc.circular(C, r, 0, 90)` (index.js 스텁이 살아남) |
| ③ 새 IR 노드  | `api.node('hatch', { svg, tikz })`                                             | SVG `<pattern>` + TikZ `pattern=north east lines`    |
| ④ 체이닝      | `api.chain('drawable', {tilt, dashed})` · `api.extend('drawable', {arrowTip})` | `.tilt(30).dashed().arrowTip()`                      |
| ⑤ 정적        | `api.static('point','byDeg')` · `api.static('ray','deg')`                      | `point.byDeg(1, 45)`                                 |
| ⑥ 테마        | `api.theme('chalk', {…})`                                                      | `.theme('chalk')` (칠판)                             |
| ⑦ 훅          | `api.hook('svg', …)`                                                           | 오른쪽 가장자리 세로 워터마크                        |
| ⑧ 래핑        | `api.around('scene','title', …)`                                               | `scene.title('t')` → `[draft] t` (옵션 `stampTitle`) |

```js
import { scene, point, use, plugins } from '@jaywoo0830a/logos';
import geometryExtras from '@jaywoo0830a/logos/plugins/geometry-extras.js'; // 패키지 동봉 플러그인(subpath export)
// 저장소 안에서 쓸 때는 상대 경로도 가능: './plugins/geometry-extras.js'
use(geometryExtras, { watermark: true, stampTitle: false });

scene()
  .equal()
  .theme('chalk')
  .add(plugins.ray(point(0, 0), point.byDeg(1, 30)).arrowTip().dashed())
  .add(plugins['arc.circular'](point(0, 0), 2, 30, 150))
  .add(plugins.hatch(1, 1, 4, 1.6).text('A = ∫₀⁴ f(x) dx'))
  .compile()
  .toSVG(); // SVG 와 toTikZ() 둘 다 동작
```

---

## 8. 코어가 여는 훅 (유지보수자용)

플러그인이 침범하지 않도록, 코어가 열어 둔 접점은 **딱 네 곳**입니다.

| 파일                                 | 추가된 줄                                                                        | 역할                         |
| ------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------- |
| `core/drawable.js`                   | `registerTarget('drawable', Drawable)` + `plugin(name, …)` 메서드                | 모든 도형에 체이닝 확장 지점 |
| `core/scene.js`                      | `themeOf(...)` 폴백 · `apply('ir', nodes, …)` · `registerTarget('scene', Scene)` | 테마·IR 훅                   |
| `backend/svg.js` · `backend/tikz.js` | `default:` 분기에서 `nodeEmitter(backend, kind)` 조회                            | 새 IR kind 출력              |
| `backend/scene-ir.js`                | `apply('ir:svg'/'svg'/'tikz', …)`                                                | 문자열·노드 후처리           |
| `index.js`                           | `lookupFactory` 로 스텁 해석 · 네임스페이스/클래스 공개                          | 새 빌더 이름                 |

**경계**: 기존 렌더링 _알고리즘_(숨은선, 곡선 샘플링, 레이아웃)을 바꾸는 일은 코어의 일입니다.
플러그인은 **새 이름 · 새 그림 종류 · 새 파이프라인 단계**를 담당합니다. 그래야
"코어는 한 방향으로 단단하고, 확장은 바깥에서 자유롭게"라는 균형이 유지됩니다.

---

## 9. 테스트 · 격리

- `test/plugin.test.js` — 17개: 설치/멱등 · `chain`(패치 자동 set) · `extend` · `plugin()` escape hatch ·
  `define`(스텁 살아남) · `static` · `node`(두 백엔드) · `theme` · `hook`(ir/svg) ·
  `around`(값 보존·체이닝) · 미등록 안내 · `plugins` Proxy · `uninstall/reset` 원복 ·
  이름 충돌/롤백 · 실제 플러그인 통합.
- 전역 레지스트리이므로 테스트는 `plugin.uninstall(name)` / `plugin.reset()` 으로 **반드시 원복**합니다.
- `use()` 는 멱등이라 같은 플러그인을 여러 번 호출해도 한 번만 설치됩니다.
- 설치 중 예외가 나면 **부분 설치가 자동 롤백**됩니다.
