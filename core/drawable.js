// DSL.md §3 「Drawable 프로토콜 (모든 도형 공통)」
// 모든 도형(점·선·주석·영역·벡터장)이 같은 불변 체이닝 메서드를 구현한다.
// 설계 원칙(§13): 「불변이 기본」 — 모든 메서드는 새 노드를 반환한다.
//
// 확장(코어 무수정): 플러그인은 `use(p => p.extend('drawable', {...}))` 로 모든 도형에
// 체이닝 메서드를, `p.chain('drawable', {...})` 로 선언형 메서드를 붙일 수 있다.
import { registerTarget, callPlugin } from './plugin.js';

let ORDER = 0;

// 중첩 설정 키 — 상수(`BOX`, `{ box: … }`) 하나를 여러 그림이 공유할 때
// 한 곳의 변경이 전부를 오염시키지 않도록 set() 에서 깊은 복사한다(A4).
const NESTED_KEYS = ['box', 'marker', 'camera', 'labelOff', 'gradient', 'arc'];
/** plain object/배열만 structuredClone. 클래스 인스턴스·함수는 그대로 둔다(프로토타입 보존). */
function cloneNested(v) {
  if (v == null || typeof v !== 'object') return v;
  try { return structuredClone(v); } catch { return v; }
}

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

  /**
   * 불변 복제 — 모든 프로토콜 메서드의 공통 초석.
   * 중첩 설정(box·gradient·labelOff …)은 깊은 복사해 **상수 공유 오염**을 막는다(A4).
   * @param {Object} changes 바꿀 설정
   * @returns {this} 새 도형(원본 불변)
   */
  set(changes) {
    const c = Object.create(this.constructor.prototype);
    c._kind = this._kind;
    const merged = { ...this._conf, ...changes };
    for (const k of NESTED_KEYS) if (merged[k] && typeof merged[k] === 'object') merged[k] = cloneNested(merged[k]);
    c._conf = merged;
    c._order = ORDER++;
    return c;
  }

  /** `set()` 의 별칭 — "뮤테이션"처럼 들리는 이름 대신 불변 업데이트임을 드러낸다(B4). */
  with(changes) { return this.set(changes); }

  // ── Drawable 프로토콜 ───────────────────────────────
  color(c) { return this.set({ color: c }); }
  stroke(w) { return this.set({ stroke: w }); }
  fill(f) { return this.set({ fill: f }); }
  dash(d) { return this.set({ dash: d }); }
  opacity(o) { return this.set({ opacity: o }); }
  z(z) { return this.set({ z }); }
  label(l, off) { return this.set({ label: l, labelOff: off }); }
  font(f) { return this.set({ font: f }); }        // 텍스트/라벨 크기
  /** 행간(줄 간격 배수) — 여러 줄 텍스트의 'a\nb' 간격. 기본 1.32 (backend/fonts.js TYPE) */
  lineHeight(x) { return this.set({ lineHeight: x }); }
  /** 자간(px) — 기본은 스타일시트 값(0.01em). 예: .letterSpacing(0.5) */
  letterSpacing(px) { return this.set({ letterSpacing: px }); }
  bold(on = true) { return this.set({ bold: on }); }
  as(name) { return this.set({ name }); }
  apply(...ts) { return this.set({ transforms: [...(this._conf.transforms || []), ...ts] }); }
  symbolic(s) { return this.set({ sym: s }); }
  gradient(g) { return this.set({ gradient: g }); }   // I3: { type:'radial'|'linear', stops:[{offset,color}] }
  clip(r) { return this.set({ clip: r }); }           // I5: 클리핑 영역(Region/Drawable)

  get conf() { return this._conf; }
  get order() { return this._order; }
  get kind() { return this._kind; }

  /**
   * 플러그인이 등록한 메서드를 **이름으로** 호출하는 escape hatch.
   * 코어에 없는 기능을 이름만 알아도 쓸 수 있게 한다(`d.plugin('slope', 2)` ≡ `d.slope(2)`).
   * 미등록이면 "어떻게 등록하는지" 안내하는 PluginError 를 던진다.
   */
  plugin(name, ...args) { return callPlugin(this, name, args); }
}

// 플러그인 대상 공개 — `api.extend('drawable', …)` 가 모든 도형(서브클래스 포함)에 붙는다.
registerTarget('drawable', Drawable);