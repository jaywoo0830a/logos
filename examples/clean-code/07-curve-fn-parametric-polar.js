// examples/clean-code/07-curve-fn-parametric-polar.js — 곡선 3종
//
//   무엇을 보여주나 : 함수·매개변수·극좌표 곡선을 같은 DSL 로 그린다.
//   사용 API       : curve.fn(…).on([a,b]) · curve.parametric(t⇒[x,y]).on(…) · curve.polar(θ⇒r).on(…)
//                    · .n(샘플수) · .dash()/.color()/.stroke()
//   실행           : node examples/clean-code/07-curve-fn-parametric-polar.js
import { join } from 'node:path';
import { point, curve, annotate, tex, tau, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '07-curve-fn-parametric-polar');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 함수 그래프 + 접선 표시용 점 */
const fnGraph = () =>
  plot2d([-3, 3], [-2, 6])
    .title('Function  y = x² − 1')
    .add(
      curve
        .fn((x) => x * x - 1)
        .on([-2.6, 2.6])
        .color(palette.blue)
        .stroke(2.5),
      curve
        .implicit((x, y) => x * x + y * y - 1)
        .color(palette.red)
        .dash([4, 3]),
      point(2, 3).dot().color(palette.red),
      annotate.text(point(2, 3)).label('(2, 3)').offset(8, 8).font(11),
    );

/** 매개곡선 (원 · 리사주) */
const parametric = () =>
  plot2d([-2, 2], [-2, 2])
    .equal()
    .title('Parametric')
    .add(
      curve
        .parametric((t) => [Math.cos(t), Math.sin(t)])
        .on([0, tau])
        .color(palette.blue)
        .stroke(2),
      curve
        .parametric((t) => [Math.cos(t), Math.sin(2 * t)])
        .on([0, tau])
        .color(palette.red)
        .stroke(1.5),
    );

/** 극좌표 장미·카디오이드 */
const polar = () =>
  subplots(
    [
      plot2d([-1.5, 1.5], [-1.5, 1.5])
        .equal()
        .title('rose  r = cos(3θ)')
        .add(
          curve
            .polar((t) => Math.cos(3 * t))
            .on([0, tau])
            .n(720)
            .color(palette.green)
            .stroke(2),
        ),
      plot2d([-2.2, 2.2], [-2.2, 2.2])
        .equal()
        .title('cardioid  r = 1 + cos θ')
        .add(
          curve
            .polar((t) => 1 + Math.cos(t))
            .on([0, tau])
            .n(720)
            .color(palette.purple)
            .stroke(2),
        ),
    ],
    { cols: 2, title: 'Polar Curves', tight: true },
  );

/** 심볼릭 함수 — tex 로 쓴 식을 그대로 그린다 */
const symbolic = () =>
  plot2d([-2, 8], [-2, 2])
    .title('Symbolic  sin(x) + cos(x)/2')
    .add(
      curve
        .fn(tex`\sin(x) + \frac{\cos(x)}{2}`)
        .on([0, 7])
        .color(palette.navy)
        .stroke(2.5),
      tex`y = \sin x + \tfrac{1}{2}\cos x`,
    );

await saveFigures(
  [
    ['07-fn', fnGraph, '함수 그래프'],
    ['07-parametric', parametric, '매개곡선'],
    ['07-polar', polar, '극좌표 곡선'],
    ['07-symbolic', symbolic, '심볼릭 곡선'],
  ],
  { dir: OUT, index: true, title: 'logos · 07 곡선' },
);
