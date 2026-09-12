// test/raster-cases.mjs — PNG 래스터 회귀 케이스 모음
//
// 왜 별도 파일인가 — `test/raster.test.js` 가 **케이스마다 자식 프로세스**로 실행하기 때문이다.
// resvg(@resvg/resvg-js 2.6.2 → resvg 0.34 포크)는 캔버스를 크게 벗어난 그룹을 만나면
// `geom::fit_to_rect()` 의 `IntRect::from_ltrb(...).unwrap()` 에서 Rust panic → **프로세스 abort**.
// JS try/catch 로는 잡을 수 없어서, "죽지 않고 PNG 를 만들었는가"를 프로세스 경계로 검증한다.
import {
  point,
  line,
  segment,
  vector,
  circle,
  ellipse,
  parabola,
  hyperbola,
  polygon,
  triangle,
  curve,
  region,
  annotate,
  tex,
  transform,
  mat,
  cplx,
  sphere,
  plane,
  cylinder,
  cone,
  polyhedron,
  surface,
  surfaceParam,
  quadrics,
  axes3,
  arrow3,
  curve3,
  vectorField,
  kit,
} from '../index.js';

const { plot2d, plot3d, subplots } = kit;
const P = (x, y) => point(x, y);
const O = () => P(0, 0);
const ONE = (fig) => subplots([fig], { cols: 1, tight: true });

export const cases = {
  // ── 회귀: 실제로 resvg 를 abort 시켰던 조합 (고치기 전에는 여기서 프로세스가 죽었다) ──
  // arc({radius}) 는 **world 단위** — 뷰보다 훨씬 큰 값을 주면 캔버스 밖 극단 좌표가 생긴다.
  'offcanvas-angle-arc': () =>
    ONE(
      plot2d([-1.5, 1.5], [-0.5, 2.5])
        .equal()
        .add(annotate.angle(P(0, 0), P(-1, 0), P(-1, 1)).arc({ radius: 14 }))
        .compile(),
    ),
  'offcanvas-dimension': () =>
    ONE(
      plot2d([-0.5, 3.5], [-0.8, 1])
        .add(segment(P(0, 0), P(3, 0)), annotate.dimension(P(0, 0), P(3, 0)).offset(28).label('3').units('m'))
        .compile(),
    ),
  'vector-3d': () =>
    plot3d({ elev: 24, azim: -55 })
      .add(vector(2, 0, 0), vector(0, 2, 0), vector(0, 0, 4))
      .compile(),
  'huge-circle': () => ONE(plot2d([-1, 1], [-1, 1]).equal().add(circle.center(O()).radius(1e4)).compile()),
  'huge-ellipse': () => ONE(plot2d([-1, 1], [-1, 1]).equal().add(ellipse.center(O()).semi(1e4, 1)).compile()),
  'wide-segment': () =>
    ONE(
      plot2d([-1, 1], [-1, 1])
        .equal()
        .add(segment(P(-1e4, 0), P(1e4, 0)))
        .compile(),
    ),
  'diag-segment': () =>
    ONE(
      plot2d([-1, 1], [-1, 1])
        .equal()
        .add(segment(P(-1e4, -1e4), P(1e4, 1e4)))
        .compile(),
    ),
  'huge-polygon': () =>
    ONE(
      plot2d([-1, 1], [-1, 1])
        .equal()
        .add(polygon(P(0, 0), P(1e4, 0), P(0, 1e4)))
        .compile(),
    ),
  'huge-arrow': () =>
    ONE(
      plot2d([-1, 1], [-1, 1])
        .equal()
        .add(annotate.arrow(P(-1e4, 0), P(1e4, 0)))
        .compile(),
    ),
  'huge-vector-2d': () => ONE(plot2d([-1, 1], [-1, 1]).equal().add(vector(1e4, 1e4)).compile()),

  // ── 대표 도형 (정상 입력이 계속 잘 나오는지) ──
  'points-labels': () =>
    plot2d([-2, 2], [-2, 2])
      .equal()
      .axes()
      .add(
        P(1, 1).dot().label('P'),
        P(-1, 0.5)
          .dot()
          .label(tex`Q`),
        annotate.text(P(0, -1.6)).label('text anchor').font(12).anchor('middle'),
      )
      .compile(),
  'line-forms': () =>
    plot2d([-3, 3], [-3, 3])
      .equal()
      .add(line.through(P(0, 0)).slope(1).color('#2563eb'), line.horizontal(-1), line.vertical(2))
      .compile(),
  conics: () =>
    plot2d([-3, 3], [-3, 3])
      .equal()
      .add(
        ellipse.center(O()).semi(2, 1),
        parabola.focus(P(0, 1)).directrix(line.horizontal(-1)).color('#b91c1c'),
        hyperbola.center(O()).semi(1, 0.6).color('#15803d'),
      )
      .compile(),
  'curves-all': () =>
    plot2d([-3, 3], [-3, 3])
      .add(
        curve.fn((x) => Math.tan(x) * 0.2).on([-3, 3]), // 화면을 크게 벗어나는 곡선(부분 가시)
        curve.parametric((t) => [2 * Math.cos(t), 2 * Math.sin(2 * t)]).on([0, Math.PI * 2]),
        curve.polar((t) => 1 + Math.cos(t)).on([0, Math.PI * 2]),
      )
      .compile(),
  'implicit-bezier': () =>
    plot2d([-2, 2], [-2, 2])
      .add(
        curve.implicit((x, y) => x * x + y * y - 1).on([-2, 2], [-2, 2]),
        curve.bezier(P(-2, 0), P(-1, 2), P(1, -2), P(2, 0)),
      )
      .compile(),
  'region-riemann': () =>
    plot2d([-0.5, 3.5], [-0.5, 5])
      .add(
        region.below((x) => x * x).on([0, 2]),
        region
          .riemann((x) => x * x)
          .on([0, 2])
          .n(6),
        annotate
          .integral((x) => x * x)
          .from(0)
          .to(2)
          .label(tex`\int_0^2 x^2 dx`),
      )
      .compile(),
  'ticks-angles': () =>
    plot2d([-1, 4], [-1, 3])
      .equal()
      .add(
        triangle(P(0, 0), P(3, 0), P(1.5, 2.6)),
        annotate.tick(segment(P(0, 0), P(3, 0))).count(2),
        annotate.angle(P(0, 0), P(3, 0), P(1.5, 2.6)).arc({ radius: 0.6 }).label('θ'),
      )
      .compile(),
  'transform-matrix': () =>
    plot2d([-2, 3], [-2, 3])
      .equal()
      .add(
        polygon(P(0, 0), P(1, 0), P(1, 1), P(0, 1)).apply(
          transform.matrix(
            mat([
              [1.4, 1],
              [0, 0.8],
            ]).rows,
          ),
        ),
      )
      .compile(),
  'vector-field': () =>
    plot2d([-3, 3], [-3, 3])
      .equal()
      .add(vectorField((x, y) => [-y, x]).on([-2.5, 2.5], [-2.5, 2.5]))
      .compile(),
  'complex-plane': () =>
    plot2d([-3, 3], [-3, 3])
      .equal()
      .add(
        cplx.unity(6).map((z) => P(z.re, z.im).dot()),
        segment(O(), P(cplx(2, 1).re, cplx(2, 1).im)),
      )
      .compile(),
  '3d-coords': () =>
    plot3d({ elev: 22, azim: -52 })
      .add(
        axes3({ xlim: [-2, 2], ylim: [-2, 2], zlim: [-2, 2] }),
        arrow3(P(0, 0, 0), P(1, 1, 1)),
        curve3.parametric((t) => [Math.cos(t), Math.sin(t), t / 3]).on([0, 6]),
      )
      .compile(),
  '3d-quadrics': () =>
    subplots(
      [
        plot3d({ elev: 20, azim: -50 }).add(quadrics.ellipsoid(1.2, 0.9, 0.7).solid(12, 12)),
        plot3d({ elev: 20, azim: -50 }).add(
          surfaceParam((u, v) => [u, v, u * v])
            .on([-1, 1], [-1, 1])
            .cmap('viridis')
            .solid(12, 12),
        ),
      ],
      { cols: 2, tight: true },
    ),
  '3d-solids': () =>
    plot3d({ elev: 18, azim: -55 })
      .add(
        cylinder
          .center(O())
          .axis(vector(0, 0, 1))
          .radius(1.2)
          .height(2),
        cone
          .vertex(P(0, 0, 0))
          .axis(vector(0, 0, 1))
          .radius(1.2)
          .height(2),
        polyhedron.platonic('icosa').circumradius(1),
        sphere.center(O()).radius(2).rings(3).meridians(4),
        plane.coordinate('xy'),
      )
      .compile(),
  // 2D + 3D 혼합 패널
  'mixed-panels': () =>
    subplots(
      [
        plot2d([-2, 2], [-2, 2]).equal().add(circle.center(O()).radius(1)).compile(),
        plot3d({ elev: 20, azim: -50 })
          .add(axes3({ xlim: [-1, 1], ylim: [-1, 1], zlim: [-1, 1] }))
          .compile(),
        plot2d([-2, 2], [-2, 2])
          .add(curve.fn((x) => Math.sin(x)).on([-2, 2]))
          .compile(),
        plot2d([-2, 2], [-2, 2])
          .add(region.below((x) => Math.exp(-x * x)).on([-2, 2]))
          .compile(),
      ],
      { cols: 2, tight: true, title: 'mixed' },
    ),
};
