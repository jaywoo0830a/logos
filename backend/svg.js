// DSL.md §12 렌더러 파이프라인 — SVG emitter (clip / gradient / math label)
import { applyTransforms } from '../transform.js';
import { katexRender, latexToText } from './katex.js';
import { STIX_STACK, svgFontStyle, TYPE } from './fonts.js';
import { regionRect } from '../shapes/region.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 테마로부터 스타일 기본값 (출판 품질)
function themed(opts) {
  return {
    bg: opts.bg || '#ffffff',
    font: opts.font || STIX_STACK,
    fontMath: opts.fontMath || STIX_STACK,
    axisColor: opts.axisColor || '#333',
    gridColor: opts.gridColor || '#cbd5e1',
    labelColor: opts.labelColor || '#333',
    pointColor: opts.pointColor || '#1f4e79',
    strokeDefault: opts.strokeDefault || '#1a2744',
    strokeWidth: opts.strokeWidth || 1.5,
  };
}

function stroke(style, t) {
  const w = style.stroke != null ? style.stroke : t.strokeWidth;   // stroke(0) 도 존중
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
  const { map, scale, scaleX = scale, scaleY = scale, W, H, world = null, bg } = opts;
  // 결정성: 렌더 단위로 id 카운터를 리셋한다(모듈 전역 누적 금지).
  CLIPN = 0; GRADN = 0;
  const t = themed(opts);
  t.math = opts.math || 'foreignObject';
  const m = transformPt(map);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${esc(t.font)}">`];
  // 배경: 상단 밝음 → 하단 미세하게 어두운 선형 그라디언트만 사용한다.
  // (채워진 원에 무조건 방사 그라디언트를 씌우던 동작은 제거 — 평면 채움은 평면으로)
  // STIX Two Math 를 모든 텍스트/수식에 적용 (브라우저 @import)
  out.push(svgFontStyle());
  out.push(`<defs><linearGradient id="lgbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg}"/><stop offset="1" stop-color="${shadeBg(t.bg)}"/></linearGradient></defs>`);
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
    const html = renderNode(n, m, scaleX, scaleY, t, gradId);
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

function transformPt(map) {
  return (d, x, y) => {
    if (d && d.transforms && d.transforms.length) {
      const [nx, ny] = applyTransforms(d.transforms, [x, y]);
      return map(nx, ny);
    }
    return map(x, y);
  };
}

/**
 * 텍스트 배경 상자 (matplotlib bbox 대응) — 텍스트 폭을 근사 추정.
 * 높이는 실제 행간(`d.lineHeight ?? TYPE.lineHeight`)을 써서 글자와 상자가 어긋나지 않게 한다.
 */
function textBoxSvg(d, x, y) {
  const fs = d.font || (d.math ? 14 : 13.5);
  const lines = String(d.text ?? '').split('\n');
  const lh = d.lineHeight ?? TYPE.lineHeight;
  const track = d.letterSpacing != null ? d.letterSpacing / fs : TYPE.letterSpacing;
  const wchars = Math.max(...lines.map((l) => l.length), 1);
  const pad = d.box?.pad ?? 4;
  const w = wchars * fs * (d.math ? 0.62 : 0.6 + track) + pad * 2 + 4;
  const h = lines.length * fs * lh + pad * 2;
  let left = x;
  if (d.anchor === 'middle') left = x - w / 2;
  else if (d.anchor === 'end') left = x - w;
  const top = y - fs * 0.85 - pad;
  const face = d.box.facecolor || d.box.fill || 'wheat';
  const alpha = d.box.alpha ?? 0.8;
  const rx = d.box.round === false ? 0 : 6;
  const rot = d.rotate ? ` transform="rotate(${d.rotate} ${x} ${y})"` : '';
  return `<rect x="${left.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" fill="${face}" opacity="${alpha}"${rot}/>`;
}

/** 점 마커 (matplotlib marker 대응: circle/square/triangle/diamond/star/point/plus/cross) */
function markerSvg(d, cx, cy, base, t) {
  const shape = d.marker || 'dot';
  const open = !!d.open;
  const r = d.size || ((shape === '*' || shape === 'star') ? 5.5 : 3.4);
  const opv = d.style?.opacity;
  const opAttr = (opv != null && opv !== 1) ? ` opacity="${opv}"` : '';
  const fill = open ? t.bg : base;
  const stroke = open ? ` stroke="${base}" stroke-width="1.7"` : '';
  const poly = (pts) => `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ')}" fill="${fill}"${open ? ` stroke="${base}" stroke-width="1.5"` : ''}${opAttr}/>`;
  const f2 = (v) => v.toFixed(2);
  switch (shape) {
    case 's': case 'square':
      return `<rect x="${f2(cx - r)}" y="${f2(cy - r)}" width="${f2(2 * r)}" height="${f2(2 * r)}" fill="${fill}"${stroke}${opAttr}/>`;
    case '^': case 'triangle':
      return poly([[cx, cy - r], [cx + r * 1.15, cy + r * 0.9], [cx - r * 1.15, cy + r * 0.9]]);
    case 'd': case 'diamond':
      return poly([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]);
    case '*': case 'star': {
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.42 : r; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
      return `<polygon points="${pts.map((p) => p.map(f2).join(',')).join(' ')}" fill="${base}"${opAttr}/>`;
    }
    case '.': case 'point':
      return `<circle cx="${cx}" cy="${cy}" r="${Math.max(1.4, r * 0.5).toFixed(2)}" fill="${base}"${opAttr}/>`;
    case '+': case 'plus':
      return `<path d="M${f2(cx - r)} ${cy} L${f2(cx + r)} ${cy} M${cx} ${f2(cy - r)} L${cx} ${f2(cy + r)}" stroke="${base}" stroke-width="1.6" fill="none"${opAttr}/>`;
    case 'x': case 'cross':
      return `<path d="M${f2(cx - r * 0.8)} ${f2(cy - r * 0.8)} L${f2(cx + r * 0.8)} ${f2(cy + r * 0.8)} M${f2(cx + r * 0.8)} ${f2(cy - r * 0.8)} L${f2(cx - r * 0.8)} ${f2(cy + r * 0.8)}" stroke="${base}" stroke-width="1.6" fill="none"${opAttr}/>`;
    default:
      if (d.stroke != null && d.stroke > 1 && !open) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${base}" stroke-width="1.6"${opAttr}/>`;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${stroke}${opAttr}/>`;
  }
}

function renderNode(n, m, scaleX, scaleY, t, gradId) {
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
      const rx = d.r * scaleX, ry = d.r * scaleY;
      const common = `fill="${fill}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st.dash || 'none'}" opacity="${st.opacity}"`;
      // equal 스케일일 때만 진짜 원, 아니면 타원으로 방출(비등방 스케일 보존).
      if (Math.abs(rx - ry) < 1e-9) return `<circle cx="${cx}" cy="${cy}" r="${rx}" ${common}/>`;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${common}/>`;
    }
    case 'fillcircle': {
      const [cx, cy] = m(d, d.cx, d.cy);
      let fill = d.fill;
      if (d.gradient && gradId) { const gid = gradId.get(d.gradient); if (gid) fill = `url(#${gid})`; }
      const rx = d.r * scaleX, ry = d.r * scaleY;
      if (Math.abs(rx - ry) < 1e-9) return `<circle cx="${cx}" cy="${cy}" r="${rx}" fill="${fill}" opacity="${d.opacity ?? 1}" stroke="none"/>`;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${d.opacity ?? 1}" stroke="none"/>`;
    }
    case 'clipfill': {
      const cid = 'logosClip' + (++CLIPN);
      return `<defs><clipPath id="${cid}"><path d="${diskPath(d.clip.cx, d.clip.cy, d.clip.r, m, d)}"/></clipPath></defs><path d="${diskPath(d.fill.cx, d.fill.cy, d.fill.r, m, d)}" fill="${d.fillColor}" opacity="${d.opacity ?? 1}" clip-path="url(#${cid})" stroke="none"/>`;
    }
    case 'ellipse': {
      const [cx, cy] = m(d, d.cx, d.cy);
      const ang = d.angle != null ? ` transform="rotate(${d.angle * 180 / Math.PI} ${cx} ${cy})"` : '';
      return `<ellipse cx="${cx}" cy="${cy}" rx="${d.rx * scaleX}" ry="${d.ry * scaleY}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" opacity="${st.opacity}"${ang}/>`;
    }
    case 'point': {
      const [cx, cy] = m(d, d.x, d.y);
      const base = d.color || d.fill || t.pointColor;
      const op = d.style?.opacity ?? 1;
      const parts = [markerSvg(d, cx, cy, base, t)];
      if (d.label) {
        const [lx, ly] = m(d, d.x, d.y);
        const ldx = d.dxPx ?? 7, ldy = d.dyPx ?? -7;
        if (d.labelMath) {
          if (t.math === 'text') parts.push(`<text x="${lx + ldx}" y="${ly + (d.dyPx ?? -7)}" font-size="13" font-style="normal" fill="${d.color || t.labelColor}">${esc(latexToText(String(d.label)))}</text>`);
          else parts.push(`<foreignObject x="${lx + ldx}" y="${ly + (d.dyPx ?? -24)}" width="300" height="44"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(String(d.label))}</div></foreignObject>`);
        } else parts.push(`<text x="${lx + ldx}" y="${ly + ldy}" font-size="13" font-style="italic" fill="${d.color || t.labelColor}">${esc(d.label)}</text>`);
      }
      return parts.join('\n');
    }
    case 'text': {
      // world 좌표는 map 으로, 화면 오프셋은 px 단위(dxPx/dyPx)로 분리 적용한다.
      const [wx, wy] = m(d, d.x, d.y);
      const x = wx + (d.dxPx || 0);
      const y = wy + (d.dyPx || 0);
      const bold = d.bold ? ' font-weight="bold"' : '';
      const color = d.color || t.labelColor;
      const boxStr = d.box ? textBoxSvg(d, x, y) : '';
      if (d.math) {
        if (t.math === 'text') {
          const fs = d.font || 14;
          return boxStr + `<text x="${x}" y="${y}" font-size="${fs}" font-style="normal"${bold} text-anchor="${d.anchor || 'start'}" fill="${color}">${esc(latexToText(d.text || ''))}</text>`;
        }
        // foreignObject 는 자체 폭을 모르므로 anchor=middle 이면 폭을 추정해 중앙 정렬한다.
        const est = Math.max(40, Math.min(620, String(d.text || '').length * 7.5 + 16));
        const fx = d.anchor === 'middle' ? x - est / 2 : x;
        return boxStr + `<foreignObject x="${fx}" y="${y - 18}" width="${est}" height="46"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(d.text || '')}</div></foreignObject>`;
      }
      const fs = d.font || 13.5;
      const fsStyle = d.italic === undefined ? (d.caption ? 'normal' : 'italic') : (d.italic ? 'italic' : 'normal');
      const rot = d.rotate ? ` transform="rotate(${d.rotate} ${x} ${y})"` : '';
      // 자간: 개별 지정(px)이 있으면 그것을, 없으면 스타일시트 기본값(em)을 그대로 쓴다.
      const track = d.letterSpacing != null ? ` letter-spacing="${d.letterSpacing}"` : '';
      const head = `font-size="${fs}" font-style="${fsStyle}"${bold} text-anchor="${d.anchor || 'start'}" fill="${color}"${track}${rot}`;
      // 멀티라인: \n → <tspan>. 줄 간격은 행간 배수(기본 TYPE.lineHeight)로 계산한다.
      const lines = String(d.text ?? '').split('\n');
      if (lines.length > 1) {
        const lh = d.lineHeight ?? TYPE.lineHeight;
        const tspans = lines.map((ln, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : fs * lh}">${esc(ln)}</tspan>`).join('');
        return boxStr + `<text x="${x}" y="${y}" ${head}>${tspans}</text>`;
      }
      return boxStr + `<text x="${x}" y="${y}" ${head}>${esc(d.text || '')}</text>`;
    }
    case 'rect': {
      // 임의 좌표 사각형 (barh 등). fill + 선택적 테두리.
      const [x0, y0] = m(d, d.x0, d.y0);
      const [x1, y1] = m(d, d.x1, d.y1);
      const strokeAttr = (d.color || d.stroke != null)
        ? ` stroke="${d.color || st.stroke}" stroke-width="${d.stroke || st['stroke-width']}"`
        : ' stroke="none"';
      return `<rect x="${Math.min(x0, x1)}" y="${Math.min(y0, y1)}" width="${Math.abs(x1 - x0)}" height="${Math.abs(y1 - y0)}" fill="${d.fill || 'none'}"${strokeAttr} opacity="${d.opacity ?? 1}"/>`;
    }
    case 'fillrect': {
      const [x0, y0u] = m(d, d.x, 0);
      const [x1, y1u] = m(d, d.x + d.w, d.y1);
      return `<rect x="${Math.min(x0, x1)}" y="${Math.min(y0u, y1u)}" width="${Math.abs(x1 - x0)}" height="${Math.abs(y1u - y0u)}" fill="${d.fill}" opacity="${d.opacity ?? 1}"/>`;
    }
    case 'fillpath': {
      const segs = [];
      for (const op of d.ops) {
        if (op.op === 'Z' || op.op === 'z') { segs.push('Z'); continue; }
        segs.push(`${op.op} ${m(d, op.x, op.y).join(' ')}`);
      }
      return `<path d="${segs.join(' ')}" fill="${d.fill}" opacity="${d.opacity ?? 1}" stroke="none"/>`;
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
      if (d.label) {
        const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2 - 6;
        if (d.labelMath && t.math !== 'text') {
          const est = Math.max(40, Math.min(620, String(d.label).length * 7.5 + 16));
          parts.push(`<foreignObject x="${lx - est / 2}" y="${ly - 18}" width="${est}" height="46"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(String(d.label))}</div></foreignObject>`);
        } else {
          const txt = d.labelMath ? latexToText(String(d.label)) : String(d.label);
          parts.push(`<text x="${lx}" y="${ly}" font-size="13" text-anchor="middle" fill="${st.stroke}">${esc(txt)}</text>`);
        }
      }
      return parts.join('\n');
    }
    case 'cliprect':
      return null; // 정의 전용
    default:
      return `<!-- ${n.kind} -->`;
  }
}

export default emitSVG;