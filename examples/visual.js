// 0911-PLAN P0-4 — 대표 씬을 PNG 로 래스터화해 output/png/ 에 저장(시각 회귀용).
// 실행: node examples/visual.js   (필요: @resvg/resvg-js)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { figures } from '../test/scenes.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'output', 'png');
mkdirSync(OUT, { recursive: true });

const items = [];
for (const [name, fig] of Object.entries(figures)) {
  try {
    const png = await fig().compile().toPNG({ math: 'text', scale: 1 });
    writeFileSync(join(OUT, `${name}.png`), png);
    items.push(name);
  } catch (e) {
    console.warn(`  ${name}: ${e.message}`);
  }
}
console.log(`✓ PNG ${items.length}개 저장 → output/png/`);
