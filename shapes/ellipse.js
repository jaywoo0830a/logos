// SCENARIOS C1 · DSL 원뿔곡선 — 타원 (ellipse.center(O).semi(a, b))
import { Drawable, renderText, isMathText } from '../core/drawable.js';
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

  /** 라벨 달기 — @param {string} l 텍스트 @param {Object} [off] 오프셋(생략 가능) */
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
        angle: c.angle && Math.abs(c.angle) > 1e-12 ? c.angle : undefined, // 회전이 있을 때만 방출(기존 출력 불변)
        color: c.color,
        stroke: c.stroke,
        fill: c.fill,
        dash: c.dash,
        opacity: c.opacity,
        transforms: c.transforms,
        label: renderText(c.label),
        labelMath: isMathText(c.label),
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
  /** `ellipse.foci(F1, F2, 2a)` 또는 `ellipse.foci(F1, F2).major(2a)` */
  foci(F1, F2, sum) {
    if (sum !== undefined) return ellipseFromFoci(F1, F2, sum);
    return new FociStep(F1, F2);
  },
  /** `ellipse.directrix(l).eccentricity(e)` — 초점(기본 원점)까지 거리와 이심률로 정의 */
  directrix(l) {
    return new DirectrixStep(l);
  },
};

/** 두 초점 + 장축 길이(2a) 로 정의 */
function ellipseFromFoci(F1, F2, sum) {
  const [x1, y1] = F1.coords,
    [x2, y2] = F2.coords;
  const cx = (x1 + x2) / 2,
    cy = (y1 + y2) / 2;
  const c = Math.hypot(x2 - x1, y2 - y1) / 2; // 중심~초점
  const a = sum / 2;
  const b = Math.sqrt(Math.max(0, a * a - c * c));
  const angle = Math.atan2(y2 - y1, x2 - x1); // 장축 방향
  return new Ellipse({ center: point(cx, cy), semi: [a, b], angle });
}

/**
 * 초점 F(기본 원점) + 준선 l + 이심률 e (0<e<1).
 *   초점~준선 거리 d = a/e − ae  ⇒  a = d·e/(1−e²), c = a·e, b = a√(1−e²).
 *   장축은 준선의 법선 방향이다.
 */
function ellipseFromDirectrix(l, F, e) {
  const { p: P0, d } = l.pointDir();
  const L = Math.hypot(d[0], d[1]) || 1;
  const n = [-d[1] / L, d[0] / L]; // 준선의 단위 법선
  const fd = (P0[0] - F.coords[0]) * n[0] + (P0[1] - F.coords[1]) * n[1]; // 초점 → 준선 부호거리
  // 초점에서 **준선 쪽**으로 향하는 단위벡터
  const toward = [Math.sign(fd || 1) * n[0], Math.sign(fd || 1) * n[1]];
  const dist = Math.abs(fd) || 1e-9; // 초점~준선 거리 = a/e − ae
  const a = (dist * e) / (1 - e * e);
  const c = a * e;
  const b = a * Math.sqrt(Math.max(0, 1 - e * e));
  // 중심은 초점에서 **준선 반대쪽**으로 c 만큼 (준선은 중심에서 a/e 떨어져 있다)
  const center = point(F.coords[0] - toward[0] * c, F.coords[1] - toward[1] * c);
  const angle = Math.atan2(toward[1], toward[0]);
  return new Ellipse({ center, semi: [a, b], angle });
}

class FociStep {
  constructor(F1, F2) {
    this._F1 = F1;
    this._F2 = F2;
  }
  major(sum) {
    return ellipseFromFoci(this._F1, this._F2, sum);
  }
}

class DirectrixStep {
  constructor(l) {
    this._l = l;
    this._F = point(0, 0);
  }
  focus(F) {
    return new DirectrixFocusStep(this._l, F);
  }
  eccentricity(e) {
    return ellipseFromDirectrix(this._l, this._F, e);
  }
}

class DirectrixFocusStep {
  constructor(l, F) {
    this._l = l;
    this._F = F;
  }
  eccentricity(e) {
    return ellipseFromDirectrix(this._l, this._F, e);
  }
}

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
  /** 장반지름 a → `.eccentricity(e)` 또는 `.semiMinor(b)` */
  semiMajor(a) {
    return new MajorStep(this._O, a);
  }
}

class MajorStep {
  constructor(O, a) {
    this._O = O;
    this._a = a;
  }
  eccentricity(e) {
    const a = this._a;
    return new Ellipse({ center: this._O, semi: [a, a * Math.sqrt(Math.max(0, 1 - e * e))] });
  }
  semiMinor(b) {
    return new Ellipse({ center: this._O, semi: [this._a, b] });
  }
}

import { point } from './point.js';
export default ellipse;
