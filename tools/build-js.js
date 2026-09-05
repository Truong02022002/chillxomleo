#!/usr/bin/env node
/**
 * Minify js/main.js -> js/main.min.js va js/flipbook.js -> js/flipbook.min.js
 *
 * Ly do ton tai: truoc day main.min.js duoc minify o ngoai repo, khong co cach nao
 * doi chieu no con khop js/main.js hay khong. Do la dung lop loi "tham chieu chet
 * sau refactor": sua nguon, quen dung lai ban minify, site chay ban cu am tham.
 * build-css.js da chan loi do cho CSS bang src-hash; day la ban tuong ung cho JS.
 *
 * FILE NGUON GIU NGUYEN chu thich — chung giai thich vi sao tung khoi ton tai.
 * Chi ban .min duoc trinh duyet nap.
 *
 * Cach dung:
 *   node tools/build-js.js          # kiem ban minify con khop nguon khong (exit 1 neu lech)
 *   node tools/build-js.js --write  # dung lai
 * Sau khi --write PHAI chay tiep: node tools/cache-bust.js --write
 *
 * Repo co tinh khong co package.json nen terser goi qua npx (tai ve lan dau).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const JOBS = [
  { src: 'js/main.js', out: 'js/main.min.js' },
  { src: 'js/flipbook.js', out: 'js/flipbook.min.js' },
];
// File dau vao phai dung TRUOC --compress/--mangle: terser coi doi so dung ngay
// sau hai co do la gia tri tuy chon, dat sau se bao "Supported options".
const TERSER = ['--yes', 'terser@5'];
const TERSER_FLAGS = ['--compress', '--mangle'];

// Chuan hoa xuong dong truoc khi bam — xem giai thich trong tools/cache-bust.js.
const hashOf = (rel) => crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\r\n').join('\n'))
  .digest('hex').slice(0, 8);

const write = process.argv.includes('--write');
let drift = 0;

for (const job of JOBS) {
  const srcHash = hashOf(job.src);
  const outPath = path.join(ROOT, job.out);
  const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  const currentHash = (current.match(/src-hash: ([0-9a-f]+)/) || [])[1];

  if (!write) {
    if (currentHash === srcHash) { console.log('khop nguon: ' + job.out + ' (src-hash ' + srcHash + ')'); continue; }
    console.error('LECH: ' + job.out + ' dung tu nguon khac (' + (currentHash || 'chua ghi hash') + ' != ' + srcHash + ')');
    drift++;
    continue;
  }

  // shell:true de goi duoc npx tren Windows; duong dan phai tu boc nhay vi ROOT
  // co the chua dau cach ("Phan Duc Truong").
  const r = spawnSync('npx', TERSER.concat(['"' + path.join(ROOT, job.src) + '"'], TERSER_FLAGS), { encoding: 'utf8', shell: true });
  if (r.status !== 0 || !r.stdout) {
    console.error('LOI khi minify ' + job.src + ': ' + (r.stderr || '').slice(0, 300));
    process.exit(2);
  }
  const body = r.stdout.trim();

  // Kiem tra tho: moi chuoi ky tu dai trong nguon phai con trong ban minify.
  // Minify duoc doi ten bien, KHONG duoc lam bien mat chuoi.
  // Bo chu thich truoc khi trich: terser xoa chu thich, nen chuoi nam trong chu
  // thich se bi bao "mat" oan. Khong bo `//` sau dau hai cham de giu nguyen URL.
  const src = fs.readFileSync(path.join(ROOT, job.src), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  // Chi lay ung vien TRONG lanh: regex quet chuoi tren code tho de vo vi no khop
  // ca doan nam GIUA hai literal (vi du "') || urlParams.get('"). Loc bang cach
  // chi giu ung vien khong chua dau nhay/ngoac/toan tu — cai do chac chan la noi
  // dung that chu khong phai manh code.
  const strings = new Set();
  for (const m of src.matchAll(/'((?:[^'\\\n]|\\.){8,60})'|"((?:[^"\\\n]|\\.){8,60})"/g)) {
    const v = m[1] ?? m[2];
    if (/^[\w\s.\-/#:?&=]+$/.test(v)) strings.add(v);
  }
  const missing = [...strings].filter((s) => !body.includes(s));
  if (missing.length) {
    console.error('LOI: ' + missing.length + ' chuoi co trong ' + job.src + ' nhung mat o ban minify:');
    missing.slice(0, 5).forEach((s) => console.error('   ' + s.slice(0, 70)));
    process.exit(2);
  }

  const built = '/* BAN MINIFY TU DONG SINH — DUNG SUA TRUC TIEP.\n' +
    '   Nguon: ' + job.src + '\n' +
    '   Sua nguon roi chay: node tools/build-js.js --write && node tools/cache-bust.js --write\n' +
    '   src-hash: ' + srcHash + ' */\n' + body + '\n';
  fs.writeFileSync(outPath, built);
  const gz = require('zlib').gzipSync(Buffer.from(body), { level: 9 }).length;
  console.log('da dung ' + job.out + ': ' + (body.length / 1024).toFixed(1) + ' KB (' +
    (gz / 1024).toFixed(1) + ' KB gzip) | ' + strings.size + ' chuoi giu nguyen | src-hash ' + srcHash);
}

if (drift) {
  console.error('\nChay: node tools/build-js.js --write && node tools/cache-bust.js --write');
  process.exit(1);
}
