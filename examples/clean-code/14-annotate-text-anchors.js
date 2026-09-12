// examples/clean-code/14-annotate-text-anchors.js — 텍스트 배치
//
//   무엇을 보여주나 : 라벨 위치(anchor)·오프셋·회전·굵기, 점 라벨, 그림 캡션.
//   사용 API       : annotate.text(P).label(…).anchor('start'|'middle'|'end').offset(dx,dy).font(n).bold().rotate(deg)
//                    · annotate.dot(P).label(…) · annotate.caption(…)
//   실행           : node examples/clean-code/14-annotate-text-anchors.js
import { join } from 'node:path';
import { point, curve, annotate, tex, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '14-annotate-text-anchors');
const { palette, plot2d, subplots, saveFigures } = kit;

/** anchor 3종 비교 */
const anchors = () => {
  const P = point(1, 1);
  return plot2d([-1, 4], [-1, 3])
    .equal()
    .title('anchor: start / middle / end')
    .add(
      curve
        .fn(() => 1)
        .on([-0.5, 3.5])
        .color(palette.gray)
        .dash([4, 3]),
      P.dot(),
      annotate.text(P).label('start').anchor('start').offset(6, -14).color(palette.blue),
      annotate.text(P).label('middle').anchor('middle').offset(0, 8).color(palette.red),
      annotate.text(P).label('end').anchor('end').offset(-6, 22).color(palette.green),
    );
};

/** 스타일: 굵기 · 회전 · 크기 */
const styles = () =>
  subplots(
    [
      plot2d([-1, 4], [-1, 3])
        .equal()
        .title('font / bold / rotate')
        .add(
          annotate.text(point(1.5, 2)).label('plain 12').font(12).anchor('middle'),
          annotate.text(point(1.5, 1.4)).label('bold 16').font(16).bold().anchor('middle'),
          annotate.text(point(1.5, 0.6)).label('rotated −30°').font(13).rotate(-30).anchor('middle'),
          annotate
            .text(point(1.5, 0))
            .label(tex`\sqrt{x^2+1}`)
            .font(15)
            .anchor('middle'),
        ),
      plot2d([-1, 4], [-1, 3])
        .equal()
        .title('annotate.dot label')
        .add(
          annotate.dot(point(0, 0)).label('origin').color(palette.blue),
          annotate.dot(point(2.4, 1.6)).label('target').color(palette.red),
          annotate.arrow(point(0, 0), point(2.4, 1.6)).color(palette.gray).dash([4, 3]),
        ),
    ],
    { cols: 2, title: 'Text Styling', tight: true },
  );

/** 캡션 · 제목 · 축 라벨 */
const captions = () =>
  plot2d([-3, 3], [-1.5, 1.5])
    .title('Titles, labels & caption')
    .xlabel('x')
    .ylabel('y')
    .add(
      curve
        .fn((x) => Math.sin(x))
        .on([-3, 3])
        .color(palette.blue)
        .stroke(2.5),
      annotate.caption('그림 1. y = sin x — 제목/축 라벨/캡션을 한 씬에서'),
    );

await saveFigures(
  [
    ['14-anchors', anchors, 'anchor 3종'],
    ['14-styles', styles, '폰트 · 회전 · 점 라벨'],
    ['14-captions', captions, '제목 · 축 라벨 · 캡션'],
  ],
  { dir: OUT, index: true, title: 'logos · 14 텍스트' },
);
