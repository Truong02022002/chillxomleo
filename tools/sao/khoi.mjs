// Khoi bam sao cuoi bai (27-10-2026) — dung chung cho tools/sao-bai.mjs va tools/tao-bai-nhap.mjs.
//
// Chi co chu cho ban Viet va ban Anh: hai ban nay viet tay. Ban zh/ko/ja/ru/th sinh tu ban Viet qua
// tools/dich/dung.mjs, chu tren khoi dich trong tools/dich/kho/<ma>.json nhu moi doan khac.
// DOI CHU O DAY = doi id doan dich: phai dich lai 5 thu tieng (tools/dich/README.md) roi dung lai.
//
// Khoi sinh ra luon o trang thai "chua du phieu": ca khoi va dong diem deu hidden, so de trong.
// tools/sao-bai.mjs --write ghi so va bo hidden khi bai du phieu; js/main.js hien phan bam sao.

export const CHU = {
  vi: {
    hoi: 'Bài viết này có ích cho bạn không?',
    hoiTrang: 'Trang này có ích cho bạn không?',     // menu, about, duong di, blog, chinh sach
    sao: (n) => `${n} sao`,
    camOn: 'Cảm ơn bạn đã chấm điểm!',
    loi: 'Chưa gửi được, bạn thử lại sau nhé.',
    diem: 'Điểm bạn đọc:',
    luot: 'Lượt chấm:',
  },
  en: {
    hoi: 'Was this article helpful?',
    hoiTrang: 'Was this page helpful?',
    sao: (n) => (n === 1 ? '1 star' : `${n} stars`),
    camOn: 'Thanks for rating!',
    loi: 'Your rating did not go through. Please try again later.',
    diem: 'Reader rating:',
    luot: 'Votes:',
  },
};

// Sao ve bang SVG (vien = chua chon, to = da chon) thay vi ky tu ★: font Signika khong co ★, may
// khach roi vao font du phong; va hai trang thai khac nhau ca hinh lan mau (WCAG 1.4.1).
const SAO = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2l2.81 6.63L22 9.24l-5.46 4.73L18.18 21 12 17.27 5.82 21l1.64-7.03L2 9.24l7.19-.61z"/></svg>';

// key = duong dan ban Viet cua trang ("/kham-pha-ho-tuyen-lam/"): moi thu tieng chung mot tong.
// laBai = trang bai viet (hoi "Bai viet nay..."); trang khac hoi "Trang nay...".
// So nam trong <span translate="no"> de bo tach doan dich bo qua — doi so khong sinh doan moi.
export function khoiSao(lang, key, laBai = true) {
  const c = CHU[lang];
  const nut = [1, 2, 3, 4, 5].map((n) => `<button type="button" value="${n}" aria-label="${c.sao(n)}">${SAO}</button>`).join('');
  return `<section class="sao-bai" data-sao="${key}" hidden>
  <p class="sao-bai-tong" hidden>${c.diem} <span translate="no" data-sao-diem></span>/5 · ${c.luot} <span translate="no" data-sao-luot></span></p>
  <div class="sao-bai-chon" data-sao-chon hidden>
    <p class="sao-bai-hoi" id="sao-bai-hoi">${laBai ? c.hoi : c.hoiTrang}</p>
    <div class="sao-bai-nut" role="group" aria-labelledby="sao-bai-hoi">${nut}</div>
    <div aria-live="polite"><p data-sao-cam-on hidden>${c.camOn}</p><p data-sao-loi hidden>${c.loi}</p></div>
  </div>
</section>`;
}
