// ADAPT.md §2·3계층 — Asymptote 백엔드 (출판 품질)
// IR 노드 → `.asy` 소스 생성, CLI(`asy -f svg`)로 컴파일.
// 공식 API(로컬 asy 2.85 검증):
//   draw(pair..pair), draw(circle(pair,r), pen), dot(pair, pen),
//   label("…", pair, NE|E|SE…), filldraw(path--cycle, fillpen, drawpen),
//   graph(real f(real), a, b, n=…)
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const n = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return r === 0 ? '0' : String(r);
};

// 색상명/hex → Asymptote rgb() pen
const NAMED = {
  red: 'rgb(1,0,0)', blue: 'rgb(0,0,1)', green: 'rgb(0,1,0)',
  black: 'rgb(0,0,0)', white: 'rgb(1,1,1)',
  crimson: 'rgb(0.86,0.08,0.24)', steelblue: 'rgb(0.27,0.51,0.71)',
  '#e11': 'rgb(0.93,0.07,0.07)', '#e63946': 'rgb(0.90,0.22,0.27)',
  '#3b82f6': 'rgb(0.235,0.51,0.96)', '#1971c2': 'rgb(0.098,0.443,0.76)',
  '#7c3aed': 'rgb(0.49,0.23,0.93)', '#e8590c': 'rgb(0.91,0.35,0.05)',
  '#93c5fd': 'rgb(0.58,0.77,0.99)', '#94a3b8': 'rgb(0.58,0.64,0.72)',
  '#4dabf7': 'rgb(0.30,0.67,0.97)', '#0f766e': 'rgb(0.06,0.46,0.43)',
};
function rgbPen(color) {
  if (!color) return 'rgb(0.2,0.2,0.2)';
  if (NAMED[color]) return NAMED[color];
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    const c = parseInt(color.slice(1), 16);
    return `rgb(${(((c >> 16) & 255) / 255).toFixed(3)},${(((c >> 8) & 255) / 255).toFixed(3)},${((c & 255) / 255).toFixed(3)})`;
  }
  return String(color);
}
function pen(color, weight, style) {
  const parts = [rgbPen(color)];
  if (weight) parts.push(`linewidth(${n(weight)}pt)`);
  if (style && style.dash) parts.push('dashed');
  return parts.join('+');
}
const invisible = 'invisible';
function ltx(text) {
  if (text == null) return '';
  const s = typeof text?.toLatex === 'function' ? text.toLatex() : String(text);
  // Asymptote label 은 문자열 인자를 받는다 → "$...$" 를 따옴표로 감싼다.
  const q = `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  return q.includes('$') ? q : `"$${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}$"`;
}
function labelPos(off) {
  if (!off) return 'E';
  if (typeof off === 'string') return off;
  const x = off.dx ?? 0, y = off.dy ?? 0;
  let p = '';
  if (y > 0) p += 'N'; else if (y < 0) p += 'S';
  if (x > 0) p += 'E'; else if (x < 0) p += 'W';
  return p || 'E';
}
/**
 * 색상명을 Asymptote 기본 색명으로 변환 (출력이 단순해짐).
 * hex 이면 rgb() 로, 알 수 없으면 rgb(깊은 회색).
 */
/** IR 노드 배열 → Asymptote 소스 (2D/3D) */
export function irToAsymptote(nodes, opts = {}) {
  const lines = [];
  const is3D = opts.dim === 3;
  if (is3D) {
    lines.push('import three;');
    lines.push('import graph3;');
    lines.push('import solids;');
  } else {
    lines.push('import graph;');
    lines.push('import geometry;');
  }
  lines.push(`size(${opts.width || 400}, ${opts.height || 400});`);
  if (opts.equal) lines.push(`unitsize(1cm);`); // 정사각형 비율 유지(기본값 근처)

  for (const nd of nodes) {
    const d = nd.data;
    switch (nd.kind) {
      case 'point':
        lines.push(`dot((${n(d.x)}, ${n(d.y)}), ${rgbPen(d.color)});`);
        if (d.label) lines.push(`label(${ltx(d.label)}, (${n(d.x)}, ${n(d.y)}), ${labelPos(d.labelOff)});`);
        break;
      case 'circle': {
        const st = pen(d.color, d.stroke, d.style);
        const fill = (d.fill && d.fill !== 'none') ? `+fill:${rgbPen(d.fill)}` : '';
        lines.push(`draw(circle((${n(d.cx)}, ${n(d.cy)}), ${n(d.r)}), ${st}${fill});`);
        break;
      }
      case 'ellipse': {
        const st = pen(d.color, d.stroke, d.style);
        lines.push(`draw(shift((${n(d.cx)}, ${n(d.cy)}))*scale(${n(d.rx)}, ${n(d.ry)})*unitcircle, ${st});`);
        break;
      }
      case 'path': {
        const pts = d.ops.filter((o) => o.op === 'M' || o.op === 'L').map((o) => `(${n(o.x)},${n(o.y)})`);
        if (pts.length < 2) break;
        const closed = d.ops.some((o) => o.op === 'Z' || o.op === 'z');
        const s = pts.join('--') + (closed ? '--cycle' : '');
        const st = pen(d.color, d.stroke, d.style);
        if (d.fill && d.fill !== 'none') lines.push(`filldraw(${s}, ${rgbPen(d.fill)}, ${st});`);
        else lines.push(`draw(${s}, ${st});`);
        break;
      }
      case 'polygon': {
        const pts = d.pts.map((p) => `(${n(p[0])},${n(p[1])})`).join('--');
        const st = pen(d.color, d.stroke, d.style);
        if (d.fill && d.fill !== 'none') lines.push(`filldraw(${pts}--cycle, ${rgbPen(d.fill)}, ${st});`);
        else lines.push(`filldraw(${pts}--cycle, invisible, ${st});`);
        break;
      }
      case 'fillpath': {
        const s = d.ops.filter((o) => o.op === 'M' || o.op === 'L').map((o) => `(${n(o.x)},${n(o.y)})`).join('--') + '--cycle';
        lines.push(`filldraw(${s}, ${rgbPen(d.fill)}, invisible);`);
        break;
      }
      case 'fillrect': {
        const x0 = n(d.x), x1 = n(d.x + d.w), y0 = '0', y1 = n(d.y1);
        lines.push(`filldraw((${x0},${y0})--(${x1},${y0})--(${x1},${y1})--(${x0},${y1})--cycle, ${rgbPen(d.fill)}, invisible);`);
        break;
      }
      case 'arrow': {
        const st = pen(d.color, d.stroke, d.style);
        const head = d.headless ? '' : ' + Arrow';
        lines.push(`draw((${n(d.x1)},${n(d.y1)})--(${n(d.x2)},${n(d.y2)}), ${st}${head});`);
        break;
      }
      case 'text':
        lines.push(`label(${ltx(d.text)}, (${n(d.x)}, ${n(d.y)}), ${labelPos(d.labelOff)});`);
        break;
      default:
        break;
    }
  }
  return lines.join('\n');
}
// ── CLI: .asy → SVG (결과 SVG 문자열도 함께 반환) ──
export async function compileAsymptote(asySource, { format = 'svg', cwd } = {}) {
  const dir = cwd || mkdtempSync(join(tmpdir(), 'logos-asy-'));
  const file = join(dir, 'fig.asy');
  writeFileSync(file, asySource, 'utf8');
  return new Promise((resolve, reject) => {
    const child = spawn('asy', [`-f${format}`, 'fig.asy'], { cwd: dir });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { reject(new Error(`asy 미설치: ${e.message}`)); });
    child.on('close', (code) => {
      if (code !== 0) { reject(new Error(`asy exit ${code}: ${err.slice(0, 400)}`)); return; }
      const out = file.replace(/\.asy$/, `.${format}`);
      let svg = '';
      try { svg = readFileSync(out, 'utf8'); } catch (e) { /* 일부 버전은 다른 확장자 */ }
      resolve({ path: out, code: asySource, svg, dir });
    });
  });
}

export default irToAsymptote;
export function asyColor(color) { return rgbPen(color); }