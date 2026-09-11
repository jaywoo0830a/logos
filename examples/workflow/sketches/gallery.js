// examples/workflow/sketches/gallery.js — 한 파일에서 여러 그림 내보내기
//
//   `export const figures = { 이름: 그림 | () => 그림, … }`
//   → CLI 가 파일 하나에서 여러 figure 를 뽑아 같은 출력 폴더에 담는다(갤러리에도 모두 표시).
import { scene, point, curve, polygon, region, annotate, panels, tex, tau } from 'logos';

/** ① 함수값 — f(x) = x³ − 3x */
const cubic = () => scene()
  .size(480, 380).view([-2.5, 2.5], [-3.5, 3.5]).equal().axes().grid({ alpha: 0.2 })
  .title('y = x³ − 3x')
  .add(
    curve.fn((x) => x ** 3 - 3 * x).on([-2.2, 2.2], { n: 400 }).color('#dc2626').stroke(2.2),
    point(-1, 2).dot().label('극대'), point(1, -2).dot().label('극소'),
  );

/** ② 극곡선 — 3엽 장미 r = cos 3θ */
const rose = () => scene()
  .size(460, 460).view([-1.3, 1.3], [-1.3, 1.3]).equal().axes(false)
  .title('r = cos 3θ')
  .add(curve.polar((t) => Math.cos(3 * t)).on([0, tau], { n: 500 }).color('#7c3aed').stroke(2));

/** ③ 적분 영역 + 정적분 라벨 (한 파일 3번째 그림) */
const integral = () => scene()
  .size(480, 380).view([-0.5, 3], [-0.5, 9]).axes({ x: { label: 'x' }, y: { label: 'y' } })
  .title('∫₀² x² dx')
  .add(
    region.between((x) => x * x, 0).on([0, 2], { n: 80 }).fill('#93c5fd').opacity(0.6),
    curve.fn((x) => x * x).on([-0.4, 2.6], { n: 300 }).color('#1d4ed8').stroke(2),
    annotate.integral((x) => x * x).from(0).to(2).label(tex`\\tfrac{8}{3}`),
  );

/** ④ panels 로 2장 합치기 */
const sideBySide = () => panels([cubic().compile(), rose().compile()], { cols: 2, gap: 14, title: '함수와 극곡선' });

export const figures = {
  'wf-cubic': cubic,
  'wf-rose': rose,
  'wf-integral': integral,
  'wf-panels': sideBySide,
};
