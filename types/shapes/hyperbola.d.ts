export class Hyperbola extends Drawable {
    constructor(conf?: {});
    get center(): any;
    label(l: any, o: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export namespace hyperbola {
    function center(O: any): {
        semi: (a: any, b: any) => Hyperbola;
    };
    /** `hyperbola.foci(F1, F2).distance(2a)` — 두 초점과 실축 길이(2a)로 정의 */
    function foci(F1: any, F2: any): FociStepH;
}
export default hyperbola;
import { Drawable } from '../core/drawable.js';
declare class FociStepH {
    constructor(F1: any, F2: any);
    _F1: any;
    _F2: any;
    /** 2a (실축 길이). b = √(c² − a²). */
    distance(sum: any): Hyperbola;
    /** 초점 간 거리(2c) 만 주고 a 는 `.semi(a)` 로 — 보조 경로 */
    focalDistance(d2: any): FociStepH;
}
