// 0911-PLAN Phase 0-2 / P0-5 — SVG 무결성 린터 + 기하 불변식
// "테스트는 초록인데 좌표가 화면 밖" 회귀를 잡는다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scene, point, circle, ellipse, curve, triangle, line, region, annotate,
  tex, pi, tau,
} from '../index.js';
import { scenes } from './scenes.js';

const W = 600, H = 600, MARGIN = 160;

/** 라벨/점/원 중심이 캔버스를 벗어나면 실패. NaN/Infinity 도 금지. */
function lint(svg, label) {
  assert.ok(!/NaN|Infinity/.test(svg), `${label}: NaN/Infinity 좌표 없음`);
  const coords = [];
  for (const m of svg.matchAll(/<(?:text|foreignObject)\b[^>]*\bx="(-?[\d.]+)"[^>]*\by="(-?[\d.]+)"/g)) coords.push([+m[1], +m[2], 'text']);
  for (const m of svg.matchAll(/<(?:circle|ellipse)\b[^>]*\bcx="(-?[\d.]+)"[^>]*\bcy="(-?[\d.]+)"/g)) coords.push([+m[1], +m[2], 'center']);
  for (const [x, y, kind] of coords) {
    assert.ok(x >= -MARGIN && x <= W + MARGIN, `${label}: ${kind} x=${x.toFixed(1)} 캔버스 밖`);
    assert.ok(y >= -MARGIN && y <= H + MARGIN, `${label}: ${kind} y=${y.toFixed(1)} 캔버스 밖`);
  }
}

test('P0-2 모든 대표 씬의 라벨/중심이 캔버스 안', () => {
  for (const [name, gen] of Object.entries(scenes)) lint(gen(), name);
});

test('P0-1 결정성: 같은 씬은 같은 SVG', () => {
  for (const [name, gen] of Object.entries(scenes)) {
    assert.equal(gen(), gen(), `${name}: 비결정적 출력`);
  }
});

test('P0-2 tight view 에서 축 눈금 라벨이 화면 밖으로 날아가지 않음 (증거 A)', () => {
  const svg = scene().axes().grid(1).add(point(1, 2).label('A').dot()).compile().toSVG();
  assert.ok(!/y="-\d{3,}"/.test(svg), 'y축 눈금 라벨이 큰 음수 좌표로 폭주하지 않음');
  lint(svg, 'tight-view');
});

test('P0-5 equal 씬의 원은 진짜 원(rx===ry)', () => {
  const svg = scene().equal().axes().add(circle.center(point(0, 0)).radius(3)).compile().toSVG();
  const c = svg.match(/<circle[^>]*\br="([\d.]+)"/);
  const e = svg.match(/<ellipse[^>]*\brx="([\d.]+)"[^>]*\bry="([\d.]+)"/);
  if (c) { /* circle 태그면 무조건 진짜 원 */ }
  else { assert.ok(e, 'circle/ellipse 존재'); assert.ok(Math.abs(parseFloat(e[1]) - parseFloat(e[2])) < 1e-6, 'rx===ry'); }
});

test('P1-3 non-equal 씬에서는 원이 타원으로 방출(비등방 스케일 보존)', () => {
  const svg = scene().view([-5, 5], [-2, 2]).add(circle.center(point(0, 0)).radius(1)).compile().toSVG();
  const e = svg.match(/<ellipse[^>]*\brx="([\d.]+)"[^>]*\bry="([\d.]+)"/);
  assert.ok(e, 'non-equal: ellipse 로 방출');
  assert.ok(Math.abs(parseFloat(e[1]) - parseFloat(e[2])) > 1, 'rx ≠ ry');
});

test('P2-4 implicit 곡선은 닫힌 폴리라인으로 병합(Z 포함)', () => {
  const svg = scene().equal().add(curve.implicit((x, y) => x * x + y * y - 1)).compile().toSVG();
  const closed = [...svg.matchAll(/<path[^>]*\bd="([^"]*)"/g)].filter((m) => /Z\s*$/.test(m[1].trim()));
  assert.ok(closed.length >= 1, '닫힌 implicit contour 존재');
});

test('P2-1 adaptive 샘플링이 곡률에 비례해 점을 배분', () => {
  const N = (segs) => segs.reduce((a, s) => a + s.length, 0);
  const straight = curve.fn((x) => 2 * x).on([-3, 3]).segments({ world: { xmin: -3, xmax: 3, ymin: -6, ymax: 6 } });
  const wiggly = curve.fn((x) => Math.sin(20 * x)).on([-3, 3]).segments({ world: { xmin: -3, xmax: 3, ymin: -1.5, ymax: 1.5 } });
  assert.ok(N(straight) < N(wiggly), `직선(${N(straight)}) < 고곡률(${N(wiggly)})`);
});

test('P2-2 step 함수의 점프가 수직 연결선 없이 끊김', () => {
  const segs = curve.fn((x) => (x < 0 ? -1 : 1)).on([-2, 2]).segments({ world: { xmin: -2, xmax: 2, ymin: -1.5, ymax: 1.5 } });
  assert.ok(segs.length >= 2, `점프에서 분리된 segment (${segs.length})`);
});

test('P2-3 region.below 가 곡선 domain 을 상속', () => {
  const f = curve.fn(Math.sin).on([0, pi]);
  const r = region.below(f);
  assert.deepEqual(r.conf.domain, [0, pi], 'domain 상속');
});

test('figure 데코레이션: 제목/축라벨/범례/임의 텍스트/화살표 수식', () => {
  const svg = scene().view([-6, 6], [-5, 6]).equal().axes()
    .title('T').xlabel(tex`x`).ylabel(tex`y`).legend('upper left')
    .add(
      circle.center(point(0, 0)).radius(5).color('#1a73e8').label(tex`r=5`),
      annotate.text(point(1, 1)).label('hello').color('#d93025').font(12).bold(),
      annotate.arrow(point(1, 1), point(2, 2)).color('#d93025').label(tex`\tfrac{a}{b}`),
    ).compile().toSVG({ math: 'text' });
  assert.ok(svg.includes('hello'), '임의 텍스트 주석');
  assert.ok(/font-weight="bold"/.test(svg), 'bold');
  assert.ok(svg.includes('>T<'), '제목');
  assert.ok(svg.includes('r=5'), '범례 항목');
  assert.ok(svg.includes('(a)/(b)'), '화살표 라벨 수식 변환');
  lint(svg, 'figure-decoration');
});

test('P1-2 auto-framing: 타원 bounds 가 view 에 반영', () => {
  const svg = scene().equal().axes().add(ellipse.center(point(0, 0)).semi(3, 2)).compile().toSVG();
  // 눈금 범위가 대략 ±3.6 (semi 3 + 10% pad) 이어야 한다.
  const nums = [...svg.matchAll(/>(-?\d+(?:\.\d+)?)<\/text>/g)].map((m) => Math.abs(parseFloat(m[1])));
  const maxTick = Math.max(...nums.filter((n) => Number.isFinite(n)));
  assert.ok(maxTick <= 4, `눈금 최대 ${maxTick} (타원 크기에 맞게 타이트)`);
});
