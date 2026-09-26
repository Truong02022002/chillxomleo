// Thoi gian doc cua mot bai: dem chu trong khoi .prose (than bai) cua trang.
// Dung chung cho the bai o /blog/ + /blog-en/ (tools/dang-bai-theo-lich.mjs chen the moi)
// de so phut cua bai dang sau tinh cung mot cach voi cac bai da co.
//
// Toc do: tieng Viet dem theo tieng (moi am tiet cach nhau dau cach), nguoi lon doc
// tham khoang 200-250 tieng/phut -> lay 230. Tieng Anh 238 tu/phut (Brysbaert 2019).

const TOC_DO = { vi: 230, en: 238 };

// Cat trong khoi <div class="... prose ..."> tinh ca cac <div> long ben trong.
function khoiProse(html) {
  const mo = html.match(/<div\b[^>]*class="[^"]*\bprose\b[^"]*"[^>]*>/);
  if (!mo) return '';
  const batDau = mo.index + mo[0].length;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = batDau;
  let sau = 1;
  let m;
  while ((m = re.exec(html))) {
    sau += m[0][1] === '/' ? -1 : 1;
    if (sau === 0) return html.slice(batDau, m.index);
  }
  return html.slice(batDau);
}

export function demChu(html) {
  const chu = khoiProse(html)
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ');
  return chu.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

export function phutDoc(html, lang) {
  return Math.max(1, Math.round(demChu(html) / TOC_DO[lang === 'en' ? 'en' : 'vi']));
}

export function nhanPhutDoc(phut, lang) {
  return lang === 'en' ? `${phut} min read` : `${phut} phút đọc`;
}
