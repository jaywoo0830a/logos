/**
 * `xy\`3, 4\`` → `point(3, 4)` (좌표 2개 또는 3개).
 * @example xy`3, 4`  ·  xy`1 2`  ·  xy`1, 2, 3`
 */
export function xy(strings: any, ...vals: any[]): import("../shapes/point.js").Point;
/**
 * `range\`0..10 step 2\`` → `[0, 2, 4, 6, 8, 10]` (역순도 허용, step 기본 1).
 * @example range`0..10 step 2`  ·  range`3..-3`
 */
export function range(strings: any, ...vals: any[]): number[];
/**
 * `view\`x∈[-3, 3]  y∈[-1, 4]\`` → `[[-3, 3], [-1, 4]]` (축 이름 `∈`/`=`/공백 모두 허용).
 * @example view`x∈[-3, 3]  y∈[-1, 4]`  ·  view`[-3,3] [-1,4]`
 */
export function view(strings: any, ...vals: any[]): number[][];
declare namespace _default {
    export { xy };
    export { range };
    export { view };
}
export default _default;
