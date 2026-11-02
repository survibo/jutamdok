// 여러 파일을 HTML 한 파일로 합친다 (메일 전송, 다른 컴퓨터에서 발표할 때).
// 실행: node 17장_발표/tools/build.mjs  →  17장_발표/dist/17장_발표_1g과_100만명.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 저장소 맨 위. index.html이 여기 있고, 그 안의 경로도 여기를 기준으로 적혀 있다.
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const html = read('index.html')
  .replace(/<link rel="stylesheet" href="((?!https?:)[^"]+)">/g, (_, f) => `<style>\n${read(f)}</style>`)
  // 함수 형태로 넘겨야 파일 안의 $ 기호가 치환 패턴으로 해석되지 않는다
  .replace(/<script src="([^"]+)"><\/script>/g, (_, f) => `<script>\n${read(f).replace(/<\/script/gi, '<\\/script')}</script>`);

// 이미지도 파일 안에 넣는다 (한 파일만 옮겨도 보이도록)
const inlined = html.replace(/[^"'\s]*assets\/[\w.-]+\.jpg/g, (f) => `data:image/jpeg;base64,${fs.readFileSync(path.join(root, f)).toString('base64')}`);

const out = path.join(root, '17장_발표', 'dist', '17장_발표_1g과_100만명.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, inlined);
console.log('완료:', path.relative(root, out), Math.round(inlined.length / 1024) + 'KB');
