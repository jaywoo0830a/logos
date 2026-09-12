// sprite.js — 범용 벡터/직렬화 유틸
// (개발 편의: 2D/3D 좌표 연산, JSON 직렬화)

export function vec(...xs) {
  return xs.length === 1 ? [xs[0], xs[0]] : xs;
}
export const Vec = vec;

export function jsub(v, ...path) {
  let cur = v;
  for (const k of path) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

export function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

// JSON 직렬화 (심볼/함수 제외, 재귀)
export function toPlain(o, seen = new WeakSet()) {
  if (o == null) return o;
  const t = typeof o;
  if (t === 'number' || t === 'string' || t === 'boolean') return o;
  if (t === 'function' || t === 'symbol' || t === 'bigint') return undefined;
  if (o instanceof Array) {
    if (seen.has(o)) return '[[CYCLE]]';
    seen.add(o);
    const out = [];
    for (const x of o) out.push(toPlain(x, seen));
    seen.delete(o);
    return out;
  }
  if (o instanceof Map) {
    const out = {};
    for (const [k, val] of o) out[String(k)] = toPlain(val, seen);
    return out;
  }
  if (o instanceof Set) return toPlain([...o], seen);
  if (t === 'object') {
    if (seen.has(o)) return '[[CYCLE]]';
    seen.add(o);
    const out = {};
    for (const k of Object.keys(o)) {
      const val = toPlain(o[k], seen);
      if (val !== undefined) out[k] = val;
    }
    seen.delete(o);
    return out;
  }
  return undefined;
}
