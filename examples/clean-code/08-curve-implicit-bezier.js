// examples/clean-code/08-curve-implicit-bezier.js — 음함수 곡선과 베지에
//
//   무엇을 보여주나 : 방정식(F(x,y)=0)으로 주어진 곡선과 제어점 기반 베지에 곡선.
//   사용 API       : curve.implicit((x,y) ⇒ F) · curve.bezier(P0,P1,P2,P3)
//                    · .stroke()/.dash()/.color() · point/segment 로 제어 다각형
//   실행           : node examples/clean-code/08-curve-implicit-bezier.js
import { join } from 'node:path';
import { point, segment, curve, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '08-curve-implicit-bezier');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 음함수: 원 · 타원 · 쌍곡선 */
const implicit = () =>
  subplots(
    [
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('x² + y² = 4')
        .add(
          curve
            .implicit((x, y) => x * x + y * y - 4)
            .color(palette.blue)
            .stroke(2.5),
        ),
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('x²/4 + y² = 1')
        .add(
          curve
            .implicit((x, y) => (x * x) / 4 + y * y - 1)
            .color(palette.red)
            .stroke(2.5),
        ),
      plot2d([-3, 3], [-3, 3])
        .equal()
        .title('x² − y² = 1')
        .add(
          curve
            .implicit((x, y) => x * x - y * y - 1)
            .color(palette.green)
            .stroke(2.5),
        ),
      plot2d([-2, 2], [-2, 2])
        .equal()
        .title('x³ − 3xy² = 0  (folium)')
        .add(
          curve
            .implicit((x, y) => x * x * x - 3 * x * y * y)
            .color(palette.purple)
            .stroke(2),
        ),
    ],
    { cols: 2, title: 'Implicit Curves', tight: true },
  );

/** 베지에 곡선 + 제어 다각형 */
const bezier = () => {
  const P0 = point(-3, -1);
  const P1 = point(-1, 3);
  const P2 = point(1, -2);
  const P3 = point(3, 1.5);
  return plot2d([-4, 4], [-3, 4])
    .equal()
    .title('Cubic Bézier')
    .add(
      segment(P0, P1).color(palette.gray).dash([4, 3]),
      segment(P1, P2).color(palette.gray).dash([4, 3]),
      segment(P2, P3).color(palette.gray).dash([4, 3]),
      curve.bezier(P0, P1, P2, P3).color(palette.blue).stroke(3),
      P0.dot().label('P₀'),
      P1.dot().label('P₁').color(palette.gray),
      P2.dot().label('P₂').color(palette.gray),
      P3.dot().label('P₃'),
      annotate.text(point(0, -2.6)).label('제어점 3개로 곡률을 조절').font(11).anchor('middle'),
    );
};

await saveFigures(
  [
    ['08-implicit', implicit, '음함수 곡선'],
    ['08-bezier', bezier, '베지에 곡선'],
  ],
  { dir: OUT, index: true, title: 'logos · 08 음함수 · 베지에' },
);
