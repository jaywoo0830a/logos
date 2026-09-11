// examples/workflow/sketches/plugin.js — 워크플로우 안에서 플러그인 쓰기
//
//   플러그인은 **코어 수정 없이** 문법을 늘린다 → PLUGIN.md
//   여기서는 패키지에 동봉된 `plugins/geometry-extras.js` 를 그대로 사용한다.
//   (외부 프로젝트: `import extras from 'logos/plugins/geometry-extras.js'`)
import { scene, point, circle, use, plugins, annotate } from 'logos';
import geometryExtras from 'logos/plugins/geometry-extras.js';

// 설치(멱등) — 이 한 줄로 ray · arc.circular · hatch · 체이닝 확장 · chalk 테마가 생긴다
use(geometryExtras, { watermark: true });

export const title = '플러그인 확장 (ray · arc · hatch)';

export const figures = {
  'wf-plugin-rays': () => scene()
    .size(560, 460).view([-3, 3], [-3, 3]).equal().axes().theme('chalk')
    .title('ray · arc.circular · point.byDeg')
    .add(
      circle.center(point.origin()).radius(2).color('#8fa8a0').stroke(1),
      plugins.ray(point.origin(), point.byDeg(1, 30)).color('#ffd54f').arrowTip().dashed(),
      plugins.ray(point.origin(), point.byDeg(1, 90)).color('#ffd54f').arrowTip(),
      plugins['arc.circular'](point.origin(), 2, 30, 150, { n: 96 }).color('#4dd0e1').stroke(3),
      annotate.angle({ from: [2, 0], vertex: [0, 0], to: point.byDeg(2, 45) }).arc({ radius: 0.8 }).color('#ffd54f'),
      point.byDeg(2, 30).dot().label('30°', { dx: 12, dy: -18 }),
    ),

  'wf-plugin-hatch': () => scene()
    .size(520, 400).view([0, 6], [0, 4]).axes()
    .title('새 IR 노드 hatch (SVG·TikZ)')
    .add(
      plugins.hatch(1, 1, 4, 1.6, { gap: 8, angle: 45 }).text('A = ∫₀⁴ f(x) dx').color('#4682b4'),
      plugins.hatch(1, 0.2, 4, 0.6, { gap: 5, angle: -45 }).color('#8b0000').opacity(0.8),
    ),
};
