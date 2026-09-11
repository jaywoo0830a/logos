// 0911-PLAN §7 — 3D hidden-line removal.
// occluder(면) 노드들의 화면 깊이 버퍼를 만들고, hiddenTest 표시된 선(path)에서
// 가려진 부분(깊이가 버퍼보다 뒤 = 큰)을 잘라낸다.
// 노드 면(pt)은 world(=투영 평면) 좌표이며 map 으로 화면 변환한다.

const EPS = 1e-6;

function rasterTri(buf, W, H, a, b, c) {
  const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
  const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
  if (minX > maxX || minY > maxY) return;
  const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(d) < EPS) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const w0 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / d;
      const w1 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / d;
      const w2 = 1 - w0 - w1;
      if (w0 < -0.001 || w1 < -0.001 || w2 < -0.001) continue;
      const z = w0 * a[2] + w1 * b[2] + w2 * c[2];
      const idx = y * W + x;
      if (z < buf[idx]) buf[idx] = z;   // 가장 가까운(작은 depth) 면 유지
    }
  }
}

function depthAt(buf, W, H, x, y) {
  const xi = Math.round(x), yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return Infinity;
  return buf[yi * W + xi];
}

/** path 노드에서 가려진 구간을 제거해 여러 개의 path 노드로 반환.
 *  가시성 전환점(시작/끝)만 방출해 op 폭증을 막는다. */
function clipPath(n, buf, W, H, map) {
  const d = n.data;
  const out = [];
  let run = null;
  const fin = (p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.depth);
  const vis = (x, y, depth) => depth <= depthAt(buf, W, H, x, y) + 0.5 + Math.abs(depth) * 1e-3;
  const flush = () => { if (run && run.length >= 2) out.push({ ...n, data: { ...d, ops: run } }); run = null; };
  for (let i = 0; i < d.ops.length; i++) {
    const p = d.ops[i];
    if (p.op === 'M') {
      flush();
      if (fin(p)) { const [sx, sy] = map(p.x, p.y); if (vis(sx, sy, p.depth)) run = [{ op: 'M', x: p.x, y: p.y }]; }
      continue;
    }
    const q = d.ops[i - 1];
    if (!fin(p) || !fin(q)) { flush(); continue; }
    const [x0, y0] = map(q.x, q.y);
    const [x1, y1] = map(p.x, p.y);
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 1.5));
    let prevVis = vis(x0, y0, q.depth);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const sx = x0 + (x1 - x0) * t, sy = y0 + (y1 - y0) * t;
      const dep = q.depth + (p.depth - q.depth) * t;
      const v = vis(sx, sy, dep);
      const wx = q.x + (p.x - q.x) * t, wy = q.y + (p.y - q.y) * t;
      if (v) {
        if (!run) run = [{ op: 'M', x: wx, y: wy }];      // 가시 시작
        else if (s === steps) run.push({ op: 'L', x: wx, y: wy });  // 끝점까지 연장
      } else if (run) {
        flush();                                            // 가시 끝
      }
      prevVis = v;
    }
  }
  flush();
  return out;
}

/**
 * @param {Array} nodes IR
 * @param {Function} map world→screen
 * @param {number} W @param {number} H
 * @returns {Array} hidden-line 적용 노드
 */
export function applyHiddenLines(nodes, map, W, H) {
  const occ = nodes.filter((n) => n.data && n.data.occluder && Array.isArray(n.data.depths));
  if (!occ.length) return nodes;
  const buf = new Float32Array(W * H).fill(Infinity);
  for (const n of occ) {
    const { pts, depths } = n.data;
    const s = pts.map((p, i) => { const [sx, sy] = map(p[0], p[1]); return [sx, sy, depths[i] ?? 0]; });
    for (let k = 1; k + 1 < s.length; k++) rasterTri(buf, W, H, s[0], s[k], s[k + 1]);
  }
  const out = [];
  for (const n of nodes) {
    if (!(n.data && n.data.hiddenTest)) { out.push(n); continue; }
    out.push(...clipPath(n, buf, W, H, map));
  }
  return out;
}

export default applyHiddenLines;
