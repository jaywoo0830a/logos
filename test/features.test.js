// 0911-PLAN §7 — 신규 figure 기능 검증
// region.betweenX/barH/annulus/wedge · panels · surface.z · vectorField3 · scene.layout
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scene,
  point,
  circle,
  region,
  panels,
  surface,
  vectorField3,
  annotate,
  curve3,
  arrow3,
  surfaceParam,
  tau,
  axes3,
  quadrics,
  circle3,
  frame3,
  kit,
  typography,
  mat,
  vec,
  Matrix,
  transform,
  polygon,
  line,
  segment,
  cplx,
} from '../index.js';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('point.marker(): 마커 모양 (square/triangle/diamond/star/point/plus/cross)', () => {
  const svg = scene()
    .view([-5, 5], [-5, 5])
    .equal()
    .add(
      point(-4, 0).marker('square').color('#111111').size(6),
      point(-2, 0).marker('triangle').color('#222222').size(6),
      point(0, 0).marker('diamond').color('#333333').size(6),
      point(2, 0).marker('star').color('#444444').size(8),
      point(4, 0).marker('point').color('#555555').size(6),
      point(0, 2).marker('plus').color('#666666').size(6),
      point(0, -2).marker('cross').color('#777777').size(6),
    )
    .compile()
    .toSVG();
  assert.ok(svg.includes('<rect'), 'square → rect');
  assert.ok((svg.match(/<polygon/g) || []).length >= 3, 'triangle/diamond/star → polygon');
  assert.ok(svg.includes('#444444'), 'star 색');
  assert.ok(!/NaN/.test(svg));
});

test('annotate.text(): bbox 배경 + 회전', () => {
  const svg = scene()
    .view([-5, 5], [-5, 5])
    .add(
      annotate.text(point(0, 0)).label('Area = 6').anchor('middle').box({ facecolor: 'wheat', alpha: 0.8 }),
      annotate.text(point(-3, 3)).label('rot').rotate(30),
    )
    .compile()
    .toSVG();
  assert.ok(/<rect[^>]*fill="wheat"[^>]*opacity="0.8"/.test(svg), 'bbox rect');
  assert.ok(/<text[^>]*transform="rotate\(30 /.test(svg), 'rotated text');
  assert.ok(!/NaN/.test(svg));
});

test('region.betweenX / barH / annulus / wedge', () => {
  const svg = scene()
    .view([-5, 5], [-5, 5])
    .equal()
    .add(
      region
        .betweenX(
          (y) => -Math.sqrt(Math.max(0, 9 - y * y)),
          (y) => Math.sqrt(Math.max(0, 9 - y * y)),
        )
        .on([-3, 3])
        .fill('#7b1fa2')
        .opacity(0.25),
      region.barH(0, 0.8, 0, 3).fill('#f9ab00').opacity(0.8),
      region.annulus(point(0, 0), 2, 3).fill('#1a73e8').opacity(0.4),
      region
        .wedge(point(0, 0), 2, 0, Math.PI / 3)
        .fill('#d93025')
        .opacity(0.5),
    )
    .compile()
    .toSVG();
  assert.ok(svg.includes('#f9ab00'), 'barH fill');
  assert.ok(svg.includes('#1a73e8'), 'annulus fill');
  assert.ok(svg.includes('#d93025'), 'wedge fill');
  assert.ok(/<path[^>]*fill="#7b1fa2"/.test(svg), 'betweenX fillpath');
  assert.ok(!/NaN/.test(svg));
});

test('panels: 중첩 svg 로 2패널 합성 + suptitle', () => {
  const f1 = scene()
    .equal()
    .add(circle.center(point(0, 0)).radius(1))
    .compile();
  const f2 = scene()
    .equal()
    .add(circle.center(point(0, 0)).radius(2))
    .compile();
  const p = panels([f1, f2], { cols: 2, title: 'Two slicings', cell: [300, 300] });
  const svg = p.toSVG();
  assert.ok(/<svg[^>]*x="[0-9.]+"[^>]*y="[0-9.]+"/.test(svg), 'nested svg with x,y');
  assert.ok(svg.includes('Two slicings'), 'suptitle');
  assert.ok(p.width >= 600 && p.height >= 300);
});

test('surface.z (mesh/faces) + vectorField3 (3D quiver)', () => {
  const svg = scene()
    .dim(3)
    .camera({ position: [6, -6, 4] })
    .add(
      surface
        .z((x, y) => x * x - y * y)
        .on([-2, 2], [-2, 2])
        .mesh(10)
        .color('#93c5fd'),
      surface
        .z((x, y) => x * x - y * y)
        .on([-2, 2], [-2, 2])
        .faces(true)
        .color('#60a5fa')
        .opacity(0.9),
      vectorField3((x, y, z) => [-y, x, 0])
        .on([-1, 1, -1, 1, 0, 0])
        .step(1)
        .color('#d93025'),
    )
    .compile()
    .toSVG();
  assert.ok(/<polygon/.test(svg), 'faces polygon');
  assert.ok(/<path/.test(svg), 'wireframe/quiver path');
  assert.ok(svg.includes('#d93025'), 'quiver color');
  assert.ok(!/NaN/.test(svg));
});

test('grid(alpha/width) + spines 옵션', () => {
  const svg = scene()
    .view([-2, 2], [-2, 2])
    .equal()
    .grid({ step: 1, alpha: 0.15, width: 0.5 })
    .spines({ top: false, right: false })
    .add(circle.center(point(0, 0)).radius(1))
    .compile()
    .toSVG();
  assert.ok(/opacity="0.15"/.test(svg), 'grid alpha');
  assert.ok(svg.includes('stroke-width="0.5"'), 'grid width');
  assert.ok(/<path/.test(svg), 'spine path');
});

test('STIX Two Math 가 텍스트/수식 전역 적용', () => {
  const svg = scene()
    .axes()
    .add(point(0, 0).dot().label('A'), circle.center(point(0, 0)).radius(1))
    .compile()
    .toSVG();
  assert.ok(svg.includes('STIX Two Math'), 'STIX 폰트 스택');
  assert.ok(/@import/.test(svg), '폰트 @import');
});

test('3D hidden-line: 뒤에 있는 선을 제거', () => {
  const fig = scene()
    .dim(3)
    .camera({ position: [6, -6, 4] })
    .add(
      surface
        .z((x, y) => x * x - y * y)
        .on([-2, 2], [-2, 2])
        .faces(true)
        .color('#60a5fa'), // occluder
      surface
        .z((x, y) => x * x - y * y - 2)
        .on([-2, 2], [-2, 2])
        .mesh(20)
        .color('#1e3a8a'), // 뒤쪽 mesh
    )
    .compile();
  const withHL = fig.toSVG();
  const withoutHL = fig.toSVG({ hiddenLine: false });
  const segs = (s) => (s.match(/L -?\d/g) || []).length; // line op 수
  assert.ok(!/NaN/.test(withHL));
  assert.ok(segs(withHL) < segs(withoutHL), `가려진 선 제거 (${segs(withHL)} < ${segs(withoutHL)})`);
  // 같은 곡면 위에 얹힌 mesh 는 가려지지 않아야 한다(오검출 방지).
  const coin = scene()
    .dim(3)
    .camera({ position: [6, -6, 4] })
    .add(
      surface
        .z((x, y) => x * x - y * y)
        .on([-2, 2], [-2, 2])
        .faces(true)
        .color('#60a5fa'),
      surface
        .z((x, y) => x * x - y * y)
        .on([-2, 2], [-2, 2])
        .mesh(10)
        .color('#1e3a8a'),
    )
    .compile();
  assert.equal(segs(coin.toSVG()), segs(coin.toSVG({ hiddenLine: false })), '동일 곡면 mesh 는 유지');
});

test('curve3/arrow3/surfaceParam — 3D 프리미티브', () => {
  const svg = scene()
    .dim(3)
    .camera({ elev: 22, azim: -55, aspect: [1, 1, 0.75] })
    .add(
      curve3
        .parametric((t) => [Math.cos(t), Math.sin(t), 0])
        .on([0, tau])
        .color('#cc0000')
        .stroke(2)
        .label('C3'),
      curve3
        .through([
          [0, 0, 0],
          [1, 1, 1],
        ])
        .dash([4, 3]),
      arrow3([0, 0, 0], [2, 0, 0]).color('#ff0000').label('xaxis'),
      surfaceParam((u, v) => [Math.sin(v) * Math.cos(u), Math.sin(v) * Math.sin(u), Math.cos(v)])
        .on([0, tau], [0, Math.PI])
        .solid(12, 8)
        .cmap('viridis'),
    )
    .compile()
    .toSVG();
  assert.ok(/<polygon/.test(svg), 'surfaceParam solid 면');
  assert.ok(/<path/.test(svg), 'curve3/arrow3 경로');
  assert.ok(svg.includes('C3') && svg.includes('xaxis'), '3D 라벨');
  assert.ok(!/NaN/.test(svg));
});

test('3D camera(elev/azim/aspect) · axes(false) · 3D 텍스트 투영', () => {
  const mk = (opts, noAxes) => {
    let s = scene().dim(3).camera(opts);
    if (noAxes) s = s.axes(false);
    return s
      .add(arrow3([0, 0, 0], [1, 0, 0]), annotate.text(point(1, 0, 0)).label('A(1,0,0)'))
      .compile()
      .toSVG();
  };
  const a = mk({ elev: 20, azim: -50 }, true),
    b = mk({ elev: 60, azim: -10 }, true);
  assert.ok(!/NaN/.test(a) && !/NaN/.test(b));
  assert.notEqual(a, b, 'elev/azim 이 투영에 반영');
  const withAxes = mk({ elev: 20, azim: -50 }, false);
  assert.ok(withAxes.length > a.length, 'axes(false) 는 3D 자동축을 생략');
  assert.ok(/3D|A\(1,0,0\)/.test(a), '3D 텍스트가 투영되어 렌더');
});

test('surface.z(...).cmap() — 높이 컬러맵', () => {
  const mk = (s) => scene().dim(3).add(s).compile().toSVG();
  const surf = () =>
    surface
      .z((x, y) => x * x + y * y)
      .on([-2, 2], [-2, 2])
      .faces(true);
  const plain = mk(surf()),
    cm = mk(surf().cmap('viridis'));
  assert.notEqual(plain, cm, 'cmap 이 면 색에 반영');
  const fills = (s) => new Set([...s.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)].map((m) => m[1]));
  const anyGreen = [...fills(cm)].some((h) => {
    const n = parseInt(h.slice(1), 16);
    return ((n >> 16) & 255) > 110 && ((n >> 8) & 255) > 130;
  });
  assert.ok(anyGreen, 'viridis 상향(녹/황) 색 존재');
  assert.ok(!/NaN/.test(cm));
});

test('scene.layout(): 겹치는 라벨 오프셋을 조정', () => {
  const build = (on) => {
    let s = scene().view([-3, 3], [-3, 3]).equal();
    if (on) s = s.layout();
    return s
      .add(point(0, 0).dot().label('A'), point(0.06, 0.02).dot().label('B'), point(0.02, -0.06).dot().label('C'))
      .compile()
      .toSVG();
  };
  const off = build(false),
    on = build(true);
  assert.ok(!/NaN/.test(on));
  assert.notEqual(off, on, 'layout 이 라벨을 재배치');
});

test('axes3/quadrics/circle3/frame3 — 3D 작성 헬퍼', () => {
  // axes3: 화살표 3개(+라벨)를 배열로 돌려주어 .add(...) 에 펼칠 수 있다.
  const arr = axes3({ length: 4, color: '#808080', width: 0.8 });
  assert.equal(arr.length, 3, '축 3개');
  const labeled = scene()
    .dim(3)
    .axes(false)
    .add(...axes3({ length: 4, labels: null }))
    .compile()
    .toSVG();
  const withLabels = scene()
    .dim(3)
    .axes(false)
    .add(...axes3({ length: 4 }))
    .compile()
    .toSVG();
  assert.ok(withLabels.length > labeled.length, 'labels: null 이면 축 라벨을 생략');

  // quadrics: 곡면 팩토리는 모두 surfaceParam 을 상속 → wire/solid/cmap 사용 가능
  const svg = scene()
    .dim(3)
    .axes(false)
    .add(
      quadrics.ball(1.2, [0, 0, 0]).wire(12, 8).color('#0000ff'),
      quadrics.ellipsoid(2, 1.5, 1).wire(10, 6),
      quadrics.hyperboloid1(1, 1, 2).wire(10, 6),
      quadrics.hyperboloid2(1, 1, 2, [0, 0, 0], [0.7, 2]).wire(10, 6),
      quadrics.cone(1).wire(10, 6),
      quadrics.cylinder(1).wire(10, 6),
      quadrics.plane((x, y) => x * x - y * y, [-1, 1], [-1, 1]).wire(8, 8),
      circle3(1, 0.5),
    )
    .compile()
    .toSVG();
  assert.ok(/<path/.test(svg) && !/NaN/.test(svg), '이차곡면/원호 렌더');
  assert.equal(typeof quadrics.ball(1).cmap, 'function', 'cmap 상속');

  // frame3: 그리지 않지만 프레이밍에는 참여(출력 도형 수는 늘지 않는다)
  const bare = scene()
    .dim(3)
    .axes(false)
    .add(...axes3({ length: 2 }))
    .compile();
  const framed = scene()
    .dim(3)
    .axes(false)
    .add(...axes3({ length: 2 }), frame3([-2, 2], [-2, 2], [-2, 2]))
    .compile();
  const draws = (ir) => ir.o.nodes.filter((n) => ['path', 'polygon', 'circle'].includes(n.kind)).length;
  assert.equal(draws(bare), draws(framed), 'frame3 는 도형을 그리지 않는다');
  assert.notDeepEqual(framed.o.world, bare.o.world, 'frame3 는 뷰 범위만 바꾼다');
});

test('kit: plot2d/plot3d 프리셋 + palette + seg/poly3 단축', () => {
  const p2 = kit.plot2d([-1, 1], [-2, 2]).compile();
  assert.equal(p2.o.dim, 2);
  assert.deepEqual(p2.o.size, [560, 440], '기본 셀 [560,440]');
  assert.deepEqual([p2.o.world.xmin, p2.o.world.xmax], [-1, 1]);

  const p3 = kit.plot3d({ elev: 25, azim: -60 }).compile();
  assert.equal(p3.o.dim, 3);
  assert.deepEqual(p3.o.size, [480, 440], '3D 기본 셀 [480,440]');
  assert.ok(!/NaN/.test(p3.toSVG()));

  assert.equal(kit.palette.blue, '#0000ff');
  assert.equal(kit.palette.orangead, '#ffa500');
  assert.equal(kit.palette.tab10.length, 10);

  // seg: 2D 는 직선, 3D 좌표는 곡선으로 자동 분기
  assert.equal(kit.seg(point(0, 0), point(1, 1)).kind, 'line');
  assert.equal(kit.seg(point(0, 0, 0), point(1, 1, 1)).kind, 'curve3');
  assert.equal(
    kit
      .poly3(
        [
          [0, 0, 0],
          [1, 1, 1],
        ],
        { dash: [4, 3] },
      )
      ._conf.dash.join(' '),
    '4 3',
    'poly3 dash',
  );
});

test('kit.subplots(): 셀 크기를 figure 에서 자동 추론 (패널 겹침 방지)', () => {
  const fig = (r) =>
    scene()
      .size(480, 440)
      .equal()
      .add(circle.center(point(0, 0)).radius(r));
  const p = kit.subplots([fig(1), fig(2), fig(3)], { cols: 3, title: 'T', tight: true });
  // W = 3*480 + 2*4(gap) + 2*8(outer) / H = 440 + 2*8 + 34(title)
  assert.equal(p.width, 1464);
  assert.equal(p.height, 490);
  // 셀보다 큰 서브씬이 있으면 최댓값을 셀 크기로 쓴다(겹침 방지)
  const mixed = kit.subplots(
    [
      scene()
        .size(300, 300)
        .add(circle.center(point(0, 0)).radius(1)),
      scene()
        .size(500, 400)
        .add(circle.center(point(0, 0)).radius(2)),
    ],
    { cols: 2 },
  );
  assert.ok(mixed.width >= 2 * 500, '가장 큰 서브씬 기준으로 셀 확보');
  assert.ok(!/NaN/.test(p.toSVG()));
});

test('kit.saveFigures(): SVG(+PNG) 저장 + index.html 갤러리', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'logos-kit-'));
  try {
    const res = await kit.saveFigures(
      [
        [
          't-one',
          () =>
            scene()
              .add(circle.center(point(0, 0)).radius(1))
              .compile(),
          '테스트 원',
        ],
      ],
      { dir, index: true, log: false, title: '테스트 갤러리' },
    );
    assert.equal(res.ok, 1);
    assert.equal(res.fail, 0);
    const svg = readFileSync(join(dir, 't-one.svg'), 'utf8');
    assert.ok(svg.startsWith('<svg'), 'SVG 저장');
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    assert.ok(html.includes('t-one.svg') && html.includes('테스트 원'), '갤러리 카드');

    // 원시 Scene 을 돌려주는 factory 도 자동 컴파일되어 저장된다
    const res2 = await kit.saveFigures(
      [
        [
          't-two',
          () =>
            scene()
              .equal()
              .add(circle.center(point(0, 0)).radius(2)),
        ],
      ],
      { dir, log: false, png: false },
    );
    assert.equal(res2.ok, 1);
    assert.ok(readFileSync(join(dir, 't-two.svg'), 'utf8').startsWith('<svg'), 'Scene 자동 컴파일');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('타이포그래피: 행간/자간 (TYPE + lineHeight/letterSpacing)', () => {
  assert.deepEqual(typography, { lineHeight: 1.32, letterSpacing: 0.01 });
  const multi = scene()
    .view([0, 10], [0, 10])
    .add(annotate.text(point(1, 5)).label('첫 줄\n둘째 줄').font(10))
    .compile()
    .toSVG();
  assert.ok(multi.includes('letter-spacing:0.01em'), '전역 자간');
  assert.ok(multi.includes('dy="13.2'), '기본 행간 1.32 × fs');
  assert.ok(!multi.includes('dy="11.5"'), '옛 행간(1.15) 미사용');

  const custom = scene()
    .view([0, 10], [0, 10])
    .add(annotate.text(point(1, 5)).label('가\n나').font(10).lineHeight(2).letterSpacing(1.5))
    .compile()
    .toSVG();
  assert.ok(custom.includes('dy="20"'), 'lineHeight(2) 오버라이드');
  assert.ok(/<text[^>]*letter-spacing="1.5"/.test(custom), 'letterSpacing(px) 속성');
});

test('linalg.mat: apply/det/inv/pow/t() — 행렬과 벡터 (12A2)', () => {
  const A = mat([
    [2, 1],
    [0.5, 1.5],
  ]);
  assert.ok(A instanceof Matrix);
  assert.deepEqual(A.apply([1, 0]), [2, 0.5], 'A·e₁ = A 의 1열');
  assert.deepEqual(A.col(1), [1, 1.5], '열 벡터');
  assert.equal(A.det, 2.5);
  assert.deepEqual(
    mat([
      [2, 1],
      [1, 3],
    ]).inv.toArray(),
    [
      [0.6, -0.2],
      [-0.2, 0.4],
    ],
  );
  assert.deepEqual(
    mat.identity(2).pow(5).toArray(),
    [
      [1, 0],
      [0, 1],
    ],
    'A⁰ = I',
  );
  assert.deepEqual(A.mul(mat.identity(2)).toArray(), A.toArray(), 'A·I = A');
  assert.deepEqual(A.t().toArray(), [
    [2, 0.5],
    [1, 1.5],
  ]);
  assert.deepEqual(
    A.map([
      [0, 0],
      [1, 1],
    ]),
    [
      [0, 0],
      [3, 2],
    ],
    '점 배열 변환',
  );
  // 3×3 행렬식 = 부피 배율
  const B = mat([
    [2, 0.5, 0.3],
    [0.2, 1.8, 0.3],
    [0.2, 0.1, 1.5],
  ]);
  assert.equal(Number(B.det.toFixed(4)), 5.118);
  assert.equal(Number(B.inv.mul(B).at(0, 0).toFixed(9)), 1);
  assert.throws(
    () =>
      mat([
        [1, 0],
        [0, 0],
      ]).inv,
    /특이 행렬/,
    'det=0 → 역행렬 없음',
  );
  assert.throws(
    () =>
      mat([
        [1, 2, 3],
        [4, 5, 6],
      ]).det,
    /정사각/,
    '비정방 행렬식 거부',
  );
  // 생성 프리셋
  assert.deepEqual(
    mat
      .rotation(90)
      .apply([2, 0.5])
      .map((v) => Number(v.toFixed(9))),
    [-0.5, 2],
  );
  assert.deepEqual(mat.reflection('y').toArray(), [
    [-1, 0],
    [0, 1],
  ]);
  assert.deepEqual(mat.shear(1.5, 0).toArray(), [
    [1, 1.5],
    [0, 1],
  ]);
  assert.deepEqual(mat.scaling(3, 2).toArray(), [
    [3, 0],
    [0, 2],
  ]);
});

test('linalg.vec: dot/norm/unit/project/cross/areaOf/angleDeg', () => {
  assert.equal(vec.norm([3, 4]), 5);
  assert.deepEqual(vec.unit([3, 4]), [0.6, 0.8]);
  assert.equal(vec.dot([3, 1], [1, 3]), 6);
  assert.equal(vec.angleDeg([3, 1], [1, 3]).toFixed(2), '53.13');
  assert.deepEqual(
    vec.project([4, 2], [2, 0.5]).map((v) => Number(v.toFixed(3))),
    [4.235, 1.059],
  );
  assert.deepEqual(
    vec.reject([4, 2], [2, 0.5]).map((v) => Number(v.toFixed(3))),
    [-0.235, 0.941],
  );
  assert.deepEqual(vec.cross([1, 0], [0, 1]), [0, 0, 1], '2D 입력은 z=0 로 승격');
  assert.equal(vec.areaOf([3, 1], [1, 2.5]), 6.5, '|a×b| = 평행사변형 넓이');
  assert.equal(vec.det2([3, 1], [1, 2.5]), 6.5, 'det2 = 부호 있는 넓이');
  assert.throws(() => vec.unit([0, 0]), /영벡터/);
});

test('transform.matrix(): 배열/Matrix 둘 다 + 도형 .apply()', () => {
  assert.deepEqual(
    transform
      .matrix([
        [2, 1],
        [0.5, 1.5],
      ])
      .apply([1, 0]),
    [2, 0.5],
  );
  assert.deepEqual(
    transform
      .matrix(
        mat([
          [2, 1],
          [0.5, 1.5],
        ]),
      )
      .apply([0, 1]),
    [1, 1.5],
  );
  const svg = scene()
    .view([-1, 4], [-1, 4])
    .add(
      polygon(point(0, 0), point(1, 0), point(1, 1), point(0, 1)).apply(
        transform.matrix([
          [2, 1],
          [0.5, 1.5],
        ]),
      ),
    )
    .compile()
    .toSVG();
  const manual = scene()
    .view([-1, 4], [-1, 4])
    .add(polygon(point(0, 0), point(2, 0.5), point(3, 2), point(1, 1.5)))
    .compile()
    .toSVG();
  assert.equal(svg, manual, '변환된 꼭짓점 좌표 방출');
  assert.ok(!/NaN/.test(svg));
});

test('axes({ y: { ticks: false } }) — y 눈금 끄기 (set_yticks([]))', () => {
  // 눈금 글자는 x 는 가운데 정렬(middle), y 는 오른쪽 정렬(end) — 정렬로 구분해 센다.
  const ticks = (svg, anchor) =>
    [...svg.matchAll(new RegExp(`font-size="12"[^>]*text-anchor="${anchor}"[^>]*>([^<]+)<`, 'g'))].map((m) => m[1]);
  const xTicks = (svg) => ticks(svg, 'middle');
  const yTicks = (svg) => ticks(svg, 'end');
  const mk = (cfg) => scene().size(400, 400).view([-3, 3], [-3, 3]).axes(cfg).compile().toSVG();
  const both = mk(true),
    noY = mk({ y: { ticks: false } }),
    noX = mk({ x: { ticks: false, label: false }, y: { ticks: false } });
  assert.ok(xTicks(both).length > 0 && yTicks(both).length > 0, '기본은 x·y 눈금 모두');
  assert.equal(yTicks(noY).length, 0, 'y 눈금 제거');
  assert.ok(xTicks(noY).length > 0, 'x 눈금은 그대로');
  assert.equal(xTicks(noX).length + yTicks(noX).length, 0, 'x·y 눈금 모두 제거');
  // kit.plot2d 도 같은 설정을 그대로 넘긴다
  const viaKit = kit
    .plot2d([-3, 3], [-3, 3], { size: [400, 400], axes: { y: { ticks: false } } })
    .compile()
    .toSVG();
  assert.equal(yTicks(viaKit).length, 0, 'plot2d(axes 설정) 전달');
});

test('점선 화살표/다각형: stroke-dasharray 방출', () => {
  const svg = scene()
    .view([-5, 5], [-5, 5])
    .add(
      annotate.arrow(point(0, 0), point(3, 2)).dash([6, 4]),
      polygon(point(-4, -4), point(-2, -4), point(-2, -2)).dash([5, 4]).fill('none'),
      segment(point(0, -4), point(3, -1)).dash([2, 3]),
    )
    .compile()
    .toSVG();
  assert.ok(/<line[^>]*stroke-dasharray="6 4"/.test(svg), '화살표 점선');
  assert.ok(/<polygon[^>]*stroke-dasharray="5 4"/.test(svg), '다각형 점선 테두리');
  assert.ok(/<path[^>]*stroke-dasharray="2 3"/.test(svg), '선분 점선');
  const plain = scene()
    .view([-5, 5], [-5, 5])
    .add(annotate.arrow(point(0, 0), point(1, 1)))
    .compile()
    .toSVG();
  assert.ok(!/<line[^>]*stroke-dasharray/.test(plain), '기본 화살표는 실선');
});

test('annotate.angle: 이름 지정형 — 꼭짓점 실수 방지', () => {
  const A = point(3, 1),
    O = point(0, 0),
    B = point(1, 3);
  const named = scene()
    .view([-1, 4], [-1, 4])
    .add(annotate.angle({ from: A, vertex: O, to: B }).arc({ radius: 0.6 }))
    .compile()
    .toSVG();
  const positional = scene()
    .view([-1, 4], [-1, 4])
    .add(annotate.angle(A, O, B).arc({ radius: 0.6 }))
    .compile()
    .toSVG();
  assert.equal(named, positional, '이름형 == 위치형(B 가 꼭짓점)');

  // [x, y] 좌표 배열도 허용
  const arrays = scene()
    .view([-1, 4], [-1, 4])
    .add(annotate.angle({ from: [3, 1], vertex: [0, 0], to: [1, 3] }).arc({ radius: 0.6 }))
    .compile()
    .toSVG();
  assert.equal(arrays, named, '좌표 배열 허용');

  // 꼭짓점을 첫 인자로 넘기면 다른 곳에 그려진다 → 실수를 즉시 알아채도록 문서/이름형 제공
  const wrong = scene()
    .view([-1, 4], [-1, 4])
    .add(annotate.angle(O, A, B).arc({ radius: 0.6 }))
    .compile()
    .toSVG();
  assert.notEqual(wrong, named, '위치형은 순서에 민감(가운데가 꼭짓점)');

  assert.throws(() => annotate.angle({ from: A, to: B }), /세 점/, '이름형 필수 키 검사');
  assert.throws(() => annotate.angle(A, [0, 0], B), /점\(point\)이 필요/, '좌표 배열을 위치형에 넘기면 명확히 실패');
});

test('annotate.angle rightAngle: 표식 두 변의 끝이 각의 두 광선 위에 놓인다', () => {
  const A = point(3, 1),
    O = point(0, 0),
    B = point(-1, 3); // A ⊥ B → 진짜 직각
  const ctx = { world: { xmin: -5, xmax: 5, ymin: -5, ymax: 5 } };
  const [mark] = annotate.angle({ from: A, vertex: O, to: B }).arc({ radius: 0.5 }).rightAngle().toIR(ctx);
  assert.equal(mark.kind, 'path', '직각 표식은 path 하나');
  const [m, corner, end] = mark.data.ops.map((o) => [o.x, o.y]);
  const s = 0.5 * 0.6; // 변 길이 = radius · 0.6
  // 각 변의 자유단은 꼭짓점에서 두 광선 방향으로 정확히 s 만큼 떨어진 점(=광선 위)
  for (const [p, Q] of [
    [m, A],
    [end, B],
  ]) {
    assert.ok(Math.abs(Math.hypot(p[0], p[1]) - s) < 1e-9, '변 길이 = radius·0.6');
    assert.ok(Math.abs(p[0] * Q.coords[1] - p[1] * Q.coords[0]) < 1e-9, '자유단은 광선 위(외적 0)');
    assert.ok(p[0] * Q.coords[0] + p[1] * Q.coords[1] > 0, '자유단은 광선이 뻗는 쪽(+방향)');
  }
  // 모서리는 두 자유단의 합 → 각의 **안쪽**에 놓인다(허공으로 삐져나가지 않음)
  assert.ok(
    Math.abs(corner[0] - (m[0] + end[0])) < 1e-9 && Math.abs(corner[1] - (m[1] + end[1])) < 1e-9,
    '모서리 = 자유단 두 개의 합',
  );
  // 광선이 90°가 아니면 경고만 하고 그대로 그린다(예외 아님)
  const [mark2] = annotate.angle({ from: A, vertex: O, to: A }).rightAngle().toIR(ctx);
  assert.equal(mark2.kind, 'path');
});

test('axes3: 축 화살표 촉 기본값 0.06 (ratio 로 조절)', () => {
  const def = axes3({ length: 5 });
  assert.equal(def.length, 3);
  assert.equal(def[0]._conf.ratio, 0.06, '축은 작은 촉이 기본');
  assert.equal(axes3({ length: 5, ratio: 0.02 })[0]._conf.ratio, 0.02, 'ratio 지정');
  assert.equal(axes3({ length: 5, ratio: null })[0]._conf.ratio, undefined, 'null 이면 arrow3 기본(0.12)');
  assert.equal(arrow3([0, 0, 0], [1, 0, 0])._conf.ratio, undefined, 'arrow3 자체 기본은 그대로');
  const svg = scene()
    .dim(3)
    .camera({ elev: 20, azim: -50 })
    .axes(false)
    .add(...axes3({ length: 3 }))
    .compile()
    .toSVG();
  assert.ok(!/NaN/.test(svg));
});

test('제목/축라벨 여백: 눈금·격자는 데이터 영역 안에만 그린다', () => {
  // 제목 자리(ymax 위 10% 여백)에 눈금 라벨이 찍히면 제목과 겹친다("6" 이 제목 위로).
  const fig = scene()
    .view([-5.5, 5.5], [-5.5, 5.5])
    .axes()
    .grid()
    .title('T')
    .add(circle.center(point(0, 0)).radius(1))
    .compile();
  const svg = fig.toSVG();
  // view 상한(5.5) 밖의 눈금(6)은 없어야 한다.
  assert.ok(!/>6<\/text>/.test(svg), '여백(제목 자리)에 눈금 라벨 없음');
  assert.ok(/>5<\/text>/.test(svg), '데이터 영역 눈금은 그대로');
  // 격자도 데이터 영역까지만 — y = 5.5 위로는 그리지 않는다.
  const world = fig.o.world;
  assert.ok(world.ymax > 5.5 + 1e-9, '제목 여백이 world 를 넓혔다');
  assert.ok(!/NaN/.test(svg));
});

test('annotate.arrow().bend(): 이차 베지어 path + 끝 화살촉', () => {
  const svg = scene()
    .view([-5, 5], [-5, 5])
    .add(annotate.arrow(point(-2, -2), point(2, 2)).bend(0.3).color('#e74c3c').stroke(2))
    .compile()
    .toSVG();
  assert.ok(/<path d="M [^"]*L [^"]*L/.test(svg), '곡선 화살표는 여러 점 path');
  assert.ok(/marker-end="url\(#lgsArrow\d+\)"/.test(svg), 'path 끝에 화살촉(marker-end)');
  assert.ok(svg.includes('#e74c3c'));
  assert.ok(!/NaN/.test(svg));
  // bend 없으면 기존 arrow 노드(직선)
  const straight = scene()
    .view([-5, 5], [-5, 5])
    .add(annotate.arrow(point(-2, -2), point(2, 2)))
    .compile()
    .toSVG();
  assert.ok(/<line [^>]*marker-end=/.test(straight), '직선 화살표는 line + marker-end');
});

test('cplx: 복소수 수치 도우미 (abs·arg·conj·mul·div·pow·roots·unity·matrix)', () => {
  const z = cplx(3, 2);
  assert.equal(z.toString(), '3 + 2i');
  assert.ok(Math.abs(z.abs - Math.sqrt(13)) < 1e-12, '|3+2i| = √13');
  assert.ok(Math.abs(z.argDeg - 33.6900675) < 1e-6, 'arg(3+2i) ≈ 33.69°');
  assert.equal(z.conj.toString(), '3 - 2i', '켤레 = 실축 반사');
  assert.deepEqual(z.toArray(), [3, 2]);

  // 곱 = 회전+확대: |z₁z₂| = |z₁||z₂|, arg 합
  const p = cplx.mul(cplx.polar(2, 60), cplx.polar(3, 30));
  assert.ok(Math.abs(p.abs - 6) < 1e-12 && Math.abs(p.argDeg - 90) < 1e-9, '2∠60° · 3∠30° = 6∠90°');

  // 나눗셈: z / z = 1, 1/z = z̄/|z|²
  assert.ok(cplx.div(z, z).equals(1));
  const inv = cplx.div(1, z);
  assert.ok(Math.abs(inv.re - 3 / 13) < 1e-12 && Math.abs(inv.im + 2 / 13) < 1e-12, '1/(3+2i) = (3-2i)/13');
  assert.ok(Math.abs(inv.abs * z.abs - 1) < 1e-12, '|z|·|1/z| = 1 (반전)');
  assert.ok(Math.abs(cplx.argDeg(inv) + z.argDeg) < 1e-9, 'arg(1/z) = −arg z (반사)');

  // 드무아브르
  assert.ok(cplx.pow(cplx.polar(2, 20), 3).equals(cplx.polar(8, 60)), 'z³ = r³∠3θ');
  assert.throws(() => cplx(1, 1).pow(0.5), /정수/, '정수가 아닌 지수는 예외');
  assert.throws(() => cplx(0, 0).pow(-1), /정의되지/, '0 의 0 이하 거듭제곱은 예외');
  assert.throws(() => cplx.div(1, 0), /나눌 수 없/, '0 으로 나누면 예외');
  assert.throws(() => cplx(NaN, 1), /유한한 실수/, 'NaN 입력은 예외');

  // n제곱근/1의 n제곱근 = 정n각형, 합 = 0
  const r4 = cplx(16, 0).roots(4);
  assert.equal(r4.length, 4);
  assert.ok(
    r4.every((w) => Math.abs(w.abs - 2) < 1e-9),
    '16 의 네 제곱근은 반지름 2',
  );
  assert.deepEqual(
    cplx.unity(4).map((w) => w.toString()),
    ['1', 'i', '-1', '-i'],
  );
  const sum = cplx.unity(6, 1.5).reduce((a, b) => a.add(b), cplx(0, 0));
  assert.ok(sum.abs < 1e-12, '1 의 n제곱근 합 = 0');
  assert.throws(() => cplx.unity(0), /1 이상의 정수/, 'n 은 1 이상');

  // a+bi ↔ 회전·확대 행렬 [[a, −b], [b, a]] (12A2 의 linalg.mat 과 연결)
  assert.deepEqual(cplx.matrix(z).rows, [
    [3, -2],
    [2, 3],
  ]);
  const w = cplx(0, 1);
  assert.deepEqual(
    cplx.matrix(w).rows,
    [
      [0, -1],
      [1, 0],
    ],
    'z = i → 90° 회전 행렬',
  );
});

test('cplx.matrix: 곱셈 = 행렬 곱 (복소수 ↔ 회전·확대 행렬 동형)', () => {
  const a = cplx(0.6, 0.8),
    b = cplx(1.5, -0.5);
  const byNumber = cplx.mul(a, b).toArray();
  const byMatrix = cplx.matrix(a).mul(cplx.matrix(b)).rows;
  const [re, im] = byNumber;
  assert.ok(
    Math.abs(byMatrix[0][0] - re) < 1e-12 && Math.abs(byMatrix[0][1] + im) < 1e-12,
    '[[a,−b],[b,a]] 곱 = [[Re, −Im], [Im, Re]] (1행)',
  );
  assert.ok(Math.abs(byMatrix[1][0] - im) < 1e-12 && Math.abs(byMatrix[1][1] - re) < 1e-12, '2행 = (Im, Re)');
  // 행렬식 = |z|²
  const det =
    cplx.matrix(a).rows[0][0] * cplx.matrix(a).rows[1][1] - cplx.matrix(a).rows[0][1] * cplx.matrix(a).rows[1][0];
  assert.ok(Math.abs(det - a.abs ** 2) < 1e-12, 'det = |z|²');
});

test('kit.seg(): 좌표 배열도 받는다 — 2D 에서 컴파일 크래시(line.pointDir) 회귀 방지', () => {
  const withArray = scene()
    .view([0, 4], [0, 4])
    .add(kit.seg([1, 1], [3, 2]))
    .compile()
    .toSVG();
  const withPoint = scene()
    .view([0, 4], [0, 4])
    .add(kit.seg(point(1, 1), point(3, 2)))
    .compile()
    .toSVG();
  assert.equal(withArray, withPoint, '배열 인자와 point 인자가 같은 그림');
  const a3 = kit.seg([0, 0, 0], [1, 1, 1]); // 3D 는 선분(curve3.through) — 배열 인자
  assert.ok(a3, '3D 배열 인자도 생성된다');
});

test('kit.palette.tab: 이름 있는 tab10 (tab10 배열과 같은 값·순서)', () => {
  assert.deepEqual(Object.values(kit.palette.tab), kit.palette.tab10);
  assert.equal(kit.palette.tab.blue, '#1f77b4');
  assert.equal(kit.palette.tab.red, '#d62728');
});
