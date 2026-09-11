// logos 렌더 갤러리 정적 서버 — output/ 디렉토리를 HTTP 로 서빙한다.
// 실행: node server.js  (포트 기본 18080, 환경변수 PORT 로 변경 가능)
// 접속: http://localhost:18080/  → 대표 예제의 렌더 갤러리(index.html)
//   `npm run examples` 가 output/parity9b|parity9c/index.html 을 만든 뒤 열면 된다.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 18080);
const HOST = process.env.HOST || '0.0.0.0'; // 컨테이너 외부 접속 허용
const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'output');
// `/` 로 들어왔을 때 차례로 시도할 갤러리(대표 예제 → 3D, 그 다음 2D).
const GALLERIES = ['index.html', 'parity9c/index.html', 'parity9b/index.html'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.tex': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    // 루트 → 갤러리 index.html (대표 예제 디렉토리까지 차례로 시도)
    const rel = urlPath === '/' ? GALLERIES[0] : urlPath.replace(/^\/+/, '');
    const candidates = urlPath === '/' ? GALLERIES : [rel];
    // 경로 이스케이프 방지
    const safe = candidates.map((c) => normalize(c).replace(/^(\.\.[/\\])+/, ''));
    const files = safe.map((c) => join(ROOT, c)).filter((f) => f.startsWith(ROOT));
    let file = null, data = null, lastErr = null;
    for (const f of files) {
      try { data = await readFile(f); file = f; break; }
      catch (e) { lastErr = e; }
    }
    if (!data) throw lastErr || new Error('not found');
    const ext = extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  } catch (e) {
    if (e.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — 파일 없음: ' + req.url);
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 — ' + e.message);
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`logos 갤러리 서버: http://${HOST}:${PORT}/`);
  console.log(`  output/ 디렉토리를 서빙합니다 (${ROOT})`);
});