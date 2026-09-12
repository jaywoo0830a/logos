// SENARIOS C1 · DSL 원뿔곡선 — 타원 (ellipse.center(O).semi(a, b))
import { Drawable, renderText } from '../core/drawable.js';
import { node } from '../core/node.js';

export class Ellipse extends Drawable {
  constructor(conf = {}) {
    super('ellipse', { ...conf });
  }
  get center() {
    return this._conf.center;
  }
  get semi() {
    return this._conf.semi;
  }

  label(l, off) {
    return this.set({ label: l, labelOff: off });
  }
  /** auto-framing 경계 (P1-2) — 회전은 무시한 근사. */
  bounds() {
    const c = this._conf;
    const [cx, cy] = c.center.coords;
    const [rx, ry] = c.semi;
    return { xmin: cx - rx, xmax: cx + rx, ymin: cy - ry, ymax: cy + ry };
  }

  toIR(ctx) {
    const c = this._conf;
    const [cx, cy] = c.center.coords;
    return [
      node('ellipse', {
        cx,
        cy,
        rx: c.semi[0],
        ry: c.semi[1],
        color: c.color,
        stroke: c.stroke,
        fill: c.fill,
        dash: c.dash,
        opacity: c.opacity,
        transforms: c.transforms,
        label: renderText(c.label),
        style: pickStyle(c),
      }),
    ];
  }
}

export function pickStyle(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'fill', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

// ── ellipse 네임스페이스 ───────────────────────────
export const ellipse = {
  center(O) {
    return new CenterStep(O);
  },
  foci(F1, F2, sum) {
    // 두 초점과 장축합(2a)으로 정의
    const [x1, y1] = F1.coords,
      [x2, y2] = F2.coords;
    const cx = (x1 + x2) / 2,
      cy = (y1 + y2) / 2;
    const c = Math.hypot(x2 - x1, y2 - y1) / 2; // 중심~초점
    const a = sum / 2;
    const b = Math.sqrt(Math.max(0, a * a - c * c));
    // 초점 축 방향 -> 회전각
    const angle = Math.atan2(y2 - y1, x2 - x1);
    return new Ellipse({ center: point(cx, cy), semi: [a, b], angle });
  },
};

class CenterStep {
  constructor(O) {
    this._O = O;
  }
  semi(aOrP, b) {
    if (b === undefined && aOrP.coords) {
      // 지름 끝점 주어짐
      const p = aOrP.coords;
      return new Ellipse({
        center: this._O,
        semi: [Math.abs(p[0] - this._O.coords[0]), Math.abs(p[1] - this._O.coords[1])],
      });
    }
    return new Ellipse({ center: this._O, semi: [aOrP, b] });
  }
}

import { point } from './point.js';
export default ellipse;
