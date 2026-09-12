// examples/clean-code/15-view-axes-grid.js — 좌표계 · 격자 · 템플릿
//
//   무엇을 보여주나 : view/equal/grid/spines/polarGrid, 그리고 교재 문맥 그대로 쓰는 태그드 템플릿.
//   사용 API       : scene().view(...).equal().grid().spines().polarGrid() · kit.plot2d(xr, yr, {axes})
//                    · view`x∈[-3, 3]  y∈[-1, 4]` · xy`3, 4` · range`0..10 step 2`
//   실행           : node examples/clean-code/15-view-axes-grid.js
import { join } from 'node:path';
import { scene, point, curve, annotate, xy, view, range, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '15-view-axes-grid');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 축 설정 커스터마이즈 · 동일 비율 */
const axesConfig = () =>
  kit
    .plot2d([-3, 3], [-3, 3], { axes: { x: { label: 'u' }, y: { label: 'v' } } })
    .equal()
    .title('custom axes + equal aspect')
    .add(
      curve
        .fn((x) => (x * x * x) / 9)
        .on([-3, 3])
        .color(palette.blue)
        .stroke(2.5),
    );

/** spines · grid 제어 */
const spines = () =>
  subplots(
    [
      scene()
        .size(420, 340)
        .view([-3, 3], [-1.5, 3])
        .axes(true)
        .grid({ alpha: 0.25 })
        .spines(false)
        .title('spines(false)')
        .add(
          curve
            .fn((x) => Math.cos(x))
            .on([-3, 3])
            .color(palette.red)
            .stroke(2.5),
        ),
      scene()
        .size(420, 340)
        .view([-3, 3], [-1.5, 3])
        .axes(true)
        .grid(false)
        .spines(true)
        .title('grid(false), spines(true)')
        .add(
          curve
            .fn((x) => Math.cos(x))
            .on([-3, 3])
            .color(palette.green)
            .stroke(2.5),
        ),
    ],
    { cols: 2, title: 'Spines & Grid', tight: true },
  );

/** 극좌표 격자 */
const polar = () =>
  scene()
    .size(440, 440)
    .view([-3, 3], [-3, 3])
    .equal()
    .axes(false)
    .polarGrid({ rings: 3, sectors: 12 })
    .title('polarGrid')
    .add(
      curve
        .polar((t) => 2 * Math.cos(2 * t))
        .on([0, Math.PI * 2])
        .n(720)
        .color(palette.purple)
        .stroke(2.5),
    );

/** 태그드 템플릿 — 교재 문맥을 코드에 그대로 */
const templates = () => {
  const P = xy`3, 4`; // → point(3, 4)
  const ticks = range`0..10 step 2`; // → [0,2,4,6,8,10]
  return kit
    .plot2d(...view`x∈[-1, 11]  y∈[-1, 6]`)
    .title('view`…` · xy`…` · range`…`')
    .add(
      point(P.x, P.y).dot().label('xy`3, 4`'),
      ...ticks.map((t) => annotate.text(point(t, -0.4)).label(String(t)).font(10).anchor('middle')),
      curve
        .fn((x) => x / 2 + 1)
        .on([0, 9])
        .color(palette.blue)
        .stroke(2),
    );
};

await saveFigures(
  [
    ['15-axes-config', axesConfig, '축 · 비율'],
    ['15-spines', spines, 'spines · grid'],
    ['15-polar-grid', polar, '극좌표 격자'],
    ['15-templates', templates, '태그드 템플릿'],
  ],
  { dir: OUT, index: true, title: 'logos · 15 좌표계 · 템플릿' },
);
