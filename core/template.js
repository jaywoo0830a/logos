// B3 — 교재 문맥을 코드에 그대로: 태그드 템플릿 `xy` · `range` · `view`
//   (FEEDBACK §B3). **파서를 만들지 않는다** — 허용 문법을 극단적으로 좁게 유지하고,
//   실패하면 쓸 수 있는 형식을 그대로 보여준다. 렌더링 규칙은 갖지 않는다(기존 API 위의 얇은 별칭).
//
//   xy`3, 4`                      → point(3, 4)
//   range`0..10 step 2`           → [0, 2, 4, 6, 8, 10]
//   view`x∈[-3, 3]  y∈[-1, 4]`    → [[-3, 3], [-1, 4]]
import { point } from '../shapes/point.js';

/** 템플릿 조각 + 보간값을 평문 문자열로 되돌린다. */
const raw = (strings, vals) => String.raw({ raw: strings }, ...vals);

/** 허용 형식이 아니면 무엇을 쓸 수 있는지 보여주며 실패한다. */
function fail(tag, s, example) {
  throw new Error(`${tag}\`${s}\`: 형식을 읽지 못했습니다. 허용 예: ${example}`);
}

const NUM = '[-+]?\\d*\\.?\\d+(?:[eE][-+]?\\d+)?';

/**
 * `xy\`3, 4\`` → `point(3, 4)` (좌표 2개 또는 3개).
 * @example xy`3, 4`  ·  xy`1 2`  ·  xy`1, 2, 3`
 */
export function xy(strings, ...vals) {
  const s = raw(strings, vals).trim();
  const nums = s.match(new RegExp(NUM, 'g')) || [];
  if (nums.length < 2 || nums.length > 3) fail('xy', s, 'xy`3, 4` 또는 xy`1, 2, 3`');
  return point(...nums.map(Number));
}

/**
 * `range\`0..10 step 2\`` → `[0, 2, 4, 6, 8, 10]` (역순도 허용, step 기본 1).
 * @example range`0..10 step 2`  ·  range`3..-3`
 */
export function range(strings, ...vals) {
  const s = raw(strings, vals).trim();
  const m = s.match(new RegExp(`^\\s*(${NUM})\\s*\\.\\.\\s*(${NUM})(?:\\s*step\\s*(${NUM}))?\\s*$`, 'i'));
  if (!m) fail('range', s, 'range`0..10 step 2`');
  const a = Number(m[1]),
    b = Number(m[2]);
  const step = m[3] !== undefined ? Math.abs(Number(m[3])) : 1;
  if (!(step > 0) || !Number.isFinite(a) || !Number.isFinite(b)) fail('range', s, 'range`0..10 step 2` (step > 0)');
  const out = [];
  const eps = step * 1e-9;
  if (b >= a) for (let v = a; v <= b + eps; v += step) out.push(Number(v.toFixed(12)));
  else for (let v = a; v >= b - eps; v -= step) out.push(Number(v.toFixed(12)));
  return out;
}

/**
 * `view\`x∈[-3, 3]  y∈[-1, 4]\`` → `[[-3, 3], [-1, 4]]` (축 이름 `∈`/`=`/공백 모두 허용).
 * @example view`x∈[-3, 3]  y∈[-1, 4]`  ·  view`[-3,3] [-1,4]`
 */
export function view(strings, ...vals) {
  const s = raw(strings, vals);
  const re = new RegExp(`[xyzw]?\\s*[∈=]?\\s*\\[\\s*(${NUM})\\s*,\\s*(${NUM})\\s*\\]`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(s))) out.push([Number(m[1]), Number(m[2])]);
  if (!out.length) fail('view', s, 'view`x∈[-3, 3]  y∈[-1, 4]`');
  return out;
}

export default { xy, range, view };
