// examples/clean-code/27-3d-solids-polyhedra.js — 입체와 다면체
//
//   무엇을 보여주나 : 원기둥·원뿔·정다면체·회전체.
//   사용 API       : cylinder.center(O).axis(v).radius(r).height(h) · cone.vertex(V).axis(v).radius(r).height(h)
//                    · polyhedron.platonic('tetra'|'cube'|'octa'|'dodeca'|'icosa').circumradius(r)
//                    · surface.revolution(curve).about(line)
//   실행           : node examples/clean-code/27-3d-solids-polyhedra.js
import { join } from 'node:path';
import { point, vector, line, curve, surface, cylinder, cone, polyhedron, axes3, annotate, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '27-3d-solids-polyhedra');
const { palette, plot3d, subplots, saveFigures } = kit;

/** 원기둥 · 원뿔 */
const cylinderCone = () =>
  plot3d({ elev: 18, azim: -55 })
    .title('cylinder & cone')
    .add(
      axes3({ xlim: [-3, 3], ylim: [-3, 3], zlim: [-1, 3] }),
      cylinder
        .center(point(0, 0, 0))
        .axis(vector(0, 0, 1))
        .radius(1.2)
        .height(2)
        .color(palette.blue)
        .opacity(0.35),
      cone
        .vertex(point(0, 0, 0))
        .axis(vector(0, 0, 1))
        .radius(1.2)
        .height(2)
        .color(palette.red)
        .opacity(0.35),
      annotate
        .text(point(0, 0, 2.4))
        .label('cyl (좌) · cone (우)')
        .font(11)
        .anchor('middle'),
    );

/** 정다면체 5종 */
const platonic = () => {
  const names = ['tetra', 'cube', 'octa', 'dodeca', 'icosa'];
  return subplots(
    names.map((n) =>
      kit
        .plot3d({ elev: 22, azim: -50 })
        .title(n)
        .add(polyhedron.platonic(n).circumradius(1).color(palette.purple).stroke(1.4)),
    ),
    { cols: 3, title: 'Platonic Solids', tight: true },
  );
};

/** 회전체 — y = √x 를 x 축 둘레로 */
const revolution = () =>
  plot3d({ elev: 20, azim: -55 })
    .title('surface.revolution  y = √x  (0 ≤ x ≤ 4)')
    .add(
      axes3({ xlim: [0, 4], ylim: [-2.5, 2.5], zlim: [-2.5, 2.5] }),
      surface
        .revolution(curve.fn((x) => Math.sqrt(x)).on([0, 4]))
        .about(line.horizontal(0))
        .color('#93c5fd')
        .opacity(0.55),
      curve
        .fn((x) => Math.sqrt(x))
        .on([0, 4])
        .color(palette.blue)
        .stroke(2.5),
    );

await saveFigures(
  [
    ['27-cylinder-cone', cylinderCone, '원기둥 · 원뿔'],
    ['27-platonic', platonic, '정다면체 5종'],
    ['27-revolution', revolution, '회전체'],
  ],
  { dir: OUT, index: true, title: 'logos · 27 입체 · 다면체' },
);
