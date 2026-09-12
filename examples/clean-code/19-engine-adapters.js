// examples/clean-code/19-engine-adapters.js — 다중 출력 · 외부 엔진 (ADAPT)
//
//   무엇을 보여주나 : 하나의 씬을 SVG/PNG 외에 TikZ · Asymptote · JSXGraph · HTML · JSON 으로 내보낸다.
//   사용 API       : SceneIR.toSVG/toTikZ/toAsymptote/toJSXGraphHTML/toHTML/toJSON
//                    · adapt.katex.katexRender (수식 조판) · adapt.tikzjax (TikZ→SVG)
//   실행           : node examples/clean-code/19-engine-adapters.js
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { scene, point, line, circle, curve, annotate, tex, adapt, kit } from '../../index.js';

const OUT = join(import.meta.dirname, '..', '..', 'output', 'clean-code', '19-engine-adapters');
mkdirSync(OUT, { recursive: true }); // 파일을 직접 쓰므로 먼저 만든다
const { palette, saveFigures } = kit;

const build = () =>
  scene()
    .size(460, 400)
    .view([-3, 3], [-2.5, 2.5])
    .equal()
    .axes(true)
    .title('One scene → many formats')
    .add(
      circle.center(point(0, 0)).radius(2).color(palette.blue).stroke(2),
      curve
        .fn((x) => Math.sin(x))
        .on([-3, 3])
        .color(palette.red)
        .stroke(2),
      point(2, 0).dot().label('P'),
      line
        .tangent(circle.center(point(0, 0)).radius(2))
        .at(point(2, 0))
        .color(palette.green),
      annotate
        .text(point(0, -1.8))
        .label(tex`x^2+y^2=4`)
        .font(13)
        .anchor('middle'),
    )
    .compile();

const ir = build();

// ── 텍스트 포맷을 모두 파일로 내보낸다 (같은 씬 = 같은 내용, 표현만 다름)
const exported = {
  'figure.tikz.tex': ir.toTikZ(),
  'figure.asy': ir.toAsymptote({ width: 460, height: 400 }),
  'figure.jsxgraph.html': ir.toJSXGraphHTML({ boardId: 'board1', width: 460, height: 400, axes: true }),
  'figure.html': ir.toHTML(),
  'figure.json': JSON.stringify(ir.toJSON(), null, 2),
  'katex.html': adapt.katex.katexRender('x^2 + y^2 = 4'),
};
for (const [name, content] of Object.entries(exported)) writeFileSync(join(OUT, name), content);

// ── TikZJax(WASM) 로 TikZ → SVG (실패하면 건너뛴다)
let tikzNote = 'tikzjax: skip';
try {
  const svg = await adapt.tikzjax('\\draw (0,0) circle (1);');
  if (svg && svg.length) {
    writeFileSync(join(OUT, 'figure.tikzjax.svg'), svg);
    tikzNote = `tikzjax: ${svg.length} bytes`;
  }
} catch (e) {
  tikzNote = 'tikzjax: skip (' + String(e.message).slice(0, 40) + ')';
}

const summary = () =>
  scene()
    .size(560, 260)
    .view([0, 10], [0, 5])
    .axes(false)
    .title('exported files (bytes)')
    .add(
      ...Object.entries(exported).map(([name, content], i) =>
        annotate
          .text(point(0.4, 4.4 - i * 0.62))
          .label(`${name}  —  ${content.length}`)
          .font(12)
          .anchor('start'),
      ),
      annotate.text(point(0.4, 0.4)).label(tikzNote).font(12).color(palette.gray),
    );

await saveFigures(
  [
    ['19-backends', () => ir, '한 씬 → SVG/PNG'],
    ['19-export-list', summary, '내보낸 포맷 목록'],
  ],
  { dir: OUT, index: true, title: 'logos · 19 다중 출력' },
);
