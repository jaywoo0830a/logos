// examples/clean-code/13-annotate-integral.js — 정적분 표시
//
//   무엇을 보여주나 : 곡선 아래 영역을 칠하고 적분식을 붙인다.
//   사용 API       : annotate.integral(f).from(a).to(b).shade(color).label(tex…)
//                    · curve.fn 로 곡선 · annotate.text 로 보조 라벨
//   실행           : node examples/clean-code/13-annotate-integral.js
import { join } from 'node:path';
import { point, curve, annotate, tex, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '13-annotate-integral');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 기본: x² 아래 [0, 2] */
const basic = () => {
  const f = (x) => x * x;
  return plot2d([-0.5, 2.8], [-0.5, 5])
    .title('∫₀² x² dx = 8/3')
    .add(
      annotate
        .integral(f)
        .from(0)
        .to(2)
        .shade(palette.skyblue)
        .label(tex`\frac{8}{3}`),
      curve.fn(f).on([-0.4, 2.6]).color(palette.blue).stroke(2.5),
      annotate.text(point(0.2, 4.2)).label('곡선 아래 넓이').font(12),
    );
};

/** 삼각함수 한 주기 */
const trig = () => {
  const f = (x) => Math.sin(x);
  return plot2d([-0.5, 3.6], [-1.4, 2])
    .title('∫₀^π sin x dx = 2')
    .add(
      annotate
        .integral(f)
        .from(0)
        .to(Math.PI)
        .shade(palette.orange)
        .label(tex`2`),
      curve.fn(f).on([-0.3, 3.5]).color(palette.red).stroke(2.5),
      annotate.text(point(1.6, 1.5)).label('한 주기 반파').font(12).anchor('middle'),
    );
};

/** 두 영역 비교 (겹쳐 보기) */
const compare = () =>
  subplots(
    [
      plot2d([0, 3], [0, 3])
        .title('∫₁² dx/x = ln 2')
        .add(
          annotate
            .integral((x) => 1 / x)
            .from(1)
            .to(2)
            .shade(palette.green),
          curve
            .fn((x) => 1 / x)
            .on([0.35, 3])
            .color(palette.blue)
            .stroke(2.5),
        ),
      plot2d([-2, 2], [0, 2])
        .title('∫ f(x) dx  (종 모양)')
        .add(
          annotate
            .integral((x) => Math.exp(-x * x))
            .from(-1.6)
            .to(1.6)
            .shade(palette.purple),
          curve
            .fn((x) => Math.exp(-x * x))
            .on([-2, 2])
            .color(palette.blue)
            .stroke(2.5),
        ),
    ],
    { cols: 2, title: 'Integrals', tight: true },
  );

await saveFigures(
  [
    ['13-basic', basic, 'x² 아래'],
    ['13-trig', trig, 'sin 한 주기'],
    ['13-compare', compare, '여러 적분'],
  ],
  { dir: OUT, index: true, title: 'logos · 13 정적분' },
);
