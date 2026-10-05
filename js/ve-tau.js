// Ve tau sau khi dat ban — NAP LUC CAN, khong nam trong main.js (05-10-2026).
// main.js nap file nay khi khach bat dau dien form dat ban (doc URL tu data-ve-tau tren
// #zaloBookingForm, cache-bust.js giu hash), nen 99% luot xem trang khong phai tai ~4 KB nay.
// Can XL_HOANG_HON (const toan cuc cua main.js) de in gio mat troi lan cua ngay dat ban.
// --- Ve tau sau khi dat ban (05-10-2026) ---
// Gui form xong, khach nhan mot tam "ve tau" Ga Xom Leo ghi ten, ngay, gio, so khach, gio mat troi
// lan hom do — luu thanh anh hoac chia se thang vao Zalo tren dien thoai. Ve tren may khach
// (canvas), KHONG gui di dau; khong in so dien thoai. Khong co ma dat cho: don chua duoc xac nhan,
// nen ve dong dau "Da gui · cho goi xac nhan" de khong ai tuong da chac cho.
window.XL_VE = (function () {
  const W = 1080, H = 1350;
  const SERIF = '"Playfair Display", "Playfair Fallback G", Georgia, serif';
  const SANS = 'Signika, "Signika Fallback", "Segoe UI", sans-serif';
  const MAU = { nen: '#2B1B11', giay: '#FBF4E8', muc: '#2E1D12', nau: '#6B5443', dong: '#8A6428', dongSang: '#D9A45C', ke: '#CDB08C', tem: '#9B2C1F' };
  // Dau may hoi nuoc: cung bo net voi icon trang Trai nghiem (24x24)
  const TAU = ['M3 15.5V7.6h5.5v7.9', 'M2.2 7.6h7.1', 'M4.5 9.2h2.6v2.5H4.5z', 'M8.5 10.6h9.2a1.8 1.8 0 0 1 1.8 1.8v3.1', 'M15.1 10.6V7.4h2.5v3.2', 'M14.5 7.4h3.7', 'M2.4 15.5h18.3l1.3 2.1', 'M17.6 5.2a1.4 1.4 0 0 1 2.4-1.3 1.2 1.2 0 0 1 1.6 1.6'];

  const bo = (x, l, t, w, h, r) => {
    x.beginPath();
    x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
    x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
  };
  // Chu gian rong: ve tung ky tu (canvas.letterSpacing chua co tren moi trinh duyet)
  const chuGian = (x, s, px, py, gian, canh) => {
    const kt = [...s];
    const rong = kt.reduce((a, k) => a + x.measureText(k).width, 0) + gian * (kt.length - 1);
    const lui = { center: rong / 2, right: rong };
    let cx = px - (lui[canh] || 0);
    x.textAlign = 'left';
    kt.forEach((k) => { x.fillText(k, cx, py); cx += x.measureText(k).width + gian; });
  };
  // Co chu nho dan cho vua be ngang (kieu chua "{c}" la cho dien co chu); van khong vua thi cat
  // va them "…". Tra ve chuoi se ve; x.font de lai dung co da chon.
  const vua = (x, s, kieu, co, toiDa, nhoNhat) => {
    let c = co;
    const dat = (n) => { x.font = kieu.replace('{c}', n); return x.measureText(s).width; };
    while (c > nhoNhat && dat(c) > toiDa) c -= 2;
    if (dat(c) <= toiDa) return s;
    let t = s;
    while (t.length > 1 && x.measureText(t + '…').width > toiDa) t = t.slice(0, -1);
    return t.trimEnd() + '…';
  };

  async function ve(o) {
    const en = !!o.en;
    try {
      await Promise.all([
        document.fonts.load('600 92px "Playfair Display"', 'Vé đặt bàn Table Ticket 0123456789/:'),
        document.fonts.load('700 24px Signika', 'ĐÀ LẠT GA XÓM LÈO'),
        document.fonts.load('600 52px Signika', o.ten || 'a'),
      ]);
    } catch (e) { /* font loi thi ve bang font du phong */ }
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const [y, m, d] = String(o.ngay || '').split('-').map(Number);
    const hh = d ? XL_HOANG_HON.tinh(y, m, d) : null;

    // Nen go toi + vet sang dong
    x.fillStyle = MAU.nen; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.025)';
    for (let i = 0; i < W; i += 9) x.fillRect(i, 0, 2, H);
    const sang = x.createRadialGradient(W / 2, -80, 40, W / 2, -80, 760);
    sang.addColorStop(0, 'rgba(217,164,92,0.30)'); sang.addColorStop(1, 'rgba(217,164,92,0)');
    x.fillStyle = sang; x.fillRect(0, 0, W, H);

    // Tam ve
    const L = 90, T = 96, R = 990, B = 1232, CAT = 968;
    x.save();
    x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 44; x.shadowOffsetY = 20;
    x.fillStyle = MAU.giay; bo(x, L, T, R - L, B - T, 16); x.fill();
    x.restore();
    x.strokeStyle = MAU.ke; x.lineWidth = 2; bo(x, L + 22, T + 22, R - L - 44, B - T - 44, 8); x.stroke();
    x.strokeStyle = 'rgba(138,100,40,0.5)'; x.lineWidth = 1.2; x.setLineDash([6, 6]);
    bo(x, L + 32, T + 32, R - L - 64, B - T - 64, 5); x.stroke(); x.setLineDash([]);
    // Hai khuyet tron + duong rang cua tach cuong ve
    x.fillStyle = MAU.nen;
    [L, R].forEach((cx) => { x.beginPath(); x.arc(cx, CAT, 34, 0, Math.PI * 2); x.fill(); });
    x.strokeStyle = 'rgba(138,100,40,0.7)'; x.lineWidth = 3; x.setLineDash([16, 12]);
    x.beginPath(); x.moveTo(L + 52, CAT); x.lineTo(R - 52, CAT); x.stroke(); x.setLineDash([]);

    // Dau ve
    x.fillStyle = MAU.dong; x.font = '700 24px ' + SANS;
    chuGian(x, en ? 'XOM LEO STATION · DA LAT 1932' : 'GA XÓM LÈO · ĐÀ LẠT 1932', W / 2, 196, 7, 'center');
    x.save();
    x.translate(W / 2 - 50, 218); x.scale(4.2, 4.2);
    x.strokeStyle = MAU.muc; x.lineWidth = 1.45; x.lineCap = 'round'; x.lineJoin = 'round';
    TAU.forEach((p) => x.stroke(new Path2D(p)));
    [6, 11.2, 16.4].forEach((cx) => { x.beginPath(); x.arc(cx, 18.1, 1.8, 0, Math.PI * 2); x.stroke(); });
    x.restore();
    x.fillStyle = MAU.muc; x.font = '600 92px ' + SERIF; x.textAlign = 'center';
    x.fillText(en ? 'Table Ticket' : 'Vé đặt bàn', W / 2, 424);
    x.fillStyle = MAU.nau; x.font = '400 30px ' + SANS;
    x.fillText(en ? 'Xom Leo Grill & Chill · Da Lat' : 'Tiệm Nướng & Chill Xóm Lèo · Đà Lạt', W / 2, 476);
    // Vach trang tri: hai vach + mat thoi
    x.strokeStyle = MAU.dong; x.lineWidth = 2;
    x.beginPath(); x.moveTo(W / 2 - 150, 522); x.lineTo(W / 2 - 22, 522); x.moveTo(W / 2 + 22, 522); x.lineTo(W / 2 + 150, 522); x.stroke();
    x.fillStyle = MAU.dong; x.beginPath(); x.moveTo(W / 2, 512); x.lineTo(W / 2 + 10, 522); x.lineTo(W / 2, 532); x.lineTo(W / 2 - 10, 522); x.closePath(); x.fill();

    // Cac truong
    const nhan = (s, px, py) => { x.fillStyle = MAU.dong; x.font = '700 21px ' + SANS; chuGian(x, s, px, py, 5, 'left'); };
    const C1 = 170, C2 = 600;
    nhan(en ? 'GUEST' : 'HÀNH KHÁCH', C1, 600);
    // Toi da 500px: con dau do "Da gui" nam ben phai tu x ~720 (ten dai 20 ky tu tung cham dau)
    const ten = vua(x, o.ten || '—', '600 {c}px ' + SANS, 56, 500, 32);
    x.fillStyle = MAU.muc; x.textAlign = 'left'; x.fillText(ten, C1, 664);
    const dip = o.dip && !/^(không có|none)$/i.test(o.dip) ? o.dip : '';
    if (dip) { x.fillStyle = MAU.tem; x.font = '600 26px ' + SANS; x.fillText((en ? 'Occasion: ' : 'Dịp: ') + dip, C1, 708); }

    nhan(en ? 'DATE' : 'NGÀY', C1, 770);
    nhan(en ? 'TIME' : 'GIỜ', C2, 770);
    x.fillStyle = MAU.muc; x.font = '600 60px ' + SERIF; x.textAlign = 'left';
    x.fillText(d ? `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}` : '—', C1, 836);
    x.fillText(o.gio || '—', C2, 836);

    nhan(en ? 'GUESTS' : 'SỐ KHÁCH', C1, 892);
    nhan(en ? 'SUNSET THAT DAY' : 'HOÀNG HÔN HÔM ĐÓ', C2, 892);
    x.fillStyle = MAU.muc; x.font = '600 40px ' + SANS;
    x.fillText(String(o.khach || '—') + (en ? ' guests' : ' người'), C1, 940);
    x.fillText(hh ? (en ? 'about ' : 'khoảng ') + XL_HOANG_HON.hm(hh.lan) : '—', C2, 940);

    // Dau do: chua phai xac nhan
    x.save();
    x.translate(R - 150, 606); x.rotate(-0.17);
    x.strokeStyle = MAU.tem; x.fillStyle = MAU.tem; x.globalAlpha = 0.86;
    x.lineWidth = 4; bo(x, -118, -52, 236, 104, 10); x.stroke();
    x.lineWidth = 1.5; bo(x, -108, -42, 216, 84, 6); x.stroke();
    x.textAlign = 'center';
    x.font = '600 38px ' + SERIF; x.fillText(en ? 'SENT' : 'ĐÃ GỬI', 0, 4);
    x.font = '700 15px ' + SANS; chuGian(x, en ? 'AWAITING CALL-BACK' : 'CHỜ GỌI XÁC NHẬN', 0, 30, en ? 1.5 : 3, 'center');
    x.restore();

    // Cuong ve
    nhan(en ? 'PLATFORM' : 'SÂN GA', C1, 1036);
    x.fillStyle = MAU.muc; x.font = '600 46px ' + SERIF; x.textAlign = 'left';
    x.fillText('113 Huỳnh Tấn Phát', C1, 1094);
    x.fillStyle = MAU.nau; x.font = '400 27px ' + SANS;
    x.fillText(en ? 'Trai Mat, Da Lat · open 15:00–23:00' : 'Trại Mát, Đà Lạt · mở cửa 15:00–23:00', C1, 1140);
    x.fillText(en ? 'Call / Zalo +84 76 452 7336' : 'Gọi / Zalo 076 452 7336', C1, 1180);

    x.fillStyle = MAU.dongSang; x.font = '600 26px ' + SANS;
    chuGian(x, 'XOMLEO.VN', W / 2, 1300, 9, 'center');
    return c;
  }

  // Dien thoai: mo bang chia se (Zalo, Messenger...) voi tep anh; may tinh hoac khong chia se duoc
  // tep thi tai ve. Tra ve 'share' | 'download' | 'cancel' de do luong.
  async function luu(c, en) {
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    if (!blob) return 'cancel';
    const tenTep = en ? 'xom-leo-table-ticket.png' : 've-dat-ban-xom-leo.png';
    if (window.matchMedia('(pointer: coarse)').matches && navigator.canShare && typeof File === 'function') {
      const tep = new File([blob], tenTep, { type: 'image/png' });
      if (navigator.canShare({ files: [tep] })) {
        try { await navigator.share({ files: [tep], title: en ? 'My Xom Leo table ticket' : 'Vé đặt bàn Xóm Lèo' }); return 'share'; }
        catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = tenTep;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return 'download';
  }

  return { ve: ve, luu: luu };
})();
