// complex.js — 복소수 수치 도우미
//
// "복소수" 그림(복소평면 · 극형식 · 켤레 · 곱 = 회전+확대 · 드무아브르 · 1의 n제곱근 ·
// 1/z 반전 …)을 그리려면 |z|, arg z, z̄, z₁z₂, 1/z, zⁿ, n제곱근 같은 **수치** 계산이
// 매번 필요하다. 이 모듈은 그 계산만 담당한다(그리기는 Scene/Drawable, `linalg.js` 와 같은 성격).
//
// 값 규약
//   · 복소수 = `Complex` 객체 (`[x, y]` 배열·실수도 입력으로 허용)
//   · z = a+bi ↔ 점 (a, b) — 복소평면의 좌표 (내적·회전은 `linalg.vec`·`mat` 과 그대로 호환)
//   · 각도는 **도(degree)** — `transform.rotate`·`linalg.vec.angleDeg` 와 같은 단위
//
// 사용
//   import { cplx } from 'logos';
//   const z = cplx(3, 2);                 // 3+2i
//   z.abs;                                // → 3.6055…   (|z|)
//   z.argDeg;                             // → 33.69…    (arg z)
//   cplx.mul(cplx.polar(2, 60), z);       // 곱 = (r 곱)·(θ 합)
//   cplx.unity(6, 1.5);                   // 반지름 1.5 인 1의 6제곱근 (정육각형 꼭짓점)
//   cplx.matrix(z).rows;                  // → [[3, -2], [2, 3]]  ← a+bi ↔ 회전·확대 행렬
import { mat } from './linalg.js';

const EPS = 1e-12;

/** 복소수 — 실수부 `re`, 허수부 `im` */
export class Complex {
  /**
   * @param {number} re 실수부
   * @param {number} im 허수부
   */
  constructor(re = 0, im = 0) {
    if (typeof re !== 'number' || typeof im !== 'number' || !Number.isFinite(re) || !Number.isFinite(im)) {
      throw new Error(`cplx(re, im): 유한한 실수 두 개가 필요합니다. (받은 값: ${re}, ${im})`);
    }
    this.re = re;
    this.im = im;
  }

  /** 극형식 (r, θ)으로 생성 — θ 는 도 */
  static polar(r, deg) {
    if (typeof r !== 'number' || typeof deg !== 'number') {
      throw new Error('cplx.polar(r, deg): 실수 두 개가 필요합니다.');
    }
    const t = (deg * Math.PI) / 180;
    return new Complex(r * Math.cos(t), r * Math.sin(t));
  }

  /** `[x, y]` (=복소평면의 점) */
  toArray() { return [this.re, this.im]; }
  /** |z| = √(a² + b²) */
  get abs() { return Math.hypot(this.re, this.im); }
  /** arg z — 라디안 (−π, π] */
  get arg() { return Math.atan2(this.im, this.re); }
  /** arg z — 도(degree) */
  get argDeg() { return (this.arg * 180) / Math.PI; }
  /** 켤레 z̄ = a − bi (실축 반사) */
  get conj() { return new Complex(this.re, -this.im); }
  /** 실수인가 (허수부 ≈ 0) */
  get isReal() { return Math.abs(this.im) < EPS; }
  /** 극형식 { r, theta, thetaDeg } */
  toPolar() { return { r: this.abs, theta: this.arg, thetaDeg: this.argDeg }; }

  /** z₁ + z₂ (벡터 덧셈과 동일) */
  add(z) { const w = of(z); return new Complex(this.re + w.re, this.im + w.im); }
  /** z₁ − z₂ */
  sub(z) { const w = of(z); return new Complex(this.re - w.re, this.im - w.im); }
  /** z₁ · z₂ — |z₁z₂| = |z₁||z₂|, arg(z₁z₂) = arg z₁ + arg z₂ */
  mul(z) {
    const w = of(z);
    return new Complex(this.re * w.re - this.im * w.im, this.re * w.im + this.im * w.re);
  }
  /** z₁ / z₂ = z₁z̄₂ / |z₂|² (0 으로 나누면 예외) */
  div(z) {
    const w = of(z);
    const d = w.re * w.re + w.im * w.im;
    if (d < EPS * EPS) throw new Error('cplx.div: 0 으로 나눌 수 없습니다.');
    return new Complex((this.re * w.re + this.im * w.im) / d, (this.im * w.re - this.re * w.im) / d);
  }
  /** k·z (실수배) */
  scale(k) { return new Complex(this.re * k, this.im * k); }
  /** −z (원점 대칭 = 180° 회전) */
  neg() { return new Complex(-this.re, -this.im); }
  /** zⁿ — 음수 지수도 허용 (z=0 과 n≤0 은 예외) */
  pow(n) {
    if (!Number.isInteger(n)) throw new Error('cplx.pow: 정수 지수만 가능합니다.');
    if (this.abs < EPS && n <= 0) throw new Error('cplx.pow: 0 의 0 이하 거듭제곱은 정의되지 않습니다.');
    return Complex.polar(this.abs ** n, this.argDeg * n);
  }
  /** n제곱근 n개 (k = 0 … n−1) — 정n각형 꼭짓점 */
  roots(n) {
    if (!Number.isInteger(n) || n < 1) throw new Error('cplx.roots: 1 이상의 정수가 필요합니다.');
    if (this.abs < EPS) return Array.from({ length: n }, () => new Complex(0, 0));
    const r = this.abs ** (1 / n);
    return Array.from({ length: n }, (_, k) => Complex.polar(r, (this.argDeg + 360 * k) / n));
  }
  /** 거의 같은가 (기본 1e-9) */
  equals(z, eps = 1e-9) {
    const w = of(z);
    return Math.abs(this.re - w.re) < eps && Math.abs(this.im - w.im) < eps;
  }
  /** 사람이 읽는 형태 — `3+2i`, `3-2i`, `-i`, `i`, `2` */
  toString() {
    const f = (x) => (Number.isInteger(x) ? String(x) : String(Number(x.toFixed(2))));
    const { re, im } = this;
    if (Math.abs(im) < EPS) return f(re);
    const unit = Math.abs(Math.abs(im) - 1) < EPS;
    const imStr = `${unit ? '' : f(Math.abs(im))}i`;
    if (Math.abs(re) < EPS) return (im < 0 ? '-' : '') + imStr;
    return `${f(re)} ${im < 0 ? '-' : '+'} ${imStr}`;
  }
}

/** 입력을 `Complex` 로 정규화 — Complex / `[x, y]` / 실수 */
function of(v) {
  if (v instanceof Complex) return v;
  if (typeof v === 'number') return new Complex(v, 0);
  if (Array.isArray(v) && v.length >= 2) return new Complex(v[0], v[1]);
  if (v && typeof v.re === 'number' && typeof v.im === 'number') return new Complex(v.re, v.im);
  throw new Error('cplx: Complex · [x, y] · 실수 중 하나가 필요합니다.');
}

/** 복소수 생성 — `cplx(3, 2)` = 3+2i */
export function cplx(re, im = 0) { return new Complex(re, im); }
/** 극형식 — `cplx.polar(2, 60)` = 2e^{i60°} (θ 는 도) */
cplx.polar = (r, deg) => Complex.polar(r, deg);
/** 입력 정규화 (`[x, y]` → Complex) */
cplx.of = of;
/** a + b */
cplx.add = (a, b) => of(a).add(b);
/** a − b */
cplx.sub = (a, b) => of(a).sub(b);
/** a · b */
cplx.mul = (a, b) => of(a).mul(b);
/** a / b */
cplx.div = (a, b) => of(a).div(b);
/** k·a */
cplx.scale = (a, k) => of(a).scale(k);
/** −a */
cplx.neg = (a) => of(a).neg();
/** 켤레 ā */
cplx.conj = (a) => of(a).conj;
/** |a| */
cplx.abs = (a) => of(a).abs;
/** arg a (라디안) */
cplx.arg = (a) => of(a).arg;
/** arg a (도) */
cplx.argDeg = (a) => of(a).argDeg;
/** 실수인가 */
cplx.isReal = (a) => of(a).isReal;
/** aⁿ */
cplx.pow = (a, n) => of(a).pow(n);
/** a 의 n제곱근 n개 */
cplx.roots = (a, n) => of(a).roots(n);
/** 1의 n제곱근 (반지름 r) — 정n각형 꼭짓점, k=0…n−1 */
cplx.unity = (n, r = 1) => {
  if (!Number.isInteger(n) || n < 1) throw new Error('cplx.unity: 1 이상의 정수가 필요합니다.');
  return Array.from({ length: n }, (_, k) => Complex.polar(r, (360 * k) / n));
};
/** 성분별 반올림 (라벨/디버그용) */
cplx.round = (a, d = 2) => {
  const w = of(a);
  return new Complex(Number(w.re.toFixed(d)), Number(w.im.toFixed(d)));
};
/**
 * a+bi ↔ 회전·확대 행렬 [[a, −b], [b, a]] (12A2 의 `mat` 과 그대로 연결).
 * 곱셈 = 이 행렬의 곱, |z|² = det A, kz = kA.
 */
cplx.matrix = (a) => {
  const w = of(a);
  return mat([[w.re, -w.im], [w.im, w.re]]);
};

export default { cplx, Complex };
