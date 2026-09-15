export class Rectangle extends Drawable {
    constructor(conf?: {});
    label(l: any, o: any): this;
    bounds(): {
        xmin: number;
        xmax: number;
        ymin: number;
        ymax: number;
    };
    toIR(): Readonly<any>[];
}
export namespace rectangle {
    function on(xRange: any, yRange: any): Rectangle;
}
export default rectangle;
import { Drawable } from '../core/drawable.js';
