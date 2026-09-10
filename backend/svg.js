// DSL.md §12 렌더러 파이프라인 — SVG emitter (clip / gradient / math label)
import { applyTransforms } from '../transform.js';
import { katexRender } from './katex.js';
import { regionRect } from '../shapes/region.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function stroke(style, theme) {
  const def = theme?.textbook ? { width: 1.1 } : {};
  return {
    stroke: style.color || '#000',
    'stroke-width': style.stroke || def.width || 1,
    opacity: style.opacity ?? 1,
    dash: style.dash ? (Array.isArray(style.dash) ? style.dash.join(' ') : String(style.dash)) : null,
  };
}

let CLIPN = 0, GRADN = 0;

function rectPx(r, m) {
  const [x1, y1] = m(null, r.xmin, r.ymax);
  const [x2, y2] = m(null, r.xmax, r.ymin);
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}
function diskPath(cx, cy, r, m, d) {
  const N = 48;
  const segs = [];
  for (let i = 0; i <= N; i++) {
    const a = (2 * Math.PI * i) / N;
    segs.push(`${i === 0 ? 'M' : 'L'} ${m(d, cx + r * Math.cos(a), cy + r * Math.sin(a)).join(' ')}`);
  }
  return segs.join(' ') + ' Z';
}

export function emitSVG(nodes, opts) {
  const { map, scale, W, H, world = null, theme = {}, bg = '#ffffff' } = opts;
  const m = transformPt(map);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`];
  out.push(`<rect width="100%" height="100%" fill="${bg}"/>`);

  const clips = new Map();
  const clipRectOf = new Map();
  const idFor = (r) => { if (r == null) return null; if (!clips.has(r)) clips.set(r, 'logosClip' + (++CLIPN)); return clips.get(r); };
  for (const n of nodes) {
    const d = n.data;
    if (n.kind === 'cliprect' && d.region) { idFor(d.region); clipRectOf.set(d.region, d); }
    if (d && d.clip) idFor(d.clip);
  }
  const defs = [];
  for (const [region, id] of clips) {
    const rr = clipRectOf.has(region) ? clipRectOf.get(region) : regionRect(region, world);
    if (rr) { const p = rectPx(rr, m); defs.push(`<clipPath id="${id}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/></clipPath>`); }
  }
  const gradId = new Map();
  for (const n of nodes) if (n.data && n.data.gradient && !gradId.has(n.data.gradient)) gradId.set(n.data.gradient, 'logosGrad' + (++GRADN));
  for (const [g, id] of gradId) {
    const stops = (g.stops || []).map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('');
    defs.push(g.type === 'linear'
      ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>`
      : `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">${stops}</radialGradient>`);
  }
  if (defs.length) out.push(`<defs>${defs.join('')}</defs>`);

  for (const n of nodes) {
    const d = n.data;
    const cid = d && d.clip ? idFor(d.clip) : null;
    const html = renderNode(n, m, scale, theme, gradId);
    if (html) out.push(cid ? `<g clip-path="url(#${cid})">${html}</g>` : html);
  }
  out.push('</svg>');
  return out.join('\n');
}

function transformPt(map) {
  return (d, x, y) => {
    if (d && d.transforms && d.transforms.length) {
      const [nx, ny] = applyTransforms(d.transforms, [x, y]);
      return map(nx, ny);
    }
    return map(x, y);
  };
}

function renderNode(n, m, scale, theme, gradId) {
  const d = n.data;
  const st = stroke(d.style || d, theme);
  switch (n.kind) {
    case 'path': {
      const segs = [];
      for (const op of d.ops) {
        if (op.op === 'Z' || op.op === 'z') { segs.push('Z'); continue; }
        segs.push(`${op.op} ${m(d, op.x, op.y).join(' ')}`);
      }
      return `<path d="${segs.join(' ')}" fill="none" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st.dash || 'none'}" opacity="${st.opacity}"/>`;
    }
    case 'polygon': {
      const pts = d.pts.map((p) => m(d, p[0], p[1]).join(',')).join(' ');
      return `<polygon points="${pts}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" opacity="${st.opacity}"/>`;
    }
    case 'circle': {
      const [cx, cy] = m(d, d.cx, d.cy);
      let fill = d.fill || 'none';
      if (d.gradient && gradId) { const gid = gradId.get(d.gradient); if (gid) fill = `url(#${gid})`; }
      return `<circle cx="${cx}" cy="${cy}" r="${d.r * scale}" fill="${fill}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st.dash || 'none'}" opacity="${st.opacity}"/>`;
    }
    case 'fillcircle': {
      const [cx, cy] = m(d, d.cx, d.cy);
      return `<circle cx="${cx}" cy="${cy}" r="${d.r * scale}" fill="${d.fill}" opacity="${d.opacity || 1}" stroke="none"/>`;
    }
    case 'clipfill': {
      const cid = 'logosClip' + (++CLIPN);
      return `<defs><clipPath id="${cid}"><path d="${diskPath(d.clip.cx, d.clip.cy, d.clip.r, m, d)}"/></clipPath></defs><path d="${diskPath(d.fill.cx, d.fill.cy, d.fill.r, m, d)}" fill="${d.fillColor}" opacity="${d.opacity || 1}" clip-path="url(#${cid})" stroke="none"/>`;
    }
    case 'ellipse': {
      const [cx, cy] = m(d, d.cx, d.cy);
      const ang = d.angle != null ? ` transform="rotate(${d.angle * 180 / Math.PI} ${cx} ${cy})"` : '';
      return `<ellipse cx="${cx}" cy="${cy}" rx="${d.rx * scale}" ry="${d.ry * scale}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" opacity="${st.opacity}"${ang}/>`;
    }
    case 'point': {
      const [cx, cy] = m(d, d.x, d.y);
      const r = 3.2;
      const fill = d.color || d.fill || '#000';
      const op = d.style?.opacity ?? 1;
      const parts = [`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${d.stroke != null ? ` stroke="${fill}" stroke-width="${d.stroke}"` : ''}${op !== 1 ? ` opacity="${op}"` : ''}/>`];
      if (d.label) {
        const [lx, ly] = m(d, d.x, d.y);
        if (d.labelMath) parts.push(`<foreignObject x="${lx + 6}" y="${ly - 20}" width="300" height="40"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(String(d.label))}</div></foreignObject>`);
        else parts.push(`<text x="${lx + 6}" y="${ly - 6}" font-size="13" fill="${d.color || '#000'}">${esc(d.label)}</text>`);
      }
      return parts.join('\n');
    }
    case 'text': {
      const [x, y] = m(d, d.x, d.y);
      if (d.math) return `<foreignObject x="${x}" y="${y - 16}" width="400" height="40"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(d.text || '')}</div></foreignObject>`;
      return `<text x="${x}" y="${y}" font-size="14" text-anchor="${d.anchor || 'start'}" fill="${d.color || '#000'}">${esc(d.text || '')}</text>`;
    }
    case 'fillrect': {
      const [x0, y0u] = m(d, d.x, 0);
      const [x1, y1u] = m(d, d.x + d.w, d.y1);
      return `<rect x="${Math.min(x0, x1)}" y="${Math.min(y0u, y1u)}" width="${Math.abs(x1 - x0)}" height="${Math.abs(y1u - y0u)}" fill="${d.fill}" opacity="${d.opacity || 1}"/>`;
    }
    case 'fillpath': {
      const segs = [];
      for (const op of d.ops) {
        if (op.op === 'Z' || op.op === 'z') { segs.push('Z'); continue; }
        segs.push(`${op.op} ${m(d, op.x, op.y).join(' ')}`);
      }
      return `<path d="${segs.join(' ')}" fill="${d.fill}" opacity="${d.opacity || 1}" stroke="none"/>`;
    }
    case 'arrow': {
      const [x1, y1] = m(d, d.x1, d.y1);
      const [x2, y2] = m(d, d.x2, d.y2);
      const parts = [];
      if (!d.headless) {
        const id = 'lgsArrow' + (++CLIPN);
        parts.push(`<defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="6" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 L2,4 Z" fill="${st.stroke}"/></marker></defs>`);
        parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" marker-end="url(#${id})" opacity="${st.opacity}"/>`);
      } else {
        parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" opacity="${st.opacity}"/>`);
      }
      if (d.label) parts.push(`<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" font-size="13" text-anchor="middle" fill="${st.stroke}">${esc(d.label)}</text>`);
      return parts.join('\n');
    }
    case 'cliprect':
      return null; // 정의 전용
    default:
      return `<!-- ${n.kind} -->`;
  }
}

export default emitSVG;