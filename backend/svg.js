// docs/spec/DSL.md §12 렌더러 파이프라인 — SVG emitter (clip / gradient / math label)
import { applyTransforms } from '../transform.js';
import { katexRender, latexToText } from './katex.js';
import { STIX_STACK, svgFontStyle, TYPE } from './fonts.js';
import { regionRect } from '../shapes/region.js';
import { nodeEmitter } from '../core/plugin.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
  const w = style.stroke != null ? style.stroke : t.strokeWidth; // stroke(0) 도 존중
  return {
    stroke: style.color || t.strokeDefault,
    'stroke-width': w,
    opacity: style.opacity ?? 1,
    dash: style.dash ? (Array.isArray(style.dash) ? style.dash.join(' ') : String(style.dash)) : null,
  };
}

let CLIPN = 0,
  GRADN = 0;

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
  CLIPN = 0;
  GRADN = 0;
  const t = themed(opts);
  t.math = opts.math || 'foreignObject';
  const m = transformPt(map);
  // 안전 패스 — **래스터(PNG)에서만** 켠다.
  //
  //   왜 래스터 전용인가: resvg(2.6.2 → resvg 0.34 포크)가 캔버스를 크게 벗어난 그룹 bbox 에서
  //   `geom::fit_to_rect()` 의 `IntRect::from_ltrb(...).unwrap()` 으로 **프로세스를 abort** 한다.
  //   브라우저/Asymptote/TikZ 는 같은 SVG 를 정상 처리하므로 일반 SVG 출력은 건드리지 않는다
  //   (출력 바이트가 그대로 유지되어 스냅샷·문자열 테스트도 변하지 않는다).
  //
  //   safe=true 이면 ⓐ 화면 밖 도형을 방출하지 않고(cullOffscreen) ⓑ 캔버스를 벗어난 좌표를
  //   정확히 잘라낸다(기하학적으로 동일한 부분만 남는다).
  const safe = opts.safe === true;
  // safe=false 일 때는 "밖" 판정이 절대 참이 되지 않도록 무한 박스를 준다 → 기존 출력 완전 불변.
  const box = safe ? canvasBox(W, H) : INF_BOX;
  const drawNodes = safe
    ? cullOffscreen(nodes, {
        map: m,
        scaleX,
        scaleY,
        W,
        H,
        // 컬은 **아주 멀리** 벗어난 도형만 대상으로 한다(안전은 클리핑이 보장하므로 보수적으로).
        //   여유를 캔버스 한 변 길이만큼 주는 이유: 라벨 텍스트의 폭/높이는 추정값이라
        //   여유가 작으면 **보이는 라벨을 잘못 버릴 수 있다**(추정 오차 흡수).
        margin: opts.cullMargin ?? Math.max(W, H),
        report: opts.cullReport,
      })
    : nodes;
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${esc(t.font)}">`,
  ];
  // 배경: 상단 밝음 → 하단 미세하게 어두운 선형 그라디언트만 사용한다.
  // (채워진 원에 무조건 방사 그라디언트를 씌우던 동작은 제거 — 평면 채움은 평면으로)
  // STIX Two Math 를 모든 텍스트/수식에 적용 (브라우저 @import)
  out.push(svgFontStyle());
  out.push(
    `<defs><linearGradient id="lgbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg}"/><stop offset="1" stop-color="${shadeBg(t.bg)}"/></linearGradient></defs>`,
  );
  out.push(`<rect width="100%" height="100%" fill="url(#lgbg)"/>`);

  const clips = new Map();
  const clipRectOf = new Map();
  const idFor = (r) => {
    if (r == null) return null;
    if (!clips.has(r)) clips.set(r, 'logosClip' + ++CLIPN);
    return clips.get(r);
  };
  for (const n of drawNodes) {
    const d = n.data;
    if (n.kind === 'cliprect' && d.region) {
      idFor(d.region);
      clipRectOf.set(d.region, d);
    }
    if (d && d.clip) idFor(d.clip);
  }
  const defs = [];
  for (const [region, id] of clips) {
    const rr = clipRectOf.has(region) ? clipRectOf.get(region) : regionRect(region, world);
    if (rr) {
      const p = rectPx(rr, m);
      defs.push(`<clipPath id="${id}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/></clipPath>`);
    }
  }
  const gradId = new Map();
  for (const n of drawNodes)
    if (n.data && n.data.gradient && !gradId.has(n.data.gradient)) gradId.set(n.data.gradient, 'logosGrad' + ++GRADN);
  for (const [g, id] of gradId) {
    const stops = (g.stops || []).map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('');
    defs.push(
      g.type === 'linear'
        ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>`
        : `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">${stops}</radialGradient>`,
    );
  }
  if (defs.length) out.push(`<defs>${defs.join('')}</defs>`);

  for (const n of drawNodes) {
    const d = n.data;
    const cid = d && d.clip ? idFor(d.clip) : null;
    const html = renderNode(n, m, scaleX, scaleY, t, gradId, box);
    if (html) out.push(cid ? `<g clip-path="url(#${cid})">${html}</g>` : html);
  }
  out.push('</svg>');
  return out.join('\n');
}

// 배경을 살짝 어둡게(미묘한 질감) — hex or 이름 지원
function shadeBg(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 6),
    g = Math.max(0, ((n >> 8) & 255) - 6),
    b = Math.max(0, (n & 255) - 8);
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

// ── 뷰(캔버스) 클리핑 ────────────────────────────────────────
// cullOffscreen 은 "완전히 밖"만 제거한다. **일부가 화면에 걸치면서 좌표가 극단**인 도형
// (예: world 단위 실수로 `arc({ radius: 14 })` 인 호, 3D `vector()` 가 만든 긴 선분, r=1e4 원)은
// 그룹 bbox 를 비정상적으로 키워 resvg 가 같은 unwrap 패닉을 낸다.
// 정확히 잘라내면 좌표가 캔버스 근처로 **유계**가 되고, 화면에 보이는 부분은 **기하학적으로 동일**하다.
// 정상 도형은 이 경로를 타지 않으므로(needsClip=false) 기존 출력은 변하지 않는다.
const CLIP_PAD = 8; // 선 두께 · 둥근 끝단 여유

/** safe=false 에서 "밖" 판정을 항상 거짓으로 만드는 박스(출력 불변 보장). */
const INF_BOX = { x0: -Infinity, y0: -Infinity, x1: Infinity, y1: Infinity };

function canvasBox(W, H) {
  return { x0: -CLIP_PAD, y0: -CLIP_PAD, x1: W + CLIP_PAD, y1: H + CLIP_PAD };
}

const outside = (x, y, b) => x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1;
const ptsOutside = (pts, b) => pts.some(([x, y]) => outside(x, y, b));

/** 선분을 박스로 자른다 (Liang–Barsky). 완전히 밖이면 null. */
function segClip(x1, y1, x2, y2, b) {
  let t0 = 0,
    t1 = 1;
  const dx = x2 - x1,
    dy = y2 - y1;
  const bounds = [
    [-dx, x1 - b.x0],
    [dx, b.x1 - x1],
    [-dy, y1 - b.y0],
    [dy, b.y1 - y1],
  ];
  for (const [p, q] of bounds) {
    if (p === 0) {
      if (q < 0) return null; // 평행 & 밖
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
}

/** 폴리라인을 박스로 자른다 → 부분 폴리라인 배열(끊긴 곳에서 새 M 으로 시작). */
function pathClip(pts, b) {
  const parts = [];
  let cur = null;
  for (let i = 0; i + 1 < pts.length; i++) {
    const s = segClip(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], b);
    if (!s) {
      cur = null;
      continue;
    }
    const [ax, ay] = [pts[i][0], pts[i][1]];
    const startsAtA = Math.abs(s[0] - ax) < 1e-9 && Math.abs(s[1] - ay) < 1e-9;
    if (
      cur &&
      startsAtA &&
      Math.abs(cur[cur.length - 1][0] - s[0]) < 1e-9 &&
      Math.abs(cur[cur.length - 1][1] - s[1]) < 1e-9
    ) {
      cur.push([s[2], s[3]]);
    } else {
      cur = [
        [s[0], s[1]],
        [s[2], s[3]],
      ];
      parts.push(cur);
    }
  }
  return parts;
}

/** 볼록 사각형(박스)으로 폴리곤을 자른다 (Sutherland–Hodgman). 채움 전용. */
function polyClip(pts, b) {
  const edges = [
    [(p) => p[0] >= b.x0, (p, q) => [b.x0, p[1] + ((q[1] - p[1]) * (b.x0 - p[0])) / (q[0] - p[0])]],
    [(p) => p[0] <= b.x1, (p, q) => [b.x1, p[1] + ((q[1] - p[1]) * (b.x1 - p[0])) / (q[0] - p[0])]],
    [(p) => p[1] >= b.y0, (p, q) => [p[0] + ((q[0] - p[0]) * (b.y0 - p[1])) / (q[1] - p[1]), b.y0]],
    [(p) => p[1] <= b.y1, (p, q) => [p[0] + ((q[0] - p[0]) * (b.y1 - p[1])) / (q[1] - p[1]), b.y1]],
  ];
  let out = pts;
  for (const [inside, hit] of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const p = input[i];
      const q = input[(i + 1) % input.length];
      if (inside(p)) {
        out.push(p);
        if (!inside(q)) out.push(hit(p, q));
      } else if (inside(q)) {
        out.push(hit(p, q));
      }
    }
    if (!out.length) return [];
  }
  return out;
}

/** 원/타원을 n각 폴리라인으로 근사(클리핑 입력용). */
function sampleEllipse(cx, cy, rx, ry, n = 96) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

/**
 * 노드의 **화면(device) 좌표 bbox** 를 보수적으로 구한다.
 * 반환 `null` 은 "판단 보류" — cliprect(정의 전용) · 플러그인 노드 · 회전 텍스트 · 빈 도형.
 * 보수적이란 뜻은 **실제보다 크게** 잡는다는 것(= 덜 자른다). 시각 결과를 바꾸지 않기 위함.
 */
function deviceBBox(n, m, scaleX, scaleY) {
  const d = n.data;
  if (!d) return null;
  const xs = [];
  const ys = [];
  const pt = (x, y) => {
    const [px, py] = m(d, x, y);
    xs.push(px);
    ys.push(py);
  };
  switch (n.kind) {
    case 'path':
    case 'fillpath': {
      for (const op of d.ops || []) {
        if (op.op === 'Z' || op.op === 'z') continue;
        pt(op.x, op.y);
      }
      break; // 화살촉(marker 9px)·스트로크 폭은 cullMargin 이 흡수한다.
    }
    case 'polygon':
      for (const p of d.pts || []) pt(p[0], p[1]);
      break;
    case 'circle':
    case 'fillcircle': {
      const r = Math.abs(d.r);
      pt(d.cx - r, d.cy - r);
      pt(d.cx + r, d.cy + r);
      break;
    }
    case 'clipfill': {
      for (const c of [d.clip, d.fill]) {
        if (!c) continue;
        const r = Math.abs(c.r);
        pt(c.cx - r, c.cy - r);
        pt(c.cx + r, c.cy + r);
      }
      break;
    }
    case 'ellipse': {
      // 회전은 보수적으로 원으로 간주(가장 큰 반지름).
      const R = Math.max(Math.abs(d.rx * scaleX), Math.abs(d.ry * scaleY));
      pt(d.cx - R, d.cy - R);
      pt(d.cx + R, d.cy + R);
      break;
    }
    case 'point': {
      const r = (d.size || 6) + (d.open ? 2 : 0);
      pt(d.x - r, d.y - r);
      pt(d.x + r, d.y + r);
      if (d.label) {
        // 라벨은 dxPx/dyPx 오프셋으로 점 옆에 붙는다(폭은 넉넉히 340px 가정).
        const [lx, ly] = m(d, d.x, d.y);
        const dx = lx + (d.dxPx ?? 7);
        xs.push(dx, dx + 340);
        ys.push(ly + (d.dyPx ?? -7) - 20, ly + (d.dyPx ?? -7) + 12);
      }
      break;
    }
    case 'text': {
      if (d.rotate) return null; // 회전 텍스트는 bbox 추정이 위험 → 절대 자르지 않는다.
      const [wx, wy] = m(d, d.x, d.y);
      const x = wx + (d.dxPx || 0);
      const y = wy + (d.dyPx || 0);
      const fs = d.font || (d.math ? 14 : 13.5);
      const w = Math.max(40, Math.min(900, String(d.text ?? '').length * fs * 0.8 + 24));
      let left = x;
      if (d.anchor === 'middle') left = x - w / 2;
      else if (d.anchor === 'end') left = x - w;
      xs.push(left, left + w);
      const rows = String(d.text ?? '').split('\n').length;
      ys.push(y - fs, y + fs * (rows + 0.6) * 1.3);
      break;
    }
    case 'rect':
      pt(d.x0, d.y0);
      pt(d.x1, d.y1);
      break;
    case 'fillrect':
      pt(d.x, 0);
      pt(d.x + d.w, d.y1);
      break;
    case 'arrow':
      pt(d.x1, d.y1);
      pt(d.x2, d.y2);
      break;
    default:
      return null; // cliprect(정의 전용) · 플러그인 노드 → 유지
  }
  if (!xs.length || !ys.length) return null;
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/**
 * 화면 밖 primitive 를 **방출하지 않는다** (안정성 + 성능).
 *
 * 배경 — `@resvg/resvg-js@2.6.2` 는 내부적으로 `resvg 0.34`(zimond/resvg@3495d870 포크)를 쓴다.
 * 그 `crates/resvg/src/render.rs::render_group()` 는 그룹 레이어가 캔버스의 4배를 넘지 않게
 * `crate::geom::fit_to_rect(ibbox, max_bbox)` 로 잘라내는데, 내부는
 * `geom.rs:27` 의 `IntRect::from_ltrb(left, top, right, bottom).unwrap()` 다.
 * **그룹 bbox 가 캔버스 ±2배 영역과 교차하지 않으면** 클램프 결과가 빈(뒤집힌) 사각형이 되어
 * `None.unwrap()` → **Rust panic = 프로세스 abort**(JS try/catch 로 못 잡는다).
 *
 * 실제 방아쇠는 `subplots()` 의 **중첩 <svg> 패널 + 캔버스를 한참 벗어난 좌표**의 조합이었다
 * (예: world 단위인 `annotate.angle().arc({ radius: 14 })`, `annotate.dimension().offset(...)`,
 *  3D `vector()` 가 만든 극단 좌표). 화면 밖 도형은 어차피 보이지 않으므로 방출하지 않으면
 * 그룹 bbox 가 항상 캔버스와 교차해 이 경로 자체를 타지 않는다. 시각 결과는 동일하다.
 *
 * @param {Array} list IR 노드
 * @param {Object} o { map, scaleX, scaleY, W, H, margin, report }
 */
function cullOffscreen(list, o) {
  const kept = [];
  for (const n of list) {
    const bb = deviceBBox(n, o.map, o.scaleX, o.scaleY);
    if (!bb) {
      kept.push(n); // 판단 보류 → 유지
      continue;
    }
    const finite = Number.isFinite(bb.x0) && Number.isFinite(bb.y0) && Number.isFinite(bb.x1) && Number.isFinite(bb.y1);
    const off = !finite || bb.x1 < -o.margin || bb.x0 > o.W + o.margin || bb.y1 < -o.margin || bb.y0 > o.H + o.margin;
    if (off) {
      if (o.report) o.report.push(finite ? n.kind : `${n.kind}(비유한 좌표)`);
      continue;
    }
    kept.push(n);
  }
  return kept;
}

/**
 * 노드 옆 라벨 — point · circle · ellipse · polygon 이 공유한다.
 * `labelMath`(Sym 라벨)면 KaTeX foreignObject, 테마가 math:'text' 면 유니코드 <text> 폴백.
 * @param {Object} d  IR 노드 data (label · labelMath · dxPx · dyPx · color)
 * @param {number} x  앵커 화면 x
 * @param {number} y  앵커 화면 y
 * @param {Object} t  테마
 * @returns {string[]}
 */
function labelParts(d, x, y, t) {
  const ldx = d.dxPx ?? 7,
    ldy = d.dyPx ?? -7;
  if (d.labelMath) {
    if (t.math === 'text')
      return [
        `<text x="${x + ldx}" y="${y + ldy}" font-size="13" font-style="normal" fill="${d.color || t.labelColor}">${esc(latexToText(String(d.label)))}</text>`,
      ];
    return [
      `<foreignObject x="${x + ldx}" y="${y + (d.dyPx ?? -24)}" width="300" height="44"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(String(d.label))}</div></foreignObject>`,
    ];
  }
  return [
    `<text x="${x + ldx}" y="${y + ldy}" font-size="13" font-style="italic" fill="${d.color || t.labelColor}">${esc(d.label)}</text>`,
  ];
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
  const r = d.size || (shape === '*' || shape === 'star' ? 5.5 : 3.4);
  const opv = d.style?.opacity;
  const opAttr = opv != null && opv !== 1 ? ` opacity="${opv}"` : '';
  const fill = open ? t.bg : base;
  const stroke = open ? ` stroke="${base}" stroke-width="1.7"` : '';
  const poly = (pts) =>
    `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ')}" fill="${fill}"${open ? ` stroke="${base}" stroke-width="1.5"` : ''}${opAttr}/>`;
  const f2 = (v) => v.toFixed(2);
  switch (shape) {
    case 's':
    case 'square':
      return `<rect x="${f2(cx - r)}" y="${f2(cy - r)}" width="${f2(2 * r)}" height="${f2(2 * r)}" fill="${fill}"${stroke}${opAttr}/>`;
    case '^':
    case 'triangle':
      return poly([
        [cx, cy - r],
        [cx + r * 1.15, cy + r * 0.9],
        [cx - r * 1.15, cy + r * 0.9],
      ]);
    case 'd':
    case 'diamond':
      return poly([
        [cx, cy - r],
        [cx + r, cy],
        [cx, cy + r],
        [cx - r, cy],
      ]);
    case '*':
    case 'star': {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.42 : r;
        pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
      }
      return `<polygon points="${pts.map((p) => p.map(f2).join(',')).join(' ')}" fill="${base}"${opAttr}/>`;
    }
    case '.':
    case 'point':
      return `<circle cx="${cx}" cy="${cy}" r="${Math.max(1.4, r * 0.5).toFixed(2)}" fill="${base}"${opAttr}/>`;
    case '+':
    case 'plus':
      return `<path d="M${f2(cx - r)} ${cy} L${f2(cx + r)} ${cy} M${cx} ${f2(cy - r)} L${cx} ${f2(cy + r)}" stroke="${base}" stroke-width="1.6" fill="none"${opAttr}/>`;
    case 'x':
    case 'cross':
      return `<path d="M${f2(cx - r * 0.8)} ${f2(cy - r * 0.8)} L${f2(cx + r * 0.8)} ${f2(cy + r * 0.8)} M${f2(cx + r * 0.8)} ${f2(cy - r * 0.8)} L${f2(cx - r * 0.8)} ${f2(cy + r * 0.8)}" stroke="${base}" stroke-width="1.6" fill="none"${opAttr}/>`;
    default:
      if (d.stroke != null && d.stroke > 1 && !open)
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${base}" stroke-width="1.6"${opAttr}/>`;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${stroke}${opAttr}/>`;
  }
}

/**
 * 클립된 좌표를 짧게 포맷(과도한 소수점 방지).
 *   반올림은 서브픽셀 AA 를 바꿀 수 있으므로 충분히 정밀하게 유지한다(래스터 경로 전용).
 */
const fmt = (v) => (Math.abs(v) < 1e-9 ? '0' : String(+v.toFixed(6)));

/**
 * 폴리라인/폴리곤을 뷰(캔버스) 박스로 **정확히** 잘라 `<path>` 문자열로 만든다.
 * 채움은 폴리곤 클립(Sutherland–Hodgman), 외곽선은 선분 클립(Liang–Barsky)로 따로 처리해
 * 캔버스 경계를 따라 원치 않는 선이 그려지지 않게 한다. **보이는 부분은 원본과 동일**하다.
 * @returns {string|null} 그릴 것이 없으면 null
 */
function clipToPaths(raw, box, o) {
  const out = [];
  if (o.fill && o.fill !== 'none') {
    const poly = polyClip(raw, box);
    if (poly.length > 2) {
      const dd = poly.map((p, i) => `${i === 0 ? 'M' : 'L'} ${fmt(p[0])} ${fmt(p[1])}`).join(' ') + ' Z';
      out.push(`<path d="${dd}" fill="${o.fill}" opacity="${o.opacity ?? 1}"/>`);
    }
  }
  if (o.stroke) {
    const parts = pathClip(o.closed ? [...raw, raw[0]] : raw, box);
    if (parts.length) {
      const dd = parts
        .map((part) => part.map((p, i) => `${i === 0 ? 'M' : 'L'} ${fmt(p[0])} ${fmt(p[1])}`).join(' '))
        .join(' ');
      out.push(
        `<path d="${dd}" fill="none" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" stroke-dasharray="${o.dash || 'none'}" stroke-linejoin="round" opacity="${o.opacity ?? 1}"/>`,
      );
    }
  }
  return out.length ? out.join('\n') : null;
}

function renderNode(n, m, scaleX, scaleY, t, gradId, box) {
  const d = n.data;
  const st = stroke(d.style || d, t);
  switch (n.kind) {
    case 'path': {
      // 출판 품질: 미세한 가장자리 반올림 + 라인이 겹칠 때 자연스러움
      const segs = [];
      const raw = [];
      for (const op of d.ops) {
        if (op.op === 'Z' || op.op === 'z') continue;
        raw.push(m(d, op.x, op.y));
      }
      if (raw.length > 1 && ptsOutside(raw, box)) {
        // 뷰 밖으로 뻗은 좌표는 **정확히 잘라낸다** — 보이는 부분은 그대로, 좌표는 유계가 된다.
        for (const part of pathClip(raw, box))
          part.forEach((p, i) => segs.push(`${i === 0 ? 'M' : 'L'} ${fmt(p[0])} ${fmt(p[1])}`));
      } else {
        for (const op of d.ops) {
          if (op.op === 'Z' || op.op === 'z') {
            segs.push('Z');
            continue;
          }
          segs.push(`${op.op} ${m(d, op.x, op.y).join(' ')}`);
        }
      }
      // 곡선 화살표(`annotate.arrow().bend()`): path 끝에 화살촉을 붙인다(marker 는 path 방향을 따라 회전).
      let headDefs = '',
        headAttr = '';
      if (d.head) {
        const id = 'lgsArrow' + ++CLIPN;
        headDefs = `<defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="6" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 L2,4 Z" fill="${st.stroke}"/></marker></defs>`;
        headAttr = ` marker-end="url(#${id})"`;
      }
      return (
        headDefs +
        `<path d="${segs.join(' ')}" fill="none" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st.dash || 'none'}" stroke-linecap="round" stroke-linejoin="round" opacity="${st.opacity}"${headAttr}/>`
      );
    }
    case 'polygon': {
      const raw = d.pts.map((p) => m(d, p[0], p[1]));
      if (ptsOutside(raw, box)) {
        const clipped = clipToPaths(raw, box, {
          fill: d.fill,
          stroke: st.stroke,
          strokeWidth: st['stroke-width'],
          dash: st.dash,
          opacity: st.opacity,
          closed: true,
        });
        if (clipped) return clipped;
      }
      const pts = raw.map((p) => p.join(',')).join(' ');
      // 라벨 — 다각형 무게중심에 붙인다(point 라벨과 같은 수식 처리).
      let polySvg = `<polygon points="${pts}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st.dash || 'none'}" stroke-linejoin="round" opacity="${st.opacity}"/>`;
      if (d.label) {
        const gx = raw.reduce((a, p) => a + p[0], 0) / raw.length;
        const gy = raw.reduce((a, p) => a + p[1], 0) / raw.length;
        polySvg += labelParts(d, gx, gy, t).join('\n');
      }
      return polySvg;
    }
    case 'circle': {
      const [cx, cy] = m(d, d.cx, d.cy);
      let fill = d.fill || 'none';
      if (d.gradient && gradId) {
        const gid = gradId.get(d.gradient);
        if (gid) fill = `url(#${gid})`;
      }
      const rx = d.r * scaleX,
        ry = d.r * scaleY;
      // 캔버스를 크게 벗어나는 원은 폴리라인 근사 후 **정확히** 잘라낸다(보이는 호는 동일).
      const R = Math.max(Math.abs(rx), Math.abs(ry));
      let out;
      if (cx - R < box.x0 || cx + R > box.x1 || cy - R < box.y0 || cy + R > box.y1) {
        out = clipToPaths(sampleEllipse(cx, cy, rx, ry, 180), box, {
          fill,
          stroke: st.stroke,
          strokeWidth: st['stroke-width'],
          dash: st.dash,
          opacity: st.opacity,
          closed: true,
        });
      } else {
        const common = `fill="${fill}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" stroke-dasharray="${st.dash || 'none'}" opacity="${st.opacity}"`;
        // equal 스케일일 때만 진짜 원, 아니면 타원으로 방출(비등방 스케일 보존).
        out =
          Math.abs(rx - ry) < 1e-9
            ? `<circle cx="${cx}" cy="${cy}" r="${rx}" ${common}/>`
            : `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${common}/>`;
      }
      // 라벨 — 원 위쪽에 붙인다(point 라벨과 같은 수식 처리).
      if (d.label) out += labelParts(d, cx, cy - Math.abs(ry), t).join('\n');
      return out;
    }
    case 'fillcircle': {
      const [cx, cy] = m(d, d.cx, d.cy);
      let fill = d.fill;
      if (d.gradient && gradId) {
        const gid = gradId.get(d.gradient);
        if (gid) fill = `url(#${gid})`;
      }
      const rx = d.r * scaleX,
        ry = d.r * scaleY;
      const R = Math.max(Math.abs(rx), Math.abs(ry));
      if (cx - R < box.x0 || cx + R > box.x1 || cy - R < box.y0 || cy + R > box.y1) {
        return clipToPaths(sampleEllipse(cx, cy, rx, ry, 180), box, {
          fill,
          opacity: d.opacity ?? 1,
          closed: true,
        });
      }
      if (Math.abs(rx - ry) < 1e-9)
        return `<circle cx="${cx}" cy="${cy}" r="${rx}" fill="${fill}" opacity="${d.opacity ?? 1}" stroke="none"/>`;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${d.opacity ?? 1}" stroke="none"/>`;
    }
    case 'clipfill': {
      const cid = 'logosClip' + ++CLIPN;
      // 디스크가 캔버스를 크게 벗어나면 폴리라인 근사 + 정확 클립(캔버스 밖 정보는 무의미).
      const diskD = (c) => {
        const [cx, cy] = m(d, c.cx, c.cy);
        const rx = c.r * scaleX,
          ry = c.r * scaleY;
        const R = Math.max(Math.abs(rx), Math.abs(ry));
        if (cx - R < box.x0 || cx + R > box.x1 || cy - R < box.y0 || cy + R > box.y1) {
          const poly = polyClip(sampleEllipse(cx, cy, rx, ry, 180), box);
          return poly.length > 2
            ? poly.map((p, i) => `${i === 0 ? 'M' : 'L'} ${fmt(p[0])} ${fmt(p[1])}`).join(' ') + ' Z'
            : '';
        }
        return diskPath(c.cx, c.cy, c.r, m, d);
      };
      return `<defs><clipPath id="${cid}"><path d="${diskD(d.clip)}"/></clipPath></defs><path d="${diskD(d.fill)}" fill="${d.fillColor}" opacity="${d.opacity ?? 1}" clip-path="url(#${cid})" stroke="none"/>`;
    }
    case 'ellipse': {
      const [cx, cy] = m(d, d.cx, d.cy);
      const rx = d.rx * scaleX,
        ry = d.ry * scaleY;
      // 회전은 클립 근사에서만 반영한다(원본은 transform 으로 방출).
      const R = Math.max(Math.abs(rx), Math.abs(ry));
      if (cx - R < box.x0 || cx + R > box.x1 || cy - R < box.y0 || cy + R > box.y1) {
        let raw = sampleEllipse(cx, cy, rx, ry, 180);
        if (d.angle != null) {
          const c = Math.cos(d.angle),
            s = Math.sin(d.angle);
          raw = raw.map(([x, y]) => {
            const dx = x - cx,
              dy = y - cy;
            return [cx + dx * c - dy * s, cy + dx * s + dy * c];
          });
        }
        return clipToPaths(raw, box, {
          fill: d.fill,
          stroke: st.stroke,
          strokeWidth: st['stroke-width'],
          dash: st.dash,
          opacity: st.opacity,
          closed: true,
        });
      }
      const ang = d.angle != null ? ` transform="rotate(${(d.angle * 180) / Math.PI} ${cx} ${cy})"` : '';
      let out = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${d.fill || 'none'}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}" opacity="${st.opacity}"${ang}/>`;
      // 라벨 — 타원 위쪽에 붙인다(point 라벨과 같은 수식 처리).
      if (d.label) out += labelParts(d, cx, cy - Math.abs(ry), t).join('\n');
      return out;
    }
    case 'point': {
      const [cx, cy] = m(d, d.x, d.y);
      const base = d.color || d.fill || t.pointColor;
      const op = d.style?.opacity ?? 1;
      const parts = [markerSvg(d, cx, cy, base, t)];
      if (d.label) {
        const [lx, ly] = m(d, d.x, d.y);
        parts.push(...labelParts(d, lx, ly, t));
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
          return (
            boxStr +
            `<text x="${x}" y="${y}" font-size="${fs}" font-style="normal"${bold} text-anchor="${d.anchor || 'start'}" fill="${color}">${esc(latexToText(d.text || ''))}</text>`
          );
        }
        // foreignObject 는 자체 폭을 모르므로 anchor=middle 이면 폭을 추정해 중앙 정렬한다.
        const est = Math.max(40, Math.min(620, String(d.text || '').length * 7.5 + 16));
        const fx = d.anchor === 'middle' ? x - est / 2 : x;
        return (
          boxStr +
          `<foreignObject x="${fx}" y="${y - 18}" width="${est}" height="46"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(d.text || '')}</div></foreignObject>`
        );
      }
      const fs = d.font || 13.5;
      const fsStyle = d.italic === undefined ? (d.caption ? 'normal' : 'italic') : d.italic ? 'italic' : 'normal';
      const rot = d.rotate ? ` transform="rotate(${d.rotate} ${x} ${y})"` : '';
      // 자간: 개별 지정(px)이 있으면 그것을, 없으면 스타일시트 기본값(em)을 그대로 쓴다.
      const track = d.letterSpacing != null ? ` letter-spacing="${d.letterSpacing}"` : '';
      const head = `font-size="${fs}" font-style="${fsStyle}"${bold} text-anchor="${d.anchor || 'start'}" fill="${color}"${track}${rot}`;
      // 멀티라인: \n → <tspan>. 줄 간격은 행간 배수(기본 TYPE.lineHeight)로 계산한다.
      const lines = String(d.text ?? '').split('\n');
      if (lines.length > 1) {
        const lh = d.lineHeight ?? TYPE.lineHeight;
        const tspans = lines
          .map((ln, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : fs * lh}">${esc(ln)}</tspan>`)
          .join('');
        return boxStr + `<text x="${x}" y="${y}" ${head}>${tspans}</text>`;
      }
      return boxStr + `<text x="${x}" y="${y}" ${head}>${esc(d.text || '')}</text>`;
    }
    case 'rect': {
      // 임의 좌표 사각형 (barh 등). fill + 선택적 테두리.
      let [x0, y0] = m(d, d.x0, d.y0);
      let [x1, y1] = m(d, d.x1, d.y1);
      // 축 정렬 사각형은 좌표 클램프가 곧 **정확한** 클립이다.
      if (outside(x0, y0, box) || outside(x1, y1, box)) {
        const cl = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
        x0 = cl(x0, box.x0, box.x1);
        x1 = cl(x1, box.x0, box.x1);
        y0 = cl(y0, box.y0, box.y1);
        y1 = cl(y1, box.y0, box.y1);
      }
      const strokeAttr =
        d.color || d.stroke != null
          ? ` stroke="${d.color || st.stroke}" stroke-width="${d.stroke || st['stroke-width']}"`
          : ' stroke="none"';
      return `<rect x="${Math.min(x0, x1)}" y="${Math.min(y0, y1)}" width="${Math.abs(x1 - x0)}" height="${Math.abs(y1 - y0)}" fill="${d.fill || 'none'}"${strokeAttr} opacity="${d.opacity ?? 1}"/>`;
    }
    case 'fillrect': {
      let [x0, y0u] = m(d, d.x, 0);
      let [x1, y1u] = m(d, d.x + d.w, d.y1);
      if (outside(x0, y0u, box) || outside(x1, y1u, box)) {
        const cl = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
        x0 = cl(x0, box.x0, box.x1);
        x1 = cl(x1, box.x0, box.x1);
        y0u = cl(y0u, box.y0, box.y1);
        y1u = cl(y1u, box.y0, box.y1);
      }
      return `<rect x="${Math.min(x0, x1)}" y="${Math.min(y0u, y1u)}" width="${Math.abs(x1 - x0)}" height="${Math.abs(y1u - y0u)}" fill="${d.fill}" opacity="${d.opacity ?? 1}"/>`;
    }
    case 'fillpath': {
      const segs = [];
      const raw = [];
      for (const op of d.ops) {
        if (op.op === 'Z' || op.op === 'z') continue;
        raw.push(m(d, op.x, op.y));
      }
      if (raw.length > 2 && ptsOutside(raw, box)) {
        const clipped = clipToPaths(raw, box, { fill: d.fill, opacity: d.opacity ?? 1, closed: true });
        if (clipped) return clipped;
      }
      for (const op of d.ops) {
        if (op.op === 'Z' || op.op === 'z') {
          segs.push('Z');
          continue;
        }
        segs.push(`${op.op} ${m(d, op.x, op.y).join(' ')}`);
      }
      return `<path d="${segs.join(' ')}" fill="${d.fill}" opacity="${d.opacity ?? 1}" stroke="none"/>`;
    }
    case 'arrow': {
      const [ax1, ay1] = m(d, d.x1, d.y1);
      const [ax2, ay2] = m(d, d.x2, d.y2);
      let x1 = ax1,
        y1 = ay1,
        x2 = ax2,
        y2 = ay2;
      // 화면 밖으로 뻗은 화살표는 선분을 정확히 잘라낸다(보이는 부분 동일 · 좌표 유계).
      if (outside(ax1, ay1, box) || outside(ax2, ay2, box)) {
        const s = segClip(ax1, ay1, ax2, ay2, box);
        if (!s) return null;
        [x1, y1, x2, y2] = s;
      }
      const parts = [];
      // 점선 화살표 (matplotlib linestyle='--' 대응) — vector()/annotate.arrow().dash()
      const dashAttr = st.dash ? ` stroke-dasharray="${st.dash}"` : '';
      if (!d.headless) {
        const id = 'lgsArrow' + ++CLIPN;
        parts.push(
          `<defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="6" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 L2,4 Z" fill="${st.stroke}"/></marker></defs>`,
        );
        parts.push(
          `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}"${dashAttr} marker-end="url(#${id})" opacity="${st.opacity}"/>`,
        );
      } else {
        parts.push(
          `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st.stroke}" stroke-width="${st['stroke-width']}"${dashAttr} opacity="${st.opacity}"/>`,
        );
      }
      if (d.label && !outside((ax1 + ax2) / 2, (ay1 + ay2) / 2 - 6, box)) {
        const lx = (x1 + x2) / 2,
          ly = (y1 + y2) / 2 - 6;
        if (d.labelMath && t.math !== 'text') {
          const est = Math.max(40, Math.min(620, String(d.label).length * 7.5 + 16));
          parts.push(
            `<foreignObject x="${lx - est / 2}" y="${ly - 18}" width="${est}" height="46"><div xmlns="http://www.w3.org/1999/xhtml">${katexRender(String(d.label))}</div></foreignObject>`,
          );
        } else {
          const txt = d.labelMath ? latexToText(String(d.label)) : String(d.label);
          parts.push(
            `<text x="${lx}" y="${ly}" font-size="13" text-anchor="middle" fill="${st.stroke}">${esc(txt)}</text>`,
          );
        }
      }
      return parts.join('\n');
    }
    case 'cliprect':
      return null; // 정의 전용
    default: {
      // 플러그인 노드 — `api.node(kind, { svg })` 로 등록된 emitter 가 이어받는다.
      //   좌표는 ctx.map(data, x, y) 로 화면 좌표로 바꾸고, 스타일은 ctx.style(data) 를 쓴다.
      const em = nodeEmitter('svg', n.kind);
      if (em) {
        const html = em(n, {
          map: m,
          scaleX,
          scaleY,
          theme: t,
          gradId,
          esc,
          style: (dd) => stroke(dd.style || dd, t),
        });
        if (html) return html;
      }
      return `<!-- ${n.kind} -->`;
    }
  }
}

export default emitSVG;
