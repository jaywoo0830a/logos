// DSL.md §12 렌더러 파이프라인 — SVG emitter (clip / gradient / math label)
import { applyTransforms } from '../transform.js';
import { katexRender } from './katex.js';
import { regionRect } from '../shapes/region.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 테마로부터 스타일 기본값 (출판 품질)
function themed(opts) {
  return {
    bg: opts.bg || '#ffffff',
    font: opts.font || 'sans-serif',
    fontMath: opts.fontMath || 'Georgia, serif',
    axisColor: opts.axisColor || '#333',
    gridColor: opts.gridColor || '#cbd5e1',
    labelColor: opts.labelColor || '#333',
    pointColor: opts.pointColor || '#1f4e79',
    strokeDefault: opts.strokeDefault || '#1a2744',
    strokeWidth: opts.strokeWidth || 1.5,
  };
}

function stroke(style, t) {
  const w = style.stroke || t.strokeWidth;
  return {
    stroke: style.color || t.strokeDefault,
    'stroke-width': w,
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
  const { map, scale, W, H, world = null, bg } = opts;
  const t = themed(opts);
  const m = transformPt(map);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${esc(t.font)}">`];
  // 부드러운 배경 그라디언트 (상단 밝음 → 하단 미세하게 어두움)
  // + 채워진 원을 위한 단일 방사 그라디언트 (출판 느낌의 음영)
  const circColor = firstFill(nodes) || t.pointColor;
  out.push(`<defs><linearGradient id="lgbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg}"/><stop offset="1" stop-color="${shadeBg(t.bg)}"/></linearGradient><radialGradient id="logoCircleGrad" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="${lighten(circColor)}"/><stop offset="0.7" stop-color="${circColor}"/><stop offset="1" stop-color="${darken(circColor)}"/></radialGradient></defs>`);
  out.push(`<rect width="100%" height="100%" fill="url(#lgbg)"/>`);

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
    const html = renderNode(n, m, scale, t, gradId);
    if (html) out.push(cid ? `<g clip-path="url(#${cid})">${html}</g>` : html);
  }
  out.push('</svg>');
  return out.join('\n');
}

// 배경을 살짝 어둡게(미묘한 질감) — hex or 이름 지원
function shadeBg(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 6), g = Math.max(0, ((n >> 8) & 255) - 6), b = Math.max(0, (n & 255) - 8);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function lighten(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + 70), g = Math.min(255, ((n >> 8) & 255) + 70), b = Math.min(255, (n & 255) + 70);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darken(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 45), g = Math.max(0, ((n >> 8) & 255) - 45), b = Math.max(0, (n & 255) - 45);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// 첫 번째 채워진 원/폴리곤의 색 추출 (방사 그라디언트 기준색)
function firstFill(nodes) {
  for (const n of nodes) {
    const d = n.data;
    if (d && d.fill && d.fill !== 'none' && /^#[0-9a-fA-F]{6}$/.test(d.fill)) return d.fill;
  }
  return null;
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

function renderNode(n, m, scale, t, gradId) {
  const d = n.data;
  const st = stroke(d.style || d, t);
  switch (n.kind) {
    case 'path': {
      // 출판 품질: 미세한 가장자리 반올림 + 라인이 겹칠 때 자연스러움
      const segs = [];
      for (const op of d.ops) {
        if (op.op === 'Z' || op.op === 'z') { segs.push('Z'); continue; }
        segs.push(`${op.op} ${m(d, op.x, op.y).join(' ')}`);
      }
      return `<path d="${segs.join(' ')}" fill="none" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st.dash || 'none'}" stroke-linecap="round" stroke-linejoin="round" opacity="${st.opacity}"/>`;
    }
    case 'polygon': {
      const pts = d.pts.map((p) => m(d, p[0], p[1]).join(',')).join(' ');
      return `<polygon points="${pts}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-linejoin="round" opacity="${st.opacity}"/>`;
    }
    case 'circle': {
      const [cx, cy] = m(d, d.cx, d.cy);
      let fill = d.fill || 'none';
      if (d.gradient && gradId) { const gid = gradId.get(d.gradient); if (gid) fill = `url(#${gid})`; }
      else if (d.fill && d.fill !== 'none') { fill = `url(#logoCircleGrad)`; }
      return `<circle cx="${cx}" cy="${cy}" r="${d.r * scale}" fill="${fill}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st.dash || 'none'}" opacity="${st.opacity}"/>`;
    }
    case 'fillcircle': {
      const [cx, cy] = m(d, d.cx, d.cy);
      let fill = d.fill;
      if (d.gradient && gradId) { const gid = gradId.get(d.gradient); if (gid) fill = `url(#${gid})`; }
      return `<circle cx="${cx}" cy="${cy}" r="${d.r * scale}" fill="${fill}" opacity="${d.opacity || 1}" stroke="none"/>`;
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
      const r = 3.4;
      const base = d.color || d.fill || t.pointColor;
      const op = d.style?.opacity ?? 1;
      let dot;
      if (d.open) {
        dot = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${t.bg}" stroke="${base}" stroke-width="1.7"/>`;
      } else if (d.stroke != null && d.stroke > 1) {
        dot = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${base}" stroke-width="1.6"${op !== 1 ? ` opacity="${op}"` : ''}/>`;
      } else {
        dot = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${base}"${op !== 1 ? ` opacity="${op}"` : ''}/>`;
      }
      const parts = [dot];
      if (d.label) {
        const [lx, ly] = m(d, d.x, d.y);
        if (d.labelMath) parts.push(`<foreignObject x="${lx + 8}" y="${ly - 24}" width="300" height="44"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(String(d.label))}</div></foreignObject>`);
        else parts.push(`<text x="${lx + 7}" y="${ly - 7}" font-size="13" font-style="italic" fill="${d.color || t.labelColor}">${esc(d.label)}</text>`);
      }
      return parts.join('\n');
    }
    case 'text': {
      const [x, y] = m(d, d.x, d.y);
      if (d.math) return `<foreignObject x="${x}" y="${y - 18}" width="500" height="44"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(d.text || '')}</div></foreignObject>`;
      const fs = d.font || 13.5;
      const fsStyle = d.italic === undefined ? (d.caption ? 'normal' : 'italic') : (d.italic ? 'italic' : 'normal');
      return `<text x="${x}" y="${y}" font-size="${fs}" font-style="${fsStyle}" text-anchor="${d.anchor || 'start'}" fill="${d.color || t.labelColor}">${esc(d.text || '')}</text>`;
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