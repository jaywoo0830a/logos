export class VectorField extends Drawable {
    constructor(conf?: {});
    on(region: any): this;
    step(s: any): this;
    len(l: any): this;
    toIR(ctx: any): Readonly<any>[];
}
export function vectorField(item: any): VectorField;
export default vectorField;
import { Drawable } from '../core/drawable.js';
