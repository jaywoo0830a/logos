// v0.2 시나리오 렌더링 데모 — output/ 에 저장
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scene, point, line, curve, circle, parabola, hyperbola, region,
  sphere, plane, polyhedron,
} from '../index.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'output');
mkdirSync(OUT, { recursive: true });
const save = (n, s) => { writeFileSync(join(OUT, `${n}.svg`), s); console.log(`  ✓ ${n} (${s.length})`); };

save('v02-implicit', scene().equal().add(curve.implicit((x, y) => x * x + y * y - 1)).compile().toSVG());
save('v02-parabola', scene().equal().axes().add(parabola.focus(point(0, 1)).directrix(line.horizontal(-1)).color('crimson')).compile().toSVG());
save('v02-hyperbola', scene().equal().axes().add(hyperbola.center(point(0, 0)).semi(3, 2)).compile().toSVG());
const c1 = circle.center(point(-0.5, 0)).radius(1), c2 = circle.center(point(0.5, 0)).radius(1);
save('v02-lens', scene().equal().add(region.intersect(region.inside(c1), region.inside(c2)).fill('steelblue').opacity(0.4), c1.stroke(1.5), c2.stroke(1.5)).compile().toSVG());
save('v02-sphere', scene().dim(3).camera({ position: [3, 3, 2] }).add(sphere.center(point(0, 0, 0)).radius(1).opacity(0.25), plane.coordinate('xy').opacity(0.4)).compile().toSVG());
save('v02-gradient', scene().equal().add(circle.center(point(0, 0)).radius(1).gradient({ type: 'radial', stops: [{ offset: 0, color: '#fff' }, { offset: 1, color: '#3b82f6' }] })).compile().toSVG());
save('v02-clip-tan', scene().equal().add(curve.fn((x) => Math.tan(x)).on([-5, 5]).clip(region.between(line.horizontal(-2), line.horizontal(2)))).compile().toSVG());
save('v02-dodeca', scene().dim(3).camera({ position: [3, 3, 3] }).add(polyhedron.platonic('dodeca').circumradius(1)).compile().toSVG());
console.log('\n→ output/ 에 저장 완료');