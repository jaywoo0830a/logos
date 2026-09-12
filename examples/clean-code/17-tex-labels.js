// examples/clean-code/17-tex-labels.js — 수식 라벨
//
//   무엇을 보여주나 : tex 태그드 템플릿으로 LaTeX 수식을 라벨로 쓰고, 심볼릭 식을 곡선으로 그린다.
//   사용 API       : tex`…` (annotate.text 라벨 · curve.fn(tex…) · 제목/축)
//                    · .font()/.bold()/.rotate()/.anchor()
//   실행           : node examples/clean-code/17-tex-labels.js
import { join } from 'node:path';
import { point, curve, annotate, tex, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '17-tex-labels');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 곡선 위 수식 라벨 */
const labels = () =>
  plot2d([-2, 2], [-1.5, 2])
    .title('TeX labels')
    .add(
      curve
        .fn(tex`\sin(x)`)
        .on([-2, 2])
        .color(palette.blue)
        .stroke(2.5),
      curve
        .fn(tex`\cos(x)`)
        .on([-2, 2])
        .color(palette.red)
        .stroke(2.5),
      annotate
        .text(point(1.5, 1))
        .label(tex`y=\sin x`)
        .font(14)
        .color(palette.blue),
      annotate
        .text(point(-1.8, 0.9))
        .label(tex`y=\cos x`)
        .font(14)
        .color(palette.red),
    );

/** 자주 쓰는 기호 모음 */
const symbols = () =>
  plot2d([-1, 1], [-1, 1])
    .axes(false)
    .title('common symbols')
    .add(
      annotate
        .text(point(0, 2.6))
        .label(tex`\frac{a}{b}`)
        .font(20)
        .anchor('middle'),
      annotate
        .text(point(0, 1.1))
        .label(tex`\sum_{k=1}^{n} k = \frac{n(n+1)}{2}`)
        .font(16)
        .anchor('middle'),
      annotate
        .text(point(0, -0.2))
        .label(tex`\int_0^1 x^2\,dx = \tfrac13`)
        .font(16)
        .anchor('middle'),
      annotate
        .text(point(0, -1.5))
        .label(tex`\alpha,\beta,\theta \;\; \mathbb{R}^2`)
        .font(16)
        .anchor('middle'),
      annotate
        .text(point(0, -2.6))
        .label(tex`\lim_{x\to 0}\frac{\sin x}{x} = 1`)
        .font(16)
        .anchor('middle'),
    );

/** 심볼릭 식을 곡선으로 */
const symbolicCurves = () =>
  subplots(
    [
      plot2d([-4, 4], [-2, 2])
        .title('damped  e^{-x/3} sin x')
        .add(
          curve
            .fn(tex`e^{-x/3}\sin(x)`)
            .on([-4, 4])
            .color(palette.purple)
            .stroke(2.5),
        ),
      plot2d([-3, 3], [-2, 2])
        .title('rational  x/(x^2+1)')
        .add(
          curve
            .fn(tex`\frac{x}{x^2+1}`)
            .on([-3, 3])
            .color(palette.green)
            .stroke(2.5),
        ),
    ],
    { cols: 2, title: 'Symbolic Curves', tight: true },
  );

await saveFigures(
  [
    ['17-labels', labels, '곡선 위 라벨'],
    ['17-symbols', symbols, '기호 모음'],
    ['17-symbolic-curves', symbolicCurves, '심볼릭 곡선'],
  ],
  { dir: OUT, index: true, title: 'logos · 17 수식 라벨' },
);
