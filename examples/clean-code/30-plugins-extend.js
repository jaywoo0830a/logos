// examples/clean-code/30-plugins-extend.js — 플러그인 (코어 수정 0)
//
//   무엇을 보여주나 : 플러그인 한 줄로 새 도형 · 새 IR 노드 · 체이닝 메서드 · 테마 · 훅을 붙인다.
//   사용 API       : use(p) · plugins.ray / plugins['arc.circular'] / plugins.hatch · .tilt/.dashed/.arrowTip
//                    · point.byDeg · theme('chalk') · 훅(SVG 워터마크) · 래핑(scene.title)
//   실행           : node examples/clean-code/30-plugins-extend.js
import { join } from 'node:path';
import { scene, point, segment, curve, annotate, use, plugins, tex, kit } from '../../index.js';
import geometryExtras, { chalkTheme } from '../../plugins/geometry-extras.js';

// ── 설치 (이 한 줄이 전부)
use(geometryExtras, { watermark: true });

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '30-plugins-extend');
const { palette, saveFigures } = kit;
const O = point(0, 0).label('O').dot();

/** 새 빌더: 반직선(ray) · 원호(arc.circular) */
const newBuilders = () =>
  scene()
    .size(540, 460)
    .view([-3, 3], [-3, 3])
    .equal()
    .axes()
    .title('새 도형 ray · arc.circular')
    .add(
      plugins.ray(O, point.byDeg(1, 30)).color(palette.orangead).arrowTip(),
      plugins.ray(O, point.byDeg(1, 90)).color(palette.orangead).arrowTip().dashed(),
      plugins['arc.circular'](O, 2, 30, 150).color(palette.cyan).stroke(3),
      point
        .byDeg(2, 90)
        .dot()
        .label(tex`90^\circ`),
      O,
    );

/** 새 IR 노드: hatch (SVG·TikZ 백엔드 동시 지원) */
const hatchNode = () =>
  scene()
    .size(520, 400)
    .view([0, 6], [0, 4])
    .axes()
    .title('새 IR 노드 hatch')
    .add(
      plugins.hatch(1, 1, 4, 1.6, { gap: 8, angle: 45 }).text('A = ∫ f dx').color(palette.steel),
      curve
        .fn((x) => 1 + 0.12 * (x - 3) ** 2)
        .on([1, 5])
        .color(palette.blue)
        .stroke(2),
      segment(point(1, 1), point(5, 1)).dashed([5, 3]).color(palette.gray),
    );

/** 체이닝 확장: 코어 메서드와 섞여도 체인이 끊기지 않는다 */
const chainable = () =>
  scene()
    .size(520, 440)
    .view([-4, 4], [-4, 4])
    .equal()
    .axes()
    .title('체이닝 .tilt · .dashed · .arrowTip')
    .add(
      segment(O, point(3, 0)).arrowTip().color(palette.crimson).stroke(2),
      segment(O, point(2.6, 0)).tilt(50).arrowTip().color(palette.green).stroke(2),
      segment(O, point(2.2, 0)).tilt(-50).arrowTip().dashed().color(palette.purple).stroke(2),
      curve
        .fn((x) => 0.4 * x * x - 2)
        .on([-3, 3])
        .tilt(-15)
        .dashed([4, 4])
        .color(palette.navy),
      O,
    );

/** 테마 · 훅 · 래핑 */
const themeHooks = () =>
  scene()
    .size(560, 420)
    .view([-2.5, 2.5], [-1.5, 1.5])
    .equal()
    .axes()
    .theme('chalk')
    .title('테마 · 워터마크 훅 · title 래핑')
    .add(
      curve
        .fn((x) => Math.sin(x))
        .on([-2.5, 2.5])
        .color('#4dd0e1')
        .stroke(2.4),
      annotate.text(point(0, 1)).label('chalk 테마 위에 그린 sin x').font(12).anchor('middle'),
    );

const res = await saveFigures(
  [
    ['30-ray-arc', newBuilders, '반직선 · 원호'],
    ['30-hatch-node', hatchNode, 'hatch IR 노드'],
    ['30-chainable', chainable, '체이닝 확장'],
    ['30-theme-hooks', themeHooks, '테마 · 훅'],
  ],
  { dir: OUT, index: true, title: 'logos · 30 플러그인 (코어 수정 0)' },
);

console.log(
  `등록 상태: ${JSON.stringify(plugins.info('geometry-extras'))} · chalk 토큰 ${Object.keys(chalkTheme).length}개 · figure ${res.ok}개`,
);
