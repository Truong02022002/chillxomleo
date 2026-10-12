// Trang bao cao "Ban do nhu cau" (tools/ban-do-nhu-cau.mjs goi taoHtml(kq)).
// Mot file HTML tu chua (chi nap font Google): bieu do bong bong ve san bang SVG (doc duoc khi tat JS),
// JS nho chi lo tooltip. Mau bieu do: 3 o dau bang mau dataviz (validate_palette.js --pairs all: PASS ca
// nen sang #FBF7EF lan nen toi #1D1610); "Theo doi" = xam trung tinh. Nhan + bang so lieu la "relief" cho
// hai mau duoi 3:1 tren nen sang.

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const so = (n) => Math.round(n).toLocaleString('vi-VN');
const pt = (x) => (x * 100).toFixed(x < 0.1 ? 1 : 0).replace('.', ',') + '%';
const vt = (p) => String(p).replace('.', ',');
const tang = (t) => (t == null ? '—' : (t >= 0 ? '+' : '−') + Math.abs(Math.round(t * 100)) + '%');
const ngayVn = (d) => (d ? d.split('-').reverse().join('/') : '');

const O = {
  core: { ten: 'Core Market', vn: 'Thị trường chính', mo: 'Đang mang lượt nhấp ở vị trí tốt — giữ vững.' },
  'co-hoi': { ten: 'High Opportunity', vn: 'Cơ hội lớn', mo: 'Nhu cầu rõ nhưng vị trí / CTR chưa theo kịp — giao việc trước.' },
  'tang-nhanh': { ten: 'Fast Growing', vn: 'Tăng nhanh', mo: 'Hiển thị tăng mạnh so với kỳ trước — theo dõi, đón đầu.' },
  'theo-doi': { ten: 'Monitoring', vn: 'Theo dõi', mo: 'Chưa đủ tín hiệu — quan sát tiếp.' },
  nhieu: { ten: 'Noise', vn: 'Nhiễu', mo: 'Không phải nhu cầu của quán.' },
};
const VIEC = {
  'day-len-trang-1': 'Đẩy lên trang 1',
  'tang-ctr': 'Tăng CTR',
  'viet-trang-moi': 'Viết trang mới',
  'don-dau': 'Đón đầu',
  'bao-ve': 'Bảo vệ',
  'theo-doi-ai': 'Theo dõi AI Mode',
  'kiem-tra-ctr-thuong-hieu': 'CTR thương hiệu',
};
const LOAI = { 'thuong-hieu': 'Thương hiệu', 'dich-vu': 'Quán / dịch vụ', 'tham-quan': 'Du lịch (bậc O)', nhieu: 'Nhiễu' };

function bieuDo(kq) {
  const W = 960, H = 560, L = 70, R = 28, T = 28, B = 58;
  const ds = kq.cum.filter((c) => c.o !== 'nhieu');
  const lx = (p) => L + (Math.log10(Math.max(1, p)) / 2) * (W - L - R);           // vi tri 1..100 (log)
  const yMin = 3, yMax = 30000;
  const ly = (i) => T + (1 - (Math.log10(Math.max(yMin, i)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * (H - T - B);
  const r = (c) => Math.min(28, 5 + 2.2 * Math.sqrt(c));
  const nguongCoHoi = Math.max(50, kq.tongThat.i * 0.01);
  let s = `<svg class="bd" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="bd-tieu-de bd-mo-ta">`;
  s += `<title id="bd-tieu-de">Bản đồ nhu cầu: mỗi bong bóng là một cụm chủ đề</title><desc id="bd-mo-ta">Trục ngang là vị trí trung bình trên Google (trái là tốt hơn, thang log), trục dọc là lượt hiển thị (thang log), cỡ bong bóng là lượt nhấp. Số liệu đầy đủ nằm trong bảng bên dưới.</desc>`;
  // vung trang 1
  s += `<rect x="${lx(1)}" y="${T}" width="${lx(10.5) - lx(1)}" height="${H - T - B}" class="vung-t1"/>`;
  s += `<text x="${lx(1) + 8}" y="${T + 16}" class="nhan-vung">Trang 1 của Google</text>`;
  // luoi + truc
  for (const v of [3, 10, 30, 100, 300, 1000, 3000, 10000, 30000]) {
    const y = ly(v);
    s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" class="luoi"/><text x="${L - 8}" y="${y + 4}" class="truc" text-anchor="end">${so(v)}</text>`;
  }
  for (const v of [1, 2, 3, 5, 10, 20, 30, 50, 100]) {
    const x = lx(v);
    s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}" class="luoi"/><text x="${x}" y="${H - B + 18}" class="truc" text-anchor="middle">${v}</text>`;
  }
  s += `<text x="${(L + W - R) / 2}" y="${H - 12}" class="ten-truc" text-anchor="middle">Vị trí trung bình trên Google (trái = cao hơn)</text>`;
  s += `<text x="16" y="${(T + H - B) / 2}" class="ten-truc" text-anchor="middle" transform="rotate(-90 16 ${(T + H - B) / 2})">Lượt hiển thị / 3 tháng</text>`;
  // nguong co hoi
  const yN = ly(nguongCoHoi);
  const chuNguong = `ngưỡng xét cơ hội: ${so(nguongCoHoi)} hiển thị`;
  const wN = chuNguong.length * 6.2;
  s += `<line x1="${L}" x2="${W - R}" y1="${yN}" y2="${yN}" class="nguong"/><text x="${W - R - 6}" y="${yN + 16}" class="nhan-vung" text-anchor="end">${chuNguong}</text>`;
  // diem: theo doi ve truoc (nam duoi), lon ve truoc nho
  const thuTu = [...ds].sort((a, b) => (a.o === 'theo-doi' ? -1 : 0) - (b.o === 'theo-doi' ? -1 : 0) || b.c - a.c);
  const nhanCo = new Set(ds.filter((c) => c.o !== 'theo-doi').map((c) => c.key));
  ds.filter((c) => c.o === 'theo-doi').sort((a, b) => b.i - a.i).slice(0, 3).forEach((c) => nhanCo.add(c.key));
  // Hop da chiem cho: nhan nguong + nhan vung trang 1 (nhan diem phai tranh)
  const hop = [[W - R - 6 - wN, yN + 4, wN, 15], [L + 4, T + 4, 130, 16]];
  let nhan = '';
  for (const c of thuTu) {
    const x = lx(c.p), y = ly(c.i), rr = r(c.c);
    const aria = `${c.ten}: ${so(c.i)} hiển thị, ${so(c.c)} nhấp, CTR ${pt(c.ctr)}, vị trí ${vt(c.p)}, ${O[c.o].vn}`;
    s += `<g class="diem o-${c.o}" tabindex="0" role="img" aria-label="${esc(aria)}" data-ten="${esc(c.ten)}" data-o="${esc(O[c.o].vn)}" data-i="${so(c.i)}" data-c="${so(c.c)}" data-ctr="${pt(c.ctr)}" data-p="${vt(c.p)}" data-t="${tang(c.tang)}">`
      + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(12, rr + 6).toFixed(1)}" class="trung"/>`
      + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" class="cham"/></g>`;
    if (nhanCo.has(c.key)) {
      const chu = c.ten.length > 30 ? c.ten.slice(0, 29) + '…' : c.ten;
      const w = chu.length * 6.6 + 4, h = 14;
      let ok = null;
      for (const [dx, dy, a] of [[rr + 6, 4, 'start'], [-(rr + 6), 4, 'end'], [0, -(rr + 6), 'middle'], [0, rr + 15, 'middle']]) {
        const x0 = a === 'start' ? x + dx : a === 'end' ? x + dx - w : x - w / 2, y0 = y + dy - 11;
        if (x0 < L || x0 + w > W - R || y0 < T || y0 + h > H - B) continue;
        if (hop.some((b) => x0 < b[0] + b[2] && x0 + w > b[0] && y0 < b[1] + b[3] && y0 + h > b[1])) continue;
        ok = [x + dx, y + dy, a, x0, y0, w, h]; break;
      }
      if (ok) { hop.push([ok[3], ok[4], ok[5], ok[6]]); nhan += `<text x="${ok[0].toFixed(1)}" y="${ok[1].toFixed(1)}" text-anchor="${ok[2]}" class="nhan-diem" aria-hidden="true">${esc(chu)}</text>`; }
    }
  }
  s += nhan + '</svg>';
  return s;
}

export function taoHtml(kq) {
  const ds = kq.cum.filter((c) => c.o !== 'nhieu');
  const nhieu = kq.cum.filter((c) => c.o === 'nhieu');
  const th = kq.cum.filter((c) => c.loai === 'thuong-hieu');
  const thC = th.reduce((s, c) => s + c.c, 0), thI = th.reduce((s, c) => s + c.i, 0);
  const nhieuI = nhieu.reduce((s, c) => s + c.i, 0);
  const demO = (o) => ds.filter((c) => c.o === o).length;
  const phu = kq.tongSite ? kq.tongFile.i / kq.tongSite.i : null;

  const viec = kq.viec.map((v, n) => `
      <li class="viec viec-${esc(v.loaiViec)}">
        <div class="viec-dau">
          <span class="chip chip-${esc(v.o)}">${esc(O[v.o].vn)}</span>
          <span class="chip chip-viec">${esc(VIEC[v.loaiViec] || v.loaiViec)}</span>
          <span class="loai">${esc(LOAI[v.loai] || '')}</span>
        </div>
        <h3>${esc(v.ten)}</h3>
        <p class="ly-do">${esc(v.lyDo)}</p>
        <dl class="so-lieu">
          <div><dt>Hiển thị</dt><dd>${so(v.i)}</dd></div>
          <div><dt>Nhấp</dt><dd>${so(v.c)}</dd></div>
          <div><dt>CTR</dt><dd>${pt(v.ctr)}</dd></div>
          <div><dt>Vị trí TB</dt><dd>${vt(v.p)}</dd></div>
          ${v.nhapTiemNang ? `<div class="tiem-nang"><dt>Tiềm năng</dt><dd>+${so(v.nhapTiemNang)} nhấp / quý <span>nếu lên vị trí ${vt(v.viTriMucTieu)}</span></dd></div>` : ''}
        </dl>
        ${v.dich ? `<p class="dich">Trang đích: <a href="https://xomleo.vn${esc(v.dich)}">xomleo.vn${esc(v.dich)}</a>${v.bac && v.bac.tonTai ? ` <span class="bac">${esc(v.bac.tenBac)}</span>` : ' <span class="bac canh-bao">trang chưa có</span>'}</p>` : ''}
        <details><summary>${v.top.length} truy vấn đứng đầu</summary>
          <table class="bang-nho"><thead><tr><th scope="col">Truy vấn</th><th scope="col">Hiển thị</th><th scope="col">Nhấp</th><th scope="col">Vị trí</th></tr></thead><tbody>
          ${v.top.map((t) => `<tr><td>${esc(t.q)}</td><td>${so(t.i)}</td><td>${so(t.c)}</td><td>${vt(+t.p.toFixed(1))}</td></tr>`).join('')}
          </tbody></table></details>
      </li>`).join('');

  const hang = ds.map((c) => `<tr>
        <th scope="row">${esc(c.ten)}${c.nghiTuDong || c.tiLeNgoac >= 0.3 ? ` <span class="ghi">${pt(c.tiLeNgoac)} nghi máy tự tìm</span>` : ''}${c.tiLeAnh > 0.5 ? ' <span class="ghi">tiếng Anh</span>' : ''}</th>
        <td><span class="chip chip-${esc(c.o)}">${esc(O[c.o].vn)}</span></td>
        <td>${so(c.i)}</td><td>${tang(c.tang)}</td><td>${so(c.c)}</td><td>${pt(c.ctr)}</td><td>${vt(c.p)}</td>
        <td>${c.dich ? `<a href="https://xomleo.vn${esc(c.dich)}">${esc(c.dich)}</a>` : '—'}${c.bac && c.bac.tonTai ? `<br><span class="bac">${esc(c.bac.tenBac)}</span>` : ''}</td>
      </tr>`).join('');

  const hangNhieu = nhieu.map((c) => `<li><strong>${esc(c.ten)}</strong> — ${so(c.i)} hiển thị, ${so(c.c)} nhấp. <span class="mo">Ví dụ: ${c.top.slice(0, 4).map((t) => '“' + esc(t.q) + '”').join(', ')}</span></li>`).join('');
  const chuaPhan = kq.chuaPhan.length ? `<p>${so(kq.soChuaPhan)} truy vấn (${so(kq.hienThiChuaPhan)} hiển thị) chưa khớp cụm nào — thêm mẫu vào <code>tools/cum-chu-de.json</code> nếu chúng là nhu cầu thật: ${kq.chuaPhan.slice(0, 15).map((t) => '“' + esc(t.q) + '”').join(', ')}.</p>` : '<p>Mọi truy vấn trong file đều đã vào cụm.</p>';

  const chongNgay = kq.chongNgay > 0 ? ` Kỳ trước (${ngayVn(kq.khoangTruoc[0])} – ${ngayVn(kq.khoangTruoc[1])}) <strong>chồng ${kq.chongNgay} ngày</strong> với kỳ này, nên cột tăng / giảm chỉ cho biết hướng, chưa phải mức thay đổi thật.` : '';

  return `<title>Bản đồ nhu cầu Xóm Lèo</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Signika:wght@400;600&display=swap">
<style>
/* Bo cuc: mot cot bao cao kieu "bang tin nha ga" — tom tat -> ban do -> viec can lam -> bang day du -> nhieu.
   Nhan dien lay tu chinh site xomleo.vn: Oswald (tieu de), Signika (than), giay kem / go toi, dong thau. */
:root {
  --bg: #FBF7EF; --mat: #FFFDF8; --muc: #2B1C10; --muc-2: #5C4A36; --muc-3: #7A6650; --ke: #E4D8C4; --vien: #CBB896;
  --dong: #8A5A1C; --vung: #F1E8D8;
  --s-core: #2a78d6; --s-cohoi: #eb6834; --s-tang: #1baf7a; --s-theodoi: #A89A86;
  --f-tieu-de: 'Oswald', 'Arial Narrow', Arial, sans-serif; --f-than: 'Signika', 'Segoe UI', system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #1D1610; --mat: #261D15; --muc: #F0E4CC; --muc-2: #CDBB9C; --muc-3: #A8977C; --ke: #3A2E22; --vien: #5A4834;
  --dong: #D9AE62; --vung: #2A2018;
  --s-core: #3987e5; --s-cohoi: #d95926; --s-tang: #199e70; --s-theodoi: #6E6352; color-scheme: dark; } }
:root[data-theme="dark"] {
  --bg: #1D1610; --mat: #261D15; --muc: #F0E4CC; --muc-2: #CDBB9C; --muc-3: #A8977C; --ke: #3A2E22; --vien: #5A4834;
  --dong: #D9AE62; --vung: #2A2018;
  --s-core: #3987e5; --s-cohoi: #d95926; --s-tang: #199e70; --s-theodoi: #6E6352; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--muc); font: 16px/1.6 var(--f-than); }
.trang { max-width: 1040px; margin: 0 auto; padding: 2.5rem 20px 4rem; display: grid; gap: 3rem; }
h1, h2, h3 { font-family: var(--f-tieu-de); font-weight: 600; line-height: 1.15; text-wrap: balance; margin: 0; }
h1 { font-size: clamp(2rem, 1.4rem + 2.6vw, 3.1rem); letter-spacing: .01em; }
h2 { font-size: 1.55rem; letter-spacing: .02em; }
h3 { font-size: 1.2rem; }
p { margin: 0; max-width: 68ch; }
a { color: var(--dong); text-underline-offset: 3px; }
a:focus-visible, summary:focus-visible, .diem:focus-visible { outline: 2px solid var(--dong); outline-offset: 3px; }
.mat-ngoai { font-family: var(--f-tieu-de); font-weight: 500; text-transform: uppercase; letter-spacing: .14em; font-size: .8rem; color: var(--dong); }
section { display: grid; gap: 1.1rem; min-width: 0; }
header.dau { display: grid; gap: .8rem; }
.dau .ky { color: var(--muc-2); }
.tom-tat { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1px; background: var(--ke); border: 1px solid var(--ke); }
.tom-tat > div { background: var(--mat); padding: 1rem 1.1rem; display: grid; gap: .15rem; }
.tom-tat dt { font-size: .85rem; color: var(--muc-2); }
.tom-tat dd { margin: 0; font-family: var(--f-tieu-de); font-size: 1.7rem; font-variant-numeric: tabular-nums; }
.tom-tat dd span { font-family: var(--f-than); font-size: .85rem; color: var(--muc-2); }
.khung-bd { position: relative; overflow-x: auto; background: var(--mat); border: 1px solid var(--ke); }
.bd { display: block; min-width: 680px; width: 100%; height: auto; }
.bd .vung-t1 { fill: var(--vung); }
.bd .luoi { stroke: var(--ke); stroke-width: 1; }
.bd .nguong { stroke: var(--vien); stroke-width: 1.5; stroke-dasharray: 5 5; }
.bd .truc { fill: var(--muc-3); font: 12px var(--f-than); font-variant-numeric: tabular-nums; }
.bd .ten-truc { fill: var(--muc-2); font: 13px var(--f-than); }
.bd .nhan-vung { fill: var(--muc-3); font: 12px var(--f-than); }
.bd .nhan-diem { fill: var(--muc); font: 600 12px var(--f-than); paint-order: stroke; stroke: var(--mat); stroke-width: 3px; stroke-linejoin: round; }
.bd .trung { fill: transparent; }
.bd .cham { stroke: var(--mat); stroke-width: 2; }
.bd .o-core .cham { fill: var(--s-core); }
.bd .o-co-hoi .cham { fill: var(--s-cohoi); }
.bd .o-tang-nhanh .cham { fill: var(--s-tang); }
.bd .o-theo-doi .cham { fill: var(--s-theodoi); fill-opacity: .75; }
.bd .diem { cursor: default; outline: none; }
.bd .diem:hover .cham, .bd .diem:focus .cham { stroke: var(--muc); }
.chu-giai { display: flex; flex-wrap: wrap; gap: .4rem 1.4rem; font-size: .9rem; color: var(--muc-2); align-items: center; }
.chu-giai span { display: inline-flex; align-items: center; gap: .45rem; }
.chu-giai i { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.goi-y { position: absolute; pointer-events: none; background: var(--muc); color: var(--bg); padding: .55rem .7rem; font-size: .85rem; line-height: 1.4; max-width: 260px; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
.goi-y strong { font-family: var(--f-tieu-de); font-weight: 500; font-size: 1.05rem; display: block; }
.o-giai { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: .9rem; }
.o-giai div { display: grid; gap: .2rem; border-top: 3px solid var(--s); padding-top: .5rem; }
.o-giai b { font-family: var(--f-tieu-de); font-weight: 500; font-size: 1.05rem; }
.o-giai small { color: var(--muc-2); font-size: .88rem; }
ol.ds-viec { list-style: none; margin: 0; padding: 0; display: grid; gap: 1rem; counter-reset: v; }
.viec { background: var(--mat); border: 1px solid var(--ke); border-left: 4px solid var(--s, var(--vien)); padding: 1.1rem 1.2rem; display: grid; gap: .55rem; min-width: 0; }
.viec-dau { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
.chip { display: inline-block; font-size: .78rem; font-weight: 600; letter-spacing: .02em; padding: .1rem .5rem; border: 1px solid currentColor; border-radius: 999px; white-space: nowrap; }
.chip-core { color: var(--s-core); } .chip-co-hoi { color: var(--s-cohoi); } .chip-tang-nhanh { color: var(--s-tang); } .chip-theo-doi, .chip-nhieu { color: var(--muc-3); }
.chip-viec { color: var(--muc); border-color: var(--vien); }
.viec-core, li.viec:has(.chip-core) { --s: var(--s-core); } li.viec:has(.chip-co-hoi) { --s: var(--s-cohoi); } li.viec:has(.chip-tang-nhanh) { --s: var(--s-tang); }
.loai { font-size: .82rem; color: var(--muc-3); }
.ly-do { color: var(--muc-2); }
.so-lieu { display: flex; flex-wrap: wrap; gap: .4rem 1.6rem; margin: 0; }
.so-lieu div { display: grid; }
.so-lieu dt { font-size: .78rem; color: var(--muc-3); }
.so-lieu dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
.so-lieu .tiem-nang dd { color: var(--dong); }
.so-lieu .tiem-nang dd span { font-weight: 400; color: var(--muc-3); font-size: .85rem; }
.dich { font-size: .92rem; overflow-wrap: anywhere; }
.bac { font-size: .78rem; color: var(--muc-2); border: 1px solid var(--ke); padding: 0 .4rem; white-space: nowrap; }
.bac.canh-bao { color: var(--s-cohoi); border-color: currentColor; }
details summary { cursor: pointer; color: var(--muc-2); font-size: .9rem; }
.cuon { overflow-x: auto; border: 1px solid var(--ke); background: var(--mat); }
table { border-collapse: collapse; width: 100%; font-size: .9rem; }
th, td { text-align: left; padding: .5rem .7rem; border-bottom: 1px solid var(--ke); vertical-align: top; }
thead th { font-family: var(--f-tieu-de); font-weight: 500; letter-spacing: .04em; color: var(--muc-2); white-space: nowrap; }
td { font-variant-numeric: tabular-nums; }
tbody th { font-weight: 600; min-width: 14rem; }
.bang-chinh td:nth-child(n+3):nth-child(-n+7), .bang-nho td:nth-child(n+2) { text-align: right; white-space: nowrap; }
.bang-nho { margin-top: .5rem; font-size: .85rem; }
.ghi { display: inline-block; font-weight: 400; font-size: .75rem; color: var(--muc-3); }
ul.ds { margin: 0; padding-left: 1.2rem; display: grid; gap: .45rem; }
.mo { color: var(--muc-2); }
.luu-y { border: 1px solid var(--vien); padding: 1rem 1.2rem; display: grid; gap: .5rem; background: var(--mat); }
.luu-y ul { margin: 0; padding-left: 1.2rem; display: grid; gap: .35rem; color: var(--muc-2); }
code { font-size: .88em; background: var(--vung); padding: 0 .3em; }
ol.buoc { margin: 0; padding-left: 1.3rem; display: grid; gap: .4rem; }
@media (prefers-reduced-motion: no-preference) { .bd .cham { transition: stroke .15s; } }
</style>

<main class="trang">
  <header class="dau">
    <p class="mat-ngoai">Website Listening · Google Search Console</p>
    <h1>Bản đồ nhu cầu tìm kiếm của Tiệm Nướng &amp; Chill Xóm Lèo</h1>
    <p class="ky">Kỳ ${ngayVn(kq.khoangNgay?.[0])} – ${ngayVn(kq.khoangNgay?.[1])} (${esc(kq.loc.join(' · '))}). ${so(kq.tongFile.soTruyVan)} truy vấn gom thành ${ds.length} cụm chủ đề + ${nhieu.length} nhóm nhiễu.${chongNgay}</p>
  </header>

  <section aria-labelledby="h-tom-tat">
    <h2 id="h-tom-tat" class="mat-ngoai" style="font-size:.8rem">Tóm tắt kỳ</h2>
    <dl class="tom-tat">
      <div><dt>Lượt nhấp từ Google</dt><dd>${so(kq.tongSite?.c ?? kq.tongFile.c)} <span>/ ${so(kq.tongSite?.i ?? kq.tongFile.i)} hiển thị</span></dd></div>
      <div><dt>Nhấp đến từ tên quán</dt><dd>${pt(thC / (kq.tongFile.c || 1))} <span>${so(thC)} / ${so(kq.tongFile.c)} nhấp có truy vấn</span></dd></div>
      <div><dt>Hiển thị là nhiễu</dt><dd>${pt(nhieuI / (kq.tongFile.i || 1))} <span>near me toàn cầu, quán khác</span></dd></div>
      <div><dt>Cơ hội cần giao</dt><dd>${demO('co-hoi')} <span>cụm · ${demO('tang-nhanh')} cụm đang tăng</span></dd></div>
    </dl>
  </section>

  <section aria-labelledby="h-ban-do">
    <h2 id="h-ban-do">Bản đồ: nhu cầu × vị trí</h2>
    <p class="mo">Mỗi bong bóng là một cụm chủ đề. Càng lên cao càng nhiều người tìm, càng sang trái quán càng đứng cao trên Google, bong bóng càng to càng nhiều lượt nhấp. Góc phải phía trên là nhu cầu lớn mà quán chưa với tới.</p>
    <div class="chu-giai" aria-hidden="true">
      <span><i style="background:var(--s-core)"></i>Thị trường chính</span>
      <span><i style="background:var(--s-cohoi)"></i>Cơ hội lớn</span>
      <span><i style="background:var(--s-tang)"></i>Tăng nhanh</span>
      <span><i style="background:var(--s-theodoi)"></i>Theo dõi</span>
      <span>Cỡ = lượt nhấp</span>
    </div>
    <div class="khung-bd" id="khung-bd">${bieuDo(kq)}<div class="goi-y" id="goi-y" hidden></div></div>
    <div class="o-giai">
      ${['core', 'co-hoi', 'tang-nhanh', 'theo-doi'].map((o) => `<div style="--s:var(--s-${o === 'co-hoi' ? 'cohoi' : o === 'tang-nhanh' ? 'tang' : o === 'theo-doi' ? 'theodoi' : 'core'})"><b>${O[o].vn} · ${demO(o)}</b><small>${O[o].ten}. ${O[o].mo}</small></div>`).join('')}
    </div>
  </section>

  <section aria-labelledby="h-viec">
    <h2 id="h-viec">Opportunity Center — việc nên làm, theo thứ tự</h2>
    <p class="mo">Xếp theo điểm = lượt nhấp có thể thêm trong một quý × trọng số kinh doanh (khách tìm quán nướng: 1; khách đọc bài điểm tham quan: 0,3). Tiềm năng tính theo đường CTR tham khảo, không phải số của Google — dùng để xếp thứ tự, đừng dùng làm cam kết.</p>
    <ol class="ds-viec">${viec}
    </ol>
  </section>

  <section aria-labelledby="h-bang">
    <h2 id="h-bang">Toàn bộ cụm chủ đề</h2>
    <div class="cuon"><table class="bang-chinh">
      <thead><tr><th scope="col">Cụm</th><th scope="col">Ô</th><th scope="col">Hiển thị</th><th scope="col">So kỳ trước</th><th scope="col">Nhấp</th><th scope="col">CTR</th><th scope="col">Vị trí TB</th><th scope="col">Trang đích · bậc DLN</th></tr></thead>
      <tbody>${hang}</tbody>
    </table></div>
  </section>

  <section aria-labelledby="h-nhieu">
    <h2 id="h-nhieu">Nhiễu đã loại khỏi bản đồ</h2>
    <ul class="ds">${hangNhieu}</ul>
    ${chuaPhan}
  </section>

  <section class="luu-y" aria-labelledby="h-luu-y">
    <h2 id="h-luu-y" style="font-size:1.15rem">Giới hạn của dữ liệu</h2>
    <ul>
      <li>File export chỉ có ${so(kq.tongFile.soTruyVan)} truy vấn đầu; truy vấn Google ẩn danh không có trong file — các cụm phủ ${phu ? pt(phu) : '—'} tổng hiển thị của site.</li>
      <li>Export chuẩn không nối truy vấn với trang. “Trang đích” là trang quán nên dùng cho cụm đó, không phải trang Google đang chọn.</li>
      <li>Vị trí của cụm là trung bình có trọng số theo lượt hiển thị. CTR tên quán thấp là bình thường: khách bấm thẳng vào Hồ sơ Google (Gọi, Chỉ đường).</li>
      <li>Cụm gắn “nghi máy tự tìm”: truy vấn có ngoặc kép hoặc lặp nguyên tiêu đề bài ở trang 1 mà không ai bấm — thường là công cụ theo dõi thứ hạng / AI, không phải khách.</li>
    </ul>
  </section>

  <section aria-labelledby="h-cap-nhat">
    <h2 id="h-cap-nhat">Cập nhật hằng tháng</h2>
    <ol class="buoc">
      <li>Search Console → Hiệu suất → Kết quả tìm kiếm → chọn <em>3 tháng qua</em> → Xuất → Tải CSV (ra file .zip).</li>
      <li>Xuất thêm một file cho <em>3 tháng ngay trước đó</em> (Ngày → Tuỳ chỉnh) để cột tăng / giảm chính xác.</li>
      <li>Chạy <code>node tools/ban-do-nhu-cau.mjs --hien-tai &lt;file mới&gt;.zip --truoc &lt;file kỳ trước&gt;.zip</code> — báo cáo ghi cạnh file export, không vào repo.</li>
    </ol>
  </section>
</main>
<script>
(() => {
  const khung = document.getElementById('khung-bd'), gy = document.getElementById('goi-y');
  if (!khung || !gy) return;
  const hien = (g) => {
    gy.replaceChildren();
    const st = document.createElement('strong'); st.textContent = g.dataset.i + ' hiển thị · ' + g.dataset.c + ' nhấp';
    const a = document.createElement('div'); a.textContent = g.dataset.ten;
    const b = document.createElement('div'); b.textContent = 'CTR ' + g.dataset.ctr + ' · vị trí ' + g.dataset.p + ' · kỳ trước ' + g.dataset.t;
    const c = document.createElement('div'); c.textContent = g.dataset.o;
    gy.append(st, a, b, c); gy.hidden = false;
    const kr = khung.getBoundingClientRect(), r = g.querySelector('.cham').getBoundingClientRect();
    let x = r.right - kr.left + khung.scrollLeft + 10, y = r.top - kr.top + 0;
    if (x + 270 > khung.scrollLeft + kr.width) x = r.left - kr.left + khung.scrollLeft - 270;
    gy.style.left = Math.max(4, x) + 'px'; gy.style.top = Math.max(4, y) + 'px';
  };
  const an = () => { gy.hidden = true; };
  khung.querySelectorAll('.diem').forEach((g) => {
    g.addEventListener('pointerenter', () => hien(g)); g.addEventListener('focus', () => hien(g));
    g.addEventListener('pointerleave', an); g.addEventListener('blur', an);
  });
})();
</script>
`;
}
