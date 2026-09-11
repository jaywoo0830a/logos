// examples/plugin_demo.js — 플러그인 아키텍처 데모(코어 수정 0)
//
// 무엇을 보여주나
//   `plugins/geometry-extras.js` 하나를 `use()` 한 것만으로 **코어 파일을 전혀 고치지 않고**
//   다음이 가능해진다. 이 예제는 그 결과를 실제 figure 4장으로 저장한다.
//     · 코어에 없던 도형      ray(반직선) · arc.circular(원호)  ← index.js 스텁이 살아난다
//     · 새 IR 노드            hatch(사선 음영)  ← SVG <pattern> 과 TikZ pattern 두 백엔드
//     · 체이닝 메서드          .tilt(deg) · .dashed() · .arrowTip()
//     · 정적                 point.byDeg(r, deg) · ray.deg(O, deg)
//     · 테마                 .theme('chalk')
//     · 훅 / 래핑            SVG 워터마크 · scene.title 접두어([draft])
//
// 실행
//   node examples/plugin_demo.js        →  output/plugin-demo/*.svg|png + index.html
//   npm run plugin-demo
import { scene, point, circle, segment, curve, annotate, use, plugins, tex, tau } from '../index.js';
import { kit } from '../index.js';
import geometryExtras, { chalkTheme } from '../plugins/geometry-extras.js';

// ── 플러그인 설치 (이 한 줄이 전부다) ──────────────────────
use(geometryExtras, { watermark: true, stampTitle: false });

const { palette } = kit;
const O = point(0, 0).label('O').dot();

// ── 1) 반직선과 원호 ────────────────────────────────────────
/** 반직선 3개(30°/90°/150°)와 원호 — 모두 플러그인이 추가한 빌더 */
const raysAndArcs = () => scene()
  .size(560, 460).view([-3, 3], [-3, 3]).equal().axes().theme('chalk')
  .title('ray 와 arc — 코어에 없던 도형')
  .add(
    circle.center(O).radius(2).color('#8fa8a0').stroke(1),
    plugins.ray(O, point.byDeg(1, 30)).color('#ffd54f').arrowTip().dashed(),
    plugins.ray(O, point.byDeg(1, 90)).color('#ffd54f').arrowTip(),
    plugins.ray(O, point.byDeg(1, 150)).color('#ffd54f').arrowTip(),
    plugins['arc.circular'](O, 2, 30, 150, { n: 96 }).color('#4dd0e1').stroke(3),
    annotate.angle({ from: [2, 0], vertex: [0, 0], to: point.byDeg(2, 45) }).arc({ radius: 0.8 }).color('#ffd54f'),
    point.byDeg(2, 30).dot().label(tex`30°`),
    point.byDeg(2, 150).dot().label(tex`150°`),
    O,
  );

// ── 2) 새 IR 노드 hatch — SVG/TikZ 두 백엔드 ────────────────
/** 사선 음영 + 라벨. `api.node('hatch', { svg, tikz })` 가 백엔드를 열어준다 */
const hatching = () => scene()
  .size(520, 400).view([0, 6], [0, 4]).axes()
  .title('새 IR 노드 hatch (SVG·TikZ)')
  .add(
    segment(point(1, 1), point(5, 1)).dashed([5, 3]).color(palette.gray),
    plugins.hatch(1, 1, 4, 1.6, { gap: 8, angle: 45 }).text('A = ∫₀⁴ f(x) dx').color(palette.steel),
    plugins.hatch(1, 0.2, 4, 0.6, { gap: 5, angle: -45 }).color(palette.darkred).opacity(0.8),
    curve.fn((x) => 1 + 0.12 * (x - 3) ** 2).on([1, 5]).color(palette.blue).stroke(2),
  );

// ── 3) 체이닝 메서드 .tilt · .dashed · .arrowTip ────────────
/** 플러그인 메서드와 코어 메서드가 **섞여도** 체인이 끊기지 않는다 */
const chainables = () => scene()
  .size(520, 460).view([-4, 4], [-4, 4]).equal().axes().grid({ alpha: 0.25 })
  .title('체이닝 확장 .tilt · .dashed · .arrowTip')
  .add(
    segment(O, point(3, 0)).arrowTip().color(palette.crimson).stroke(2),
    segment(O, point(2.4, 0)).tilt(45).arrowTip().color(palette.orange).stroke(2),
    segment(O, point(2.0, 0)).tilt(90).arrowTip().dashed().color(palette.green).stroke(2),
    curve.fn((x) => 0.35 * x * x - 2).on([-3, 3]).tilt(-20).dashed([4, 4]).color(palette.purple),
    point(3, 0).label('x').dot(), O,
  );

// ── 4) 훅(워터마크) + 래핑(draft 접두어) + 정적 ──────────────
/**
 * 훅과 래핑은 그림 자체보다 "코어를 고치지 않고 파이프라인에 끼어든다"는 사실이 핵심이다.
 * 워터마크는 `api.hook('svg')` 가, `[draft]` 는 `api.around('scene','title')` 가 만든다.
 */
const pipelineHooks = () => scene()
  .size(560, 420).view([-2.5, 2.5], [-1.5, 1.5]).equal().axes().theme('chalk')
  .title('훅(svg 워터마크) · 래핑(title) · 정적(point.byDeg)')
  .add(
    curve.fn((x) => Math.sin(x)).on([-2.5, 2.5], { n: 400 }).color('#4dd0e1').stroke(2.4),
    point.byDeg(1, 45).dot().label('(√2/2, √2/2)'),
    point(Math.PI / 2, 1).dot().label('π/2'),
    O,
  );

// ── 저장 ───────────────────────────────────────────────────
const res = await kit.saveFigures([
  ['plugin1-ray-arc', raysAndArcs, '반직선 · 원호 (새 빌더)'],
  ['plugin2-hatch-node', hatching, '새 IR 노드 hatch'],
  ['plugin3-chainable', chainables, '체이닝 확장 3종'],
  ['plugin4-hooks-theme', pipelineHooks, '훅 · 래핑 · 테마 · 정적'],
], { dir: 'output/plugin-demo', index: true, title: 'logos · 플러그인 데모 (코어 수정 0)' });

console.log(`플러그인 등록 상태: ${JSON.stringify(plugins.info('geometry-extras'), null, 0)}`);
console.log(`chalk 테마 토큰: ${Object.keys(chalkTheme).length}개 · figure ${res.ok}개`);
