/**
 * Menu lat trang cho /menu/ va /menu-en/.
 *
 * Vi sao tu viet thay vi dung thu vien: turn.js (~40 KB, con keo theo jQuery)
 * va StPageFlip (~32 KB) deu phai nap tu CDN hoac vendor vao repo, trong khi
 * trang nay chi can lat trang, nhay muc va phong to. Ban nay ~9 KB chua nen.
 *
 * Nguon du lieu la <ol data-fb-src> trong HTML: moi <li> mang data-img (ten
 * file, khong duoi), data-alt va data-sec (ten muc de dung chip nhay nhanh).
 * De o HTML chu khong nhet vao JS de /menu-en/ dung lai y nguyen file nay,
 * chi khac phan chu.
 *
 * Anh KHONG dat loading="lazy": 18 to giay chong len nhau cung mot cho nen
 * trinh duyet coi tat ca deu trong tam nhin va tai het mot luc. Thay vao do
 * chi gan src cho cac trang quanh vi tri dang xem (xem preload()).
 */
(function () {
  'use strict';

  var sec = document.querySelector('[data-fb]');
  if (!sec) return;

  var srcList = sec.querySelector('[data-fb-src]');
  var book = sec.querySelector('[data-fb-book]');
  var stage = sec.querySelector('[data-fb-stage]');
  var viewport = sec.querySelector('[data-fb-viewport]');
  var chipWrap = sec.querySelector('[data-fb-chips]');
  var counter = sec.querySelector('[data-fb-count]');
  var btnPrev = sec.querySelector('[data-fb-prev]');
  var btnNext = sec.querySelector('[data-fb-next]');
  var btnSound = sec.querySelector('[data-fb-sound]');
  var btnFull = sec.querySelector('[data-fb-full]');
  if (!srcList || !book || !stage || !viewport) return;

  var BASE = sec.getAttribute('data-fb-base') || '';
  var WORD = sec.getAttribute('data-fb-word') || 'Trang';

  var pages = Array.prototype.slice.call(srcList.querySelectorAll('li')).map(function (li) {
    return {
      img: li.getAttribute('data-img'),
      alt: li.getAttribute('data-alt') || '',
      group: li.getAttribute('data-sec') || ''
    };
  });
  var N = pages.length;
  if (!N) return;

  var mq = window.matchMedia('(min-width: 900px)');
  var spread = mq.matches;
  var leaves = [];
  var imgs = [];
  var flipped = 0;
  var chips = [];

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function maxFlip() {
    // Che 2 trang: lat het 9 to con thay bia sau nam ben trai.
    // Che 1 trang: to cuoi phai o nguyen, lat no di la man hinh trong.
    return spread ? leaves.length : leaves.length - 1;
  }
  function firstPage() {
    if (!spread) return flipped;
    return flipped === 0 ? 0 : 2 * flipped - 1;
  }
  function flipForPage(p) {
    return spread ? Math.ceil(p / 2) : p;
  }

  /* ---------- dung sach ---------- */

  function makeImg(i) {
    var im = el('img', 'fb-img');
    im.alt = pages[i].alt;
    im.width = 1086;
    im.height = 1448;
    im.decoding = 'async';
    // Khong tat thi keo chuot tren anh se khoi dong keo-tha anh cua trinh
    // duyet, ban pointercancel va nuot mat thao tac vuot lat.
    im.draggable = false;
    imgs[i] = im;
    return im;
  }

  // O kho binh thuong trang chi rong ~500px nen ban 640w la du. Khi mo toan
  // man hinh (co the phong toi 3x de doc gia) thi khai bao sizes lon hon de
  // trinh duyet tu nang len ban 1086w — neu khong khach phong to chi thay
  // ban 640w bi keo gian, dung mat muc dich cua nut phong to.
  var SIZES_LO = '(max-width: 899px) 88vw, (max-width: 1200px) 44vw, 520px';
  var SIZES_HI = '1086px';
  var hiRes = false;

  function load(i) {
    var im = imgs[i];
    if (!im || im.getAttribute('src')) return;
    var n = pages[i].img;
    im.srcset = BASE + n + '-sm.webp 640w, ' + BASE + n + '.webp 1086w';
    im.sizes = hiRes ? SIZES_HI : SIZES_LO;
    im.src = BASE + n + '-sm.webp';
  }

  function setHiRes(on) {
    if (hiRes === on) return;
    hiRes = on;
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i] && imgs[i].getAttribute('src')) imgs[i].sizes = on ? SIZES_HI : SIZES_LO;
    }
  }

  function preload() {
    var p = firstPage();
    var lo = Math.max(0, p - 2);
    var hi = Math.min(N - 1, p + 3);
    for (var i = lo; i <= hi; i++) load(i);
  }

  function build() {
    book.textContent = '';
    leaves = [];
    imgs = [];
    var step = spread ? 2 : 1;
    for (var i = 0; i < N; i += step) {
      var leaf = el('div', 'fb-leaf');
      var front = el('div', 'fb-face fb-front');
      front.appendChild(makeImg(i));
      leaf.appendChild(front);
      var back = el('div', 'fb-face fb-back');
      if (spread && i + 1 < N) back.appendChild(makeImg(i + 1));
      else back.className += ' fb-blank';
      leaf.appendChild(back);
      book.appendChild(leaf);
      leaves.push(leaf);
    }
  }

  /* ---------- trang thai ---------- */

  function apply(animate, moving) {
    var L = leaves.length;
    var i;
    if (!animate) for (i = 0; i < L; i++) leaves[i].classList.add('fb-noanim');
    for (i = 0; i < L; i++) {
      var lf = leaves[i];
      if (i < flipped) lf.classList.add('is-flipped');
      else lf.classList.remove('is-flipped');
      // To dang bay giu z cao nhat cho toi khi transition xong, neu khong
      // no se chui xuong duoi chong giay ngay giua chung bay.
      if (lf !== moving) lf.style.zIndex = i < flipped ? i + 1 : L - i;
    }
    if (!animate) {
      void book.offsetWidth; // chot gia tri moi truoc khi bat lai transition
      for (i = 0; i < L; i++) leaves[i].classList.remove('fb-noanim');
    }
    if (spread) book.setAttribute('data-pos', flipped === 0 ? 'start' : (flipped >= L ? 'end' : 'mid'));
    else book.removeAttribute('data-pos');
    updateUI();
    preload();
  }

  function onEnd(e) {
    if (e.propertyName !== 'transform') return;
    e.currentTarget.removeEventListener('transitionend', onEnd);
    apply(true, null);
  }

  function go(delta) {
    var t = Math.max(0, Math.min(maxFlip(), flipped + delta));
    if (t === flipped) return;
    var moving = delta > 0 ? leaves[flipped] : leaves[t];
    flipped = t;
    if (moving) {
      moving.style.zIndex = leaves.length + 10;
      moving.addEventListener('transitionend', onEnd);
    }
    apply(true, moving);
    playFlip();
  }

  function jumpTo(p) {
    var t = Math.max(0, Math.min(maxFlip(), flipForPage(p)));
    if (t === flipped) return;
    if (Math.abs(t - flipped) <= 1) { go(t - flipped); return; }
    flipped = t;
    apply(false, null); // nhay xa thi khong lat tung to cho do chong mat
    playFlip();
  }

  function updateUI() {
    var p = firstPage();
    var two = spread && flipped > 0 && flipped < leaves.length;
    var label = two ? (p + 1) + '–' + Math.min(p + 2, N) : String(p + 1);
    if (counter) counter.textContent = WORD + ' ' + label + ' / ' + N;
    if (btnPrev) btnPrev.disabled = flipped <= 0;
    if (btnNext) btnNext.disabled = flipped >= maxFlip();
    // Chip sang theo MUC dang nam tren man hinh, khong theo trang ben trai.
    // Mot cap trang co the vat qua hai muc (trai Heo, phai Hai san) nen ca hai
    // chip cung sang; neu chi lay trang trai thi bam "Lau" lai sang "No cai
    // bung" — Lau la trang ben phai — khien khach tuong bam hut.
    var visible = Object.create(null);
    visible[pages[p].group] = 1;
    if (two && p + 1 < N) visible[pages[p + 1].group] = 1;
    for (var i = 0; i < chips.length; i++) {
      chips[i].btn.setAttribute('aria-current', visible[chips[i].label] ? 'true' : 'false');
    }
  }

  /* ---------- chip nhay nhanh ---------- */

  function buildChips() {
    if (!chipWrap) return;
    var seen = {};
    for (var i = 0; i < N; i++) {
      var g = pages[i].group;
      if (!g || seen[g]) continue;
      seen[g] = 1;
      var btn = el('button', 'fb-chip');
      btn.type = 'button';
      btn.textContent = g;
      btn.setAttribute('aria-current', 'false');
      (function (page) {
        btn.addEventListener('click', function () { jumpTo(page); });
      })(i);
      chipWrap.appendChild(btn);
      chips.push({ btn: btn, page: i, label: g });
    }
  }

  /* ---------- tieng lat trang ---------- */

  var ac = null;
  var soundOn = false;
  try { soundOn = localStorage.getItem('xl-fb-sound') === '1'; } catch (e) {}

  // Tao bang Web Audio thay vi tai file mp3: khong them request, khong them
  // asset phai cache-bust, va tat may cung khong ai nghe thay gi.
  function playFlip() {
    if (!soundOn || reduced()) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!ac) ac = new AC();
      if (ac.state === 'suspended') ac.resume();
      var dur = 0.34;
      var len = Math.floor(ac.sampleRate * dur);
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4) * Math.min(1, t * 25);
      }
      var s = ac.createBufferSource();
      s.buffer = buf;
      var bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 0.7;
      bp.frequency.setValueAtTime(700, ac.currentTime);
      bp.frequency.exponentialRampToValueAtTime(3200, ac.currentTime + dur);
      var g = ac.createGain();
      g.gain.value = 0.22;
      s.connect(bp); bp.connect(g); g.connect(ac.destination);
      s.start();
    } catch (e) {}
  }

  /* ---------- toan man hinh + phong to ---------- */

  var zoom = 1, panX = 0, panY = 0;

  function applyZoom() {
    stage.style.transform = zoom === 1
      ? ''
      : 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
  }
  function clampPan() {
    var r = viewport.getBoundingClientRect();
    var mx = Math.max(0, (r.width * (zoom - 1)) / 2);
    var my = Math.max(0, (r.height * (zoom - 1)) / 2);
    panX = Math.max(-mx, Math.min(mx, panX));
    panY = Math.max(-my, Math.min(my, panY));
  }
  function setZoom(z) {
    zoom = Math.max(1, Math.min(3, z));
    if (zoom === 1) { panX = 0; panY = 0; }
    // Dang phong to thi bam khong lat nua (con tro doi thanh ban tay keo),
    // neu khong khach vua keo xem chi tiet vua bi lat trang.
    sec.classList.toggle('is-zoomed', zoom > 1);
    clampPan();
    applyZoom();
  }
  function isFull() { return sec.classList.contains('is-full'); }

  // Khoi menu nam trong <section class="relative z-10"> — mot stacking context.
  // position:fixed KHONG thoat khoi stacking context cua to tien, nen du dat
  // z-index bao nhieu lop phu van bi nhot duoi thanh dieu huong z-50 va nut
  // goi noi. Cach duy nhat chac an: chuyen han phan tu ra <body> khi bat, va
  // tra dung cho cu khi tat (danh dau cho bang mot comment node).
  var anchor = null;
  function setFull(on) {
    if (on && !anchor) {
      anchor = document.createComment('flipbook');
      sec.parentNode.insertBefore(anchor, sec);
      document.body.appendChild(sec);
    } else if (!on && anchor) {
      anchor.parentNode.insertBefore(sec, anchor);
      anchor.parentNode.removeChild(anchor);
      anchor = null;
    }
    sec.classList.toggle('is-full', on);
    document.body.classList.toggle('fb-lock', on);
    if (btnFull) btnFull.setAttribute('aria-pressed', on ? 'true' : 'false');
    setHiRes(on);
    if (!on) setZoom(1);
  }

  viewport.addEventListener('wheel', function (e) {
    if (!isFull()) return;
    e.preventDefault();
    setZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });

  // Nhap dup CHI de tra ve co that. Truoc day no con dung de phong to, nhung
  // tu khi bam vao sach la lat trang thi hai thao tac dam nhau: nhap dup de
  // phong to se lat mat hai trang trước khi zoom kip chay. Phong to nay dung
  // con lan chuot (may tinh) va chum hai ngon (dien thoai).
  stage.addEventListener('dblclick', function () {
    if (isFull() && zoom > 1) setZoom(1);
  });

  /* Mot bo xu ly con tro lo ca ba viec: vuot de lat, keo de di chuyen khi
     dang phong to, va chum hai ngon de phong to. */
  var pts = {};
  var nPts = 0;
  var startX = 0, startY = 0, basePanX = 0, basePanY = 0, baseDist = 0, baseZoom = 1;

  function dist() {
    var k = Object.keys(pts);
    if (k.length < 2) return 0;
    var a = pts[k[0]], b = pts[k[1]];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  stage.addEventListener('pointerdown', function (e) {
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    nPts = Object.keys(pts).length;
    if (nPts === 1) {
      startX = e.clientX; startY = e.clientY;
      basePanX = panX; basePanY = panY;
      if (zoom > 1) stage.classList.add('is-panning');
    } else if (nPts === 2) {
      baseDist = dist();
      baseZoom = zoom;
    }
    if (stage.setPointerCapture && nPts === 1) {
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });

  stage.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return;
    pts[e.pointerId].x = e.clientX;
    pts[e.pointerId].y = e.clientY;
    if (nPts >= 2) {
      var d = dist();
      if (baseDist > 0 && d > 0) setZoom(baseZoom * (d / baseDist));
      return;
    }
    if (zoom > 1 && isFull()) {
      panX = basePanX + (e.clientX - startX);
      panY = basePanY + (e.clientY - startY);
      clampPan();
      applyZoom();
    }
  });

  // pointercancel = trinh duyet gianh lay cu chi (vd doi thanh cuon trang).
  // Phai HUY chu khong duoc coi nhu vuot xong: toa do cua no thuong ve 0, tinh
  // ra doan duong keo vai tram pixel va lat nham mot trang.
  function endPointer(e, cancelled) {
    if (!pts[e.pointerId]) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    delete pts[e.pointerId];
    var left = Object.keys(pts).length;
    if (!cancelled && nPts === 1 && zoom === 1) {
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        go(dx < 0 ? 1 : -1);            // vuot
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        // Bam vao sach: nua phai lat toi, nua trai lat lui — dung nhu cam
        // cuon menu tren tay. Lay tam theo getBoundingClientRect nen da tinh
        // ca luc sach bi day sang mot ben o trang bia va trang cuoi.
        var r = book.getBoundingClientRect();
        go(e.clientX < r.left + r.width / 2 ? -1 : 1);
      }
    }
    nPts = left;
    stage.classList.remove('is-panning');
  }
  stage.addEventListener('pointerup', function (e) { endPointer(e, false); });
  stage.addEventListener('pointercancel', function (e) { endPointer(e, true); });

  /* ---------- nut, phim ---------- */

  if (btnPrev) btnPrev.addEventListener('click', function () { go(-1); });
  if (btnNext) btnNext.addEventListener('click', function () { go(1); });
  if (btnFull) btnFull.addEventListener('click', function () { setFull(!isFull()); });
  if (btnSound) {
    btnSound.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    btnSound.addEventListener('click', function () {
      soundOn = !soundOn;
      btnSound.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      try { localStorage.setItem('xl-fb-sound', soundOn ? '1' : '0'); } catch (e) {}
      if (soundOn) playFlip();
    });
  }

  document.addEventListener('keydown', function (e) {
    // Chi cuop phim mui ten khi khach dang o trong flipbook, khong thi
    // trang van cuon binh thuong.
    if (!isFull() && !sec.contains(document.activeElement)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); jumpTo(0); }
    else if (e.key === 'End') { e.preventDefault(); jumpTo(N - 1); }
    else if (e.key === 'Escape' && isFull()) { e.preventDefault(); setFull(false); }
  });

  function onModeChange() {
    var p = firstPage();
    spread = mq.matches;
    sec.classList.toggle('fb--spread', spread);
    sec.classList.toggle('fb--single', !spread);
    setZoom(1);
    build();
    flipped = Math.max(0, Math.min(maxFlip(), flipForPage(p)));
    apply(false, null);
  }
  if (mq.addEventListener) mq.addEventListener('change', onModeChange);
  else if (mq.addListener) mq.addListener(onModeChange);

  sec.classList.add(spread ? 'fb--spread' : 'fb--single');
  build();
  buildChips();
  apply(false, null);
  sec.classList.add('is-ready');
})();
