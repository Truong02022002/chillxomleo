// Sinh ban nhap bai viet tu file noi dung JSON.
//
// Chay:  node tools/tao-bai-nhap.mjs hang-doi/noi-dung/<slug>.json
//
// Lay bo khung (nav, footer, script, bien the CSS) tu mot bai co san roi thay
// phan dau va toan bo <article>. Nho vay bai moi luon dong bo voi site: doi nav
// hay footer thi chi can sinh lai, khong phai sua tay tung bai.
//
// Xuat ra:  hang-doi/<slug>/index.html  va  hang-doi/<slug>-en/index.html

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const KHUNG = 'quan-nuong-da-lat-view-xe-lua';   // bai lam bo khung
const TACGIA = 'Bếp trưởng Xóm Lèo';
const TACGIA_EN = 'Xom Leo Head Chef';

const fileND = process.argv[2];
if (!fileND) { console.error('Thieu duong dan file noi dung.'); process.exit(1); }
const d = JSON.parse(fs.readFileSync(fileND, 'utf8'));

const eolCua = (s) => (s.includes('\r\n') ? '\r\n' : '\n');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escAttr = (s) => esc(s);

const ngayVI = (iso) => { const [y, m, dd] = iso.split('-'); return `${+dd}/${+m}/${y}`; };
const ngayEN = (iso) => { const [y, m, dd] = iso.split('-'); return `${+m}/${+dd}/${y}`; };

function kichThuoc(rel) {
  const b = fs.readFileSync(path.join(ROOT, rel));
  const dang = b.toString('ascii', 12, 16);
  if (dang === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (dang === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
  return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
}

// Anh trong bai: dung srcset 640w + ban goc, dung bien the co that.
function anhTrongBai(rel, alt) {
  const ten = rel.replace(/\.webp$/, '');
  const kt = kichThuoc(rel);
  return `<p><img srcset="../${ten}-640w.webp 640w, ../${ten}.webp ${kt.w}w" sizes="(max-width: 768px) 78vw, 650px" width="${kt.w}" height="${kt.h}" loading="lazy" decoding="async" class="alignnone size-full w-full rounded-xl" src="../${ten}.webp" alt="${escAttr(alt)}"></p>`;
}

function anhBia(rel, alt) {
  const ten = rel.replace(/\.webp$/, '');
  const kt = kichThuoc(rel);
  return `<div class="relative w-full aspect-[16/9] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl mb-12 bg-[#6B5443]/10">
                <img srcset="../${ten}-640w.webp 640w, ../${ten}.webp ${kt.w}w" sizes="(max-width: 768px) 92vw, 1168px" width="${kt.w}" height="${kt.h}" fetchpriority="high" decoding="async"
                src="../${ten}.webp"
                alt="${escAttr(alt)}"
                class="object-cover absolute inset-0 w-full h-full"
                />`;
}

// ---------- article ----------

function dungArticle(t, lang) {
  const hau = lang === 'vi' ? '' : '-en';
  const nhan = lang === 'vi' ? 'Tin Tức' : 'News';
  const ngay = lang === 'vi' ? ngayVI(d.ngayDang) : ngayEN(d.ngayDang);
  const tacGia = lang === 'vi' ? TACGIA : TACGIA_EN;
  const boiChu = lang === 'vi' ? 'Bài viết bởi ' : 'Written by ';
  const veBlog = lang === 'vi' ? 'Quay lại Blog' : 'Back to Blog';
  const nhanTomTat = lang === 'vi' ? 'Tóm tắt nhanh' : 'Quick answer';
  const nhanMucLuc = lang === 'vi' ? 'Mục lục' : 'Contents';
  const nhanAnh = lang === 'vi' ? 'Ảnh: ' : 'Photo: ';
  const linkBlog = lang === 'vi' ? '/blog/' : '/blog-en/';
  const linkAbout = lang === 'vi' ? '/about/' : '/about-en/';

  const muc = t.muc.map((m) => {
    const than = [`<h2 id="${m.id}">${esc(m.h2)}</h2>`, m.html];
    if (m.anh) than.push(anhTrongBai(m.anh.file, m.anh.alt));
    return than.join('\n');
  }).join('\n\n');

  const idFaq = 'faq-' + d.slug;
  const faqHtml = [
    `<h2 id="${idFaq}">${lang === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently asked questions'}</h2>`,
    ...t.faq.map((q) => `<h3>${esc(q.hoi)}</h3>\n<p>${q.dap}</p>`),
  ].join('\n');

  const mucLuc = [...t.muc.map((m) => `    <li><a href="#${m.id}">${esc(m.h2)}</a></li>`),
    `    <li><a href="#${idFaq}">${lang === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently asked questions'}</a></li>`].join('\n');

  const ldFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faq.map((q) => ({
      '@type': 'Question',
      name: q.hoi,
      acceptedAnswer: { '@type': 'Answer', text: q.dap.replace(/<[^>]+>/g, '') },
    })),
  };

  return `<article class="container mx-auto px-6 md:px-12 max-w-4xl pt-32 pb-24">
            <a href="${linkBlog}" class="inline-flex items-center gap-2 text-sm text-[#6B5443] hover:text-[#A03F00] mb-10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
            ${veBlog}
            </a>

            <div class="flex items-center gap-3 mb-6">
                <span class="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A03F00] bg-[#A03F00]/10 px-3 py-1.5 rounded-sm">${nhan}</span>
                <span class="w-1 h-1 rounded-full bg-[#6B5443]/40"></span>
                <span class="text-[10px] uppercase tracking-widest text-[#6B5443]">${ngay}</span>
                <span class="w-1 h-1 rounded-full bg-[#6B5443]/40"></span>
                <a href="${linkAbout}" rel="author" class="text-[10px] uppercase tracking-widest text-[#6B5443] hover:text-[#A03F00] transition-colors">${boiChu}${esc(tacGia)}</a>
            </div>

            <h1 class="font-serif text-4xl md:text-5xl lg:text-6xl text-[#3B2314] mb-8">${esc(t.h1)}</h1>
            <aside aria-label="${nhanTomTat}" class="max-w-3xl mx-auto my-8 p-5 rounded-xl border-l-4 border-primary bg-surface/60 tl-dr-block">
  <p class="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-2">${nhanTomTat}</p>
  <p class="text-sm md:text-base text-foreground/85 leading-relaxed">${t.tomTat}</p>
</aside>

            ${anhBia(d.anhBia, t.anhBiaAlt)}
<div class="text-center mt-3 mb-10 mx-auto w-[85%] max-w-[650px]"><span class="text-[0.85rem] text-foreground/70 italic font-medium tracking-wide">${nhanAnh}${esc(t.chuThichAnh)}</span></div>
            </div>

            <details class="blog-toc" open>
  <summary class="blog-toc-title">${nhanMucLuc}</summary>
  <ol>
${mucLuc}
  </ol>
</details>

            <div class="prose prose-lg prose-p:text-[#3B2314]/80 prose-headings:font-serif prose-headings:text-[#3B2314] max-w-none prose-a:text-[#A03F00] hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg prose-img:mx-auto">
${muc}

${faqHtml}
            </div>

<script type="application/ld+json">
${JSON.stringify(ldFaq, null, 1)}
</script>
        </article>`;
}

// ---------- head ----------

function dungHead(khung, t, lang) {
  const hau = lang === 'vi' ? '' : '-en';
  const url = `https://xomleo.vn/${d.slug}${hau}/`;
  const urlVi = `https://xomleo.vn/${d.slug}/`;
  const urlEn = `https://xomleo.vn/${d.slug}-en/`;
  const anhUrl = `https://xomleo.vn/${d.anhBia}`;
  let h = khung;

  h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(t.title)}</title>`);
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => a + escAttr(t.moTa) + b);
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => a + url + b);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => a + escAttr(t.title) + b);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, (_, a, b) => a + escAttr(t.moTa) + b);
  h = h.replace(/(<meta property="og:image" content=")[^"]*(")/, (_, a, b) => a + anhUrl + b);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, (_, a, b) => a + url + b);
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*(")/, (_, a, b) => a + escAttr(t.title) + b);
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*(")/, (_, a, b) => a + escAttr(t.moTa) + b);
  h = h.replace(/(<meta name="twitter:image" content=")[^"]*(")/, (_, a, b) => a + anhUrl + b);
  h = h.replace(/(<link rel="alternate" hreflang="vi" href=")[^"]*(")/, (_, a, b) => a + urlVi + b);
  h = h.replace(/(<link rel="alternate" hreflang="en" href=")[^"]*(")/, (_, a, b) => a + urlEn + b);
  h = h.replace(/(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/, (_, a, b) => a + urlVi + b);

  const ldArticle = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: t.title, description: t.moTa, url,
    datePublished: d.ngayDang, dateModified: d.ngayDang,
    author: {
      '@type': 'Person', name: lang === 'vi' ? TACGIA : TACGIA_EN,
      jobTitle: lang === 'vi' ? 'Bếp trưởng & Chủ quán' : 'Head Chef & Owner',
      worksFor: { '@type': 'Organization', name: 'Tiệm Nướng & Chill Xóm Lèo', url: 'https://xomleo.vn' },
      url: lang === 'vi' ? 'https://xomleo.vn/about/' : 'https://xomleo.vn/about-en/',
      sameAs: ['https://www.facebook.com/nuongxomleo', 'https://www.tiktok.com/@tiemnuongchillxomleo'],
    },
    publisher: {
      '@type': 'Organization', '@id': 'https://xomleo.vn/#organization', url: 'https://xomleo.vn',
      name: 'Tiệm Nướng & Chill Xóm Lèo',
      logo: { '@type': 'ImageObject', url: 'https://xomleo.vn/uploads/1775619688243-610230636-img2.webp' },
    },
    image: anhUrl, mainEntityOfPage: url, inLanguage: lang,
    articleSection: lang === 'vi' ? 'Cẩm nang du lịch Đà Lạt' : 'Da Lat travel guide',
    isPartOf: { '@id': 'https://xomleo.vn/#website' },
  };
  const ldCrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: lang === 'vi' ? 'Trang chủ' : 'Home', item: lang === 'vi' ? 'https://xomleo.vn' : 'https://xomleo.vn/en/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: lang === 'vi' ? 'https://xomleo.vn/blog/' : 'https://xomleo.vn/blog-en/' },
      { '@type': 'ListItem', position: 3, name: t.title },
    ],
  };

  // Thay hai khoi ld+json dau (Article, BreadcrumbList) trong head
  const moi = [ldArticle, ldCrumb];
  let i = 0;
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, () =>
    i < 2 ? `<script type="application/ld+json">\n${JSON.stringify(moi[i++], null, 1)}\n</script>` : `<script type="application/ld+json">`);
  return h;
}

// ---------- rap ----------

for (const lang of ['vi', 'en']) {
  const hau = lang === 'vi' ? '' : '-en';
  const t = d[lang];
  const goc = fs.readFileSync(path.join(ROOT, KHUNG + hau, 'index.html'), 'utf8');
  const nl = eolCua(goc);

  const head = dungHead(goc.slice(0, goc.indexOf('</head>')), t, lang);
  const nav = goc.slice(goc.indexOf('</head>'), goc.indexOf('<article'));
  const duoi = goc.slice(goc.indexOf('</article>') + '</article>'.length);

  let trang = head + nav + dungArticle(t, lang) + duoi;
  // dong bo xuong dong voi bai goc
  trang = trang.replace(/\r\n/g, '\n');
  if (nl === '\r\n') trang = trang.replace(/\n/g, '\r\n');

  const den = path.join(ROOT, 'hang-doi', d.slug + hau);
  fs.mkdirSync(den, { recursive: true });
  fs.writeFileSync(path.join(den, 'index.html'), trang);
  console.log(`  ${lang.toUpperCase()}  ${Math.round(trang.length / 1024)} KB  hang-doi/${d.slug}${hau}/index.html`);
}
console.log('\nXong. Chay tiep: node tools/dang-bai-theo-lich.mjs --thu');
