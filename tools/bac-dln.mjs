// Bac DLN cua trang (Decision Ladder Navigation cua Danh Nolan: Orient - Choose - Prove -
// Rate - Act) khai o thuoc tinh <html data-dln="...">. Doan GA noi tuyen doc thuoc tinh do
// va gui thanh `content_group` — chieu "Content group" co san cua GA4, khong can dang ky
// Custom Definition. Nho vay bao cao Trang va man hinh tach duoc luot xem, thoi gian tuong
// tac va lead theo tung bac. Hop dong du lieu: tools/do-luong.md muc 4.
//
// Chu so dau de GA4 xep dung thu tu O -> A khi sap theo ten.
export const BAC_DLN = { O: '1-orient', C: '2-choose', P: '3-prove', R: '4-rate', A: '5-act' };
// Trang ngoai thang: hub danh sach bai (/blog/), trang phap ly, trang 404.
export const NGOAI_THANG = ['hub', 'legal', '404'];
export const GIA_TRI_HOP_LE = new Set([...Object.values(BAC_DLN), ...NGOAI_THANG]);

// Ghi (hoac go, khi giaTri rong) thuoc tinh data-dln tren the <html> dau tien.
export function datBac(html, giaTri) {
  return html.replace(/<html\b[^>]*>/, (the) => {
    const bo = the.replace(/\s+data-dln="[^"]*"/, '');
    return giaTri ? bo.replace(/>$/, ` data-dln="${giaTri}">`) : bo;
  });
}
