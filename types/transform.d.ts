/** style.transforms 를 좌표에 적용 */
export function applyTransforms(transforms: any, [x, y, z]: [any, any, any]): any[];
export function rotate(a: any): {
    apply: any;
    meta: {};
} & {
    about(pt: any): {
        apply: any;
        meta: {};
    };
    aroundAxis(axis: any): {
        apply: any;
        meta: {};
    };
};
export function translate(dx: any, dy: any, dz: any): {
    apply: any;
    meta: {};
};
export function scale(sx: any, sy: any): {
    apply: any;
    meta: {};
};
export namespace transform {
    function rotate(a: any): {
        apply: any;
        meta: {};
    } & {
        about(pt: any): {
            apply: any;
            meta: {};
        };
        aroundAxis(axis: any): {
            apply: any;
            meta: {};
        };
    };
    function scale(sx: any, sy: any, sz: any): {
        apply: any;
        meta: {};
    };
    function translate(dx: any, dy: any, dz: any): {
        apply: any;
        meta: {};
    };
    namespace reflect {
        function over(l: any): {
            apply: any;
            meta: {};
        };
    }
    function shear(k: any): {
        apply: any;
        meta: {};
    };
    function homothety(center: any, k: any): {
        apply: any;
        meta: {};
    };
    /**
     * 임의의 **행렬(선형변환)** — `transform.matrix([[2,1],[0.5,1.5]])` (또는 `transform.matrix(mat(A))`).
     * 도형에 `.apply(transform.matrix(A))` 로 붙이면 좌표가 `A·x` 로 매핑된다.
     * (2×2 · 3×3 · 2×3 등 n×m 모두 가능 — 점 차원과 맞아야 한다)
     * @param {number[][]|Matrix} M 행의 배열 또는 `mat()` 이 만든 행렬
     */
    function matrix(M: number[][] | Matrix): {
        apply: any;
        meta: {};
    };
    function compose(...ts: any[]): {
        apply: any;
        meta: {};
    };
}
export default transform;
import { Matrix } from './linalg.js';
