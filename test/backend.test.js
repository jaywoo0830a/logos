// 0911-PLAN Phase 5-1 — 출력 백엔드(TikZ / Asymptote / JSXGraph / KaTeX / PNG) 정합 검증
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { scene, point, circle, curve, tex, pi, adapt } from '../index.js';
import { resvgFontOptions, STIX_FAMILY } from '../backend/fonts.js';

test('TikZ: standalone 구조와 도형 포함', () => {
  const out = scene()
    .view([-2, 2], [-2, 2])
    .add(circle.center(point(0, 0)).radius(1), curve.fn((x) => x * x).on([-1, 1]))
    .compile()
    .toTikZ({ standalone: true });
  assert.ok(out.includes('\\documentclass[tikz,border=2pt]{standalone}'));
  assert.ok(out.includes('\\begin{tikzpicture}') && out.includes('\\end{document}'));
  assert.ok(out.includes('circle') && out.includes('--'));
});

test('Asymptote: import/draw 골격 생성', () => {
  const asy = scene()
    .equal()
    .add(circle.center(point(0, 0)).radius(1), curve.fn((x) => x * x).on([-1, 1]))
    .compile()
    .toAsymptote();
  assert.equal(typeof asy, 'string');
  assert.ok(asy.length > 0);
});

test('JSXGraph: 인터랙티브 HTML 생성', () => {
  const html = scene()
    .equal()
    .add(circle.center(point(0, 0)).radius(1))
    .compile()
    .toJSXGraphHTML();
  assert.ok(typeof html === 'string' && /board|jsxgraph/i.test(html));
});

test('KaTeX: latexToText 폴백이 기호를 보존', () => {
  const svg = scene()
    .equal()
    .add(circle.center(point(0, 0)).radius(1))
    .compile()
    .toSVG({ math: 'text' });
  assert.ok(!svg.includes('<foreignObject'), 'math:text 모드는 foreignObject 미사용');
});

test('수식 라벨: LaTeX → 텍스트 폴백', async () => {
  const { latexToText } = await import('../backend/katex.js');
  const t = latexToText('\\int_0^1 \\frac{x^2}{2}\\,dx');
  assert.ok(t.includes('∫'), '적분 기호');
  assert.ok(!/[\\{}]/.test(t), '역슬래시/중괄호 제거');
});

test('latexToText: 악센트(\\bar·\\vec)가 결합 문자로 남는다', async () => {
  const { latexToText } = await import('../backend/katex.js');
  // 예전에는 \\bar{z} 의 중괄호만 벗겨져 `z` 가 아니라 빈 `{z}`/NaN 으로 새어 나갔다.
  assert.equal(latexToText('\\bar{z}'), 'z\u0304', '\\bar{z} → z + 결합 macron');
  assert.equal(latexToText('\\overline{z}'), 'z\u0304', '\\overline 도 같다');
  assert.equal(latexToText('\\vec{v}'), 'v\u20d7', '\\vec → 결합 화살표');
  assert.equal(latexToText('\\hat{x}').length, 2, '\\hat{x} → x + 결합 circumflex');
  assert.ok(!/[\\{}]/.test(latexToText('1/\\bar{z} = z/|z|^2')), '악센트 뒤에도 중괄호 없음');
  // 실제 라벨 경로에서도 NaN 이 나오지 않는다.
  const svg = scene()
    .view([-2, 2], [-2, 2])
    .add(
      point(1, 1)
        .dot()
        .label(tex`\\bar{z}`),
    )
    .compile()
    .toSVG({ math: 'text' });
  assert.ok(!/NaN/.test(svg), '래스터 폴백 라벨에 NaN 없음');
});

test('PNG: resvg 있으면 실제 래스터, 없으면 명확한 에러', async () => {
  const fig = scene()
    .view([-0.5, pi + 0.5], [-0.5, 1.5])
    .axes()
    .add(
      curve.fn(Math.sin).on([0, pi]).color('crimson'),
      point(1, Math.sin(1))
        .dot()
        .label(tex`P`),
    )
    .compile();
  try {
    const png = await fig.toPNG({ scale: 1 });
    assert.ok(png && (png.length ?? png.byteLength) > 0, 'PNG 바이트 생성');
  } catch (e) {
    assert.match(String(e.message), /resvg/, '래스터 백엔드 안내');
  }
});

test('PNG: resvg 폰트 옵션에 시스템 폰트 dirs 포함 (CJK 라벨 tofu 방지)', async () => {
  const o = resvgFontOptions();
  assert.ok(o.font, 'font 옵션');
  assert.equal(o.font.defaultFontFamily, STIX_FAMILY, '기본(수식) 폰트는 STIX');
  assert.ok(Array.isArray(o.font.fontFiles) && o.font.fontFiles.length, 'STIX 파일 포함');
  // /usr/share/fonts 가 있는 환경(리눅스)에서는 반드시 fontDirs 로 넘겨야
  // resvg 가 시스템 글리프 폴백(한글 등)을 찾는다 — 없으면 PNG 라벨이 □ 로 깨진다.
  if (existsSync('/usr/share/fonts')) {
    assert.ok((o.font.fontDirs || []).includes('/usr/share/fonts'), 'fontDirs 에 /usr/share/fonts');
  }
  // 한글 라벨도 SVG 로는 그대로 나간다(래스터 폴백의 전제)
  const svg = scene().view([0, 2], [0, 2]).add(point(1, 1).label('한글 라벨')).compile().toSVG({ math: 'text' });
  assert.ok(svg.includes('한글 라벨'), 'CJK 라벨 텍스트 보존');
});

test('adapt 네임스페이스 노출 (ADAPT.md)', () => {
  assert.ok(adapt && adapt.katex && typeof adapt.katex.katexRender === 'function');
  assert.ok(typeof adapt.asymptote === 'function');
});
