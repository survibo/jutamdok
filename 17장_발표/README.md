# 17장 발표: 1g과 100만 명

저장소 맨 위의 `index.html`을 더블클릭하면 열린다. GitHub Pages도 이 파일을 쓴다 (https://survibo.github.io/jutamdok/). `main`에 올리면 1~2분 뒤 반영된다. 파일을 고치고 브라우저에서 새로고침(F5)하면 바로 반영된다.

## 무엇을 고치려면 어디를 보나

| 고치려는 것 | 파일 |
| --- | --- |
| 글, 제목, 쪽수, 슬라이드 순서·추가·삭제 | `content/slides.js` |
| 추정치 사다리의 값 | `content/slides.js`의 `ladder` (값만 적으면 위치는 자동) |
| 시뮬레이션 설정값, 슬라이더 범위, 계기판 | `content/sims.js` |
| 색, 글꼴 | `css/tokens.css` |
| 슬라이드 틀, 기본 글자 크기, 내비 | `css/deck.css` |
| 패널, 표 등 부품의 모양 | `css/components.css` |
| 부품의 구조, 새 부품 추가 | `js/ui.js` |
| 헨릭 모델 계산, 숫자 표기 | `js/model.js` |
| 차트 그리기 / 시뮬레이션 틀 / 슬라이드 이동 | `js/chart.js` / `js/sim-kit.js` / `js/deck.js` |

쪽 번호는 자동으로 맞는다.

## 한 파일로 합치기

메일로 보내거나 다른 컴퓨터에서 발표할 때:

```
node 17장_발표/tools/build.mjs
```

`17장_발표/dist/17장_발표_1g과_100만명.html`이 생긴다. `dist/`는 결과물이므로 직접 고치지 않는다.

## 알아 둘 점

- 글꼴은 Google Fonts에서 받는다. 인터넷이 없으면 맑은 고딕 등 시스템 글꼴로 대체되고 줄바꿈이 달라질 수 있다.
- 일반 `<script>`만 쓴다. ES 모듈(`import`)은 더블클릭으로 연 파일에서 막히므로 쓰지 않는다.
- 스크립트 순서가 중요하다. 순서는 맨 위 `index.html`에 적혀 있다. 파일을 옮기면 그 안의 경로도 같이 고쳐야 한다.
