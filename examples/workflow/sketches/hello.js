// examples/workflow/sketches/hello.js — 워크플로우 최소 예제 (4단계 흐름 확인용)
//
//   패키지 설치 → 이 파일 작성 → bash scripts/render.sh → out/ 에 산출물
//
// 스케치 계약(CLI): `export default` 하나면 충분하다.
//   Scene | SceneIR | 팩토리 함수  — 무엇이든 된다. 이름/제목은 선택.
import { scene, point, circle, segment, curve, annotate, tex } from '@jaywoo0830a/logos';

export const title = '단위원과 각';

export default scene()
  .size(640, 520)
  .view([-2.2, 2.2], [-1.6, 1.8])
  .equal()
  .axes()
  .grid({ alpha: 0.2 })
  .title('단위원 · sin · cos')
  .add(
    circle.center(point.origin()).radius(1).color('#94a3b8').stroke(1.4),
    curve
      .fn((x) => Math.sin(x))
      .on([-2.2, 2.2], { n: 300 })
      .color('#0ea5e9')
      .stroke(2),
    segment(point.origin(), point.polar(1, Math.PI / 3))
      .color('#dc2626')
      .stroke(2),
    segment(point.polar(1, Math.PI / 3), point(Math.cos(Math.PI / 3), 0))
      .dash([4, 3])
      .color('#dc2626'),
    segment(point.origin(), point(Math.cos(Math.PI / 3), 0))
      .color('#16a34a')
      .stroke(2),
    point
      .polar(1, Math.PI / 3)
      .dot()
      .color('#dc2626')
      .label(tex`P`),
    annotate
      .angle({ from: [1, 0], vertex: [0, 0], to: point.polar(1, Math.PI / 3) })
      .arc({ radius: 0.35 })
      .color('#7c3aed')
      .label(tex`\theta`),
  );
