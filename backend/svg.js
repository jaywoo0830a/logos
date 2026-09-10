// DSL.md §12 렌더러 파이프라인 — SVG emitter
// IR 노드(불변)를 받아 SVG 문자열로 방출.
import { applyTransforms } from '../transform.js';
import { katexRender } from './katex.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function stroke(style, theme) {
  const def = theme?.textbook ? { width: 1.1 } : {};
  const st = {
    stroke: style.color || '#000',
    'stroke-width': style.stroke || def.width || 1,
    opacity: style.opacity ?? 1,
  };
  if (style.dash) st['stroke-dasharray'] = Array.isArray(style.dash) ? style.dash.join(' ') : style.dash;
  return st;
}

export function emitSVG(nodes, opts) {
  const { map, scale, W, H, theme = {}, bg = '#ffffff' } = opts;
  const m = transformPt(nodes, map, applyTransforms);
  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  out.push(`<rect width="100%" height="100%" fill="${bg}"/>`);
  for (const n of nodes) out.push(renderNode(n, m, scale, theme));
  out.push('</svg>');
  return out.join('\n');
}

function P(map, apply, coords) { const [x, y] = apply(coords); return map(x, y); }

function transformPt(nodes, map, applyTransforms) {
  return (d, x, y) => {
    if (d.transforms && d.transforms.length) {
      const [nx, ny] = applyTransforms(d.transforms, [x, y]);
      return map(nx, ny);
    }
    return map(x, y);
  };
}

function renderNode(n, m, scale, theme) {
  const d = n.data;
  switch (n.kind) {
    case 'path': {
      const st = stroke(d.style || d, theme);
      const segs = [];
      for (const op of d.ops) segs.push(`${op.op} ${m(d, op.x, op.y).join(' ')}`);
      return `<path d="${segs.join(' ')}" fill="none" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st['stroke-dasharray'] || 'none'}" opacity="${st.opacity}"/>`;
    }
    case 'polygon': {
      const st = stroke(d.style || d, theme);
      const pts = d.pts.map((p) => { const [px, py] = m(d, p[0], p[1]); return `${px},${py}`; }).join(' ');
      return `<polygon points="${pts}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" opacity="${st.opacity}"/>`;
    }
    case 'circle': {
      const st = stroke(d.style || d, theme);
      const [cx, cy] = m(d, d.cx, d.cy);
      return `<circle cx="${cx}" cy="${cy}" r="${d.r * scale}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st['stroke-dasharray'] || 'none'}" opacity="${st.opacity}"/>`;
    }
    case 'ellipse': {
      const st = stroke(d.style || d, theme);
      const [cx, cy] = m(d, d.cx, d.cy);
      const ang = d.angle != null ? ` transform="rotate(${d.angle * 180 / Math.PI} ${cx} ${cy})"` : '';
      return `<ellipse cx="${cx}" cy="${cy}" rx="${d.rx * scale}" ry="${d.ry * scale}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st['stroke-dasharray'] || 'none'}" opacity="${st.opacity}"${ang}/>`;
    }
    case 'point': {
      const st = stroke(d.style || d, theme);
      const [cx, cy] = m(d, d.x, d.y);
      const r = 3.2;
      const hasStroke = d.stroke != null;
      const fill = d.color || d.fill || '#000';
      const op = d.style?.opacity ?? 1;
      const parts = [`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${hasStroke ? ` stroke="${fill}" stroke-width="${d.stroke}"` : ''}${op !== 1 ? ` opacity="${op}"` : ''}/>`];
      if (d.label) {
        const [lx, ly] = m(d, d.x, d.y);
        if (d.labelMath) {
          parts.push(`<foreignObject x="${lx + 6}" y="${ly - 20}" width="300" height="40"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(String(d.label))}</div></foreignObject>`);
        } else {
          parts.push(`<text x="${lx + 6}" y="${ly - 6}" font-size="13" fill="${d.color || '#000'}">${esc(d.label)}</text>`);
        }
      }
      return parts.join('\n');
    }
    case 'text': {
      const [x, y] = m(d, d.x, d.y);
      const anchor = d.anchor || 'start';
      if (d.math) {
        const katex = katexRender(d.text || '');
        return `<foreignObject x="${x}" y="${y - 16}" width="400" height="40"><div xmlns="http://www.w3.org/1999/xhtml">${katex}</div></foreignObject>`;
      }
      return `<text x="${x}" y="${y}" font-size="14" text-anchor="${anchor}" fill="${d.color || '#000'}">${esc(d.text || '')}</text>`;
    }
    case 'fillrect': {
      const [x0, y0u] = m(d, d.x, 0);
      const [x1, y1u] = m(d, d.x + d.w, d.y1);
      const x = Math.min(x0, x1), y = Math.min(y0u, y1u);
      const w = Math.abs(x1 - x0), h = Math.abs(y1u - y0u);
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${d.fill}" opacity="${d.opacity}"/>`;
    }
    case 'fillpath': {
      const segs = [];
      for (const op of d.ops) segs.push(`${op.op} ${m(d, op.x, op.y).join(' ')}`);
      return `<path d="${segs.join(' ')}" fill="${d.fill}" opacity="${d.opacity}" stroke="none"/>`;
    }
    case 'arrow': {
      const st = stroke(d, theme);
      const [x1, y1] = m(d, d.x1, d.y1);
      const [x2, y2] = m(d, d.x2, d.y2);
      const parts = [];
      if (!d.headless) {
        parts.push(`<defs><marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L12,0 Z" fill="#000"/></marker></defs>`);
      }
      parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}"${d.headless ? '' : ' marker-end="url(#ah)"'} opacity="${st.opacity}"/>`);
      return parts.join('\n');
    }
    default:
      return `<!-- ${n.kind} -->`;
  }
}

export default emitSVG;