// example.py 와 동일한 그림을 logos 만으로 재현 (matplotlib 품질 비교용).
// 실행: node examples/mpl_parity.js   → output/parity/*.svg + *.png
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scene, point, line, circle, curve, region, panels, surface, vectorField3, annotate, tex, tau } from '../index.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'output', 'parity');
mkdirSync(OUT, { recursive: true });

const BLUE = '#1a73e8', RED = '#d93025', GREEN = '#188038', AMBER = '#f9ab00', PURPLE = '#7b1fa2', GRAY = '#666666';

// ── 14D1A-1: circle x^2+y^2=25 + tangent at (3,4) (example.py a1_circle_trade) ──
function circleTrade() {
  const C = circle.center(point(0, 0)).radius(5).color(BLUE).stroke(2.5).label(tex`x^2+y^2=25`);
  const T = line.slopeIntercept(-0.75, 6.25).color(RED).stroke(2.2).dash([6, 4]).label(tex`y-4=-\tfrac{3}{4}(x-3)`);
  const P = point(3, 4).dot().color(RED);
  return scene()
    .view([-5.8, 6.2], [-4.6, 5.6]).equal().axes()
    .grid({ step: 1, alpha: 0.12, width: 0.5 })     // example.py: ax.grid(alpha=0.15, lw=0.4)
    .title('The circle: one formula, four sign stories')
    .xlabel(tex`x`).ylabel(tex`y`)
    .legend('upper left')
    .layout()
    .add(
      C, T, P,
      annotate.arrow(point(1.1, 4.7), point(3, 4)).color(RED)
        .label(tex`\tfrac{dy}{dx}=-\tfrac{x}{y}=-\tfrac{3}{4}`),
      annotate.text(point(3.1, 2.1)).label('fight\n(y↓ as x↑)').color(PURPLE).anchor('middle').font(11),
      annotate.text(point(3.1, -1.5)).label('cooperate\n(y↑ as x↑)').color(GREEN).anchor('middle').font(11),
      annotate.arrow(point(3.2, -3.4), point(5, 0)).color(GRAY).label('vertical tangent  y=0'),
    )
    .compile();
}

// ── 16C1A-1: circle x^2+y^2=9 + vertical slice (example.py b1_circle_area) ──
function circleArea() {
  const C = circle.center(point(0, 0)).radius(3).color(BLUE).stroke(2.5).label(tex`x^2+y^2=9`);
  // 반원 아래 영역: curve.fn(√(9-x^2)) 을 [−3,3] 에서, 아래는 x축
  const upper = curve.fn((x) => Math.sqrt(Math.max(0, 9 - x * x))).on([-3, 3]).color(BLUE).stroke(2.5);
  return scene()
    .view([-3.9, 3.9], [-3.4, 3.6]).equal().axes()
    .title('The constraint as a factory: each x manufactures its y')
    .xlabel(tex`x`).ylabel(tex`y`)
    .add(
      upper,
      regionBelow(upper, -3, 3).fill(BLUE).opacity(0.25),
      capSlice(1.2, 0.14),
      C,
      annotate.arrow(point(0.35, 2.6), point(1.42, Math.sqrt(9 - 1.44))).color(RED)
        .label('slice height'),
      annotate.text(point(0, -3.1)).label(tex`A=4\int_0^3\sqrt{9-x^2}\,dx=9\pi`).color(PURPLE).anchor('middle').font(13).bold(),
    )
    .compile();
}

// ── 작은 헬퍼: 영역/슬라이스 (라이브러리 API 조합) ──
function regionBelow(cv, a, b) { return region.below(cv).on([a, b]); }
function capSlice(x0, w) {
  return region.below(curve.fn((x) => Math.sqrt(Math.max(0, 9 - x * x))).on([x0, x0 + w]).color(RED))
    .on([x0, x0 + w]).fill(RED).opacity(0.6);
}

// ── 16C1A-0: 두 가지 슬라이싱 (example.py b0_two_slicings) — 2패널 ──
function twoSlicings() {
  const circ = () => circle.center(point(0, 0)).radius(3).color(BLUE).stroke(2.5);
  const yPos = (x) => Math.sqrt(Math.max(0, 9 - x * x));
  const xPos = (y) => Math.sqrt(Math.max(0, 9 - y * y));
  const p1 = scene().view([-3.5, 3.5], [-3.5, 3.5]).equal().title('Vertical slices — x drives')
    .add(circ(),
      ...[-2.5, -1.25, 0, 1.25].map((x0) => region.between((x) => -yPos(x), yPos).on([x0, x0 + 0.9]).fill(RED).opacity(0.25)),
      annotate.text(point(0, -3.1)).label(tex`A=\int_{-3}^{3}2\sqrt{9-x^2}\,dx=9\pi`).color(RED).anchor('middle').font(11).bold(),
    ).compile();
  const p2 = scene().view([-3.5, 3.5], [-3.5, 3.5]).equal().title('Horizontal slices — y drives')
    .add(circ(),
      ...[-2.5, -1.25, 0, 1.25].map((y0) => region.betweenX((y) => -xPos(y), xPos).on([y0, y0 + 0.9]).fill(PURPLE).opacity(0.25)),
      annotate.text(point(0, -3.1)).label(tex`A=\int_{-3}^{3}2\sqrt{9-y^2}\,dy=9\pi`).color(PURPLE).anchor('middle').font(11).bold(),
    ).compile();
  return panels([p1, p2], { cols: 2, title: 'One region, two drivers', cell: [560, 560], tight: true });
}

// ── barh + annulus/wedge (example.py b2/b6) ──
function barsRings() {
  return scene().view([-4, 4], [-4, 4]).equal().axes()
    .spines({ top: false, right: false })           // example.py: 상/우 spine 숨김
    .title('Horizontal bars · annulus · wedge')
    .legend('upper right')
    .add(
      ...[0, 1, 2].map((k) => region.barH(k * 0.9 - 3, k * 0.9 - 2.2, 0, 1.2 + k * 0.9).fill([BLUE, AMBER, GREEN][k]).opacity(0.8)),
      region.annulus(point(0, 0), 2, 3).fill(BLUE).opacity(0.35).label('annulus'),
      region.wedge(point(0, 0), 2, 0, Math.PI / 3).fill(RED).opacity(0.5).label('wedge'),
      circle.center(point(0, 0)).radius(3).color(GRAY).stroke(1.5),
    )
    .compile();
}

// ── 3D 안장 곡면 + quiver (example.py a5/a4) ──
function saddleField() {
  return scene().dim(3).camera({ position: [6, -6, 4] })
    .layout()
    .title('Saddle surface + vector field (3D)')
    .add(
      surface.z((x, y) => x * x - y * y).on([-2, 2], [-2, 2]).faces(true).color('#60a5fa').opacity(0.95),
      surface.z((x, y) => x * x - y * y).on([-2, 2], [-2, 2]).mesh(16).color('#1e3a8a').stroke(1),
      vectorField3((x, y, z) => [-y, x, 0]).on([-1.5, 1.5, -1.5, 1.5, 0, 0]).step(0.75).len(0.5).color(RED),
      annotate.caption(tex`z=x^2-y^2,\quad \vec{F}=(-y,x,0)`),
    )
    .compile();
}

// ── 라벨 자동 배치 데모 ──
function autoLayout() {
  return scene().view([-3, 3], [-3, 3]).equal().axes().layout()
    .title('Auto label layout (collision avoidance)')
    .add(
      point(0, 0).dot().label('origin'), point(0.1, 0.1).dot().label('α'),
      point(-0.1, 0.05).dot().label('β'), point(0.05, -0.12).dot().label('γ'),
    )
    .compile();
}

async function emit(name, fig) {
  const svg = fig.toSVG();
  writeFileSync(join(OUT, `${name}.svg`), svg);
  try { writeFileSync(join(OUT, `${name}.png`), await fig.toPNG({ math: 'text', scale: 2 })); }
  catch (e) { console.warn(`  ${name}.png: ${e.message}`); }
  console.log(`✓ ${name}.svg (+png)`);
}

await emit('14d1a-1-circle-trade', circleTrade());
await emit('16c1a-1-circle-area', circleArea());
await emit('16c1a-0-two-slicings', twoSlicings());
await emit('16c1a-bars-rings', barsRings());
await emit('14d1a-5-saddle-field', saddleField());
await emit('layout-auto', autoLayout());
console.log('→ output/parity/ 확인');
