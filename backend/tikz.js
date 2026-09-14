// docs/spec/DSL.md §12 렌더러 파이프라인 — TikZ emitter (논문/책 삽입용)
// IR 노드를 TikZ(standalone) 문서로 방출. 좌표는 사용자 좌표계 그대로.
import { applyTransforms } from '../transform.js';
import { nodeEmitter } from '../core/plugin.js';

function pt(d, x, y) {
  const [nx, ny] = d.transforms && d.transforms.length ? applyTransforms(d.transforms, [x, y]) : [x, y];
  const dx = nx < 1e-9 && nx > -1e-9 ? 0 : nx;
  const dy = ny < 1e-9 && ny > -1e-9 ? 0 : ny;
  return `${fmt(dx)},${fmt(dy)}`;
}
const fmt = (v) => {
  const n = Math.round(v * 1000) / 1000;
  return n === 0 ? '0' : String(n);
};

function stroke(d) {
  let s = [];
  if (d.dash) s.push('dashed');
  if (d.stroke && d.stroke > 1) s.push('thick');
  return s.join(', ');
}

export function emitTikZ(nodes, opts = {}) {
  const body = [];
  for (const n of nodes) {
    const d = n.data;
    switch (n.kind) {
      case 'path': {
        const st = stroke(d);
        const ops = d.ops.map((o) => (o.op === 'M' ? '--' : '--') + ` (${pt(d, o.x, o.y)})`).join(' ');
        body.push(`\\draw[${st}] ${ops};`);
        break;
      }
      case 'polygon': {
        const st = stroke(d);
        const ops = d.pts.map((p) => `(${pt(d, p[0], p[1])})`).join(' -- ');
        const fill = d.fill ? `fill=${d.fill}` : '';
        body.push(`\\filldraw[${st}${fill ? ',' + fill : ''}] ${ops} -- cycle;`);
        break;
      }
      case 'circle': {
        const st = stroke(d);
        const [cx, cy] = [d.cx, d.cy];
        body.push(`\\draw[${st}] (${fmt(cx)},${fmt(cy)}) circle (${fmt(d.r)});`);
        break;
      }
      case 'point': {
        const [x, y] = [d.x, d.y];
        body.push(`\\filldraw (${pt(d, x, y)}) circle (1.6pt)${d.label ? ` node[right] {${d.label}}` : ''};`);
        break;
      }
      case 'text': {
        body.push(`\\node at (${pt(d, d.x, d.y)}) {\\(${d.text}\\)};`);
        break;
      }
      case 'fillpath': {
        const ops = d.ops.map((o) => (o.op === 'M' ? '' : ' -- ') + `(${pt(d, o.x, o.y)})`).join('');
        body.push(`\\fill[${d.fill}, opacity=${d.opacity || 0.3}] ${ops};`);
        break;
      }
      case 'arrow': {
        const opt = d.headless ? '' : '->';
        body.push(`\\draw[${opt}] (${pt(d, d.x1, d.y1)}) -- (${pt(d, d.x2, d.y2)});`);
        break;
      }
      default:
        // 플러그인 노드 — `api.node(kind, { tikz })` emitter (문자열 반환 시 그대로 삽입)
        {
          const em = nodeEmitter('tikz', n.kind);
          const s = em ? em(n, opts) : null;
          if (s) body.push(s);
        }
        break;
    }
  }
  const pre = [
    '\\documentclass[tikz,border=2pt]{standalone}',
    '\\usepackage{pgfplots}',
    '\\pgfplotsset{compat=1.18}',
    '\\begin{document}',
    '\\begin{tikzpicture}[>=Stealth, line cap=round, line join=round]',
  ];
  const post = ['\\end{tikzpicture}', '\\end{document}'];
  return [...pre, ...body, ...post].join('\n');
}

export default emitTikZ;
