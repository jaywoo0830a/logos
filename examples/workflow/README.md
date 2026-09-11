# workflow 예제 — "설치 → 작성 → 실행 → 렌더" 4단계 그대로

이 폴더는 워크플로우를 **손으로 따라 해 볼 수 있는** 최소 프로젝트입니다(리눅스 전용).

```
examples/workflow/
  sketches/            ← ② 코드 작성 (여기에 .js 를 둔다)
    hello.js           단위원 + sin 곡선 (export default 1장)
    gallery.js         한 파일에서 4장 (export const figures = {…})
    plugin.js          플러그인(ray · arc.circular · hatch) 사용
  out/                 ← ④ 산출물 (렌더하면 생긴다 · git 추적 제외)
```

## 실행

```bash
# 저장소 루트에서
bash scripts/install.sh --docker          # ① 패키지 설치 + 렌더 이미지 빌드
bash scripts/render.sh -p examples/workflow -s sketches -o out   # ③ 렌더 (도커)
bash scripts/serve.sh examples/workflow/out 18080                # ④ 브라우저로 확인
```

> `-s`/`-o` 는 **프로젝트(`-p`) 기준 상대경로**입니다. 위처럼 `-p` 를 주면 `out` 은
> `examples/workflow/out` 이 됩니다(절대경로를 주면 그대로 그 위치에 렌더됩니다).

도커 없이 호스트에서 바로:

```bash
bash scripts/render.sh --local -p examples/workflow -s sketches -o /tmp/report
```

## 스케치 계약

| 내보내기 | 의미 |
|---|---|
| `export default` | 그림 1장 — `Scene` · `SceneIR` · `() => Scene` 모두 허용 |
| `export const figures = { 이름: 그림 }` | 한 파일 여러 장(이름이 파일명) |
| `export const figures = [[이름, 그림, 제목], …]` | 배열 형식(제목 지정) |
| `export const name` / `title` | 파일명/표시 이름 덮어쓰기 |

렌더 결과는 항상 `out/` 안에 `<이름>.svg` · `<이름>.png` · `index.html`(갤러리) ·
`manifest.json`(기계 판독용 요약)로 나옵니다. 자세한 내용은 [`WORKFLOW.md`](../../WORKFLOW.md).
