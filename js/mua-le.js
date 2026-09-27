/* ============================================================================
   GIAO DIEN MUA LE (Noel / Tet) — 27-09-2026
   Chi duoc nap khi doan <script> trong <head> (tools/mua-le.mjs) da tinh ra mua le va
   dat <html data-mua="noel|tet"> (hoac dang xem thu bang ?mua=...). Hinh ve nam het trong
   css/mua-le.css; file nay chi CHEN cac phan tu .mua-* va thong bao lich Tet.

   Chen SAU khi trang 'load' xong va CSS mua le da ap: khong tranh bang thong / CPU voi LCP,
   va do trang tri hien dan len ("den bat sang") thay vi nhay vao.
   Moi phan tu chen vao deu nam de len (absolute) hoac o cuoi chan trang / duoi bang gio —
   ngoai man hinh luc chen — nen khong day bo cuc (CLS).

   Sua xong: node tools/build-js.js --write && node tools/mua-le.mjs --write
   ============================================================================ */
(function () {
  'use strict';

  var d = document;
  var h = d.documentElement;
  var mua = h.getAttribute('data-mua') || '';
  var thu = h.getAttribute('data-mua-thu') || '';
  if (!mua && !thu) return;

  var cfg = window.xomleoMua || {};
  var en = /^en/i.test(h.lang);
  var N = 864e5;
  // Gio Viet Nam (UTC+7) bieu dien nhu UTC — cung quy uoc voi doan <head>, doc bang getUTC*.
  var nay = Date.now() + 252e5;

  // Lich Tet cua QUAN tung nam. CHI ghi nam da duoc chu site xac nhan: nam chua co van
  // trang tri Tet binh thuong nhung KHONG hien thong bao (khong doan lich nghi cua quan).
  // nghiTu = ngay nghi dau tien (28 thang Chap, duong lich). Tu do suy ra: nghi het mung 1,
  // mo lai mung 2 tu 15:00, phu thu mung 2 -> het mung 10 (chu site chot 17-09 + 20-09-2026).
  // Tet Dinh Mui khong co 30 Tet: thang Chap chi 29 ngay.
  var LICH_TET = {
    2027: { nghiTu: '2027-02-04', phuThu: 8 }
  };

  var THU_VI = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  var THU_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var THANG_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // "Thứ Năm 4/2" | "4/2/2027" | "Thu 4 Feb" | "4 Feb 2027"
  function ngay(ms, coThu, coNam) {
    var x = new Date(ms);
    var dd = x.getUTCDate(), mm = x.getUTCMonth(), yy = x.getUTCFullYear(), w = x.getUTCDay();
    if (en) return (coThu ? THU_EN[w] + ' ' : '') + dd + ' ' + THANG_EN[mm] + (coNam ? ' ' + yy : '');
    return (coThu ? THU_VI[w] + ' ' : '') + dd + '/' + (mm + 1) + (coNam ? '/' + yy : '');
  }

  // Can chi cua nam am lich co mung 1 roi vao nam duong y. Tieng Anh theo 12 con giap
  // cua Viet Nam: Mao = meo (Cat), Suu = trau (Buffalo).
  function tenNam(y) {
    return {
      vi: ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'][y % 10] + ' ' +
          ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'][y % 12],
      en: ['Monkey', 'Rooster', 'Dog', 'Pig', 'Rat', 'Buffalo', 'Tiger', 'Cat', 'Dragon', 'Snake', 'Horse', 'Goat'][y % 12]
    };
  }

  // Tet gan nhat (doan <head> da chon: dang dien ra hoac sap toi). Het bang lich thi doan nam sau.
  var namTet = cfg.tet ? new Date(cfg.tet).getUTCFullYear() : new Date(nay).getUTCFullYear() + 1;
  var giap = tenNam(namTet);

  function the(tag, cls, html) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function trangTri(tag, cls) {
    var e = the(tag, cls);
    e.setAttribute('aria-hidden', 'true');
    return e;
  }

  // ---------- Loi chuc chan trang ----------
  function loiChuc() {
    if (mua === 'tet') {
      return en
        ? ['Happy Lunar New Year', 'Chúc Mừng Năm Mới · Year of the ' + giap.en + ' ' + namTet]
        : ['Cung Chúc Tân Xuân', 'Xuân ' + giap.vi + ' ' + namTet + ' · Ga Xóm Lèo'];
    }
    // Noel keo tu 1/12 den het 1/1: tu 27/12 doi sang chuc nam moi.
    var x = new Date(nay), m = x.getUTCMonth(), dd = x.getUTCDate();
    var namMoi = m === 11 ? x.getUTCFullYear() + 1 : x.getUTCFullYear();
    var tet = (m === 11 && dd >= 27) || (m === 0 && dd === 1);
    if (en) return tet ? ['Happy New Year ' + namMoi, 'Bonne Année · Xom Leo Station'] : ['Merry Christmas', 'Joyeux Noël · Xom Leo Station'];
    return tet ? ['Chúc Mừng Năm Mới ' + namMoi, 'Bonne Année · Ga Xóm Lèo'] : ['Giáng Sinh An Lành', 'Joyeux Noël · Ga Xóm Lèo'];
  }

  // ---------- Lich Tet: pha hien tai ----------
  // truoc   : chua nghi -> bao du lich nghi / mo lai / phu thu
  // nghi    : 28 Chap -> het mung 1
  // phu-thu : mung 2 -> het mung 10
  // sau mung 10: khong bao gi nua.
  function lichTet() {
    var l = LICH_TET[namTet];
    if (!l || !cfg.tet) return null;
    var mung1 = cfg.tet;
    var nghiTu = Date.parse(l.nghiTu + 'T00:00:00Z');
    var moLai = mung1 + N;
    var pha = nay < nghiTu ? 'truoc' : nay < moLai ? 'nghi' : nay < mung1 + 10 * N ? 'phu-thu' : '';
    if (!pha) return null;
    return { pha: pha, nghiTu: nghiTu, nghiDen: mung1, moLai: moLai, mung10: mung1 + 9 * N, pt: l.phuThu };
  }

  function oThongBao(nhan, chinh, phu) {
    return '<li><span class="mua-tb-nhan">' + nhan + '</span><span class="mua-tb-chinh">' + chinh +
      '</span><span class="mua-tb-phu">' + phu + '</span></li>';
  }

  function thongBaoTet(l) {
    var ten, o = [];
    var oNghi = en
      ? oThongBao('Closed', '28th of the 12th lunar month – 1st day of Tết', ngay(l.nghiTu, 1) + ' – ' + ngay(l.nghiDen, 1, 1))
      : oThongBao('Nghỉ Tết', '28 tháng Chạp – hết mùng 1', ngay(l.nghiTu, 1) + ' – ' + ngay(l.nghiDen, 1, 1));
    var oMo = en
      ? oThongBao('Reopening', '2nd day of Tết · from 15:00', ngay(l.moLai, 1, 1))
      : oThongBao('Mở lại', 'Mùng 2 · từ 15:00', ngay(l.moLai, 1, 1));
    var oPhuThu = en
      ? oThongBao(l.pt + '% Tết surcharge', '2nd – 10th day of Tết', ngay(l.moLai) + ' – ' + ngay(l.mung10, 0, 1))
      : oThongBao('Phụ thu Tết ' + l.pt + '%', 'Mùng 2 – hết mùng 10', ngay(l.moLai) + ' – ' + ngay(l.mung10, 0, 1));
    if (l.pha === 'truoc') {
      ten = en ? 'Tết Holiday Hours · Year of the ' + giap.en : 'Lịch Tết Xuân ' + giap.vi;
      o = [oNghi, oMo, oPhuThu];
    } else if (l.pha === 'nghi') {
      ten = en ? 'Closed for Tết · see you on the 2nd day' : 'Quán đang nghỉ Tết · hẹn gặp mùng 2';
      o = [oMo, oPhuThu];
    } else {
      ten = en ? 'Open again · Year of the ' + giap.en : 'Đã mở cửa đón Xuân ' + giap.vi;
      o = [en ? oThongBao('Open', '15:00 – 23:00', 'Every day') : oThongBao('Mở cửa', '15:00 – 23:00', 'Hằng ngày'), oPhuThu];
    }
    var e = the('div', 'mua-tb', '<p class="mua-tb-ten">' + ten + '</p><ul class="mua-tb-luoi">' + o.join('') + '</ul>');
    e.setAttribute('role', 'note');
    return e;
  }

  function dongGioTet(l) {
    if (l.pha === 'truoc') {
      return en
        ? 'Tết: closed ' + ngay(l.nghiTu) + ' – ' + ngay(l.nghiDen) + ', reopening ' + ngay(l.moLai) + ' from 15:00'
        : 'Tết: nghỉ ' + ngay(l.nghiTu) + ' – ' + ngay(l.nghiDen) + ', mở lại mùng 2 (' + ngay(l.moLai) + ') từ 15:00';
    }
    if (l.pha === 'nghi') {
      return en
        ? 'Closed for Tết · reopening ' + ngay(l.moLai, 1) + ' at 15:00'
        : 'Đang nghỉ Tết · mở lại 15:00 ' + ngay(l.moLai, 1);
    }
    return en
      ? l.pt + '% Tết surcharge until ' + ngay(l.mung10)
      : 'Phụ thu Tết ' + l.pt + '% đến hết mùng 10 (' + ngay(l.mung10) + ')';
  }

  // Lop roi: 3 tam (cham gan, cham xa, hinh tinh the / canh mai) — hinh ve o css/mua-le.css.
  function lopRoi() {
    var roi = the('div', 'mua-roi');
    for (var k = 0; k < 3; k++) roi.appendChild(the('i'));
    return roi;
  }

  // Chen mot do trang tri vao moi phan tu khop selector (toi da `toiDa` cai).
  function gan(selector, cls, toiDa) {
    var ds = d.querySelectorAll(selector);
    for (var k = 0; k < ds.length && k < (toiDa || 99); k++) ds[k].appendChild(trangTri('i', cls));
  }

  // ---------- Chen ----------
  function trangHoang() {
    var nav = d.getElementById('navbar');
    if (nav) {
      nav.appendChild(trangTri('span', 'mua-mai'));
      // Logo = the <a> dau tien cua thanh dieu huong (da position:relative).
      var logo = nav.querySelector('a');
      if (logo) {
        logo.appendChild(trangTri('i', 'mua-logo-canh'));
        if (mua === 'tet') logo.appendChild(trangTri('i', 'mua-logo-hoa'));
      }
    }

    var hero = d.querySelector('.hero-cinematic');
    if (!hero && d.body) {
      // Moi trang khac: tuyet / hoa roi o man hinh dau.
      var tran = trangTri('div', 'mua-tran');
      tran.appendChild(lopRoi());
      d.body.insertBefore(tran, d.body.firstChild);
    }

    // Tem buu dien tren hop "Tom tat nhanh" (bai viet, /blog/, /menu/...).
    gan('.tl-dr-block', 'mua-tem', 2);
    // The bai: vao khung anh (overflow:hidden) cua tung the.
    gan('.blog-item a > div.relative', 'mua-the');
    // Nut goi noi (main.js chen tu truoc 'load').
    gan('.floating-btn.btn-call', 'mua-mu', 1);
    // Form dat ban (trang chu).
    gan('.premium-form-inner', 'mua-dinh-form', 1);
    if (mua === 'noel') {
      gan('.premium-form-inner', 'mua-chop-form', 1);
      gan('section.bang-gio', 'mua-chop-bang', 1);
    }
    // Anh dau bai: khung co overflow:hidden -> moc cao 0 dat ngay truoc khung.
    var anh = d.querySelector('article header ~ div[style*="aspect-ratio"], div.relative.w-full.overflow-hidden[style*="aspect-ratio"]');
    if (anh && anh.parentNode) {
      var neo = trangTri('div', 'mua-neo');
      neo.appendChild(the('i', 'mua-dinh-anh'));
      anh.parentNode.insertBefore(neo, anh);
    }

    if (hero) {
      var lop = trangTri('div', 'mua-hero');
      lop.appendChild(lopRoi());
      if (mua === 'noel') {
        lop.appendChild(the('span', 'mua-goc'));
        lop.appendChild(the('span', 'mua-goc mua-goc-p'));
      } else {
        lop.appendChild(the('span', 'mua-canh'));
        lop.appendChild(the('span', 'mua-long'));
        lop.appendChild(the('span', 'mua-long mua-long-2'));
      }
      hero.appendChild(lop);
    }

    var ft = d.querySelector('footer');
    if (ft) {
      ft.insertBefore(trangTri('div', 'mua-vien'), ft.firstChild);
      var chuc = loiChuc();
      var hang = trangTri('div', 'mua-chuc');
      hang.innerHTML = '<span class="mua-chuc-hinh"></span><div><p class="mua-chuc-lon">' + chuc[0] +
        '</p><p class="mua-chuc-nho">' + chuc[1] + '</p></div><span class="mua-chuc-hinh"></span>';
      // Hang loi chuc dat ngay tren dai ban quyen (dai cuoi cung cua chan trang).
      var bq = null, ps = ft.querySelectorAll('p');
      for (var i = 0; i < ps.length; i++) if (ps[i].textContent.indexOf('©') !== -1) bq = ps[i];
      var dai = bq && bq.closest('footer > *');
      if (dai) ft.insertBefore(hang, dai);
      else ft.appendChild(hang);
    }

    if (mua === 'tet') {
      var l = lichTet();
      if (l) {
        var bang = d.querySelector('section.bang-gio');
        if (bang) bang.appendChild(thongBaoTet(l));
        if (ft) {
          var ps2 = ft.querySelectorAll('p');
          for (var j = 0; j < ps2.length; j++) {
            if (/15:00/.test(ps2[j].textContent)) { ps2[j].appendChild(the('span', 'mua-gio', dongGioTet(l))); break; }
          }
        }
      }
    }

    var mauThanh = d.querySelector('meta[name="theme-color"]');
    if (mauThanh) mauThanh.setAttribute('content', mua === 'tet' ? '#8C1216' : '#1E4A36');

    // Favicon tren tab: dau may xanh thong doi mu Noel / dau may do son cai bong mai.
    // File uploads/favicon-<mua>-16x16|32x32.png (sinh tu favicon goc, 27-09-2026). rel~="icon"
    // khop "icon" va "shortcut icon", KHONG khop apple-touch-icon (icon man hinh chinh giu nguyen).
    // Sua anh thi doi ?v de trinh duyet + Cloudflare lay ban moi.
    var bieuTuong = d.querySelectorAll('link[rel~="icon"]');
    for (var q = 0; q < bieuTuong.length; q++) {
      var co = bieuTuong[q].getAttribute('sizes') === '16x16' ? '16x16' : '32x32';
      bieuTuong[q].setAttribute('type', 'image/png');
      bieuTuong[q].setAttribute('href', '/uploads/favicon-' + mua + '-' + co + '.png?v1');
    }
  }

  function nhanXemThu() {
    var ten = { noel: 'Noel', tet: 'Tết', thuong: en ? 'regular days' : 'ngày thường' }[thu] || thu;
    var e = the('div', 'mua-thu');
    e.setAttribute('role', 'status');
    e.appendChild(d.createTextNode((en ? 'Preview: ' : 'Xem thử: ') + ten));
    var a = the('a');
    a.href = location.pathname + '?mua=tu-dong';
    a.textContent = en ? 'Back to auto' : 'Về tự động';
    e.appendChild(a);
    d.body.appendChild(e);
  }

  function chay() {
    if (mua) trangHoang();
    if (thu) nhanXemThu();
  }

  // Doi ca hai: trang 'load' xong + CSS mua le da ap (doan <head> dat data-mua-css va
  // phat su kien 'mua-css'), roi qua 2 khung hinh cho chac trang da ve xong.
  var cho = 2;
  function xong() {
    if (--cho) return;
    requestAnimationFrame(function () { requestAnimationFrame(chay); });
  }
  if (h.hasAttribute('data-mua-css')) xong();
  else d.addEventListener('mua-css', xong, { once: true });
  if (d.readyState === 'complete') xong();
  else window.addEventListener('load', xong, { once: true });
})();
