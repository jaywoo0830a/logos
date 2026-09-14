// SCENARIOS C2 — 포물선 (parabola = 초점 F 와 준선 d 로 정의)
import { Drawable } from '../core/drawable.js';
import { node } from '../core/node.js';
import { curve } from './curve.js';
import { point } from './point.js';
import { line } from './line.js';

/** 초점 F, 준선(수평선) d 로 정의된 포물선 — 수직축 (위로/아래로 열림) */
export class Parabola extends Drawable {
  constructor(conf = {}) {
    super('parabola', { ...conf });
  }
  label(l, o) {
    return this.set({ label: l, labelOff: o });
  }
  // 초점/준선에서 꼭짓점·p(초점~꼭짓점 거리) 도출
  //   준선이 수평이면 축은 수직(y=…), 준선이 수직이면 축은 수평(x=…) — 둘 다 지원한다.
  params() {
    const F = this._conf.focus.coords;
    const { p: dP, d: dD } = this._conf.directrix.pointDir();
    if (Math.abs(dD[0]) >= Math.abs(dD[1])) {
      const yDir = dP[1]; // 준선 y = dP[1]
      const p = (F[1] - yDir) / 2; // +면 위로 열림
      return { horizontal: true, p, vx: F[0], vy: (F[1] + yDir) / 2 };
    }
    const xDir = dP[0]; // 준선 x = dP[0]
    const p = (F[0] - xDir) / 2; // +면 오른쪽으로 열림
    return { horizontal: false, p, vx: (F[0] + xDir) / 2, vy: F[1] };
  }
  toIR(ctx) {
    const c = this._conf;
    const { horizontal, p, vx, vy } = this.params();
    const w = ctx.world;
    const n = c.n || 160;
    const ops = [];
    let start = false;
    const push = (x, y) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        start = false;
        return;
      }
      ops.push({ op: start ? 'L' : 'M', x, y });
      start = true;
    };
    if (horizontal) {
      // y = vy + (x-vx)² / (4p)
      const h = Math.max(2, Math.max(Math.abs(w.xmin - vx), Math.abs(w.xmax - vx)));
      for (let i = 0; i <= n; i++) {
        const x = vx - h + (2 * h * i) / n;
        push(x, vy + ((x - vx) * (x - vx)) / (4 * p));
      }
    } else {
      // x = vx + (y-vy)² / (4p)
      const h = Math.max(2, Math.max(Math.abs(w.ymin - vy), Math.abs(w.ymax - vy)));
      for (let i = 0; i <= n; i++) {
        const y = vy - h + (2 * h * i) / n;
        push(vx + ((y - vy) * (y - vy)) / (4 * p), y);
      }
    }
    const out = [
      node('path', { ops, color: c.color, stroke: c.stroke, dash: c.dash, opacity: c.opacity, style: pickStyleP(c) }),
    ];
    if (c.label) {
      const last = ops[ops.length - 1];
      const prev = ops[Math.max(0, ops.length - 2)];
      out.push(
        node('text', {
          x: last ? last.x : 0,
          y: (last ? last.y : 0) - 0.3,
          dxPx: prev ? Math.sign(last.x - prev.x) * 6 : 6,
          dyPx: -8,
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
  /** 꼭짓점과 초점으로 정의 (축은 두 점을 잇는 방향) */
  vertex(V) {
    return new VertexStep(V);
  },
  /** y = a x² + b x + c (또는 x = a y² + b y + c) */
  polynomial(a, b, c = 0, opts = {}) {
    const alongX = !!opts.alongX;
    // 축 방향의 꼭짓점 좌표: t = -b/(2a)
    const t = Math.abs(a) < 1e-12 ? 0 : -b / (2 * a);
    const apex = c - (b * b) / (4 * a);
    const p = 1 / (4 * a); // 초점까지 거리(부호 있음)
    if (alongX) {
      // x = a y² + b y + c → 꼭짓점 (apex, t), 준선 x = apex - p
      return new Parabola({ focus: point(apex + p, t), directrix: line.vertical(apex - p) });
    }
    // y = a x² + b x + c → 꼭짓점 (t, apex), 준선 y = apex - p
    return new Parabola({ focus: point(t, apex + p), directrix: line.horizontal(apex - p) });
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

/** 꼭짓점 + 초점 → 준선은 초점의 거울상 (축은 두 점을 잇는 방향) */
class VertexStep {
  constructor(V) {
    this._V = V;
  }
  focus(F) {
    const [vx, vy] = this._V.coords;
    const [fx, fy] = F.coords;
    // 축 판정: 초점이 꼭짓점의 어느 축으로 치우쳤는가
    if (Math.abs(fx - vx) <= Math.abs(fy - vy)) {
      return new Parabola({ focus: F, directrix: line.horizontal(2 * vy - fy) });
    }
    return new Parabola({ focus: F, directrix: line.vertical(2 * vx - fx) });
  }
}

export default parabola;
