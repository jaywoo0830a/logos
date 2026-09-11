// 1.md — 수학 원서 대표 시나리오 렌더링 → output/
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scene, point, line, curve, circle, triangle, segment, square, rectangle,
  region, annotate, vector, regular, surface, vectorField, tex, pi,
} from '../index.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'output');
mkdirSync(OUT, { recursive: true });
const save = (n, s) => { writeFileSync(join(OUT, `${n}.svg`), s); console.log(`  ✓ ${n} (${s.length})`); };

// #2 수직점근선
save('bk02-asymptote', scene().view([-4, 5], [-6, 8]).axes().add(
  curve.fn((x) => 1 / (x - 1)).on([-3, 4]), line.vertical(1).dash([4, 3]).color('#888'),
  annotate.caption(tex`\lim_{x \to 1} \frac{1}{x-1} = \infty`),
).compile().toSVG());

// #10 정적분 아래 영역
save('bk10-integral', scene().view([-0.5, Math.PI + 0.5], [-0.5, 1.5]).axes().add(
  curve.fn(Math.sin).on([0, Math.PI]).color('crimson'),
  region.below(curve.fn(Math.sin).on([0, Math.PI])).fill('steelblue').opacity(0.4),
  annotate.integral(tex`\sin x`).from(0).to(Math.PI).label(tex`2`),
).compile().toSVG());

// #18 외접원 + 외심
const A = point(0, 0), B = point(4, 0), C = point(1.5, 3);
const O = point.circumcenter(A, B, C);
save('bk18-circumcenter', scene().view([-3, 7], [-3, 5]).equal().add(
  A, B, C, circle.through(A, B, C).color('steelblue'), O.dot().label('O'), segment(O, A).dash([2, 2]),
).compile().toSVG());

// #24 피타고라스 정사각형
const A0 = point(0, 0), B0 = point(3, 0), C0 = point(0, 4);
save('bk24-pythagorean', scene().view([-4, 4], [-4, 4]).equal().add(
  square.on(segment(A0, B0)), square.on(segment(B0, C0)), square.on(segment(C0, A0)),
  segment(A0, B0), segment(B0, C0), segment(C0, A0),
  annotate.caption(tex`a^2 + b^2 = c^2`),
).compile().toSVG());

// #45 이항분포
const bc = (k) => { let r = 1; for (let i = 0; i < k; i++) r *= (10 - i) / (i + 1); return r * (0.5 ** 10); };
const bars = Array.from({ length: 11 }, (_, k) => rectangle.on([k - 0.4, k + 0.4], [0, bc(k)]).fill('steelblue').opacity(0.7));
save('bk45-binomial', scene().view([-1, 11], [0, 0.3]).addAll(bars).compile().toSVG());

// #48 기울기장
save('bk48-slopefield', scene().view([-3, 3], [-3, 3]).axes().add(vectorField((x, y) => [1, x + y])).compile().toSVG());

console.log('\n→ output/ 에 저장 완료');