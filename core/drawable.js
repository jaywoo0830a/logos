// DSL.md §3 「Drawable 프로토콜 (모든 도형 공통)」
// 모든 도형(점·선·주석·영역·벡터장)이 같은 불변 체이닝 메서드를 구현한다.
// 설계 원칙(§13): 「불변이 기본」 — 모든 메서드는 새 노드를 반환한다.

let ORDER = 0;

/**
 * Label 값(문자열 또는 Sym)을 화면에 그릴 문자열로 변환.
 * @param {*} v
 * @returns {string|null}
 */
export function renderText(v) {
  if (v == null) return null;
  if (typeof v === 'object' && typeof v.toLatex === 'function') return v.toLatex();
  return String(v);
}

export class Drawable {
  /**
   * @param {string} kind  IR 종류
   * @param {Object} conf  도형별 초기 설정
   */
  constructor(kind, conf = {}) {
    this._kind = kind;
    this._conf = { ...conf };
    this._order = ORDER++;
  }

  /** 불변 복제 — 모든 프로토콜 메서드의 공통 초석 */
  set(changes) {
    const c = Object.create(this.constructor.prototype);
    c._kind = this._kind;
    c._conf = { ...this._conf, ...changes };
    c._order = ORDER++;
    return c;
  }

  // ── Drawable 프로토콜 ───────────────────────────────
  color(c) { return this.set({ color: c }); }
  stroke(w) { return this.set({ stroke: w }); }
  fill(f) { return this.set({ fill: f }); }
  dash(d) { return this.set({ dash: d }); }
  opacity(o) { return this.set({ opacity: o }); }
  z(z) { return this.set({ z }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }
  as(name) { return this.set({ name }); }
  apply(...ts) { return this.set({ transforms: [...(this._conf.transforms || []), ...ts] }); }
  symbolic(s) { return this.set({ sym: s }); }

  get conf() { return this._conf; }
  get order() { return this._order; }
  get kind() { return this._kind; }
}