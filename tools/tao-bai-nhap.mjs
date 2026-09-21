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
// Ten quan trong schema theo ngon ngu trang (chu site chot 12-09-2026): ban EN dung ten
// tieng Anh va giu ten Viet o alternateName de Google van noi duoc voi ho so Maps.
const TEN_QUAN = 'Tiệm Nướng & Chill Xóm Lèo';
const TEN_QUAN_EN = 'Xom Leo Grill & Chill';

const fileND = process.argv[2];
if (!fileND) { console.error('Thieu duong dan file noi dung.'); process.exit(1); }
const d = JSON.parse(fs.readFileSync(fileND, 'utf8'));

// Ten file anh phai la chu-thuong-gach-ngang co nghia (checklist muc 75; site da doi ten hang loat
// ngay 15-09-2026, xem tools/anh-doi-ten.json). Chan ten kieu WordPress/Facebook/may anh.
const TEN_ANH = /^[a-z0-9]+(-[a-z0-9]+)+\.webp$/;
const anhDung = [d.anhBia, ...['vi', 'en'].flatMap((l) => (d[l]?.muc || []).map((m) => m.anh?.file))].filter(Boolean);
const tenSai = anhDung.filter((rel) => !TEN_ANH.test(path.basename(rel)) || /\d{7,}/.test(path.basename(rel)));
if (tenSai.length) {
  console.error('Ten file anh chua dung chuan chu-thuong-gach-ngang (vd: ban-go-view-tau-xom-leo.webp):\n  ' + tenSai.join('\n  '));
  process.exit(1);
}

const eolCua = (s) => (s.includes('\r\n') ? '\r\n' : '\n');
// GIAI MA TRUOC ROI MOI ESCAPE — nho vay esc() khong phu thuoc vao viec file noi dung
// viet "&" hay "&amp;", ket qua deu ra "&amp;". Truoc 20-09-2026 esc() escape thang,
// nen alt viet san "Tiem Nuong &amp; Chill" bi thanh "&amp;amp;" va trinh duyet hien
// ra chu "&amp;" — da lot vao 5 bai (37 cho). Xem boThucThe() ngay duoi.
const esc = (s) => boThucThe(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escAttr = (s) => esc(s);
// q.dap la HTML nen viet "&amp;", nhung JSON-LD phai chua chu that. Bo tag khong du,
// phai go luon thuc the, neu khong tro ly AI se doc ra "Tiem Nuong &amp; Chill".
// Trang chu dang de "Tiem Nuong & Chill Xom Leo" trong JSON-LD — day la chuan can khop.
// Go &amp; SAU CUNG de khong giai ma hai lan.
const boThucThe = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&');

const ngayVI = (iso) => { const [y, m, dd] = iso.split('-'); return `${+dd}/${+m}/${y}`; };
const ngayEN = (iso) => { const [y, m, dd] = iso.split('-'); return `${+m}/${+dd}/${y}`; };

function kichThuoc(rel) {
  const b = fs.readFileSync(path.join(ROOT, rel));
  const dang = b.toString('ascii', 12, 16);
  if (dang === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (dang === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
  return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
}

// srcset lay moi bien the co that tren dia (640w/960w/1280w) + ban goc. Thieu 960w/1280w thi
// dien thoai DPR cao va desktop phai tai ban goc (co anh bia 1 MB) — ra soat 15-09-2026.
function srcsetCo(ten, w) {
  const bienThe = [640, 960, 1280].filter((n) => n < w && fs.existsSync(path.join(ROOT, `${ten}-${n}w.webp`)))
    .map((n) => `../${ten}-${n}w.webp ${n}w`);
  return [...bienThe, `../${ten}.webp ${w}w`].join(', ');
}

// Anh trong bai: sizes khop khung than bai 650px.
function anhTrongBai(rel, alt) {
  const ten = rel.replace(/\.webp$/, '');
  const kt = kichThuoc(rel);
  return `<p><img srcset="${srcsetCo(ten, kt.w)}" sizes="(max-width: 768px) 78vw, 650px" width="${kt.w}" height="${kt.h}" loading="lazy" decoding="async" class="alignnone size-full w-full rounded-xl" src="../${ten}.webp" alt="${escAttr(alt)}"></p>`;
}

function anhBia(rel, alt) {
  const ten = rel.replace(/\.webp$/, '');
  const kt = kichThuoc(rel);
  return `<div class="relative w-full aspect-[16/9] rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl mb-12 bg-[#6B5443]/10">
                <img srcset="${srcsetCo(ten, kt.w)}" sizes="(max-width: 768px) 92vw, 1168px" width="${kt.w}" height="${kt.h}" fetchpriority="high" decoding="async"
                src="../${ten}.webp"
                alt="${escAttr(alt)}"
                class="object-cover absolute inset-0 w-full h-full"
                />`;
}

// ---------- article ----------

function dungArticle(t, lang) {
  const hau = lang === 'vi' ? '' : '-en';
  const nhan = lang === 'vi' ? 'Cẩm nang' : 'Travel Guide';
  const ngay = lang === 'vi' ? ngayVI(d.ngayDang) : ngayEN(d.ngayDang);
  const tacGia = lang === 'vi' ? TACGIA : TACGIA_EN;
  const boiChu = lang === 'vi' ? 'Bài viết bởi ' : 'Written by ';
  const nhanTrangChu = lang === 'vi' ? 'Trang chủ' : 'Home';
  const linkTrangChu = lang === 'vi' ? '/' : '/en/';
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
    '@id': `https://xomleo.vn/${d.slug}${hau}/#faq`,
    mainEntity: t.faq.map((q) => ({
      '@type': 'Question',
      name: q.hoi,
      acceptedAnswer: { '@type': 'Answer', text: boThucThe(q.dap.replace(/<[^>]+>/g, '')) },
    })),
    inLanguage: lang,
    isPartOf: { '@id': 'https://xomleo.vn/#website' },
  };

  return `<article class="container mx-auto px-6 md:px-12 max-w-4xl pt-32 pb-24">
            <nav aria-label="Breadcrumb" class="mb-10">
              <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#6B5443]">
                <li><a href="${linkTrangChu}" class="hover:text-[#A03F00] transition-colors">${nhanTrangChu}</a></li>
                <li aria-hidden="true" class="text-[#6B5443]/40">&rsaquo;</li>
                <li><a href="${linkBlog}" class="hover:text-[#A03F00] transition-colors">Blog</a></li>
                <li aria-hidden="true" class="text-[#6B5443]/40">&rsaquo;</li>
                <li><span aria-current="page" class="text-[#3B2314] font-medium">${esc(t.h1)}</span></li>
              </ol>
            </nav>

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

  // Cau truc @id da chot khi ra soat schema 12-09-2026 — giu dung nhu cac bai dang song,
  // tools/kiem-schema.mjs se bao neu lech.
  const tenQuan = lang === 'vi' ? TEN_QUAN : TEN_QUAN_EN;
  const tenPhu = lang === 'vi' ? {} : { alternateName: TEN_QUAN };
  const ldArticle = {
    '@context': 'https://schema.org', '@type': 'Article', '@id': `${url}#article`,
    headline: t.title, description: t.moTa, url,
    datePublished: d.ngayDang, dateModified: d.ngayDang,
    author: {
      '@type': 'Person', '@id': 'https://xomleo.vn/#bep-truong', name: lang === 'vi' ? TACGIA : TACGIA_EN,
      jobTitle: lang === 'vi' ? 'Bếp trưởng & Chủ quán' : 'Head Chef & Owner',
      worksFor: { '@type': 'Organization', '@id': 'https://xomleo.vn/#organization', name: tenQuan, url: 'https://xomleo.vn/', ...tenPhu },
      url: lang === 'vi' ? 'https://xomleo.vn/about/' : 'https://xomleo.vn/about-en/',
      sameAs: ['https://www.facebook.com/nuongxomleo', 'https://www.tiktok.com/@tiemnuongchillxomleo'],
    },
    publisher: {
      '@type': 'Organization', '@id': 'https://xomleo.vn/#organization', url: 'https://xomleo.vn/',
      name: tenQuan, ...tenPhu,
      logo: { '@type': 'ImageObject', url: 'https://xomleo.vn/uploads/logo.png' },
    },
    image: anhUrl,
    // WebPage noi tuyen la cho duy nhat gan duoc BreadcrumbList vao graph (breadcrumb chi hop le
    // tren WebPage, khong hop le tren Article). name lay tu h1 — ten trang nguoi dung thay.
    mainEntityOfPage: {
      '@type': 'WebPage', '@id': url, url, name: t.h1, description: t.moTa, inLanguage: lang,
      isPartOf: { '@id': 'https://xomleo.vn/#website' },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    inLanguage: lang,
    articleSection: lang === 'vi' ? 'Cẩm nang du lịch Đà Lạt' : 'Da Lat Travel Guide',
    isPartOf: { '@id': 'https://xomleo.vn/#website' },
  };
  const ldCrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: lang === 'vi' ? 'Trang chủ' : 'Home', item: lang === 'vi' ? 'https://xomleo.vn/' : 'https://xomleo.vn/en/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: lang === 'vi' ? 'https://xomleo.vn/blog/' : 'https://xomleo.vn/blog-en/' },
      // Muc cuoi phai trung nhan breadcrumb dang hien tren trang, ma nhan do la h1 (xem dungArticle)
      { '@type': 'ListItem', position: 3, name: t.h1 },
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
  // Nav chep tu bai khung nen nut doi ngon ngu VN|EN van tro ve bai khung. Bai nhom dong
  // (dang 18-09-2026) va ca ba ban nhap sau do len song nhu vay: bam "EN" tren bai moi lai
  // nhay sang bai view xe lua. Phat hien 21-09-2026.
  let doiNN = 0;
  const nav = goc.slice(goc.indexOf('</head>'), goc.indexOf('<article'))
    .replace(/(<a\s+href=")[^"]*("\s+hreflang="(vi|en)")/g, (_, a, b, l) => {
      doiNN++;
      return a + (l === 'vi' ? `/${d.slug}/` : `/${d.slug}-en/`) + b;
    });
  if (!doiNN) { console.error(`Khong tim thay nut doi ngon ngu trong nav cua ${KHUNG}${hau}.`); process.exit(1); }
  // Phan sau </article> cua bai khung co khoi <section id="faq"> "Giai dap nhanh" — 7 cau
  // hoi RIENG cua bai view xe lua (tau chay may gio, ban view tau co phu phi...). Chep nguyen
  // thi bai moi hien lai dung khoi do: bai nhom dong len song 18-09 mang theo no. Bai moi da
  // co muc FAQ rieng trong <article> (id="faq-<slug>") nen bo han khoi cua khung.
  const duoi = goc.slice(goc.indexOf('</article>') + '</article>'.length)
    .replace(/\s*<section id="faq"[\s\S]*?<\/section>/, '');

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
