// plugins/geometry-extras.js — logos **플러그인 예시**: 코어에 없는 기능을 코어 수정 없이 붙인다.
//
// 이 파일은 `core/`·`shapes/`·`backend/` 를 **전혀 고치지 않는다**. `use()` 한 번으로:
//   ① 새 빌더        ray(반직선)                       api.define('ray', …, { ctor: Ray })
//   ② 스텁 채우기     arc.circular(원호)                api.define('arc.circular', …)
//                     (index.js 의 `arc` 스텁이 등록 즉시 살아난다 — 코어 수정 0)
//   ③ 새 IR 노드      hatch(사선 음영 사각형)           api.node('hatch', { svg, tikz })
//                     → svg.js/tikz.js 를 고치지 않고 새 그림 종류가 두 백엔드로 나간다
//   ④ 체이닝 메서드   .tilt(deg) · .dashed() · .arrowTip()   api.chain('drawable', …)
//   ⑤ 정적            point.byDeg(r, deg), ray.deg(O, deg)   api.static('point', …)
//   ⑥ 테마           .theme('chalk')                  api.theme('chalk', …)
//   ⑦ 파이프라인 훅   SVG 워터마크                      api.hook('svg', …)
//   ⑧ 기존 메서드 래핑 scene.title 앞에 [draft]        api.around('scene', 'title', …)
//
// 사용법
//   import { scene, point, use } from '@jaywoo0830a/logos';
//   import geometryExtras from './plugins/geometry-extras.js';
//   use(geometryExtras, { stampTitle: true });        // 옵션은 install(api, opts) 로 전달
//   scene().add(ray(point(0, 0), point(2, 1))).compile().toSVG();
import { Drawable, node, point, transform, renderText } from '../index.js';

/** @typedef {import('../shapes/point.js').Point} Point */

const RAD = Math.PI / 180;

/** 코어 도형과 같은 관례의 스타일 키 추출 */
function styleOf(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity', 'z']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

// ── ① ray — 반직선 (코어에는 없는 도형) ─────────────────────
export class Ray extends Drawable {
  /** @param {Point} O 시작점 @param {Point} P 방향을 정하는 점 */
  constructor(O, P, conf = {}) {
    super('ray', { O, P, ...conf });
  }
  get O() {
    return this._conf.O;
  }
  get P() {
    return this._conf.P;
  }
  /** O + t·(P − O) — t>1 이면 P 너머, t<0 이면 반대쪽 */
  at(t) {
    const [x0, y0] = this._conf.O.coords,
      [x1, y1] = this._conf.P.coords;
    return point(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
  }
  /** 그려지는 구간 — 뒤로 tail, 앞으로 over 배(반직선처럼 보이게) */
  segment(tail, over) {
    return [this.at(-(tail ?? this._conf.tail ?? 0.15)), this.at(over ?? this._conf.over ?? 2.4)];
  }
  length() {
    const [A, B] = this.segment().map((p) => p.coords);
    return Math.hypot(B[0] - A[0], B[1] - A[1]);
  }
  bounds() {
    const [A, B] = this.segment().map((p) => p.coords);
    const O = this._conf.O.coords;
    return {
      xmin: Math.min(A[0], B[0], O[0]),
      xmax: Math.max(A[0], B[0], O[0]),
      ymin: Math.min(A[1], B[1], O[1]),
      ymax: Math.max(A[1], B[1], O[1]),
    };
  }
  toIR() {
    const c = this._conf;
    const [A, B] = this.segment().map((p) => p.coords);
    return [
      node('path', {
        ops: [
          { op: 'M', x: A[0], y: A[1] },
          { op: 'L', x: B[0], y: B[1] },
        ],
        head: c.head, // 코어 path emitter 의 화살촉(marker-end)
        color: c.color,
        stroke: c.stroke,
        dash: c.dash,
        opacity: c.opacity,
        transforms: c.transforms,
        clip: c.clip,
        style: styleOf(c),
      }),
    ];
  }
}

// ── ② arc.circular — 원호 ──────────────────────────────────
export class Arc extends Drawable {
  /** @param {Point} C 중심 @param {number} r 반지름 @param {number} a0,a1 각(기본 도) */
  constructor(C, r, a0, a1, conf = {}) {
    super('arc', { C, r, a0, a1, ...conf });
  }
  /** 끝점 */
  end(t) {
    const c = this._conf,
      a0 = c.rad ? c.a0 : c.a0 * RAD;
    const a = a0 + (t ?? 1) * this.sweep();
    return point(c.C.coords[0] + c.r * Math.cos(a), c.C.coords[1] + c.r * Math.sin(a));
  }
  sweep() {
    const c = this._conf;
    return c.rad ? c.a1 - c.a0 : (c.a1 - c.a0) * RAD;
  }
  bounds() {
    const c = this._conf,
      [cx, cy] = c.C.coords;
    return { xmin: cx - c.r, xmax: cx + c.r, ymin: cy - c.r, ymax: cy + c.r };
  }
  toIR() {
    const c = this._conf;
    const [cx, cy] = c.C.coords;
    const a0 = c.rad ? c.a0 : c.a0 * RAD;
    const n = Math.max(2, c.n ?? 64);
    const ops = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (this.sweep() * i) / n;
      ops.push({ op: i === 0 ? 'M' : 'L', x: cx + c.r * Math.cos(a), y: cy + c.r * Math.sin(a) });
    }
    return [
      node('path', {
        ops,
        color: c.color,
        stroke: c.stroke,
        dash: c.dash,
        opacity: c.opacity,
        transforms: c.transforms,
        style: styleOf(c),
      }),
    ];
  }
}

// ── ③ 새 IR 노드 'hatch' — 사선 음영 사각형 (백엔드 무수정) ──
let HATCH_SEQ = 0; // SVG <pattern> id 용(렌더 단위로 증가, 결정적)

/**
 * SVG emitter — `api.node('hatch', { svg })` 로 등록된다.
 * ctx: { map, scaleX, scaleY, theme, gradId, esc, style }
 *   ctx.map(d, x, y) → 화면 좌표, ctx.style(d) → { stroke, 'stroke-width', opacity, dash }
 */
export function hatchSvg(n, ctx) {
  const d = n.data;
  const [x, y] = ctx.map(d, d.x, d.y);
  const [x2, y2] = ctx.map(d, d.x + d.w, d.y + d.h);
  const s = ctx.style(d);
  const w = s['stroke-width'] || 1;
  const color = d.color || s.stroke;
  const gap = d.gap ?? 9;
  const id = `lgHatch${++HATCH_SEQ}`;
  const rx = Math.min(x, x2),
    ry = Math.min(y, y2);
  const rw = Math.abs(x2 - x),
    rh = Math.abs(y2 - y);
  const defs =
    `<defs><pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse"` +
    ` patternTransform="rotate(${d.angle ?? 45})">` +
    `<line x1="0" y1="0" x2="0" y2="${gap}" stroke="${color}" stroke-width="${w}"/></pattern></defs>`;
  const rect =
    `<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}"` +
    ` fill="url(#${id})" stroke="${color}" stroke-width="${w}" opacity="${s.opacity ?? 1}"/>`;
  // 라벨은 emitter 가 아니라 `Hatched.toIR()` 이 코어 text 노드로 따로 내보낸다
  //   (그래야 KaTeX/STIX 조판·자동 배치를 그대로 물려받는다 — 코어 IR 조합의 예)
  return defs + rect;
}

/** TikZ emitter — 패턴 라이브러리로 같은 그림이 나간다 */
export function hatchTikz(n) {
  const d = n.data;
  const color = d.color || 'black';
  return `\\fill[pattern=north east lines, pattern color=${color}] (${d.x},${d.y}) rectangle (${d.x + d.w},${d.y + d.h});`;
}

/** 사선 음영 직사각형 — `.hatch({ gap, angle })` 로 밀도를 바꿀 수 있다 */
export class Hatched extends Drawable {
  constructor(x, y, w, h, conf = {}) {
    super('hatch', { x, y, w, h, ...conf });
  }
  hatch(o = {}) {
    return this.set({ gap: o.gap ?? this._conf.gap, angle: o.angle ?? this._conf.angle });
  }
  text(t) {
    return this.set({ text: t });
  }
  bounds() {
    const c = this._conf;
    return { xmin: c.x, xmax: c.x + c.w, ymin: c.y, ymax: c.y + c.h };
  }
  toIR() {
    const c = this._conf;
    const out = [
      node('hatch', {
        x: c.x,
        y: c.y,
        w: c.w,
        h: c.h,
        gap: c.gap,
        angle: c.angle,
        color: c.color,
        stroke: c.stroke,
        style: styleOf(c),
      }),
    ];
    // 라벨은 코어 `text` 노드를 그대로 재사용한다(KaTeX 조판·자동 배치까지 물려받음).
    if (c.text != null) {
      out.push(
        node('text', {
          x: c.x + c.w / 2,
          y: c.y + c.h / 2,
          dxPx: 0,
          dyPx: 0,
          text: renderText(c.text),
          anchor: 'middle',
          math: typeof c.text?.toLatex === 'function',
          color: c.color,
          bold: c.bold,
        }),
      );
    }
    return out;
  }
}

// ── 팩토리 ─────────────────────────────────────────────────
export const ray = (O, P, conf) => new Ray(O, P, conf);
export const arcCircular = (C, r, a0, a1, conf) => new Arc(C, r, a0, a1, conf);
export const hatch = (x, y, w, h, conf) => new Hatched(x, y, w, h, conf);

// ── ④ 체이닝 메서드 (선언형: (conf, ...args) => patch) ──────
//   패치 객체를 돌려주면 플러그인 아키텍처가 자동으로 `this.set(patch)` 를 거치므로
//   반환값은 새 인스턴스(=체이닝 유지)가 된다.
export const chainables = {
  /** deg 만큼 원점 회전 (transform.rotate 는 라디안) */
  tilt: (c, deg) => ({ transforms: [...(c.transforms || []), transform.rotate(deg * RAD)] }),
  /** 점선 — 대시 패턴 지정 */
  dashed: (c, d = [4, 3]) => ({ dash: d }),
};

/**
 * `.arrowTip()` — **임의의 도형** 끝에 화살촉을 붙인다.
 *
 * 코어 path emitter 는 노드 데이터에 `head: true` 가 있을 때만 marker-end 를 붙이는데,
 * 모든 코어 도형이 `head` 를 IR 로 넘기지는 않는다. 그래서 이 메서드는 패치가 아니라
 * **IR 을 감싸는 새 Drawable(TipMarked)** 을 돌려준다 — 플러그인 규칙 ③(Drawable 반환은
 * 그대로 통과) 덕분에 체이닝도 그대로 이어진다.
 *   `segment(A, B).arrowTip().color('#c00')`  ← 감싼 뒤에도 코어 메서드 사용 가능
 */
export class TipMarked extends Drawable {
  constructor(inner, conf = {}) {
    super('tip', { inner, ...conf });
  }
  get inner() {
    return this._conf.inner;
  }
  /** 감싼 도형의 경계 위임 — 씬의 자동 view 계산과 협력한다 */
  bounds() {
    const i = this.inner;
    if (i && typeof i.bounds === 'function') return i.bounds();
    if (i && Array.isArray(i.coords)) {
      const [x, y] = i.coords;
      return { xmin: x, xmax: x, ymin: y, ymax: y };
    }
    return null;
  }
  toIR(ctx) {
    const irs = this.inner.toIR(ctx) || [];
    // 마지막 path 노드에만 화살촉 플래그를 심는다(코어 emitter 가 그대로 소비)
    return irs.map((nd, i) =>
      i === irs.length - 1 && nd.kind === 'path' ? { ...nd, data: { ...nd.data, head: true } } : nd,
    );
  }
}

/** 명령형 체이닝 메서드 — Drawable 을 반환하면 그대로 통과한다(규칙 ③) */
export const wrappers = {
  arrowTip() {
    return new TipMarked(this);
  },
};

// ── ⑤ 정적(네임스페이스) ────────────────────────────────────
/** `point.byDeg(r, deg)` — 극좌표를 도 단위로 (코어 point.polar 는 라디안) */
const pointByDeg = (r, deg) => point(r * Math.cos(deg * RAD), r * Math.sin(deg * RAD));
/** `ray.deg(O, deg, len)` — O 에서 deg 방향으로 뻗는 반직선 */
const rayDeg = (O, deg, len = 2) =>
  ray(O, point(O.coords[0] + len * Math.cos(deg * RAD), O.coords[1] + len * Math.sin(deg * RAD)));

// ── ⑥ 테마 ─────────────────────────────────────────────────
/** 칠판(chalk) 테마 — `.theme('chalk')` 로 즉시 사용 */
export const chalkTheme = {
  bg: '#2f3e3a',
  gridColor: '#41544e',
  gridMajor: '#4d635c',
  axisColor: '#e9f2ee',
  axisWidth: 1.3,
  tickColor: '#cfe0da',
  labelColor: '#f4faf7',
  font: 'Georgia, "Times New Roman", serif',
  fontMath: 'Latin Modern Math, Georgia, serif',
  pointColor: '#ffd54f',
  strokeDefault: '#eaf4f0',
};

// ── ⑦ 파이프라인 훅 ────────────────────────────────────────
/** 완성된 SVG 문자열을 건드리지 않고 오른쪽 가장자리에 세로 워터마크를 덧붙인다(백엔드 무수정) */
function watermarkHook(svg, ctx, on = true) {
  if (!on || typeof svg !== 'string' || !svg.includes('</svg>')) return svg;
  // 오른쪽 가장자리 세로 스탬프 — 가운데 제목·축 눈금과 겹치지 않는 자리
  const [W, H] = (ctx.ir && ctx.ir.o && ctx.ir.o.size) || [600, 600];
  const x = W - 6,
    y = H / 2;
  const mark =
    `<text x="${x}" y="${y}" transform="rotate(-90 ${x} ${y})" text-anchor="middle"` +
    ` font-size="10" font-family="Georgia, serif" fill="#9aa5b1" opacity="0.75">plugins/geometry-extras.js</text>`;
  return svg.replace('</svg>', `${mark}</svg>`);
}

// ── 플러그인 본체 ──────────────────────────────────────────
const geometryExtras = {
  name: 'geometry-extras',
  version: '1.0.0',
  /**
   * @param {Object} api 플러그인 등록 API
   * @param {Object} opts { watermark=true, stampTitle=false }
   */
  install(api, opts = {}) {
    // ① 새 빌더 — `ray(...)` / `plugins.ray(...)` 즉시 사용 가능
    api.define('ray', ray, { ctor: Ray });
    // ② 네임스페이스 스텁 채우기 — index.js 의 `arc` Proxy 가 이 이름을 찾는다
    api.define('arc.circular', arcCircular, { ctor: Arc });
    api.define('hatch', hatch, { ctor: Hatched });
    // ⑤ 정적 — 기존/새 팩토리에 이름을 붙인다
    api.static('point', 'byDeg', pointByDeg);
    api.static('ray', 'deg', rayDeg);
    // ④ 체이닝 메서드 — 모든 도형(Drawable 하위 전부)에 붙는다
    api.chain('drawable', chainables); // 선언형(패치 객체 → 자동 set)
    api.extend('drawable', wrappers); // 명령형(Drawable 반환 → 그대로 통과)
    // ⑥ 테마
    api.theme('chalk', chalkTheme);
    // ③ 새 IR 노드 + 두 백엔드 emitter
    api.node('hatch', { svg: hatchSvg, tikz: hatchTikz });
    // ⑦ 훅
    api.hook('svg', (svg, ctx) => watermarkHook(svg, ctx, opts.watermark !== false));
    // ⑧ 기존 메서드 래핑(옵션) — Scene.title 을 감싸 접두어를 붙인다
    if (opts.stampTitle) api.around('scene', 'title', (orig, t) => orig(`[draft] ${t}`));
  },
};

export default geometryExtras;
