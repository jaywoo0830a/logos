export function pickStyle(c: any): {};
export class Ellipse extends Drawable {
    constructor(conf?: {});
    get center(): any;
    get semi(): any;
    /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
    label(l: string, off?: any): this;
    /** auto-framing 경계 (P1-2) — 회전은 무시한 근사. */
    bounds(): {
        xmin: number;
        xmax: any;
        ymin: number;
        ymax: any;
    };
    toIR(ctx: any): Readonly<any>[];
}
export namespace ellipse {
    function center(O: any): CenterStep;
    /** `ellipse.foci(F1, F2, 2a)` 또는 `ellipse.foci(F1, F2).major(2a)` */
    function foci(F1: any, F2: any, sum: any): Ellipse | FociStep;
    /** `ellipse.directrix(l).eccentricity(e)` — 초점(기본 원점)까지 거리와 이심률로 정의 */
    function directrix(l: any): DirectrixStep;
}
export default ellipse;
import { Drawable } from '../core/drawable.js';
declare class CenterStep {
    constructor(O: any);
    _O: any;
    semi(aOrP: any, b: any): Ellipse;
    /** 장반지름 a → `.eccentricity(e)` 또는 `.semiMinor(b)` */
    semiMajor(a: any): MajorStep;
}
declare class FociStep {
    constructor(F1: any, F2: any);
    _F1: any;
    _F2: any;
    major(sum: any): Ellipse;
}
declare class DirectrixStep {
    constructor(l: any);
    _l: any;
    _F: import("./point.js").Point;
    focus(F: any): DirectrixFocusStep;
    eccentricity(e: any): Ellipse;
}
declare class MajorStep {
    constructor(O: any, a: any);
    _O: any;
    _a: any;
    eccentricity(e: any): Ellipse;
    semiMinor(b: any): Ellipse;
}
declare class DirectrixFocusStep {
    constructor(l: any, F: any);
    _l: any;
    _F: any;
    eccentricity(e: any): Ellipse;
}
