// 0911-PLAN §7 — 신규 figure 기능 검증
// region.betweenX/barH/annulus/wedge · panels · surface.z · vectorField3 · scene.layout
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scene, point, circle, region, panels, surface, vectorField3, annotate } from '../index.js';

test('point.marker(): 마커 모양 (square/triangle/diamond/star/point/plus/cross)', () => {
  const svg = scene().view([-5, 5], [-5, 5]).equal().add(
    point(-4, 0).marker('square').color('#111111').size(6),
    point(-2, 0).marker('triangle').color('#222222').size(6),
    point(0, 0).marker('diamond').color('#333333').size(6),
    point(2, 0).marker('star').color('#444444').size(8),
    point(4, 0).marker('point').color('#555555').size(6),
    point(0, 2).marker('plus').color('#666666').size(6),
    point(0, -2).marker('cross').color('#777777').size(6),
  ).compile().toSVG();
  assert.ok(svg.includes('<rect'), 'square → rect');
  assert.ok((svg.match(/<polygon/g) || []).length >= 3, 'triangle/diamond/star → polygon');
  assert.ok(svg.includes('#444444'), 'star 색');
  assert.ok(!/NaN/.test(svg));
});

test('annotate.text(): bbox 배경 + 회전', () => {
  const svg = scene().view([-5, 5], [-5, 5]).add(
    annotate.text(point(0, 0)).label('Area = 6').anchor('middle').box({ facecolor: 'wheat', alpha: 0.8 }),
    annotate.text(point(-3, 3)).label('rot').rotate(30),
  ).compile().toSVG();
  assert.ok(/<rect[^>]*fill="wheat"[^>]*opacity="0.8"/.test(svg), 'bbox rect');
  assert.ok(/<text[^>]*transform="rotate\(30 /.test(svg), 'rotated text');
  assert.ok(!/NaN/.test(svg));
});

test('region.betweenX / barH / annulus / wedge', () => {
  const svg = scene().view([-5, 5], [-5, 5]).equal().add(
    region.betweenX((y) => -Math.sqrt(Math.max(0, 9 - y * y)), (y) => Math.sqrt(Math.max(0, 9 - y * y)))
      .on([-3, 3]).fill('#7b1fa2').opacity(0.25),
    region.barH(0, 0.8, 0, 3).fill('#f9ab00').opacity(0.8),
    region.annulus(point(0, 0), 2, 3).fill('#1a73e8').opacity(0.4),
    region.wedge(point(0, 0), 2, 0, Math.PI / 3).fill('#d93025').opacity(0.5),
  ).compile().toSVG();
  assert.ok(svg.includes('#f9ab00'), 'barH fill');
  assert.ok(svg.includes('#1a73e8'), 'annulus fill');
  assert.ok(svg.includes('#d93025'), 'wedge fill');
  assert.ok(/<path[^>]*fill="#7b1fa2"/.test(svg), 'betweenX fillpath');
  assert.ok(!/NaN/.test(svg));
});

test('panels: 중첩 svg 로 2패널 합성 + suptitle', () => {
  const f1 = scene().equal().add(circle.center(point(0, 0)).radius(1)).compile();
  const f2 = scene().equal().add(circle.center(point(0, 0)).radius(2)).compile();
  const p = panels([f1, f2], { cols: 2, title: 'Two slicings', cell: [300, 300] });
  const svg = p.toSVG();
  assert.ok(/<svg[^>]*x="[0-9.]+"[^>]*y="[0-9.]+"/.test(svg), 'nested svg with x,y');
  assert.ok(svg.includes('Two slicings'), 'suptitle');
  assert.ok(p.width >= 600 && p.height >= 300);
});

test('surface.z (mesh/faces) + vectorField3 (3D quiver)', () => {
  const svg = scene().dim(3).camera({ position: [6, -6, 4] }).add(
    surface.z((x, y) => x * x - y * y).on([-2, 2], [-2, 2]).mesh(10).color('#93c5fd'),
    surface.z((x, y) => x * x - y * y).on([-2, 2], [-2, 2]).faces(true).color('#60a5fa').opacity(0.9),
    vectorField3((x, y, z) => [-y, x, 0]).on([-1, 1, -1, 1, 0, 0]).step(1).color('#d93025'),
  ).compile().toSVG();
  assert.ok(/<polygon/.test(svg), 'faces polygon');
  assert.ok(/<path/.test(svg), 'wireframe/quiver path');
  assert.ok(svg.includes('#d93025'), 'quiver color');
  assert.ok(!/NaN/.test(svg));
});

test('grid(alpha/width) + spines 옵션', () => {
  const svg = scene().view([-2, 2], [-2, 2]).equal()
    .grid({ step: 1, alpha: 0.15, width: 0.5 })
    .spines({ top: false, right: false })
    .add(circle.center(point(0, 0)).radius(1))
    .compile().toSVG();
  assert.ok(/opacity="0.15"/.test(svg), 'grid alpha');
  assert.ok(svg.includes('stroke-width="0.5"'), 'grid width');
  assert.ok(/<path/.test(svg), 'spine path');
});

test('STIX Two Math 가 텍스트/수식 전역 적용', () => {
  const svg = scene().axes().add(point(0, 0).dot().label('A'), circle.center(point(0, 0)).radius(1)).compile().toSVG();
  assert.ok(svg.includes('STIX Two Math'), 'STIX 폰트 스택');
  assert.ok(/@import/.test(svg), '폰트 @import');
});

test('3D hidden-line: 뒤에 있는 선을 제거', () => {
  const fig = scene().dim(3).camera({ position: [6, -6, 4] }).add(
    surface.z((x, y) => x * x - y * y).on([-2, 2], [-2, 2]).faces(true).color('#60a5fa'),   // occluder
    surface.z((x, y) => x * x - y * y - 2).on([-2, 2], [-2, 2]).mesh(20).color('#1e3a8a'), // 뒤쪽 mesh
  ).compile();
  const withHL = fig.toSVG();
  const withoutHL = fig.toSVG({ hiddenLine: false });
  const segs = (s) => (s.match(/L -?\d/g) || []).length;   // line op 수
  assert.ok(!/NaN/.test(withHL));
  assert.ok(segs(withHL) < segs(withoutHL), `가려진 선 제거 (${segs(withHL)} < ${segs(withoutHL)})`);
  // 같은 곡면 위에 얹힌 mesh 는 가려지지 않아야 한다(오검출 방지).
  const coin = scene().dim(3).camera({ position: [6, -6, 4] }).add(
    surface.z((x, y) => x * x - y * y).on([-2, 2], [-2, 2]).faces(true).color('#60a5fa'),
    surface.z((x, y) => x * x - y * y).on([-2, 2], [-2, 2]).mesh(10).color('#1e3a8a'),
  ).compile();
  assert.equal(segs(coin.toSVG()), segs(coin.toSVG({ hiddenLine: false })), '동일 곡면 mesh 는 유지');
});

test('scene.layout(): 겹치는 라벨 오프셋을 조정', () => {
  const build = (on) => {
    let s = scene().view([-3, 3], [-3, 3]).equal();
    if (on) s = s.layout();
    return s.add(
      point(0, 0).dot().label('A'),
      point(0.06, 0.02).dot().label('B'),
      point(0.02, -0.06).dot().label('C'),
    ).compile().toSVG();
  };
  const off = build(false), on = build(true);
  assert.ok(!/NaN/.test(on));
  assert.notEqual(off, on, 'layout 이 라벨을 재배치');
});
