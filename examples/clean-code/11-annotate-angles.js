// examples/clean-code/11-annotate-angles.js — 각도 표시
//
//   무엇을 보여주나 : 호·직각 표식·도/라디안 라벨.
//   사용 API       : annotate.angle(A, B, C) ※ B 가 꼭짓점 · .arc({radius, double}) · .rightAngle()
//                    · .degrees()/.radians() · .label(…)
//   실행           : node examples/clean-code/11-annotate-angles.js
import { join } from 'node:path';
import { point, line, segment, polygon, annotate, tex, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '11-annotate-angles');
const { palette, plot2d, subplots, saveFigures } = kit;

/** 기본 호 + 도 단위 */
const basic = () => {
  const O = point(0, 0);
  const A = point(3, 0);
  const B = point(2, 2);
  return plot2d([-1, 4], [-1, 3])
    .equal()
    .title('Angle (degrees)')
    .add(
      segment(O, A).color(palette.gray).stroke(2),
      segment(O, B).color(palette.gray).stroke(2),
      annotate.angle(A, O, B).arc({ radius: 1.2 }).degrees().label('θ'),
      O.dot().label('O'),
      A.dot().label('A'),
      B.dot().label('B'),
    );
};

/** 직각 표식 (두 선이 그려져 있어야 제자리) */
const rightAngle = () => {
  const P = point(2, 1);
  return plot2d([-1, 4], [-1, 3])
    .equal()
    .title('Right Angle')
    .add(
      line.horizontal(1).color(palette.gray).stroke(2),
      line.vertical(2).color(palette.gray).stroke(2),
      annotate.angle(point(1, 1), P, point(2, 2)).arc({ radius: 0.3 }).rightAngle(),
      P.dot().label('P'),
    );
};

/**
 * 이중 호 · 라디안 · 직각 — **subplots 패널 안의 각도 주석**.
 *
 * 주의: `arc({ radius })` 는 **world 단위**다 (px 이 아니다). 뷰보다 큰 값을 주면 호가 화면 밖으로
 * 나가 보이지 않고, 예전에는 resvg 래스터가 프로세스를 abort 시키기까지 했다. 지금은 래스터
 * 안전 패스가 캔버스 밖 좌표를 정확히 잘라내고 경고를 낸다 (`test/raster.test.js` 가 회귀를 지킨다).
 */
const advanced = () => {
  const O = point(0, 0);
  return subplots(
    [
      plot2d([-1, 4], [-1, 3])
        .equal()
        .title('double arc · radians')
        .add(
          segment(O, point(3, 0)).color(palette.gray).stroke(2),
          segment(O, point(1, 2.4)).color(palette.gray).stroke(2),
          annotate.angle(point(3, 0), O, point(1, 2.4)).arc({ radius: 1.2, double: true }).radians().label('φ'),
          O.dot().label('O'),
        ),
      plot2d([-1.5, 1.5], [-0.5, 2.5])
        .equal()
        .title('right angles in a square')
        .add(
          polygon(point(-1, 0), point(1, 0), point(1, 2), point(-1, 2)).color(palette.blue).stroke(2),
          annotate.angle(point(0, 0), point(-1, 0), point(-1, 1)).arc({ radius: 0.3 }).rightAngle(),
          annotate.angle(point(0, 0), point(1, 0), point(1, 1)).arc({ radius: 0.3 }).rightAngle(),
          annotate
            .text(point(0, 1))
            .label(tex`\square`)
            .font(18)
            .anchor('middle'),
        ),
    ],
    { cols: 2, title: 'Angles', tight: true },
  );
};

await saveFigures(
  [
    ['11-basic', basic, '각도 (도)'],
    ['11-right-angle', rightAngle, '직각 표식'],
    ['11-advanced', advanced, 'subplots 패널의 각도 주석'],
  ],
  { dir: OUT, index: true, title: 'logos · 11 각도' },
);
