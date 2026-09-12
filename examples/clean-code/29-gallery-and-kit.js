// examples/clean-code/29-gallery-and-kit.js — 저장 · 갤러리 (kit)
//
//   무엇을 보여주나 : kit 의 저장 헬퍼 3종 — 개별 저장 · 일괄 저장+갤러리 · 갤러리 직접 쓰기.
//   사용 API       : kit.saveFigure(fig, {dir, name, png, log}) · kit.saveFigures(list, {dir, index, title})
//                    · kit.writeGallery(dir, entries, {title}) · kit.subplots
//   실행           : node examples/clean-code/29-gallery-and-kit.js
import { join } from 'node:path';
import { scene, point, circle, curve, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '29-gallery-and-kit');
const { palette, plot2d, subplots, saveFigure, saveFigures, writeGallery } = kit;

/** 1) 개별 저장 — saveFigure 는 이름 하나만 저장한다 */
const single = () =>
  plot2d([-3, 3], [-3, 3])
    .equal()
    .title('saveFigure (단일)')
    .add(circle.center(point(0, 0)).radius(2).color(palette.blue).stroke(2), point(0, 0).dot().label('O'));

/** 2) 일괄 저장 + index.html 갤러리 */
const gallery = () =>
  subplots(
    [
      plot2d([-2, 2], [-2, 2])
        .equal()
        .title('curve')
        .add(
          curve
            .fn((x) => x * x - 1)
            .on([-2, 2])
            .color(palette.red),
        ),
      plot2d([-2, 2], [-2, 2])
        .equal()
        .title('circle')
        .add(circle.center(point(0, 0)).radius(1.5).color(palette.green)),
    ],
    { cols: 2, title: 'saveFigures + index', tight: true },
  );

/** 3) 갤러리 직접 쓰기 — entries 를 직접 만들어 writeGallery */
const manual = () =>
  scene()
    .size(520, 420)
    .view([-4, 4], [-3, 3])
    .axes(true)
    .title('writeGallery 로 묶기 전 개별 저장')
    .add(
      curve
        .fn((x) => Math.sin(x))
        .on([-4, 4])
        .color(palette.purple)
        .stroke(2.5),
      annotate.caption('이 figure 는 saveFigure 로 따로 저장됩니다'),
    );

// ① 단일 저장
const a = await saveFigure(single(), { dir: OUT, name: '29-single', png: true, log: false });
// ② 개별 저장 (갤러리에는 직접 넣는다)
await saveFigure(manual(), { dir: OUT, name: '29-manual', png: true, log: false });
// ③ 일괄 저장 + 자동 갤러리
const res = await saveFigures([['29-gallery', gallery, '일괄 저장']], {
  dir: OUT,
  index: true,
  title: 'logos · 29 kit 저장',
});
// ④ 갤러리 다시 쓰기 (entries 를 직접 구성)
writeGallery(
  OUT,
  [
    { name: '29-single', title: 'single' },
    { name: '29-manual', title: 'manual' },
    { name: '29-gallery', title: 'gallery' },
  ],
  { title: 'logos · 29 kit 저장 헬퍼' },
);

console.log('saved:', a.svg ? 'svg ok' : 'svg?', '· figures:', res.ok);
