/**
 * Thong ke truy cap xomleo.vn — web app Apps Script cap so GA4 cho trang https://xomleo.vn/quan-tri/
 *
 * Ban nay nam trong repo CONG KHAI de theo doi thay doi. KHONG ghi mat ma hay ma rieng nao vao day:
 * moi thu rieng de o Cai dat du an -> Thuoc tinh tap lenh (Script properties):
 *   MAT_MA           mat ma vao trang /quan-tri/ (>= 10 ky tu)
 *   GA4_PROPERTY_ID  so hieu property GA4 (ham kiemTra() tu tim va tu ghi)
 *
 * Can bat 2 dich vu nang cao (Dich vu -> +): Google Analytics Data API, Google Analytics Admin API.
 * Trien khai: Ung dung web, Thuc thi voi tu cach = Toi, Ai co quyen truy cap = Bat ky ai.
 * Huong dan day du: tools/thong-ke/HUONG-DAN.md
 *
 * Vi sao "Bat ky ai": trang xomleo.vn goi bang fetch, khong mang dang nhap Google theo. Lop bao ve la
 * MAT_MA (so sanh qua SHA-256) + gioi han 15 lan sai moi 15 phut cho ca script.
 * Script chi tra so tong hop (luot xem, nguon, trang, hanh dong), khong co du lieu ca nhan nao.
 */

const MA_DO_LUONG = 'G-YWGENK065S';   // luong web cua xomleo.vn (connected tag G-1YNW7BWD6W la property khac)
const PHIEN_BAN = '2026-10-16';
const KY_HOP_LE = [7, 28, 90];
const SU_KIEN = ['click_call', 'chat_open', 'click_directions', 'click_booking_cta', 'generate_lead'];
const SAI_TOI_DA = 15;                  // lan sai moi cua so 15 phut, tinh chung ca script
const LUU_TAM_GIAY = 900;               // so lieu GA4 luu tam 15 phut (do ton quota)

function doGet() {
  return traJson_({ ok: true, phienBan: PHIEN_BAN });
}

function doPost(e) {
  let yc;
  try { yc = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return traJson_({ loi: 'yeu-cau-hong' }); }
  const tt = PropertiesService.getScriptProperties();
  const matMa = tt.getProperty('MAT_MA');
  const propertyId = tt.getProperty('GA4_PROPERTY_ID');
  if (!matMa || !propertyId) return traJson_({ loi: 'chua-cai-dat' });

  const cache = CacheService.getScriptCache();
  const khoaSai = 'sai-' + Math.floor(Date.now() / 900000);
  const sai = Number(cache.get(khoaSai) || 0);
  if (sai >= SAI_TOI_DA) return traJson_({ loi: 'tam-khoa' });
  if (!bangNhau_(String(yc.matMa || ''), matMa)) {
    cache.put(khoaSai, String(sai + 1), 900);
    Utilities.sleep(1000);
    return traJson_({ loi: 'sai-mat-ma' });
  }

  const ky = KY_HOP_LE.indexOf(Number(yc.ky)) >= 0 ? Number(yc.ky) : 28;
  try {
    const khoa = 'so-' + ky;
    let so = JSON.parse(cache.get(khoa) || 'null');
    if (!so) {
      so = tongHop_(propertyId, ky);
      try { cache.put(khoa, JSON.stringify(so), LUU_TAM_GIAY); } catch (err) { /* qua 100 KB thi thoi khong luu tam */ }
    }
    so.online = dangOnline_(propertyId, cache);
    return traJson_(so);
  } catch (err) {
    return traJson_({ loi: 'ga4', chiTiet: String((err && err.message) || err).slice(0, 300) });
  }
}

// ---------- GA4 ----------

function tongHop_(propertyId, ky) {
  const ten = 'properties/' + propertyId;
  const nay = { startDate: (ky - 1) + 'daysAgo', endDate: 'today', name: 'nay' };
  const truoc = { startDate: (2 * ky - 1) + 'daysAgo', endDate: ky + 'daysAgo', name: 'truoc' };
  const ds = (...cac) => cac.map((name) => ({ name }));
  const giam = (metricName) => [{ metric: { metricName }, desc: true }];

  const lo1 = AnalyticsData.Properties.batchRunReports({ requests: [
    { dateRanges: [nay, truoc], metrics: ds('activeUsers', 'newUsers', 'sessions', 'engagedSessions', 'screenPageViews', 'userEngagementDuration') },
    { dateRanges: [nay], dimensions: ds('date'), metrics: ds('activeUsers', 'screenPageViews'), orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 400 },
    { dateRanges: [nay, truoc], dimensions: ds('sessionSource', 'sessionMedium'), metrics: ds('sessions', 'activeUsers'), orderBys: giam('sessions'), limit: 80 },
    { dateRanges: [nay], dimensions: ds('pagePath'), metrics: ds('screenPageViews', 'activeUsers'), orderBys: giam('screenPageViews'), limit: 20 },
    { dateRanges: [nay, truoc], dimensions: ds('eventName'), metrics: ds('eventCount'),
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: SU_KIEN } } } },
  ] }, ten);
  const lo2 = AnalyticsData.Properties.batchRunReports({ requests: [
    { dateRanges: [nay], dimensions: ds('deviceCategory'), metrics: ds('activeUsers'), orderBys: giam('activeUsers') },
    { dateRanges: [nay], dimensions: ds('city'), metrics: ds('activeUsers'), orderBys: giam('activeUsers'), limit: 12 },
    { dateRanges: [nay], dimensions: ds('hour'), metrics: ds('activeUsers'), orderBys: [{ dimension: { dimensionName: 'hour' } }], limit: 24 },
  ] }, ten);
  const r1 = lo1.reports || [], r2 = lo2.reports || [];

  const tong = {};
  for (const x of bang_(r1[0])) {
    tong[x.dateRange || 'nay'] = {
      nguoi: x.activeUsers || 0, nguoiMoi: x.newUsers || 0, phien: x.sessions || 0, phienTuongTac: x.engagedSessions || 0,
      luotXem: x.screenPageViews || 0, giayTuongTac: x.userEngagementDuration || 0,
    };
  }
  return {
    phienBan: PHIEN_BAN,
    capNhat: new Date().toISOString(),
    ky: ky,
    tong: tong,
    theoNgay: bang_(r1[1]).map((x) => ({ ngay: x.date, nguoi: x.activeUsers || 0, luotXem: x.screenPageViews || 0 })),
    nguon: bang_(r1[2]).map((x) => ({ nguon: x.sessionSource, kenh: x.sessionMedium, ky: x.dateRange || 'nay', phien: x.sessions || 0, nguoi: x.activeUsers || 0 })),
    trang: bang_(r1[3]).map((x) => ({ duong: x.pagePath, luotXem: x.screenPageViews || 0, nguoi: x.activeUsers || 0 })),
    hanhDong: bang_(r1[4]).map((x) => ({ su: x.eventName, ky: x.dateRange || 'nay', lan: x.eventCount || 0 })),
    thietBi: bang_(r2[0]).map((x) => ({ loai: x.deviceCategory, nguoi: x.activeUsers || 0 })),
    thanhPho: bang_(r2[1]).map((x) => ({ ten: x.city, nguoi: x.activeUsers || 0 })),
    theoGio: bang_(r2[2]).map((x) => ({ gio: Number(x.hour), nguoi: x.activeUsers || 0 })),
  };
}

// Doi mot bao cao GA4 thanh mang doi tuong { tenChieu: gia tri, tenChiSo: so }.
// Khi hoi 2 khoang ngay, GA4 tu them chieu "dateRange" (gia tri = name cua khoang) o cuoi.
function bang_(rep) {
  if (!rep) return [];
  const dh = (rep.dimensionHeaders || []).map((h) => h.name);
  const mh = (rep.metricHeaders || []).map((h) => h.name);
  return (rep.rows || []).map((r) => {
    const o = {};
    (r.dimensionValues || []).forEach((v, i) => { o[dh[i] || 'dateRange'] = v.value; });
    (r.metricValues || []).forEach((v, i) => { o[mh[i]] = Number(v.value); });
    return o;
  });
}

function dangOnline_(propertyId, cache) {
  const daCo = cache.get('online');
  if (daCo !== null) return Number(daCo);
  try {
    const r = AnalyticsData.Properties.runRealtimeReport({ metrics: [{ name: 'activeUsers' }] }, 'properties/' + propertyId);
    const n = r.rows && r.rows[0] ? Number(r.rows[0].metricValues[0].value) : 0;
    cache.put('online', String(n), 60);
    return n;
  } catch (err) {
    return null;
  }
}

// ---------- tien ich ----------

function bangNhau_(a, b) {
  const bam = (s) => Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  const ha = bam(a), hb = bam(b);
  let khac = 0;
  for (let i = 0; i < ha.length; i++) khac |= ha[i] ^ hb[i];
  return khac === 0;
}

function traJson_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- chay tay trong trinh soan thao: chon kiemTra roi bam Chay ----------

function kiemTra() {
  const tt = PropertiesService.getScriptProperties();
  let propertyId = tt.getProperty('GA4_PROPERTY_ID');

  if (!propertyId) {
    console.log('Đang tìm property GA4 có luồng web ' + MA_DO_LUONG + '…');
    const tom = AnalyticsAdmin.AccountSummaries.list({ pageSize: 200 });
    for (const tk of tom.accountSummaries || []) {
      for (const ps of tk.propertySummaries || []) {
        const luong = AnalyticsAdmin.Properties.DataStreams.list(ps.property, { pageSize: 50 });
        for (const s of luong.dataStreams || []) {
          const ma = s.webStreamData && s.webStreamData.measurementId;
          console.log('  ' + ps.displayName + ' (' + ps.property + '): ' + (ma || 'không phải luồng web'));
          if (ma === MA_DO_LUONG) propertyId = ps.property.split('/')[1];
        }
      }
    }
    if (!propertyId) {
      throw new Error('Tài khoản Google đang mở dự án này không xem được property chứa ' + MA_DO_LUONG +
        '. Mở dự án bằng tài khoản quản trị GA4 của quán, hoặc thêm tài khoản này vào GA4 với quyền Người xem.');
    }
    tt.setProperty('GA4_PROPERTY_ID', propertyId);
    console.log('Đã lưu GA4_PROPERTY_ID = ' + propertyId);
  } else {
    console.log('GA4_PROPERTY_ID đã có: ' + propertyId);
  }

  const matMa = tt.getProperty('MAT_MA');
  if (!matMa || matMa.length < 10) {
    throw new Error('Chưa có MAT_MA hoặc ngắn hơn 10 ký tự. Vào Cài đặt dự án → Thuộc tính tập lệnh, thêm MAT_MA.');
  }

  const so = tongHop_(propertyId, 7);
  const t = so.tong.nay || {};
  console.log('Lấy thử 7 ngày: ' + (t.nguoi || 0) + ' người truy cập, ' + (t.luotXem || 0) + ' lượt xem trang, ' +
    so.trang.length + ' trang, ' + so.nguon.length + ' dòng nguồn. Đang online: ' + dangOnline_(propertyId, CacheService.getScriptCache()));
  console.log('Xong. Bước tiếp: Triển khai → Tùy chọn triển khai mới → Ứng dụng web (xem HUONG-DAN.md).');
}
