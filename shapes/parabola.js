// SENARIOS C2 — 포물선 (parabola = 초점 F 와 준선 d 로 정의)
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';
import { curve } from './curve.js';

/** 초점 F, 준선(수평선) d 로 정의된 포물선 — 수직축 (위로/아래로 열림) */
export class Parabola extends Drawable {
  constructor(conf = {}) {
    super('parabola', { ...conf });
  }
  label(l, o) {
    return this.set({ label: l, labelOff: o });
  }
  // 초점/준선에서 꼭짓점·p(초점~꼭짓점 거리) 도출
  params() {
    const F = this._conf.focus.coords;
    const { p: dP, d: dD } = this._conf.directrix.pointDir();
    // 준선 y = dP[1] (수평)
    const yDir = dP[1];
    const p = (F[1] - yDir) / 2; // +면 위로 열림
    const vx = F[0],
      vy = (F[1] + yDir) / 2; // 꼭짓점
    return { p, vx, vy, a: 1 / (4 * Math.abs(p) || 1), dir: Math.sign(p) };
  }
  toIR(ctx) {
    const c = this._conf;
    const { p, vx, vy, a, dir } = this.params();
    // y = dir * a * (x-vx)^2 + vy  (단위길이로)
    const w = ctx.world;
    const xr = Math.max(Math.abs(w.xmin - vx), Math.abs(w.xmax - vx));
    const h = Math.max(2, xr);
    const yAt = (x) => vy + (dir * (x - vx) * (x - vx)) / (4 * p);
    const n = c.n || 160;
    const ops = [];
    let start = false;
    for (let i = 0; i <= n; i++) {
      const x = vx - h + (2 * h * i) / n;
      const y = yAt(x);
      if (!Number.isFinite(y)) {
        start = false;
        continue;
      }
      ops.push({ op: start ? 'L' : 'M', x, y });
      start = true;
    }
    const out = [
      node('path', { ops, color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity, style: pickStyleP(c) }),
    ];
    if (c.label) {
      const xl = vx + h * 0.7,
        yl = yAt(xl);
      out.push(
        node('text', {
          x: xl,
          y: yl - 0.3,
          text: String(c.label.toLatex ? c.label.toLatex() : c.label),
          anchor: 'start',
          math: !!c.label.toLatex,
          color: c.color,
        }),
      );
    }
    return out;
  }
}
function pickStyleP(c) {
  const s = {};
  for (const k of ['color', 'stroke', 'dash', 'opacity']) if (c[k] !== undefined) s[k] = c[k];
  return s;
}

export const parabola = {
  focus(F) {
    return new ParabolaBuilder(F);
  },
  standard(p) {
    // vertex (0,0), opens up by p
    const vert = { coords: [0, -p] };
    return new Parabola({ focus: vert, directrix: { pointDir: () => ({ p: [0, p], d: [1, 0] }) } });
  },
};
class ParabolaBuilder {
  constructor(F) {
    this._F = F;
  }
  directrix(d) {
    return new Parabola({ focus: this._F, directrix: d });
  }
}

export default parabola;
