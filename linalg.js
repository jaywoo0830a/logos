// linalg.js — 선형대수 수치 도우미 (행렬 · 벡터)
//
// "행렬과 벡터" 그림(선형변환·행렬식·고유공간·투영 …)을 그리려면
//   A·x, det A, A⁻¹, A^k, a·b, |a|, a 를 b 에 정사영 …
// 같은 **수치** 계산이 매번 필요하다. 이 모듈은 그 계산만 담당한다
// (그리기는 Scene/Drawable, 여기는 순수 함수 — 기존 `solver/` 와 같은 성격).
//
// 값 규약
//   · 벡터 = 숫자 배열 `[x, y]` / `[x, y, z]`
//   · 행렬 = **행의 배열** `[[a, b], [c, d]]`  (수학 표기 그대로, `mpl` 과 동일)
//   · 각도는 **도(degree)** — 화면/교재 표기와 맞춘다(`transform.rotate` 도 도 단위)
//
// 사용
//   import { mat, vec } from '@jaywoo0830a/logos';
//   const A = mat([[2, 1], [0.5, 1.5]]);
//   A.apply([1, 0]);     // → [2, 0.5]      (기저 벡터의 상)
//   A.det;               // → 2.5
//   vec.project([4, 2], [2, 0.5]);   // → a 를 b 에 정사영

/** 행렬 — 행의 배열로 만든다. `mat([[a,b],[c,d]])` */
export class Matrix {
  /** @param {number[][]} rows */
  constructor(rows) {
    if (!Array.isArray(rows) || !rows.length || !Array.isArray(rows[0])) {
      throw new Error('mat(rows): 행의 배열이 필요합니다. 예: mat([[2,1],[0.5,1.5]])');
    }
    this.rows = rows.map((r) => [...r]);
    this.n = this.rows.length;
    this.m = this.rows[0].length;
    if (this.rows.some((r) => r.length !== this.m)) throw new Error('mat(rows): 모든 행의 길이가 같아야 합니다.');
  }

  /** 원시 행 배열 */
  toArray() {
    return this.rows.map((r) => [...r]);
  }
  /** (i, j) 원소 */
  at(i, j) {
    return this.rows[i][j];
  }
  /** 정사각 행렬인가 */
  get square() {
    return this.n === this.m;
  }
  /** 행렬식 (2×2, 3×3) */
  get det() {
    if (!this.square) throw new Error('det: 정사각 행렬만 가능합니다.');
    if (this.n === 2) return this.rows[0][0] * this.rows[1][1] - this.rows[0][1] * this.rows[1][0];
    if (this.n === 3) {
      const [a, b, c] = this.rows[0],
        [d, e, f] = this.rows[1],
        [g, h, i] = this.rows[2];
      return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    }
    throw new Error('det: 2×2 또는 3×3 만 지원합니다.');
  }
  /** 역행렬 (2×2, 3×3) — det=0 이면 예외 */
  get inv() {
    const d = this.det;
    if (Math.abs(d) < 1e-12) throw new Error('inv: 특이 행렬(det=0)은 역행렬이 없습니다.');
    if (this.n === 2) {
      const [[a, b], [c, e]] = this.rows;
      return mat([
        [e / d, -b / d],
        [-c / d, a / d],
      ]);
    }
    const [[a, b, c], [e, f, g], [h, i, j]] = this.rows;
    const cof = [
      [f * j - g * i, -(e * j - g * h), e * i - f * h],
      [-(b * j - c * i), a * j - c * h, -(a * i - b * h)],
      [b * g - c * f, -(a * g - c * e), a * f - b * e],
    ];
    // adjugate = cofactor 전치
    return mat([0, 1, 2].map((r) => [0, 1, 2].map((k) => cof[k][r] / d)));
  }
  /** 열 벡터 j */
  col(j) {
    return this.rows.map((r) => r[j]);
  }
  /** 전치 */
  t() {
    return mat(Array.from({ length: this.m }, (_, j) => this.col(j)));
  }
  /** 행렬곱 `this · N` */
  mul(N) {
    const B = N instanceof Matrix ? N.rows : N;
    return mat(this.rows.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0))));
  }
  /** `A^k` (k=0 → 단위행렬) */
  pow(k) {
    if (!Number.isInteger(k) || k < 0) throw new Error('pow: 0 이상의 정수만 가능합니다.');
    let out = mat.identity(this.n);
    for (let i = 0; i < k; i++) out = out.mul(this);
    return out;
  }
  /** 점(벡터) 하나에 적용 — `A·x` */
  apply(p) {
    return this.rows.map((row) => row.reduce((s, v, k) => s + v * p[k], 0));
  }
  /** 점 배열에 적용 */
  map(pts) {
    return pts.map((p) => this.apply(p));
  }
  /** 사람이 읽는 형태 */
  toString() {
    return `mat([${this.rows.map((r) => `[${r.join(', ')}]`).join(', ')}])`;
  }
}

/** 행렬 생성 — `mat([[a,b],[c,d]])` */
export function mat(rows) {
  return new Matrix(rows);
}

/** 단위행렬 */
mat.identity = (n = 2) =>
  new Matrix(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
/** 회전행렬 R(θ) — θ 는 도(반시계) */
mat.rotation = (deg) => {
  const t = (deg * Math.PI) / 180,
    c = Math.cos(t),
    s = Math.sin(t);
  return mat([
    [c, -s],
    [s, c],
  ]);
};
/** 전단(밀기) — kx: x 방향, ky: y 방향 */
mat.shear = (kx = 0, ky = 0) =>
  mat([
    [1, kx],
    [ky, 1],
  ]);
/** 스케일 */
mat.scaling = (sx, sy = sx) =>
  mat([
    [sx, 0],
    [0, sy],
  ]);
/** 반사 — 'x'(x축) | 'y'(y축) | 'yx'(y=x) | 도(단위벡터 방향) */
mat.reflection = (axis) => {
  if (axis === 'x')
    return mat([
      [1, 0],
      [0, -1],
    ]);
  if (axis === 'y')
    return mat([
      [-1, 0],
      [0, 1],
    ]);
  if (axis === 'yx')
    return mat([
      [0, 1],
      [1, 0],
    ]);
  const t = (Number(axis) * Math.PI) / 180,
    c = Math.cos(2 * t),
    s = Math.sin(2 * t);
  return mat([
    [c, s],
    [s, -c],
  ]);
};

// ── 벡터 (순수 함수) ─────────────────────────────────
/** 벡터 도우미 — 입력은 숫자 배열, 출력도 숫자 배열(불변). */
export const vec = {
  /** a + b */
  add: (a, b) => a.map((v, i) => v + b[i]),
  /** a − b */
  sub: (a, b) => a.map((v, i) => v - b[i]),
  /** k·a */
  scale: (a, k) => a.map((v) => v * k),
  /** 내적 a·b */
  dot: (a, b) => a.reduce((s, v, i) => s + v * b[i], 0),
  /** 유클리드 노름 |a| — `vec.norm([3,4]) === 5` */
  norm: (a) => Math.sqrt(vec.dot(a, a)),
  /** 단위벡터 (영벡터면 예외) */
  unit: (a) => {
    const n = vec.norm(a);
    if (n < 1e-12) throw new Error('unit: 영벡터는 단위벡터가 없습니다.');
    return a.map((v) => v / n);
  },
  /** a 를 b 에 정사영 — (a·b/|b|²)·b */
  project: (a, b) => vec.scale(b, vec.dot(a, b) / vec.dot(b, b)),
  /** 정사영의 수직 성분 — a − proj_b a */
  reject: (a, b) => vec.sub(a, vec.project(a, b)),
  /** a 와 b 사이의 각(도) */
  angleDeg: (a, b) =>
    (Math.acos(Math.max(-1, Math.min(1, vec.dot(a, b) / (vec.norm(a) * vec.norm(b))))) * 180) / Math.PI,
  /** 3D 외적 (2D 입력은 z=0 으로 승격) */
  cross: (a, b) => {
    const [ax, ay, az = 0] = a,
      [bx, by, bz = 0] = b;
    return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
  },
  /** 두 벡터가 만드는 평행사변형의 (부호 있는) 넓이 = 행렬식 */
  det2: (a, b) => a[0] * b[1] - a[1] * b[0],
  /** |a × b| = |a||b| sin θ — 평행사변형 넓이 */
  areaOf: (a, b) => vec.norm(vec.cross(a, b)),
  /** 두 점 사이 거리 */
  dist: (a, b) => vec.norm(vec.sub(a, b)),
  /** 성분별 반올림 (라벨/디버그용) */
  round: (a, d = 2) => a.map((v) => Number(v.toFixed(d))),
};

export default { mat, vec, Matrix };
