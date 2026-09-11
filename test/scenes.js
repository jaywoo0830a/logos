// test/scenes.js — 골든 스냅샷/불변식 린터/시각 회귀가 공유하는 대표 씬 정의 (0911-PLAN Phase 0)
import {
  scene, point, line, circle, ellipse, parabola, hyperbola, curve, triangle,
  segment, region, annotate, sphere, surface, tex, pi, tau,
} from '../index.js';

// figures: SceneIR 팩토리 (compile 전). scenes: SVG 문자열 팩토리.
export const figures = {
  A1_point: () => scene().axes().grid(1).add(point(1, 2).label('A').dot()),
  A3_circle_equal: () => scene().equal().axes().add(circle.center(point(0, 0)).radius(3).fill('#dfe7fb').opacity(0.35).stroke(2)),
  A4_styles: () => scene().axes().add(
    point(0, 0).dot().color('#e11'),
    point(1, 1).dot().color('#0a0').stroke(3),
    point(3, 3).dot().opacity(0.4),
  ),
  B1_fn: () => scene().view([-3, 3], [-1, 9]).equal().axes().add(curve.fn((x) => x * x).on([-3, 3]).color('crimson').stroke(2).label(tex`f(x)=x^2`)),
  B4_discontinuous: () => scene().view([-5, 5], [-4, 4]).axes().add(curve.fn((x) => 1 / (x - 1.1)).on([-4.5, 4.5]).color('#0f766e').stroke(2), line.vertical(1.1).dash([4, 3])),
  B5_implicit: () => scene().equal().add(curve.implicit((x, y) => x * x + y * y - 1).color('#7c3aed').stroke(2)),
  C1_ellipse: () => scene().equal().axes().add(ellipse.center(point(0, 0)).semi(3, 2).stroke(2).color('#7c3aed')),
  C2_parabola: () => scene().equal().axes().add(
    parabola.focus(point(0, 1)).directrix(line.horizontal(-1)).color('crimson').stroke(2),
    point(0, 1).dot().label('F'), line.horizontal(-1).color('#888'),
  ),
  C3_hyperbola: () => scene().equal().axes().add(hyperbola.center(point(0, 0)).semi(1.5, 1).color('#0f766e').stroke(2)),
  D1_triangle: () => scene().equal().axes().add(triangle(point(0, 0), point(4, 0), point(2, 3)).fill('#a5d8ff').opacity(0.5).stroke(2).color('#1971c2')),
  D3_riemann: () => scene().view([-0.5, 2.5], [-0.5, 5]).axes().add(
    curve.fn((x) => x * x).on([0, 2]).color('#e63946').stroke(2.2),
    region.riemann((x) => x * x).on([0, 2]).n(8).left().fill('#4dabf7').opacity(0.45),
  ),
  G1_angle: () => scene().equal().add(
    triangle(point(0, 0), point(4, 0), point(1, 3)).stroke(2),
    annotate.angle(point(0, 0), point(4, 0), point(1, 3)).arc({ radius: 1, double: true }).label('α'),
  ),
  G4_integral: () => scene().view([-0.5, pi + 0.5], [-0.5, 1.5]).axes().add(
    curve.fn(Math.sin).on([0, pi]).color('#e63946').stroke(2.2),
    region.below(curve.fn(Math.sin).on([0, pi])).fill('#4dabf7').opacity(0.4),
    annotate.integral(tex`\sin x`).from(0).to(pi).label(tex`2`),
  ),
  G5_integral_text: () => scene().view([-0.5, pi + 0.5], [-0.5, 1.5]).axes().add(
    curve.fn(Math.sin).on([0, pi]).color('#e63946'),
    annotate.integral(tex`\sin x`).from(0).to(pi).label(tex`2`),
  ),
  K1_incenter: () => scene().view([-1, 6], [-1, 5]).equal().axes().theme('textbook').add(
    triangle(point(0, 0), point(5, 0), point(1.5, 4)).fill('#eef3ff').stroke(2),
    circle.inscribed(triangle(point(0, 0), point(5, 0), point(1.5, 4))).color('#e11').dash([4, 3]),
  ),
  K2_tangent: () => scene().view([-4, 6], [-4, 4]).equal().axes().theme('textbook').add(
    circle.center(point(0, 0)).radius(3).stroke(2).color('#1971c2'),
    line.through(point(5, 4), point(5, 0)).color('#e63946').stroke(2),
    segment(point(0, 0), point(5, 4)).dash([3, 3]).color('#868e96'),
    point(0, 0).dot(), point(5, 4).dot(), point(5, 0).dot(),
    annotate.angle(point(0, 0), point(5, 0), point(5, 4)).rightAngle(),
  ),
  K5_calculus: () => scene().view([-3, 4], [-2, 9]).equal().axes().grid({ step: 1 }).theme('textbook').add(
    curve.fn(tex`x^{2} - 1`).on([-3, 3]).color('crimson').stroke(2).label(tex`f(x)=x^2-1`),
    line.tangent(curve.fn(tex`x^{2} - 1`).on([-3, 3])).at(1).dash([5, 3]).color('#666'),
    point(1, 0).dot().label(tex`(1,0)`),
    region.riemann(tex`x^{2} - 1`).on([0, 2]).n(8).left().fill('steelblue').opacity(0.35),
  ),
  F1_polar_rose: () => scene().equal().polarGrid().add(
    curve.polar((t) => Math.cos(3 * t)).on([0, tau]).stroke(2).color('#3b82f6').label(tex`r=\cos 3\theta`),
  ),
  E1_sphere: () => scene().dim(3).camera({ position: [4, 3, 3] }).add(sphere.center(point(0, 0, 0)).radius(1).fill('#4dabf7').opacity(0.3)),
  E3_revolution: () => scene().dim(3).camera({ position: [6, -6, 4] }).add(
    surface.revolution(curve.fn((x) => Math.sqrt(x)).on([0, 4])).about(line.horizontal(0)).opacity(0.8).color('#93c5fd'),
  ),
  I5_clip: () => scene().equal().add(
    curve.fn((x) => x * x).on([-1.5, 1.5]).clip(region.between(line.horizontal(-1), line.horizontal(1))),
  ),
  J5_unicode: () => scene().axes().add(point(0, 0).dot().label('α'), point(1, 0).dot().label('점 A')),
};

// math:'text' 로 방출할 씬(폰트 비의존 렌더 확인용).
const TEXT_MATH = new Set(['G5_integral_text']);

export const scenes = Object.fromEntries(
  Object.entries(figures).map(([name, fig]) => [
    name,
    () => fig().compile().toSVG(TEXT_MATH.has(name) ? { math: 'text' } : undefined),
  ]),
);

export default scenes;

