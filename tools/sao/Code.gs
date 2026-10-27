/**
 * Sao danh gia bai viet xomleo.vn — web app Apps Script nhan phieu cham sao cua ban doc va tra tong.
 *
 * Ban nay nam trong repo CONG KHAI de theo doi thay doi. Khong co mat ma nao: tong diem la so cong khai
 * (dang hien tren trang), con phieu tung nguoi chi nam trong Google Sheet cua quan.
 * Thuoc tinh tap lenh (Script properties):
 *   SHEET_ID   ma Google Sheet chua phieu (ham caiDat() tu tao Sheet va tu ghi)
 *
 * Trien khai: Ung dung web, Thuc thi voi tu cach = Toi, Ai co quyen truy cap = Bat ky ai.
 * Huong dan day du: tools/sao/HUONG-DAN.md
 *
 * POST (js/main.js, khoi "Sao danh gia bai viet"), body URLSearchParams:
 *   trang  duong dan ban VIET cua bai ("/kham-pha-ho-tuyen-lam/"): moi thu tieng cua mot bai chung mot tong
 *   sao    1..5
 *   may    ma ngau nhien trinh duyet tu sinh, giu trong localStorage
 * GET tra { phienBan, trang: { "/duong-dan/": { n, tb } } } — tools/sao-bai.mjs keo ve moi ngay.
 *
 * Chong phieu rac o muc vua phai (Apps Script khong cho biet IP): moi may chi tinh phieu MOI NHAT cho
 * moi bai, gioi han so phieu moi bai moi gio va ca script moi gio. Thay phieu rac thi xoa dong trong
 * Sheet — lan keo sau tong tu tinh lai.
 */

const PHIEN_BAN = '2026-10-27';
const TEN_TRANG_TINH = 'phieu';
const TOI_DA_MOI_BAI_MOI_GIO = 10;
const TOI_DA_MOI_GIO = 60;
const LUU_TAM_GIAY = 600;               // tong luu tam 10 phut; co phieu moi thi xoa luu tam ngay

function doGet() {
  const cache = CacheService.getScriptCache();
  let tong = cache.get('tong');
  if (!tong) {
    tong = JSON.stringify(tinhTong_(bang_().getDataRange().getValues()));
    try { cache.put('tong', tong, LUU_TAM_GIAY); } catch (err) { /* qua 100 KB thi thoi khong luu tam */ }
  }
  return ContentService.createTextOutput(tong).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const trang = String(p.trang || '');
  const sao = Number(p.sao);
  const may = String(p.may || '');
  // Slug ban Viet chi gom chu thuong khong dau, so va gach ngang (stub emoji khong co khoi sao).
  if (trang.length > 120 || !/^\/[a-z0-9]+(-[a-z0-9]+)*\/$/.test(trang)) return traJson_({ status: 'error', loi: 'trang' });
  if (!(sao >= 1 && sao <= 5 && Math.floor(sao) === sao)) return traJson_({ status: 'error', loi: 'sao' });
  if (!/^[a-z0-9]{16,40}$/.test(may)) return traJson_({ status: 'error', loi: 'may' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return traJson_({ status: 'error', loi: 'ban' });
  try {
    const cache = CacheService.getScriptCache();
    const gio = Math.floor(Date.now() / 3600000);
    const khoaBai = 'b' + gio + trang, khoaChung = 'c' + gio;
    const soBai = Number(cache.get(khoaBai) || 0), soChung = Number(cache.get(khoaChung) || 0);
    if (soBai >= TOI_DA_MOI_BAI_MOI_GIO || soChung >= TOI_DA_MOI_GIO) return traJson_({ status: 'error', loi: 'qua-nhieu' });
    bang_().appendRow([new Date(), trang, sao, may]);
    cache.put(khoaBai, String(soBai + 1), 3600);
    cache.put(khoaChung, String(soChung + 1), 3600);
    cache.remove('tong');
  } finally {
    lock.releaseLock();
  }
  return traJson_({ status: 'ok' });
}

// Dong dau la tieu de. Dong xep theo thoi gian ghi nen phieu sau cua cung (trang, may) de len phieu truoc.
function tinhTong_(dong) {
  const moiNhat = {};
  for (let i = 1; i < dong.length; i++) {
    const trang = String(dong[i][1] || ''), sao = Number(dong[i][2]), may = String(dong[i][3] || '');
    if (!trang || !may || !(sao >= 1 && sao <= 5)) continue;
    moiNhat[trang + ' ' + may] = { trang: trang, sao: sao };
  }
  const gom = {};
  Object.keys(moiNhat).forEach(function (k) {
    const v = moiNhat[k];
    const g = gom[v.trang] || (gom[v.trang] = { n: 0, cong: 0 });
    g.n++;
    g.cong += v.sao;
  });
  const trang = {};
  Object.keys(gom).sort().forEach(function (k) {
    trang[k] = { n: gom[k].n, tb: Math.round(gom[k].cong / gom[k].n * 10) / 10 };
  });
  return { phienBan: PHIEN_BAN, trang: trang };
}

function bang_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Chua chay caiDat()');
  const ss = SpreadsheetApp.openById(id);
  return ss.getSheetByName(TEN_TRANG_TINH) || taoTrangTinh_(ss);
}

function taoTrangTinh_(ss) {
  const sh = ss.insertSheet(TEN_TRANG_TINH);
  sh.appendRow(['Thời gian', 'Trang', 'Sao', 'Mã máy']);
  sh.setFrozenRows(1);
  return sh;
}

function traJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Chay tay MOT lan trong trinh soan thao: tao Sheet chua phieu (neu chua co) va in tong hien tai.
function caiDat() {
  const tt = PropertiesService.getScriptProperties();
  if (!tt.getProperty('SHEET_ID')) {
    const ss = SpreadsheetApp.create('Sao bài viết xomleo.vn');
    const dau = ss.getSheets()[0];
    taoTrangTinh_(ss);
    ss.deleteSheet(dau);
    tt.setProperty('SHEET_ID', ss.getId());
    Logger.log('Đã tạo Sheet: ' + ss.getUrl());
  }
  Logger.log('Tổng hiện tại: ' + JSON.stringify(tinhTong_(bang_().getDataRange().getValues())));
}
