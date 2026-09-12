// 3D 입체 코어 (E1) — 정사영 후 2D IR 로 방출
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';
import { point } from './point.js';

export function pick(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}
export const project3 = (ctx, p) => (ctx.project ? ctx.project(p) : [p[0], p[1]]);

/** hex(#rrggbb 및 이름 기본색) → 밝기 ±delta% 한 6자리 hex */
function hslLightAdjust(hex, delta) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return hex;
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (mx + mn) / 2;
  const d = mx - mn;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  l = Math.max(0, Math.min(1, l + delta / 100));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t0) => {
    let t = t0;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const to = (f) => Math.round(Math.min(255, Math.max(0, f * 255)));
  return `#${((to(hue2rgb(h / 360 + 1 / 3)) << 16) | (to(hue2rgb(h / 360)) << 8) | to(hue2rgb(h / 360 - 1 / 3))).toString(16).padStart(6, '0')}`;
}
function lightenHsl(c, d) {
  return hslLightAdjust(c, d);
}
function darkenHsl(c, d) {
  return hslLightAdjust(c, -d);
}
/** depth(시선거리) → z 키. 뒤(큰 depth)일수록 작은 z → 먼저 그려진다. layer 는 미세 우선순위. */
export function depthZ(depth, layer = 0) {
  return -(Number.isFinite(depth) ? depth : 0) * 0.1 + layer * 1e-3;
}

export function polyline(pts, c, layer, nodeImp = node, pickImp = pick) {
  const ops = [];
  let started = false;
  let ds = 0,
    dn = 0;
  for (const p of pts) {
    const [x, y] = p;
    if (Number.isFinite(p[2])) {
      ds += p[2];
      dn++;
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      started = false;
      continue;
    }
    ops.push({ op: started ? 'L' : 'M', x, y });
    started = true;
  }
  // P4-1: primitive 별 평균 depth 로 z 를 정해 painter's algorithm 정렬.
  const z = depthZ(dn ? ds / dn : 0, layer);
  return nodeImp('path', {
    ops,
    color: c.color,
    stroke: c.stroke,
    dash: c.dash,
    opacity: c.opacity,
    z,
    style: pickImp(c),
  });
}

export class Sphere extends Drawable {
  constructor(conf = {}) {
    super('sphere', { ...conf });
  }
  center() {
    return this._conf.center.coords;
  }
  radius() {
    return this._conf.radius;
  }
  // 3D 자동 프레이밍용 코너점
  get vertices() {
    const [cx, cy, cz] = this._conf.center.coords,
      r = this._conf.radius;
    return [
      [cx - r, cy - r, cz - r],
      [cx + r, cy + r, cz + r],
    ].map((v) => point(...v));
  }
  label(l, o) {
    return this.set({ label: l, labelOff: o });
  }
  /** 위도선 개수 — `rings(false|0)` 로 끄고, `rings(3)` 처럼 성기게. 기본 7. */
  rings(n = 7) {
    return this.set({ rings: n });
  }
  /** 경선 개수 — 기본 0(안 그림). `meridians(4)` 면 세로 반원 4개. */
  meridians(n = 0) {
    return this.set({ meridians: n });
  }
  toIR(ctx) {
    const [cx, cy, cz] = this._conf.center.coords;
    const r = this._conf.radius;
    const c = this._conf;
    const out = [];
    const CP = project3(ctx, [cx, cy, cz]);
    // 위도선(가로 원) — 기본 7개(양 극 제외). `rings(false|0)` 이면 실루엣만.
    const rings =
      c.rings === false || c.rings === 0 ? 0 : Number.isFinite(c.rings) ? Math.max(0, Math.floor(c.rings)) : 7;
    for (let k = 1; k <= rings; k++) {
      const phi = (Math.PI * k) / (rings + 1);
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const th = (2 * Math.PI * i) / 48;
        pts.push(
          project3(ctx, [
            cx + r * Math.sin(phi) * Math.cos(th),
            cy + r * Math.sin(phi) * Math.sin(th),
            cz + r * Math.cos(phi),
          ]),
        );
      }
      out.push(polyline(pts, c, -1));
    }
    // 경선(세로 반원) — 기본 0. 남북극을 잇는 반원 n 개.
    const mer = Number.isFinite(c.meridians) ? Math.max(0, Math.floor(c.meridians)) : 0;
    for (let j = 0; j < mer; j++) {
      const th = (Math.PI * j) / mer;
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const phi = (Math.PI * i) / 48;
        pts.push(
          project3(ctx, [
            cx + r * Math.sin(phi) * Math.cos(th),
            cy + r * Math.sin(phi) * Math.sin(th),
            cz + r * Math.cos(phi),
          ]),
        );
      }
      out.push(polyline(pts, c, -1));
    }
    if (c.opacity != null || c.fill) {
      // 구 실루엣: 단색이 아니라 '방사 그라디언트'로 오목-볼록(half-tone) 입체감
      const base = c.fill || '#3b82f6';
      out.push(
        node('fillcircle', {
          cx: CP[0],
          cy: CP[1],
          r: r * 0.97,
          fill: base,
          opacity: c.opacity ?? 0.25,
          z: depthZ(CP[2], 0) - 1,
          style: pick(c),
          gradient: {
            type: 'radial',
            stops: [
              { offset: 0, color: lightenHsl(base, 30) },
              { offset: 0.6, color: base },
              { offset: 1, color: darkenHsl(base, 28) },
            ],
          },
        }),
      );
    }
    return out;
  }
}
export const sphere = {
  center(O) {
    return {
      radius: (r) => new Sphere({ center: O, radius: r }),
      /** 중심 + 한 점 → 반지름이 |P−O| 인 구 */
      through: (P) =>
        new Sphere({
          center: O,
          radius: Math.hypot(
            P.coords[0] - O.coords[0],
            P.coords[1] - O.coords[1],
            (P.coords[2] ?? 0) - (O.coords[2] ?? 0),
          ),
        }),
    };
  },
  /** 네 점을 지나는 구 (구면 방정식 3원 연립) */
  through(A, B, C, D) {
    const R = sphereThrough4(A, B, C, D);
    return R;
  },
  unit() {
    return new Sphere({ center: point(0, 0, 0), radius: 1 });
  },
};

/** 네 점을 지나는 구 — 중심은 등거리 조건 3식을 푼다. */
function sphereThrough4(A, B, C, D) {
  const P = [A, B, C, D].map((p) => [p.coords[0], p.coords[1], p.coords[2] ?? 0]);
  const [a, b, c, d] = P;
  const M = [];
  const rhs = [];
  for (const Q of [b, c, d]) {
    M.push([2 * (Q[0] - a[0]), 2 * (Q[1] - a[1]), 2 * (Q[2] - a[2])]);
    rhs.push(Q[0] ** 2 + Q[1] ** 2 + Q[2] ** 2 - (a[0] ** 2 + a[1] ** 2 + a[2] ** 2));
  }
  const ctr = solve3(M, rhs);
  if (!ctr) return null;
  return new Sphere({
    center: point(ctr[0], ctr[1], ctr[2]),
    radius: Math.hypot(ctr[0] - a[0], ctr[1] - a[1], ctr[2] - a[2]),
  });
}

/** 3×3 연립방정식 (가우스 소거). 특이하면 null. */
function solve3(M, rhs) {
  const m = M.map((row, i) => [...row, rhs[i]]);
  for (let i = 0; i < 3; i++) {
    let p = i;
    for (let k = i + 1; k < 3; k++) if (Math.abs(m[k][i]) > Math.abs(m[p][i])) p = k;
    if (Math.abs(m[p][i]) < 1e-12) return null;
    [m[i], m[p]] = [m[p], m[i]];
    for (let k = i + 1; k < 3; k++) {
      const f = m[k][i] / m[i][i];
      for (let j = i; j < 4; j++) m[k][j] -= f * m[i][j];
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    let s = m[i][3];
    for (let j = i + 1; j < 3; j++) s -= m[i][j] * x[j];
    x[i] = s / m[i][i];
  }
  return x;
}

export class Plane extends Drawable {
  constructor(conf = {}) {
    super('plane', { ...conf });
  }
  /** 평면을 법선 방향으로 d 만큼 평행이동 */
  offset(d) {
    const n = unit3(this._normal());
    const P0 = this._P0();
    return this.set({ P0: [P0[0] + n[0] * d, P0[1] + n[1] * d, P0[2] + n[2] * d] });
  }
  /** 단위 법선 */
  normal() {
    return unit3(this._normal());
  }
  /** 평면 위의 한 점 */
  anchor() {
    return this._P0();
  }
  _normal() {
    const c = this._conf;
    if (c.n) return [c.n[0] ?? 0, c.n[1] ?? 0, c.n[2] ?? 0];
    if (c.coord === 'yz') return [1, 0, 0];
    if (c.coord === 'xz' || c.coord === 'zx') return [0, 1, 0];
    return [0, 0, 1];
  }
  _P0() {
    const c = this._conf;
    if (c.P0) return [c.P0[0] ?? 0, c.P0[1] ?? 0, c.P0[2] ?? 0];
    return [0, 0, 0];
  }
  get vertices() {
    const half = this._conf.half || 2.2;
    return this._corners3(half).map((v) => point(...v));
  }
  _corners3(half) {
    const n = unit3(this._normal());
    const P0 = this._P0();
    // 기존 좌표평면(xy)과 **같은 점 순서**를 유지한다.
    const [u, v] =
      Math.abs(n[2] - 1) < 1e-12
        ? [
            [1, 0, 0],
            [0, 1, 0],
          ]
        : basisOf(n);
    const at = (su, sv) => [
      P0[0] + half * (su * u[0] + sv * v[0]),
      P0[1] + half * (su * u[1] + sv * v[1]),
      P0[2] + half * (su * u[2] + sv * v[2]),
    ];
    return [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)];
  }
  toIR(ctx) {
    const c = this._conf;
    const half = c.half || 2.2;
    const pts = this._corners3(half).map((p) => project3(ctx, p));
    const depth = pts.reduce((a, p) => a + (p[2] || 0), 0) / pts.length;
    return [
      node('polygon', {
        pts,
        closed: true,
        fill: c.fill || '#eee',
        color: c.color,
        stroke: c.stroke,
        opacity: c.opacity ?? 0.4,
        z: depthZ(depth, -1),
        style: pick(c),
      }),
    ];
  }
}

// ── 3D 벡터 유틸 (평면 기저용) ─────────────────────────
function unit3(v) {
  const L = Math.hypot(v[0] || 0, v[1] || 0, v[2] || 0) || 1;
  return [v[0] / L, v[1] / L, v[2] / L];
}
function cross3(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
/** 법선 n 에 수직인 정규직교 기저 [u, v] */
function basisOf(n) {
  const ax =
    Math.abs(n[0]) <= Math.abs(n[1]) && Math.abs(n[0]) <= Math.abs(n[2])
      ? [1, 0, 0]
      : Math.abs(n[1]) <= Math.abs(n[2])
        ? [0, 1, 0]
        : [0, 0, 1];
  const u = unit3(cross3(n, ax));
  const v = unit3(cross3(n, u));
  return [u, v];
}

/** 중심 + 법선으로 정의되는 평면 */
function planeFromPointNormal(P, n) {
  const c = Array.isArray(P) ? P : (P.coords ?? [0, 0, 0]);
  const nn = typeof n === 'function' ? n() : Array.isArray(n) ? n : (n.v ?? n.raw ?? [0, 0, 1]);
  return new Plane({ P0: [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0], n: [nn[0] ?? 0, nn[1] ?? 0, nn[2] ?? 0] });
}

export const plane = {
  coordinate(name) {
    return new Plane({ coord: name });
  },
  normal(v) {
    return new Plane({ normal: v, n: Array.isArray(v) ? v : (v?.v ?? v?.raw ?? [0, 0, 1]) });
  },
  /** 세 점을 지나는 평면 (법선 = (B−A)×(C−A)) */
  through(A, B, C) {
    const a = A.coords,
      b = B.coords,
      c = C.coords;
    const ab = [b[0] - a[0], b[1] - a[1], (b[2] ?? 0) - (a[2] ?? 0)];
    const ac = [c[0] - a[0], c[1] - a[1], (c[2] ?? 0) - (a[2] ?? 0)];
    return planeFromPointNormal(a, cross3(ab, ac));
  },
  /** 점 + 법선 */
  pointNormal(A, n) {
    return planeFromPointNormal(A, n);
  },
  /** ax + by + cz = d */
  standard(a, b, c, d) {
    const L2 = a * a + b * b + c * c || 1;
    return new Plane({ P0: [(a * d) / L2, (b * d) / L2, (c * d) / L2], n: [a, b, c] });
  },
};
