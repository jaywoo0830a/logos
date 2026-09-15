export class Scene {
    [x: number]: () => string;
    constructor(conf?: {});
    _conf: {
        dim: number;
        equal: boolean;
        axes: any;
        grid: any;
        polarGrid: boolean;
        sphericalGrid: boolean;
        theme: string;
        camera: {
            position: number[];
            target: number[];
            up: number[];
        };
        lights: any[];
        size: number[];
        dpi: number;
        view: any;
        shapes: any[];
        asserts: any[];
    };
    /**
     * 불변 복제 — 바뀐 설정만 덮어쓴 새 Scene 을 돌려준다(B6: 체이닝 자동완성용 `@returns`).
     * @param {Object} changes
     * @returns {this}
     */
    set(changes: any): this;
    dim(d: any): this;
    auto(): this;
    view(...ranges: any[]): this;
    equal(): this;
    axes(cfg?: boolean): this;
    grid(cfg?: boolean): this;
    /** 플롯 테두리(spines). 예: .spines({ top: false, right: false }) */
    spines(cfg?: boolean): this;
    polarGrid(cfg?: boolean): this;
    sphericalGrid(cfg?: boolean): this;
    size(w: any, h: any): this;
    dpi(d: any): this;
    theme(t: any): this;
    title(t: any): this;
    xlabel(t: any): this;
    ylabel(t: any): this;
    legend(v?: boolean): this;
    /** 라벨 자동 배치(텍스트 충돌 회피). */
    layout(mode?: string): this;
    camera(c: any): this;
    orbit(o: any): this;
    light(l: any): this;
    add(...shapes: any[]): this;
    addAll(shapes: any): this;
    assert(...rules: any[]): this;
    compile(): SceneIR;
}
export default Scene;
export { SceneIR };
import { SceneIR } from '../backend/scene-ir.js';
