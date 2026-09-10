// ADAPT.md §2·3계층 — Asymptote 백엔드 (출판 품질)
// IR 노드 → `.asy` 소스 생성, 그리고 CLI(`asy -f svg`)로 컴파일.
// Asymptote는 LaTeX 로 라벨을 조판하고 PDF/SVG/PRC(3D) 를 지원한다.
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const n = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return r === 0 ? '0' : String(r);
};

/** 라벨 → Asymptote LaTeX ($...$ 포함 문자열 그대로) */
function lbl(text) {
  if (text == null) return '';
  return typeof text.toLatex === 'function' ? `$${text.toLatex()}$` : `$${String(text)}$`;
}

/** IR 노드 배열 → Asymptote 소스 (2D) */
export function irToAsymptote(nodes, opts = {}) {
  const lines = [];
  lines.push('import graph;');
  lines.push('import geometry;');
  lines.push(`size(${opts.width || 400}, ${opts.height || 400});`);
  lines.push('unitsize(1cm);');

  for (const nd of nodes) {
    const d = nd.data;
    switch (nd.kind) {
      case 'point': {
        lines.push(`dot((${n(d.x)}, ${n(d.y)}), blue);`);
        if (d.label) lines.push(`label("${lbl(d.label)}", (${n(d.x)}, ${n(d.y)}), NE);`);
        break;
      }
      case 'circle': {
        lines.push(`draw(circle((${n(d.cx)}, ${n(d.cy)}), ${n(d.r)}));`);
        break;
      }
      case 'path': {
        // 폴리라인(곡선/선) → path
        const pts = d.ops
          .filter((o) => o.op === 'M' || o.op === 'L')
          .map((o) => `(${n(o.x)}, ${n(o.y)})`)
          .join('--');
        if (pts) lines.push(`draw(${pts});`);
        break;
      }
      case 'polygon': {
        const pts = d.pts.map((p) => `(${n(p[0])}, ${n(p[1])})`).join('--');
        lines.push(`filldraw(${pts}--cycle);`);
        break;
      }
      case 'text': {
        lines.push(`label("${lbl(d.text)}", (${n(d.x)}, ${n(d.y)}));`);
        break;
      }
      default:
        break;
    }
  }
  return lines.join('\n');
}

// ── CLI 컴파일: .asy → SVG ───────────────────────
export function compileAsymptote(asySource, { format = 'svg', cwd } = {}) {
  return new Promise((resolve, reject) => {
    const dir = cwd || mkdtempSync(join(tmpdir(), 'logos-asy-'));
    const file = join(dir, 'fig.asy');
    writeFileSync(file, asySource, 'utf8');
    const child = spawn('asy', [`-f${format}`, file], { cwd: dir });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { reject(new Error(`asy 미설치: ${e.message}`)); });
    child.on('close', (code) => {
      if (code !== 0) { reject(new Error(`asy exit ${code}: ${err.slice(0, 500)}`)); return; }
      const outFile = file.replace(/\.asy$/, `.${format}`);
      // BackgroundTask: 결과 파일 읽어 resolve
      resolve({ path: outFile, dir, code: asySource });
    });
  });
}

export default irToAsymptote;