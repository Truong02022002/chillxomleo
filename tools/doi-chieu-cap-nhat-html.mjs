// Trang bao cao "Doi chieu truoc / sau dot cap nhat Google" (tools/doi-chieu-cap-nhat.mjs goi taoHtml(kq)).
// Mot file HTML tu chua (chi nap font Google). Cung giao dien voi bao cao ban do nhu cau: Oswald + Signika,
// giay kem / go toi. Bieu do theo ngay = 3 bieu do nho chung truc ngay (nhap, hien thi, vi tri) — moi bieu do
// mot truc doc, khong ghep hai thang do. Mau net: xanh (TB 7 ngay) + cam (ngay site doi noi dung), chay
// validate_palette.js (skill dataviz) PASS ca nen #FFFDF8 lan #261D15. Mau trang thai (tot / canh bao / nang /
// nghiem trong) co dinh theo bang trang thai cua skill, luon di kem chu nhin thay duoc, khong dung mau mot minh.

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const so = (n) => (n == null ? '—' : Math.round(n).toLocaleString('vi-VN'));
const pt = (x) => (x == null || !isFinite(x) ? '—' : (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0).replace('.', ',') + '%');
const ptTron = (x) => (x == null || !isFinite(x) ? '—' : Math.abs(x * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0).replace('.', ',') + '%');
const vt = (p) => (p == null ? '—' : p.toFixed(1).replace('.', ','));
const ngayVn = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '');
const ngayDu = (d) => (d ? d.split('-').reverse().join('/') : '');
const hang = (d) => (d == null ? '—' : Math.abs(d) < 0.05 ? 'giữ' : (d > 0 ? 'tụt ' : 'lên ') + Math.abs(d).toFixed(1).replace('.', ','));
const doiTi = (t, s) => (t > 0 ? pt((s - t) / t) : s > 0 ? 'mới' : '—');
const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const thuCua = (d) => THU[new Date(d + 'T00:00:00Z').getUTCDay()];
const soNgayGiua = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

const LOAI = {
  'tut-manh': { ten: 'Tụt mạnh', mau: 'critical' },
  'tut-vua': { ten: 'Tụt vừa', mau: 'serious' },
  mat: { ten: 'Mất hiển thị', mau: 'warning' },
  'tut-nhe': { ten: 'Tụt nhẹ', mau: 'trung' },
  'on-dinh': { ten: 'Ổn định', mau: 'trung' },
  'len-nhe': { ten: 'Lên nhẹ', mau: 'good' },
  'len-vua': { ten: 'Lên vừa', mau: 'good' },
  'len-manh': { ten: 'Lên mạnh', mau: 'good' },
  moi: { ten: 'Mới nổi', mau: 'good' },
};
// Cham trang thai: class "cham-tt" (KHONG dung "dau" — trung <header class="dau"> lam header co thanh 10px)
const chip = (loai) => (loai && LOAI[loai] ? `<span class="chip"><i class="cham-tt tt-${LOAI[loai].mau}" aria-hidden="true"></i>${LOAI[loai].ten}</span>` : '<span class="mo">chưa đủ số</span>');
const MUC_KL = { tot: ['good', 'Tốt'], trung: ['trung', 'Ghi nhận'], 'canh-bao': ['warning', 'Chú ý'], xau: ['critical', 'Cần làm'] };
const TEN_NN = { vi: 'VI', en: 'EN', zh: 'zh', ko: 'ko', ja: 'ja', ru: 'ru', th: 'th' };

// ---------------- Bieu do theo ngay (3 bieu do nho chung truc ngay) ----------------
// So dem (nhap, hien thi) lam tron len buoc 1/2/4/5/6/8/10 de vach giua la so nguyen; vi tri giu 2,5.
function lamTronLen(v, demDuoc) {
  if (!(v > 0)) return 1;
  const mu = 10 ** Math.floor(Math.log10(v));
  for (const b of demDuoc ? [1, 2, 4, 5, 6, 8, 10] : [1, 2, 2.5, 5, 10]) if (b * mu >= v) return b * mu;
  return 10 * mu;
}
function bieuDoNgay(kq) {
  const ds = kq.ngay;
  if (!ds || ds.length < 8) return null;
  const W = 960, L = 58, R = 18, TOP = 50, PH = 112, GAP = 34, XB = 44;
  const KHUNG = [
    { key: 'c', ten: 'Lượt nhấp mỗi ngày', dao: false },
    { key: 'i', ten: 'Lượt hiển thị mỗi ngày', dao: false },
    { key: 'p', ten: 'Vị trí trung bình mỗi ngày (cao hơn = tốt hơn)', dao: true },
  ];
  const H = TOP + KHUNG.length * PH + (KHUNG.length - 1) * GAP + XB;
  const n = ds.length;
  const x = (j) => L + (j / (n - 1)) * (W - L - R);
  const jCua = (d) => soNgayGiua(ds[0].d, d);
  const nuaNgay = (W - L - R) / (n - 1) / 2;
  const topCua = (m) => TOP + m * (PH + GAP);
  // Trung binh 7 ngay (vi tri: trong so theo hien thi)
  const tb7 = (key) => ds.map((_, j) => {
    if (j < 6) return null;
    let s = 0, m = 0;
    for (let t = j - 6; t <= j; t++) {
      const v = ds[t][key]; if (v == null) continue;
      if (key === 'p') { s += v * (ds[t].i || 0); m += ds[t].i || 0; } else { s += v; m += 1; }
    }
    return m ? s / m : null;
  });
  const TB = Object.fromEntries(KHUNG.map((k) => [k.key, tb7(k.key)]));
  let s = `<svg class="bd-ngay" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="bdn-t" aria-describedby="bdn-m">`;
  s += `<title id="bdn-t">Search Console theo ngày, ${ngayDu(ds[0].d)} – ${ngayDu(ds[n - 1].d)}</title>`;
  s += `<desc id="bdn-m">Ba biểu đồ chung trục ngày: lượt nhấp, lượt hiển thị và vị trí trung bình mỗi ngày (đường mảnh) cùng trung bình 7 ngày (đường đậm). Vùng nền là thời gian Google chạy đợt cập nhật; ngoặc phía trên đánh dấu kỳ trước và kỳ sau; vạch nhỏ dưới trục ngày là ngày site đổi nội dung. Số đầy đủ trong bảng ngay dưới biểu đồ.</desc>`;
  const y0 = TOP, y1 = H - XB;
  // Vung dot cap nhat; nhan sat mep phai thi neo vao mep phai cho khoi bi cat
  for (const d of kq.dotTrongKy || []) {
    const a = Math.max(L, x(Math.max(0, jCua(d.batDau))) - nuaNgay);
    const b = Math.min(W - R, x(Math.min(n - 1, jCua(d.xong || ds[n - 1].d))) + nuaNgay);
    if (b <= a) continue;
    s += `<rect x="${a.toFixed(1)}" y="${y0 - 6}" width="${(b - a).toFixed(1)}" height="${y1 - y0 + 6}" class="vung-dot"/>`;
    const nhan = (d.loai === 'core' ? 'Core ' : d.loai === 'spam' ? 'Spam ' : '') + d.batDau.slice(5, 7) + '/' + d.batDau.slice(0, 4) + (d.xong ? '' : ' (đang chạy)');
    const traiSang = a + 3 + nhan.length * 6.6 <= W - R;
    s += `<text x="${(traiSang ? a + 3 : Math.min(b, W - R) - 3).toFixed(1)}" y="14" class="nhan-vung" text-anchor="${traiSang ? 'start' : 'end'}">${esc(nhan)}</text>`;
  }
  // Ngoac ky truoc / ky sau; duong mep ky ve trong tung khung, chua dai tieu de khung
  for (const [ky, ten] of [[kq.kyT, 'Kỳ trước'], [kq.kyS, 'Kỳ sau']]) {
    if (!ky) continue;
    const ja = jCua(ky.tu), jb = jCua(ky.den);
    if (jb < 0 || ja > n - 1) continue;
    const a = x(Math.max(0, ja)) - nuaNgay, b = x(Math.min(n - 1, jb)) + nuaNgay, yN = 34;
    s += `<path d="M${a.toFixed(1)} ${yN + 6}V${yN}H${b.toFixed(1)}V${yN + 6}" class="ngoac"/>`;
    s += `<text x="${((a + b) / 2).toFixed(1)}" y="${yN - 5}" class="nhan-ngoac" text-anchor="middle">${ten}</text>`;
    for (const xx of [a, b]) KHUNG.forEach((_, m) => { s += `<line x1="${xx.toFixed(1)}" x2="${xx.toFixed(1)}" y1="${topCua(m)}" y2="${topCua(m) + PH}" class="mep-ky"/>`; });
  }
  const yTb = [];
  KHUNG.forEach((k, m) => {
    const top = topCua(m), bot = top + PH;
    const vals = ds.map((r) => r[k.key]).filter((v) => v != null);
    const lon = lamTronLen(Math.max(...vals, k.dao ? 2 : 1), !k.dao);
    const nho = k.dao ? 1 : 0;
    const y = (v) => (k.dao ? top + ((v - nho) / (lon - nho)) * PH : bot - (v / lon) * PH);
    s += `<text x="${L}" y="${top - 9}" class="ten-khung">${esc(k.ten)}</text>`;
    const vach = [...new Set(k.dao ? [1, Math.round(lon / 2), lon] : [0, Math.round(lon / 2), lon])];
    for (const v of vach) s += `<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="luoi"/><text x="${L - 8}" y="${(y(v) + 4).toFixed(1)}" class="truc" text-anchor="end">${esc(Number(v).toLocaleString('vi-VN'))}</text>`;
    const duong = (arr) => { let p = '', mo = false; arr.forEach((v, j) => { if (v == null) { mo = false; return; } p += (mo ? 'L' : 'M') + x(j).toFixed(1) + ' ' + y(v).toFixed(1); mo = true; }); return p; };
    s += `<path d="${duong(ds.map((r) => r[k.key]))}" class="duong-ngay"/>`;
    s += `<path d="${duong(TB[k.key])}" class="duong-tb"/>`;
    yTb.push(TB[k.key].map((v) => (v == null ? null : +y(v).toFixed(1))));
  });
  // Vach ngay site doi noi dung
  for (const v of kq.ngayDoi || []) {
    const j = jCua(v.d); if (j < 0 || j > n - 1) continue;
    s += `<rect x="${(x(j) - 1.5).toFixed(1)}" y="${y1 + 4}" width="3" height="8" rx="1" class="vach-doi"/>`;
  }
  // Truc ngay: nhan moi 14 ngay + ngay cuoi
  for (let j = 0; j < n; j += 14) s += `<text x="${x(j).toFixed(1)}" y="${y1 + 30}" class="truc" text-anchor="middle">${ngayVn(ds[j].d)}</text>`;
  if ((n - 1) % 14 > 4) s += `<text x="${x(n - 1).toFixed(1)}" y="${y1 + 30}" class="truc" text-anchor="end">${ngayVn(ds[n - 1].d)}</text>`;
  // Lop tuong tac
  s += `<line x1="0" x2="0" y1="${y0 - 6}" y2="${y1}" class="truc-doc" visibility="hidden"/>`;
  KHUNG.forEach(() => { s += '<circle r="4.5" class="cham-tb" visibility="hidden"/>'; });
  s += `<rect x="${L}" y="${y0 - 6}" width="${W - L - R}" height="${y1 - y0 + 18}" class="lop-cham"/>`;
  s += '</svg>';

  const trongDot = (d) => (kq.dotTrongKy || []).filter((t) => d >= t.batDau && d <= (t.xong || '9999-12-31')).map((t) => t.ten);
  const kyCua = (d) => (kq.kyT && d >= kq.kyT.tu && d <= kq.kyT.den ? 'trước' : kq.kyS && d >= kq.kyS.tu && d <= kq.kyS.den ? 'sau' : '');
  const doiTheoNgay = new Map((kq.ngayDoi || []).map((v) => [v.d, v.so]));
  const tbChu = (key, j) => (TB[key][j] == null ? null : key === 'c' ? TB.c[j].toFixed(1).replace('.', ',') : key === 'i' ? so(TB.i[j]) : vt(TB.p[j]));
  const dl = {
    W, L, R, yTb,
    ngay: ds.map((r, j) => ({
      nhan: `${thuCua(r.d)} ${ngayDu(r.d)}`,
      c: so(r.c), i: so(r.i), p: vt(r.p),
      tbC: tbChu('c', j), tbI: tbChu('i', j), tbP: tbChu('p', j),
      dot: trongDot(r.d), doi: doiTheoNgay.get(r.d) || 0, ky: kyCua(r.d),
    })),
  };
  const bang = ds.map((r, j) => `<tr><th scope="row">${thuCua(r.d)} ${ngayDu(r.d)}</th><td>${kyCua(r.d)}</td><td>${so(r.c)}</td><td>${tbChu('c', j) ?? ''}</td><td>${so(r.i)}</td><td>${tbChu('i', j) ?? ''}</td><td>${vt(r.p)}</td><td>${tbChu('p', j) ?? ''}</td><td>${esc(trongDot(r.d).join(', '))}</td><td>${doiTheoNgay.get(r.d) || ''}</td></tr>`).join('');
  return { svg: s, dl, bang };
}

// ---------------- Bang ----------------
function bangNhom(ds, cotDau, them) {
  if (!ds || !ds.length) return '<p class="mo">Không có số liệu.</p>';
  const dong = ds.map((g) => `<tr>
      <th scope="row">${esc(g.ten)}${them ? them(g) : ''}</th>
      <td>${so(g.iT)} → ${so(g.iS)}<br><span class="phu">${doiTi(g.iT, g.iS)}</span></td>
      <td>${so(g.cT)} → ${so(g.cS)}<br><span class="phu">${doiTi(g.cT, g.cS)}</span></td>
      <td>${g.ro ? `${vt(g.ro.pT)} → ${vt(g.ro.pS)}<br><span class="phu">${hang(g.ro.d)} · ${g.ro.n} dòng</span>` : '—'}</td>
      <td>${g.tiLeMat ? ptTron(g.tiLeMat) : '—'}</td>
      <td>${g.loai ? chip(g.loai) : '<span class="mo">ít số</span>'}${g.matNhieu ? `<br>${chip('mat')}` : ''}</td>
    </tr>`).join('');
  return `<div class="cuon"><table class="bang-so">
    <thead><tr><th scope="col">${esc(cotDau)}</th><th scope="col">Hiển thị</th><th scope="col">Nhấp</th><th scope="col">Vị trí trên rổ cố định</th><th scope="col">Hiển thị mất</th><th scope="col">Xếp loại</th></tr></thead>
    <tbody>${dong}</tbody></table></div>`;
}
function bangDong(rows, kieu, gioiHan = 40) {
  if (!rows || !rows.length) return '<p class="mo">Không có.</p>';
  const ds = rows.slice(0, gioiHan);
  const dong = ds.map((r) => {
    const ghi = [];
    if (r.itSoLieu) ghi.push('kỳ sau ít số (dưới 5 hiển thị)');
    if (r.tuIt) ghi.push(`kỳ trước chỉ ${so(r.iTGoc)} hiển thị — chưa so được vị trí`);
    if (r.phuThem) ghi.push('hiển thị tăng mạnh — vị trí TB có thể bị kéo xuống vì phủ thêm người tìm / truy vấn mới');
    if (r.doiNoiDung && r.doiNoiDung.length) ghi.push('site sửa nội dung ' + r.doiNoiDung.map(ngayVn).join(', '));
    if (r.saoBat) ghi.push('bật điểm sao ' + ngayVn(r.saoBat));
    if (r.doiTruocKy && r.doiTruocKy.length) ghi.push('đổi trước kỳ trước ' + r.doiTruocKy.slice(-2).map(ngayVn).join(', '));
    if (kieu === 'trang' && r.tonTai === false) ghi.push('không còn trang này trên site');
    else if (kieu === 'trang' && r.trongSitemap === false) ghi.push('không có trong sitemap (đã gộp / chuyển hướng / canonical sang trang khác)');
    const ten = kieu === 'q'
      ? `${esc(r.q)}<br><span class="phu">${esc(r.tenCum)}</span>`
      : `<a href="https://xomleo.vn${esc(r.duong)}">${esc(r.duong)}</a><br><span class="phu">${esc([TEN_NN[r.ngonNgu], r.tenBac, r.title].filter(Boolean).join(' · '))}${r.cumDich && r.cumDich.length ? ' · cụm: ' + esc(r.cumDich.join(', ')) : ''}</span>`;
    return `<tr><th scope="row">${ten}</th><td>${so(r.iT)} → ${so(r.iS)}</td><td>${so(r.cT)} → ${so(r.cS)}</td><td>${vt(r.pT)} → ${vt(r.pS)}<br><span class="phu">${r.pT != null && r.pS != null ? hang(r.pS - r.pT) : ''}</span></td><td>${chip(r.loai)}</td><td class="ghi-chu">${esc(ghi.join('; '))}</td></tr>`;
  }).join('');
  const bot = rows.length > gioiHan ? `<p class="mo">Còn ${rows.length - gioiHan} dòng nữa trong file .json cùng tên.</p>` : '';
  return `<div class="cuon"><table class="bang-so bang-dong">
    <thead><tr><th scope="col">${kieu === 'q' ? 'Truy vấn · cụm' : 'Trang · ngôn ngữ · bậc'}</th><th scope="col">Hiển thị</th><th scope="col">Nhấp</th><th scope="col">Vị trí</th><th scope="col">Xếp loại</th><th scope="col">Ghi chú</th></tr></thead>
    <tbody>${dong}</tbody></table></div>${bot}`;
}

export function taoHtml(kq) {
  const d = kq.dot;
  const xemSom = !!(kq.loiChan && kq.loiChan.length);
  const mucKL = { ...MUC_KL, ...(xemSom ? { xau: ['warning', 'Chờ đợt xong'] } : {}) };
  const tv = kq.truyVan || [], tr = kq.trang || [];
  const loc = (ds, f) => ds.filter(f);
  const sau = (r) => (r.iTGoc ?? r.iT) + r.iS;
  const mat12 = (r) => r.loai === 'mat' && r.pT != null && r.pT <= 20;
  const trKhongSua = loc(tr, (r) => !r.tuSua);
  const tm = { q: loc(tv, (r) => r.loai === 'tut-manh' && !r.phuThem), t: loc(trKhongSua, (r) => r.loai === 'tut-manh' && !r.phuThem) };
  const mat12s = { q: loc(tv, mat12), t: loc(trKhongSua, mat12) };
  const tuSua = loc(tr, (r) => r.tuSua);
  const doiTruoc = loc(trKhongSua, (r) => r.doiTruocKy && r.doiTruocKy.length);
  const nhom = (ds) => ({ q: loc(tv, (r) => ds.includes(r.loai)), t: loc(trKhongSua, (r) => ds.includes(r.loai)) });
  const tPhu = { q: loc(tv, (r) => r.loai === 'tut-manh' && r.phuThem), t: loc(trKhongSua, (r) => r.loai === 'tut-manh' && r.phuThem) };
  const tVua = nhom(['tut-vua']);
  const matKhac = { q: loc(tv, (r) => r.loai === 'mat' && !mat12(r)), t: loc(trKhongSua, (r) => r.loai === 'mat' && !mat12(r)) };
  const nhe = nhom(['tut-nhe']), len = nhom(['len-nhe', 'len-vua', 'len-manh']), moi = nhom(['moi']);
  const bd = bieuDoNgay(kq);
  const bien = kq.bienDung || {};
  const T = kq.tongT, S = kq.tongS;

  const khoiXemSom = xemSom ? `
  <div class="bang-xem-som" role="note">
    <p><strong>Xem sớm — chưa kết luận được.</strong> Chưa đạt ${kq.loiChan.length} điều kiện so sánh (của Google và quy ước site):</p>
    <ul>${kq.loiChan.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
  </div>` : '';
  // Canh bao / ghi chu: nhan chu nhin thay duoc (khong chi khac mau cham)
  const ghiChuDau = (kq.canhBao.length || kq.thongTin.length) ? `
  <ul class="ds-ghi">${kq.canhBao.map((s) => `<li><i class="cham-tt tt-warning" aria-hidden="true"></i><span class="nhan-kl">Cảnh báo</span><span>${esc(s)}</span></li>`).join('')}${kq.thongTin.map((s) => `<li><i class="cham-tt tt-trung" aria-hidden="true"></i><span class="nhan-kl">Ghi chú</span><span>${esc(s)}</span></li>`).join('')}</ul>` : '';

  const ketLuan = kq.ketLuan.map((x) => `<li><i class="cham-tt tt-${mucKL[x.muc][0]}" aria-hidden="true"></i><span class="nhan-kl">${mucKL[x.muc][1]}</span><span>${esc(x.chu)}</span></li>`).join('');

  const o = (nhan, gt, phu) => `<div><dt>${nhan}</dt><dd>${gt}</dd>${phu ? `<dd class="phu">${phu}</dd>` : ''}</div>`;
  const mucChu = (m) => ({ trong: 'trong dao động thường', 'de-y': 'hơn dao động thường', vuot: 'hơn 2 lần dao động' }[m] || '');
  const pb = kq.phanBo;
  const tomTat = T && S ? `
  <dl class="tom-tat">
    ${o('Lượt nhấp / kỳ', `${so(T.c * kq.heSoQuyDoi)} → ${so(S.c)}`, `${pt(kq.doi && kq.doi.c)} · ${mucChu(kq.mucDoi && kq.mucDoi.c)} (±${ptTron(bien.c)})`)}
    ${o('Lượt hiển thị / kỳ', `${so(T.i * kq.heSoQuyDoi)} → ${so(S.i)}`, `${pt(kq.doi && kq.doi.i)} · ${mucChu(kq.mucDoi && kq.mucDoi.i)} (±${ptTron(bien.i)})`)}
    ${o('CTR', `${ptTron(T.ctr)} → ${ptTron(S.ctr)}`, kq.doi && kq.doi.ctr != null ? `${kq.doi.ctr >= 0 ? '+' : '−'}${Math.abs(kq.doi.ctr * 100).toFixed(1).replace('.', ',')} điểm %` : '')}
    ${kq.roSite ? o('Vị trí trên rổ truy vấn cố định', `${vt(kq.roSite.pT)} → ${vt(kq.roSite.pS)}`, `${hang(kq.roSite.d)} · ${kq.roSite.n} truy vấn có ở cả hai kỳ · phủ ${T.i ? ptTron(kq.roSite.w / T.i) : '—'} tổng hiển thị`) : o('Vị trí trung bình (cả site)', `${vt(T.p)} → ${vt(S.p)}`, 'trộn cả truy vấn mới / mất — xem rổ cố định khi có hai file tuần')}
    ${kq.tiLeMatSite != null ? o('Hiển thị ở truy vấn đã mất', ptTron(kq.tiLeMatSite), 'truy vấn kỳ trước đủ ngưỡng, kỳ sau không còn dòng nào') : ''}
    ${pb && pb.tongT && pb.tongS ? o('Truy vấn ẩn danh / ngoài bảng', `${ptTron(pb.anT / pb.tongT)} → ${ptTron(pb.anS / pb.tongS)}`, 'phần hiển thị không đọc được hạng') : ''}
  </dl>` : '';

  const khoiBieuDo = bd ? `
  <section aria-labelledby="h-ngay">
    <h2 id="h-ngay">Theo ngày</h2>
    <p class="mo">Biến động có trùng lúc Google chạy đợt cập nhật không, hay bắt đầu từ trước — và có trùng ngày site tự sửa nội dung không. Rê chuột, chạm, hoặc chọn biểu đồ rồi dùng phím ← → để xem từng ngày.</p>
    <div class="chu-giai">
      <span><i class="k-duong k-tb" aria-hidden="true"></i>Trung bình 7 ngày</span>
      <span><i class="k-duong k-ngay" aria-hidden="true"></i>Từng ngày</span>
      <span><i class="k-vung" aria-hidden="true"></i>Google đang chạy đợt cập nhật</span>
      <span><i class="k-vach" aria-hidden="true"></i>Ngày site đổi nội dung (lastmod sitemap)</span>
    </div>
    <p class="mo goi-y-keo" id="goi-y-keo" hidden>Biểu đồ rộng hơn màn hình: đang hiện các tuần gần nhất — kéo ngang để xem các tuần trước.</p>
    <div class="khung-bd" id="khung-ngay" tabindex="0" role="group" aria-label="Biểu đồ theo ngày. Dùng phím mũi tên trái phải để xem từng ngày, Page Up / Page Down để nhảy một tuần.">${bd.svg}<div class="goi-y" id="goi-y-ngay" hidden></div></div>
    <p class="sr" id="doc-ngay" role="status" aria-live="polite"></p>
    <details><summary>Bảng số theo ngày</summary>
      <div class="cuon"><table class="bang-so bang-ngay"><thead><tr><th scope="col">Ngày</th><th scope="col">Kỳ</th><th scope="col">Nhấp</th><th scope="col">TB 7 ngày</th><th scope="col">Hiển thị</th><th scope="col">TB 7 ngày</th><th scope="col">Vị trí</th><th scope="col">TB 7 ngày</th><th scope="col">Đợt cập nhật</th><th scope="col">Trang site đổi</th></tr></thead><tbody>${bd.bang}</tbody></table></div>
    </details>
    ${kq.bien && kq.bien.khoi ? `<details><summary>Các tuần dùng để đo dao động thường (${kq.bien.soCap} cặp tuần liền nhau sạch)</summary>
      <div class="cuon"><table class="bang-so"><thead><tr><th scope="col">Tuần</th><th scope="col">Nhấp</th><th scope="col">Hiển thị</th><th scope="col">Vị trí TB</th><th scope="col">Bỏ khỏi phép đo vì</th></tr></thead><tbody>
      ${kq.bien.khoi.map((k) => `<tr><th scope="row">${ngayVn(k.tu)} – ${ngayVn(k.den)}</th><td>${so(k.c)}</td><td>${so(k.i)}</td><td>${vt(k.p)}</td><td class="ghi-chu">${k.dinh ? esc((k.lyDo || []).join('; ')) : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="mo">${kq.bien.c != null ? `Độ lệch chuẩn của mức đổi tuần-sang-tuần trên ${kq.bien.soCap} cặp tuần sạch: nhấp ±${ptTron(kq.bien.c)}, hiển thị ±${ptTron(kq.bien.i)}, vị trí ±${kq.bien.p == null ? '—' : kq.bien.p.toFixed(2).replace('.', ',')}. Ít cặp nên chỉ là ước lượng thô; hai tuần cách xa nhau thường lệch nhiều hơn hai tuần liền nhau (mùa vụ trôi dần), nên đây là mức tối thiểu.` : `Chỉ có ${kq.bien.soCap} cặp tuần sạch — chưa đủ để đo; báo cáo dùng biên tham khảo ${esc(bien.nguon || '')}.`}</p>
    </details>` : ''}
  </section>` : '';

  const coHaiKy = kq.cheDo === 'hai-ky';
  const lenhDot = d.key === 'tu-khai' ? `--bat-dau ${d.batDau}${d.xong ? ' --xong ' + d.xong : ''}` : `--dot ${d.key}`;
  const khoiNhom = coHaiKy ? `
  <section aria-labelledby="h-nhom">
    <h2 id="h-nhom">Nhóm nào đổi</h2>
    <p class="mo">Đọc cột <strong>Vị trí trên rổ cố định</strong> trước: chỉ tính các dòng có ở cả hai kỳ, trọng số là hiển thị kỳ trước — ít bị mùa vụ và truy vấn mới làm xê dịch hơn tổng (nhưng không giữ cơ cấu thiết bị bên trong từng dòng). Cột <strong>Hiển thị mất</strong> là phần hiển thị kỳ trước nằm ở dòng đủ ngưỡng mà kỳ sau không còn (thường là tụt rất sâu).</p>
    <h3>Tên quán / không tên quán</h3>
    ${bangNhom(kq.tenQuan, 'Nhóm truy vấn')}
    <h3>Cụm chủ đề <span class="phu">(tools/cum-chu-de.json, không tính cụm nhiễu)</span></h3>
    ${bangNhom((kq.cum || []).filter((c) => c.kieu !== 'nhieu'), 'Cụm', (g) => (g.dich ? `<br><span class="phu">${esc(g.dich)}</span>` : ''))}
    <h3>Ngôn ngữ trang</h3>
    ${bangNhom(kq.ngonNgu, 'Ngôn ngữ')}
    <h3>Bậc DLN của trang</h3>
    ${bangNhom(kq.bacDln, 'Bậc')}
    ${kq.doiChung && kq.doiChung.length ? `<h3>Trang theo lần site tự sửa</h3>
    <p class="mo">Nhóm “không đổi” là đối chứng sạch nhất: nó tụt cùng các nhóm khác thì nghiêng về Google hoặc mùa vụ; chỉ nhóm vừa đổi tụt thì xem lại thay đổi của mình trước.</p>
    ${bangNhom(kq.doiChung, 'Nhóm trang')}` : ''}
    ${kq.thiTruong ? `<h3>Thị trường (quốc gia người tìm)</h3>
    <div class="cuon"><table class="bang-so"><thead><tr><th scope="col">Thị trường</th><th scope="col">Hiển thị</th><th scope="col">Nhấp</th><th scope="col">Vị trí TB</th></tr></thead><tbody>
      ${kq.thiTruong.map((g) => `<tr><th scope="row">${esc(g.ten)}</th><td>${so(g.iT)} → ${so(g.iS)}<br><span class="phu">${doiTi(g.iT, g.iS)}</span></td><td>${so(g.cT)} → ${so(g.cS)}<br><span class="phu">${doiTi(g.cT, g.cS)}</span></td><td>${vt(g.pT)} → ${vt(g.pS)}</td></tr>`).join('')}
    </tbody></table></div>
    <details><summary>15 quốc gia nhiều hiển thị nhất</summary><div class="cuon"><table class="bang-so"><thead><tr><th scope="col">Quốc gia</th><th scope="col">Hiển thị</th><th scope="col">Nhấp</th><th scope="col">Vị trí TB</th></tr></thead><tbody>
      ${(kq.quocGia || []).map((g) => `<tr><th scope="row">${esc(g.ten)}</th><td>${so(g.iT)} → ${so(g.iS)}</td><td>${so(g.cT)} → ${so(g.cS)}</td><td>${vt(g.pT)} → ${vt(g.pS)}</td></tr>`).join('')}
    </tbody></table></div></details>` : ''}
    ${kq.thietBi ? `<h3>Thiết bị</h3>
    <div class="cuon"><table class="bang-so"><thead><tr><th scope="col">Thiết bị</th><th scope="col">Hiển thị</th><th scope="col">Nhấp</th><th scope="col">Vị trí TB</th></tr></thead><tbody>
      ${kq.thietBi.map((g) => `<tr><th scope="row">${esc(g.ten)}</th><td>${so(g.iT)} → ${so(g.iS)}<br><span class="phu">${doiTi(g.iT, g.iS)}</span></td><td>${so(g.cT)} → ${so(g.cS)}<br><span class="phu">${doiTi(g.cT, g.cS)}</span></td><td>${vt(g.pT)} → ${vt(g.pS)}</td></tr>`).join('')}
    </tbody></table></div>` : ''}
    ${kq.hinhThuc ? `<h3>Hình thức xuất hiện</h3><ul class="ds">${kq.hinhThuc.map((g) => `<li>${esc(g.ten)}: ${so(g.iT)} → ${so(g.iS)} hiển thị</li>`).join('')}</ul>` : ''}
  </section>

  <section aria-labelledby="h-gt">
    <h2 id="h-gt">Năm giả thuyết ghi từ trước</h2>
    <p class="mo">Ghi vào <code>tools/do-luong.md</code> mục 13 trước khi có số, để lúc đọc báo cáo không tự “tìm ra” nguyên nhân theo ý mình. Mỗi giả thuyết là một nhóm trang; nhóm nào tụt rõ thì bắt đầu xem từ đó.</p>
    <div class="cuon"><table class="bang-so"><thead><tr><th scope="col">Giả thuyết</th><th scope="col">Trang</th><th scope="col">Hiển thị</th><th scope="col">Vị trí trên rổ cố định</th><th scope="col">Tụt mạnh / mất</th><th scope="col">Xếp loại</th></tr></thead><tbody>
      ${(kq.giaThuyet || []).map((g) => `<tr><th scope="row">${esc(g.key)} · ${esc(g.ten)}<br><span class="phu">${esc(g.vi)}</span></th><td>${g.soDong}</td><td>${so(g.iT)} → ${so(g.iS)}<br><span class="phu">${doiTi(g.iT, g.iS)}</span></td><td>${g.ro ? `${vt(g.ro.pT)} → ${vt(g.ro.pS)}<br><span class="phu">${hang(g.ro.d)}</span>` : '—'}</td><td>${g.canXem ?? 0}</td><td>${g.loai ? chip(g.loai) : '<span class="mo">ít số</span>'}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="mo">H1, H3 chỉ tính bản VI + EN nên không trùng H2. H4, H5 có thể trùng trang với H1, H2, H3 (một bài mùa vụ vừa sửa và các bản dịch của nó nằm ở nhiều nhóm) — đọc cột Trang trước khi cộng dồn kết luận.</p>
  </section>

  <section aria-labelledby="h-sau">
    <h2 id="h-sau">Cần đánh giá sâu — tụt mạnh (kiểu 4 → 29) hoặc mất hẳn hiển thị</h2>
    ${xemSom ? '<p class="ghi-xem-som"><strong>Xem sớm:</strong> chưa sửa gì tới hết 7 ngày sau khi đợt xong — danh sách này còn đổi.</p>' : ''}
    <p class="mo">Đang ở trang 1–2 mà tụt từ 10 bậc trở lên, hoặc mất hẳn hiển thị, và site không tự sửa trang đó trong cửa sổ. Google: “Do a deeper assessment.” Trang mất hẳn: kiểm bằng Kiểm tra URL trong Search Console trước (còn được lập chỉ mục không, có bị chặn không). Với từng trang: mở kết quả Google thật cho truy vấn đó, xem ai lên thay và họ trả lời được điều gì trang mình chưa có; rồi tự hỏi theo bộ câu hỏi <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content">Creating helpful, reliable, people-first content</a>. Một trang lẻ tụt thì xem trang đó; tụt rộng trên nhiều cụm, kéo dài từ 2 tuần trở lên thì tự đánh giá cả site. Sửa từng trang, không sửa hàng loạt.</p>
    <h3>Truy vấn tụt mạnh</h3>${bangDong(tm.q, 'q')}
    <h3>Trang tụt mạnh</h3>${bangDong(tm.t, 'trang')}
    <h3>Mất hẳn hiển thị khi đang ở trang 1–2</h3>${bangDong(mat12s.q, 'q')}${bangDong(mat12s.t, 'trang')}
  </section>

  <section aria-labelledby="h-tu-sua">
    <h2 id="h-tu-sua">Trang site tự sửa trong cửa sổ ${kq.cuaSo ? `${ngayVn(kq.cuaSo.tu)} – ${ngayVn(kq.cuaSo.den)}` : ''}</h2>
    <p class="mo">Đổi nội dung (lastmod sitemap) hoặc bật điểm sao trong cửa sổ so sánh. Biến động của các trang này có thể do chính thay đổi của mình — xem lại thay đổi (git log) trước khi đổ cho Google.</p>
    ${bangDong([...tuSua].sort((a, b) => sau(b) - sau(a)), 'trang')}
    ${doiTruoc.length ? `<details><summary>Trang đổi trong 3 tuần trước kỳ trước (${doiTruoc.length} trang có xếp loại)</summary>
      <p class="mo">Google cần vài ngày tới vài tuần để thu thập lại, nên thay đổi lúc đó có thể còn ngấm vào cả hai kỳ.</p>
      ${bangDong([...doiTruoc].sort((a, b) => sau(b) - sau(a)), 'trang')}</details>` : ''}
    ${kq.lichSu && kq.lichSu.commits.length ? `<details><summary>${kq.lichSu.commits.length} commit sửa trang trong cửa sổ</summary><ul class="ds ds-commit">${kq.lichSu.commits.slice(0, 80).map((c) => `<li><code>${esc(c.sha)}</code> ${ngayVn(c.ngay)} — ${esc(c.tieuDe)}</li>`).join('')}</ul>${kq.lichSu.commits.length > 80 ? `<p class="mo">Còn ${kq.lichSu.commits.length - 80} commit (git log).</p>` : ''}</details>` : '<p class="mo">Không có commit nào sửa trang trong cửa sổ.</p>'}
  </section>

  <section aria-labelledby="h-khac">
    <h2 id="h-khac">Các nhóm còn lại</h2>
    <p class="mo">Trang site tự sửa nằm riêng ở mục trên, không lặp lại ở đây.</p>
    <details><summary>Tụt vừa — theo dõi thêm 1–2 tuần (${tVua.q.length + tPhu.q.length} truy vấn, ${tVua.t.length + tPhu.t.length} trang)</summary>
      <p class="mo">Rơi xuống trang 2 hoặc tụt 5–9 bậc; kèm các dòng tụt mạnh nhưng hiển thị tăng mạnh (vị trí TB bị kéo xuống vì phủ thêm người tìm mới). Xem kết quả Google thật trước khi làm gì.</p>
      ${bangDong([...tVua.q, ...tPhu.q], 'q')}${bangDong([...tVua.t, ...tPhu.t], 'trang')}</details>
    <details><summary>Mất hiển thị khi đang ở trang 3 trở xuống (${matKhac.q.length} truy vấn, ${matKhac.t.length} trang)</summary>
      <p class="mo">Kỳ trước đủ ngưỡng, kỳ sau không còn dòng nào: tụt sâu hơn nữa, hết mùa, hoặc trang ra khỏi chỉ mục — kiểm bằng công cụ Kiểm tra URL trong Search Console.</p>
      ${bangDong(matKhac.q, 'q')}${bangDong(matKhac.t, 'trang')}</details>
    <details><summary>Tụt nhẹ — không sửa (${nhe.q.length} truy vấn, ${nhe.t.length} trang)</summary>
      <p class="mo">Vẫn ở trang 1, tụt dưới 5 bậc (rộng hơn ví dụ 2 → 4 của Google). Google: “There's no need to take drastic action” — và tránh sửa nội dung đang chạy tốt.</p>
      ${bangDong(nhe.q, 'q')}${bangDong(nhe.t, 'trang')}</details>
    <details><summary>Lên hạng (${len.q.length} truy vấn, ${len.t.length} trang) · mới nổi (${moi.q.length} truy vấn, ${moi.t.length} trang)</summary>
      <p class="mo">“Mới nổi”: kỳ trước không có hoặc dưới ngưỡng, kỳ sau đủ ngưỡng — chưa so được vị trí.</p>
      ${bangDong(len.q, 'q')}${bangDong(len.t, 'trang')}${bangDong(moi.q, 'q')}${bangDong(moi.t, 'trang')}</details>
  </section>` : `
  <section aria-labelledby="h-chi-tong">
    <h2 id="h-chi-tong">Chỉ có tổng theo ngày</h2>
    <p class="mo">File --ca-ky chỉ cho tổng của cả site mỗi ngày. Muốn biết nhóm truy vấn, trang, ngôn ngữ nào đổi thì xuất thêm hai file một tuần (kỳ trước, kỳ sau) và chạy lại với --truoc / --sau.</p>
    ${kq.lichSu && kq.lichSu.commits.length ? `<details><summary>${kq.lichSu.commits.length} commit sửa trang từ ${ngayVn(kq.cuaSo.tu)} tới ${ngayVn(kq.cuaSo.den)}</summary><ul class="ds ds-commit">${kq.lichSu.commits.slice(0, 80).map((c) => `<li><code>${esc(c.sha)}</code> ${ngayVn(c.ngay)} — ${esc(c.tieuDe)}</li>`).join('')}</ul></details>` : ''}
    ${kq.lichSu && kq.lichSu.commitsTruoc && kq.lichSu.commitsTruoc.length ? `<details><summary>${kq.lichSu.commitsTruoc.length} commit sửa trang trong 3 tuần trước kỳ trước</summary><ul class="ds ds-commit">${kq.lichSu.commitsTruoc.slice(0, 80).map((c) => `<li><code>${esc(c.sha)}</code> ${ngayVn(c.ngay)} — ${esc(c.tieuDe)}</li>`).join('')}</ul></details>` : ''}
  </section>`;

  // Phat hay khong: core update khong nham site nao; spam update THI CO ha site vi pham, tu dong, khong bao
  const docPhat = d.loai === 'spam'
    ? 'Spam update là hệ thống tự động (SpamBrain): site vi phạm chính sách spam “may rank lower in results or not appear in results at all” mà <strong>không có thông báo</strong> trong Search Console — mục <em>Thao tác thủ công</em> chỉ ghi án do người của Google xét. Tụt trùng đợt spam thì đọc lại <a href="https://developers.google.com/search/docs/essentials/spam-policies">chính sách spam</a>, nhất là nội dung nhân bản theo quy mô (H2: bản dịch tự động).'
    : d.loai === 'core'
      ? 'Tụt đúng lúc có core update <strong>không có nghĩa là bị phạt</strong>: Google nói core update “don\'t target specific sites or individual web pages”. Trùng thời gian là chỗ để điều tra, chưa phải nguyên nhân. Án do người của Google xét thì ghi ở mục <em>Thao tác thủ công</em> trong Search Console.'
      : 'Tụt đúng lúc có đợt cập nhật chưa chắc là do đợt đó: trùng thời gian là chỗ để điều tra, chưa phải nguyên nhân. Án do người của Google xét thì ghi ở mục <em>Thao tác thủ công</em>; spam update hạ site vi phạm tự động, không báo trong Search Console.';

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Đối chiếu ${esc(d.ten)}${xemSom ? ' (xem sớm)' : ''}</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Signika:wght@400;600&display=swap">
<style>
:root {
  --bg: #FBF7EF; --mat: #FFFDF8; --muc: #2B1C10; --muc-2: #5C4A36; --muc-3: #7A6650; --ke: #E4D8C4; --vien: #CBB896;
  --dong: #8A5A1C; --vung: #F1E8D8; --s-chinh: #2a78d6; --s-doi: #eb6834;
  --st-good: #0ca30c; --st-warning: #fab219; --st-serious: #ec835a; --st-critical: #d03b3b; --st-trung: #A89A86;
  --f-tieu-de: 'Oswald', 'Arial Narrow', Arial, sans-serif; --f-than: 'Signika', 'Segoe UI', system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #1D1610; --mat: #261D15; --muc: #F0E4CC; --muc-2: #CDBB9C; --muc-3: #A8977C; --ke: #3A2E22; --vien: #5A4834;
  --dong: #D9AE62; --vung: #33281D; --s-chinh: #3987e5; --s-doi: #d95926; --st-trung: #6E6352; color-scheme: dark; } }
:root[data-theme="dark"] {
  --bg: #1D1610; --mat: #261D15; --muc: #F0E4CC; --muc-2: #CDBB9C; --muc-3: #A8977C; --ke: #3A2E22; --vien: #5A4834;
  --dong: #D9AE62; --vung: #33281D; --s-chinh: #3987e5; --s-doi: #d95926; --st-trung: #6E6352; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--muc); font: 16px/1.6 var(--f-than); }
.trang { max-width: 1040px; margin: 0 auto; padding: 2.5rem 16px 4rem; display: grid; gap: 2.6rem; }
h1, h2, h3 { font-family: var(--f-tieu-de); font-weight: 600; line-height: 1.15; text-wrap: balance; margin: 0; }
h1 { font-size: clamp(1.9rem, 1.3rem + 2.4vw, 2.9rem); letter-spacing: .01em; }
h2 { font-size: 1.5rem; letter-spacing: .02em; }
h3 { font-size: 1.12rem; margin-top: .6rem; }
p { margin: 0; max-width: 72ch; }
a { color: var(--dong); text-underline-offset: 3px; overflow-wrap: anywhere; }
a:focus-visible, summary:focus-visible, .khung-bd:focus-visible { outline: 2px solid var(--dong); outline-offset: 3px; }
.mat-ngoai { font-family: var(--f-tieu-de); font-weight: 500; text-transform: uppercase; letter-spacing: .14em; font-size: .8rem; color: var(--dong); }
section, header.dau { display: grid; gap: 1rem; min-width: 0; }
.ky { color: var(--muc-2); }
.mo, .phu { color: var(--muc-2); }
.phu { font-size: .82rem; font-weight: 400; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.bang-xem-som { border: 2px solid var(--st-critical); background: var(--mat); padding: 1rem 1.2rem; display: grid; gap: .5rem; }
.ghi-xem-som { border-left: 4px solid var(--st-warning); padding: .4rem .8rem; background: var(--mat); }
.bang-xem-som ul { margin: 0; padding-left: 1.2rem; display: grid; gap: .35rem; }
.ds-ghi, .ket-luan { list-style: none; margin: 0; padding: 0; display: grid; }
.ds-ghi { gap: .35rem; font-size: .92rem; color: var(--muc-2); }
.ket-luan { gap: .7rem; }
.ds-ghi li, .ket-luan li { display: grid; grid-template-columns: 14px 5.6rem 1fr; gap: .6rem; align-items: baseline; }
@media (max-width: 30rem) { .ds-ghi li, .ket-luan li { grid-template-columns: 14px 1fr; } .ds-ghi li > span:last-child, .ket-luan li > span:last-child { grid-column: 2; } }
.nhan-kl { font-family: var(--f-tieu-de); font-weight: 500; font-size: .82rem; letter-spacing: .06em; text-transform: uppercase; color: var(--muc-2); white-space: nowrap; }
.cham-tt { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex: none; box-shadow: 0 0 0 2px var(--mat); }
.tt-good { background: var(--st-good); } .tt-warning { background: var(--st-warning); } .tt-serious { background: var(--st-serious); }
.tt-critical { background: var(--st-critical); } .tt-trung { background: var(--st-trung); }
.chip { display: inline-flex; align-items: center; gap: .4rem; font-size: .8rem; font-weight: 600; padding: .05rem .5rem; border: 1px solid var(--ke); border-radius: 999px; white-space: nowrap; color: var(--muc); }
/* flex: hang cuoi tu gian ra, khong de lai o trong mau nen ke */
.tom-tat { display: flex; flex-wrap: wrap; gap: 1px; background: var(--ke); border: 1px solid var(--ke); margin: 0; }
.tom-tat > div { flex: 1 1 150px; background: var(--mat); padding: .9rem 1rem; display: grid; gap: .1rem; align-content: start; }
.tom-tat dt { font-size: .85rem; color: var(--muc-2); }
.tom-tat dd { margin: 0; font-family: var(--f-than); font-weight: 600; font-size: 1.25rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
.tom-tat dd.phu { font-size: .82rem; font-weight: 400; white-space: normal; }
.chu-giai { display: flex; flex-wrap: wrap; gap: .4rem 1.4rem; font-size: .88rem; color: var(--muc-2); align-items: center; }
.chu-giai span { display: inline-flex; align-items: center; gap: .45rem; }
.k-duong { width: 18px; height: 0; border-top: 2px solid var(--s-chinh); display: inline-block; }
.k-ngay { border-top: 1px solid var(--muc-3); }
.k-vung { width: 14px; height: 12px; background: var(--vung); border: 1px solid var(--ke); display: inline-block; }
.k-vach { width: 3px; height: 10px; background: var(--s-doi); border-radius: 1px; display: inline-block; }
.khung-bd { position: relative; overflow-x: auto; background: var(--mat); border: 1px solid var(--ke); }
.bd-ngay { display: block; min-width: 860px; width: 100%; height: auto; }
.bd-ngay .vung-dot { fill: var(--vung); }
.bd-ngay .luoi { stroke: var(--ke); stroke-width: 1; }
.bd-ngay .truc { fill: var(--muc-3); font: 12px var(--f-than); font-variant-numeric: tabular-nums; }
.bd-ngay .ten-khung { fill: var(--muc-2); font: 600 13px var(--f-than); }
.bd-ngay .nhan-vung, .bd-ngay .nhan-ngoac { fill: var(--muc-2); font: 12px var(--f-than); }
.bd-ngay .ngoac { fill: none; stroke: var(--muc-2); stroke-width: 1; }
.bd-ngay .mep-ky { stroke: var(--vien); stroke-width: 1; }
.bd-ngay .duong-ngay { fill: none; stroke: var(--muc-3); stroke-width: 1; stroke-opacity: .6; stroke-linejoin: round; }
.bd-ngay .duong-tb { fill: none; stroke: var(--s-chinh); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.bd-ngay .vach-doi { fill: var(--s-doi); }
.bd-ngay .truc-doc { stroke: var(--muc-2); stroke-width: 1; }
.bd-ngay .cham-tb { fill: var(--s-chinh); stroke: var(--mat); stroke-width: 2; }
.bd-ngay .lop-cham { fill: transparent; cursor: crosshair; touch-action: pan-x pan-y; }
.goi-y { position: absolute; pointer-events: none; background: var(--muc); color: var(--bg); padding: .55rem .7rem; font-size: .85rem; line-height: 1.45; width: 240px; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
.goi-y .ngay { font-family: var(--f-tieu-de); font-weight: 500; font-size: 1rem; }
.goi-y .so { font-weight: 600; }
/* details la khoi thuong (khong grid) va min-width 0: khong thi bang ben trong day ca trang tran ngang o man hep */
details { display: block; min-width: 0; }
details > * + * { margin-top: .6rem; }
details summary { cursor: pointer; color: var(--muc-2); font-size: .92rem; }
.cuon { overflow-x: auto; border: 1px solid var(--ke); background: var(--mat); max-width: 100%; }
table { border-collapse: collapse; width: 100%; font-size: .88rem; }
th, td { text-align: left; padding: .45rem .65rem; border-bottom: 1px solid var(--ke); vertical-align: top; }
thead th { font-family: var(--f-tieu-de); font-weight: 500; letter-spacing: .04em; color: var(--muc-2); white-space: nowrap; }
td { font-variant-numeric: tabular-nums; white-space: nowrap; }
td.ghi-chu { white-space: normal; min-width: 12rem; color: var(--muc-2); font-size: .82rem; }
tbody th { font-weight: 600; min-width: 13rem; overflow-wrap: anywhere; }
.bang-dong tbody th { font-weight: 400; }
.bang-ngay tbody th { min-width: 0; white-space: nowrap; font-weight: 400; font-variant-numeric: tabular-nums; }
ul.ds { margin: 0; padding-left: 1.2rem; display: grid; gap: .35rem; }
.ds-commit { font-size: .85rem; color: var(--muc-2); }
.luu-y { border: 1px solid var(--vien); padding: 1rem 1.2rem; display: grid; gap: .5rem; background: var(--mat); }
.luu-y ul, ol.buoc { margin: 0; padding-left: 1.2rem; display: grid; gap: .35rem; color: var(--muc-2); }
code { font-size: .88em; background: var(--vung); padding: 0 .3em; overflow-wrap: anywhere; }
</style>
</head>
<body>
<main class="trang">
  <header class="dau">
    <p class="mat-ngoai">Search Console · trước / sau đợt cập nhật</p>
    <h1>Đối chiếu ${esc(d.ten)}${xemSom ? ' <span class="phu">(xem sớm)</span>' : ''}</h1>
    <p class="ky">Google chạy đợt này từ ${ngayDu(d.batDau)} tới ${d.xong ? ngayDu(d.xong) : '<strong>chưa xong</strong>'} (giờ Pacific, theo <a href="${esc(d.nguon || 'https://status.search.google.com/summary')}">Search Status Dashboard</a>).
    ${kq.kyT ? `Kỳ trước ${ngayDu(kq.kyT.tu)} – ${ngayDu(kq.kyT.den)}` : ''}${kq.kyS ? `, kỳ sau ${ngayDu(kq.kyS.tu)} – ${ngayDu(kq.kyS.den)}` : ''}. Loại tìm kiếm: ${esc(kq.loaiTimKiem)}. Ngưỡng xếp loại: ${so(kq.nguong)} hiển thị / 7 ngày ở kỳ trước.</p>
    ${khoiXemSom}
    ${ghiChuDau}
  </header>

  <section aria-labelledby="h-kl">
    <h2 id="h-kl">Kết luận nhanh</h2>
    <ul class="ket-luan">${ketLuan}</ul>
    ${tomTat}
  </section>
${khoiBieuDo}
${khoiNhom}
  <section class="luu-y" aria-labelledby="h-gioi-han">
    <h2 id="h-gioi-han" style="font-size:1.15rem">Đọc cho đúng</h2>
    <ul>
      <li>${docPhat}</li>
      <li>Loại trừ nguyên nhân kỹ thuật trước: xem issue <code>[giam-sat]</code> của giám sát uptime từ ngày đợt bắt đầu tới hết kỳ sau, và Search Console → Cài đặt → Thống kê thu thập dữ liệu → Trạng thái máy chủ (robots.txt, DNS, kết nối) cùng khoảng đó. Web sập hay robots.txt lỗi trong cửa sổ cũng cho đúng hình “tụt trùng đợt”.</li>
      <li>Export chuẩn chỉ có 1.000 truy vấn đầu, không có truy vấn Google ẩn danh, và không nối truy vấn với trang. Vị trí trung bình của một trang là trộn mọi truy vấn của trang đó.</li>
      <li>Một tuần của site nhỏ ít số: chỉ xếp loại theo vị trí khi kỳ trước có từ ${so(kq.nguong)} hiển thị; kỳ sau dưới 5 hiển thị thì ghi “ít số” (vẫn xếp loại — tụt sâu thì hiển thị sập theo). Kết luận theo cụm và nhóm, đừng theo một truy vấn lẻ. Dao động thường đo từ ít cặp tuần nên chỉ là ước lượng thô.</li>
      <li>Ngày Search Console tính theo giờ Pacific (chậm hơn Việt Nam 14–15 giờ); ngày site đổi nội dung tính theo giờ Việt Nam, GA4 theo múi giờ của property — lệch nhau một ngày là bình thường.</li>
      <li>Khách đặt bàn: GA4 → Khám phá → Biểu mẫu tự do; hàng <em>Trang đích + chuỗi truy vấn</em>, giá trị <em>Số sự kiện</em>; lọc <em>Nguồn / phương tiện của phiên</em> = <code>google / organic</code> (không lấy <code>google_maps</code> — đó là Hồ sơ doanh nghiệp) và tên sự kiện <code>generate_lead</code>, <code>click_call</code>, <code>chat_open</code>; so hai kỳ (do-luong.md mục 13). Lead và cuộc gọi chỉ để xếp ưu tiên: một tuần quá ít đơn để gạt đi một lần tụt mạnh.</li>
    </ul>
    <h3>Đừng</h3>
    <ul>
      <li>Đừng sửa hàng loạt, đừng đổi URL, title, H1 của trang đang chạy tốt khi đợt còn chạy hoặc chưa đủ một tuần sau khi xong.</li>
      <li>Đừng sửa trang tụt nhẹ (kiểu 2 → 4), và đừng sửa theo báo cáo “xem sớm”.</li>
      <li>Sửa xong một trang tụt mạnh thì chờ: Google nói có thay đổi thấy sau vài ngày, có khi vài tháng, có khi phải chờ đợt core update sau.</li>
    </ul>
  </section>

  <section aria-labelledby="h-lam-lai">
    <h2 id="h-lam-lai" style="font-size:1.15rem">Làm lại báo cáo</h2>
    <ol class="buoc">
      <li>Search Console → Hiệu suất → Kết quả tìm kiếm → Ngày → Tuỳ chỉnh: 7 ngày ngay trước ngày bắt đầu → Xuất → Tải CSV. Lặp lại cho 7 ngày ngay sau ngày xong (xuất từ 10 ngày sau ngày xong). Thêm một file <em>6 tháng qua</em> cho biểu đồ theo ngày và dao động thường.</li>
      <li><code>node tools/doi-chieu-cap-nhat.mjs ${esc(lenhDot)} --truoc &lt;tuần trước&gt;.zip --sau &lt;tuần sau&gt;.zip --ca-ky &lt;6 tháng&gt;.zip --ra &lt;thư mục ngoài repo&gt;</code></li>
    </ol>
    <p class="mo">Tạo lúc ${esc((kq.taoLuc || '').slice(0, 16).replace('T', ' '))} UTC${kq.tep ? ` từ ${esc([kq.tep.truoc, kq.tep.sau, kq.tep.caKy].filter(Boolean).join(', '))}` : ''}.</p>
  </section>
</main>
${bd ? `<script type="application/json" id="du-lieu-ngay">${JSON.stringify(bd.dl).replace(/</g, '\\u003c')}</script>
<script>
(() => {
  const D = JSON.parse(document.getElementById('du-lieu-ngay').textContent);
  const khung = document.getElementById('khung-ngay'), svg = khung.querySelector('svg'), gy = document.getElementById('goi-y-ngay');
  const docNgay = document.getElementById('doc-ngay'), keo = document.getElementById('goi-y-keo');
  const doc = svg.querySelector('.truc-doc'), cham = [...svg.querySelectorAll('.cham-tb')], lop = svg.querySelector('.lop-cham');
  const n = D.ngay.length;
  let j0 = -1;
  const xCua = (j) => D.L + (j / (n - 1)) * (D.W - D.L - D.R);
  const jTu = (e) => { const sr = svg.getBoundingClientRect(); const x = (e.clientX - sr.left) / sr.width * D.W; return Math.round((x - D.L) / (D.W - D.L - D.R) * (n - 1)); };
  const dong = (nhan, so, them) => {
    const e = document.createElement('div');
    if (so != null) { const b = document.createElement('span'); b.className = 'so'; b.textContent = so; e.append(b, ' ' + nhan + (them ? ' · ' + them : '')); }
    else e.textContent = nhan;
    gy.append(e);
  };
  // cuon: dua ngay dang chon vao vung nhin cua khung (ban phim, cham tay); doc: doc cho trinh doc man hinh
  function hien(j, cuon, docTo) {
    j = Math.max(0, Math.min(n - 1, j)); j0 = j;
    const r = D.ngay[j], x = xCua(j);
    doc.setAttribute('x1', x); doc.setAttribute('x2', x); doc.removeAttribute('visibility');
    cham.forEach((c, m) => { const y = D.yTb[m][j]; if (y == null) c.setAttribute('visibility', 'hidden'); else { c.setAttribute('cx', x); c.setAttribute('cy', y); c.removeAttribute('visibility'); } });
    gy.replaceChildren();
    const t = document.createElement('div'); t.className = 'ngay'; t.textContent = r.nhan + (r.ky ? ' · kỳ ' + r.ky : ''); gy.append(t);
    dong('nhấp', r.c, r.tbC != null ? 'TB 7 ngày ' + r.tbC : '');
    dong('hiển thị', r.i, r.tbI != null ? 'TB 7 ngày ' + r.tbI : '');
    dong('vị trí TB', r.p, r.tbP != null ? 'TB 7 ngày ' + r.tbP : '');
    if (r.dot.length) dong('Google đang chạy: ' + r.dot.join(', '));
    if (r.doi) dong('Site đổi nội dung ' + r.doi + ' trang');
    gy.hidden = false;
    const kr = khung.getBoundingClientRect(), sr = svg.getBoundingClientRect(), k = sr.width / D.W;
    const xNoi = sr.left - kr.left + khung.scrollLeft + x * k, rong = khung.clientWidth;
    if (cuon && (xNoi < khung.scrollLeft + 24 || xNoi > khung.scrollLeft + rong - 24)) khung.scrollLeft = Math.max(0, xNoi - rong / 2);
    const w = gy.offsetWidth || 240, trai = khung.scrollLeft;
    let px = xNoi + 14;
    if (px + w > trai + rong - 4) px = xNoi - 14 - w;
    gy.style.left = Math.max(trai + 4, Math.min(px, trai + rong - w - 4)) + 'px'; gy.style.top = '10px';
    if (docTo) docNgay.textContent = r.nhan + (r.ky ? ', kỳ ' + r.ky : '') + ': ' + r.c + ' nhấp, ' + r.i + ' hiển thị, vị trí trung bình ' + r.p + (r.dot.length ? '; Google đang chạy ' + r.dot.join(', ') : '') + (r.doi ? '; site đổi nội dung ' + r.doi + ' trang' : '') + '.';
  }
  function an() { gy.hidden = true; doc.setAttribute('visibility', 'hidden'); cham.forEach((c) => c.setAttribute('visibility', 'hidden')); }
  lop.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') hien(jTu(e), false, false); });
  // Cham tay / bam: hien dung ngay vua cham (dat j0 truoc khi khung nhan focus — focus hien lai ngay nay,
  // khong nhay ve ngay cuoi), dua no vao vung nhin
  lop.addEventListener('pointerdown', (e) => { hien(jTu(e), e.pointerType === 'touch', true); });
  lop.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch' && document.activeElement !== khung) an(); });
  khung.addEventListener('focus', () => hien(j0 < 0 ? n - 1 : j0, true, true));
  khung.addEventListener('blur', an);
  khung.addEventListener('keydown', (e) => {
    const buoc = { ArrowRight: 1, ArrowLeft: -1, PageUp: -7, PageDown: 7 }[e.key];
    if (buoc) { e.preventDefault(); hien((j0 < 0 ? n - 1 : j0) + buoc, true, true); }
    else if (e.key === 'Home') { e.preventDefault(); hien(0, true, true); }
    else if (e.key === 'End') { e.preventDefault(); hien(n - 1, true, true); }
    else if (e.key === 'Escape') an();
  });
  // Man hep: bieu do rong hon khung -> mo san o cac tuan gan nhat (noi co dot va hai ky), bao keo ngang
  const kiemRong = () => { const tran = khung.scrollWidth > khung.clientWidth + 1; keo.hidden = !tran; return tran; };
  if (kiemRong()) khung.scrollLeft = khung.scrollWidth;
  addEventListener('resize', kiemRong);
})();
</script>` : ''}
</body>
</html>
`;
}
