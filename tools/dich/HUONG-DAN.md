# Hướng dẫn dịch xomleo.vn sang 中文 / 한국어 / 日本語 / Русский / ไทย

Site của **Tiệm Nướng & Chill Xóm Lèo**: quán nướng BBQ than hồng + lẩu ở Đà Lạt, view thung lũng nhà
kính Trại Mát, ngắm hoàng hôn và đoàn tàu cổ chạy ngang lan can. Phần lớn site là cẩm nang du lịch Đà
Lạt (điểm tham quan, ăn gì, chơi gì). Người đọc bản dịch là **khách du lịch Trung Quốc, Hàn, Nhật, Nga,
Thái** đang tìm chỗ ăn/chơi ở Đà Lạt. Dịch cho họ đọc tự nhiên như bài viết gốc bằng tiếng của họ —
không dịch từng chữ, nhưng **không thêm, không bớt dữ kiện** (giờ, giá, khoảng cách, số liệu giữ đúng).

Nguồn luôn là bản **tiếng Việt**. Bản tiếng Anh có sẵn trên site không phải nguồn.

## 1. Gói việc và cách trả bài

- Gói nguồn: `tools/dich/viec/viec-NN.json` → `{"goi": "...", "doan": [{"id", "trang", "loai", "vi"}]}`.
  `trang` là URL trang chứa đoạn (để biết ngữ cảnh). Các đoạn xếp theo thứ tự xuất hiện trên trang.
- Bản dịch ghi vào `tools/dich/ban-dich/<ma>/viec-NN.json` (`<ma>` = zh, ko, ja, ru, th), là MỘT object
  JSON phẳng: `{"<id>": "<bản dịch>", ...}` — đủ mọi id của gói, không thêm id lạ. Phải là JSON hợp lệ
  (UTF-8, escape dấu `"` và `\` trong chuỗi).
- Kiểm: `node tools/dich/kiem-ban-dich.mjs <ma> viec-NN` — sửa tới khi **0 lỗi**. Đọc kỹ cảnh báo: "còn
  chữ Việt" và "có vẻ chưa dịch" thường là sót thật; nếu đúng là tên riêng được giữ thì bỏ qua.
- Gói lớn thì ghi bản dịch theo từng phần (đọc nửa đầu gói → ghi file → đọc tiếp → ghi đè file với đủ
  nội dung) để không mất việc giữa chừng. Đừng dùng script/máy dịch để sinh bản dịch — tự dịch.

## 2. Loại đoạn (`loai`)

- `chu` — chữ hiển thị trên trang, có thể chứa **mã thẻ** (mục 3).
- `tt` — giá trị thuộc tính: alt ảnh, aria-label, placeholder, meta description, tiêu đề og… Chữ thuần,
  không mã thẻ. Alt ảnh mô tả đúng thứ trong ảnh như bản Việt.
- `ld` — chuỗi trong dữ liệu có cấu trúc schema.org (mô tả, tên món, câu hỏi FAQ, keywords…). Chữ thuần.
  `keywords` là danh sách cách nhau bằng dấu phẩy: viết thành **từ khoá người bản ngữ thật sự gõ** khi
  tìm (vd. zh 大叻烧烤, ko 달랏 맛집 / 달랏 바베큐, ja ダラット グルメ, ru Далат ресторан барбекю,
  th ร้านปิ้งย่างดาลัด), không dịch máy từng cụm.
- `js` — chuỗi trong script ô tìm kiếm blog; giữ nguyên biến `{0}`.

## 3. Mã thẻ — LUẬT CỨNG

`<a1>…</a1>`, `<strong2>…</strong2>`, `<span3>…</span3>` là thẻ có cặp; `<br4/>`, `<img5/>`,
`<svg6/>` là thẻ đơn. Mỗi mã trong nguồn phải xuất hiện **đúng một lần** trong bản dịch, cặp mở/đóng
bọc đúng phần chữ tương ứng và lồng đúng thứ tự. **Được đổi vị trí** cho hợp ngữ pháp. Không thêm mã,
không bỏ mã, không viết thẻ HTML thật, không escape (`&amp;`…) — viết ký tự bình thường.

Ví dụ (zh): `Đến <a1>Xóm Lèo</a1> lúc <strong2>17:00</strong2> để kịp hoàng hôn.`
→ `<strong2>17:00</strong2>前到<a1>Xóm Lèo</a1>，正好赶上日落。`

Đoạn chỉ gồm các link menu kiểu `<a1>Trang chủ</a1> <a2>Trải nghiệm</a2> <a3>Menu</a3>` thì dịch
từng nhãn bên trong, giữ nguyên khoảng trắng giữa các mã.

## 4. Giữ nguyên (không dịch, không phiên âm)

- Tên quán **Tiệm Nướng & Chill Xóm Lèo** — đúng từng chữ, kể cả "&". "Xóm Lèo" đứng một mình cũng giữ.
  Quán chị em **Trạm Dừng Chill** giữ nguyên. "Xóm Lèo Station" giữ nguyên.
- Địa chỉ đầy đủ **113 Huỳnh Tấn Phát, Phường Xuân Trường - Đà Lạt, Lâm Đồng** — chép nguyên văn
  (khách đưa cho tài xế Grab/taxi xem). Trong câu văn thường, tên đường "Huỳnh Tấn Phát" cũng giữ.
- Số điện thoại, email, URL, @tên tài khoản, hashtag, giờ (15:00–23:00), **giá** (209.000đ, 250k,
  250–300k — giữ đúng cách viết), mã/tên thương hiệu nước ngoài (Google Maps, TikTok, Facebook, Zalo,
  Grab, BBQ, Kobe, Okachi, Tiger, Heineken, Coca-Cola, Fairytale Land, Wonderland, Dalat Plateau
  Rail Road…).
- Tên địa danh nhỏ không có tên quen dùng trong ngôn ngữ đích: **Trại Mát**, **Đơn Dương**, Cầu Đất,
  Xuân Trường… → giữ chữ Việt có dấu. Địa danh lớn dùng bảng thuật ngữ (mục 7).
- Họ tên người Việt giữ nguyên chữ Việt. Riêng chỗ điền mẫu "Nguyễn Văn A" (ô tên trong form) thì đổi
  thành tên mẫu của ngôn ngữ đích: zh 张三 · ko 홍길동 · ja 山田太郎 · ru Иван Петров · th สมชาย ใจดี.

Món ăn/đặc sản Việt: dịch nghĩa cho người đọc hiểu; khi tên Việt có ích để gọi món hay tìm quán (bánh
tráng nướng, bánh căn, nem nướng…) thì được kèm tên Việt trong ngoặc **ở lần nhắc đầu tiên trong đoạn**,
vd. zh 烤米纸（bánh tráng nướng）. Không kèm ở mọi lần nhắc.

Số: giữ đúng giá trị. Ngày tháng được viết theo kiểu ngôn ngữ đích (2026年10月12日, 12.10.2026…) nhưng
phải đúng ngày. Đơn vị (km, phút, người) dịch bình thường.

## 5. Văn phong từng ngôn ngữ

- **zh** — Tiếng Trung giản thể (zh-Hans, người đọc Trung Quốc đại lục). Văn du lịch/ẩm thực tự nhiên,
  dấu câu toàn khổ （），。：！？、. Không dùng phồn thể.
- **ko** — 존댓말 해요체 cho thân bài (…예요, …해요); tiêu đề, nút, nhãn ngắn gọn dạng danh từ
  (예약하기, 메뉴 보기). Khoảng cách từ (띄어쓰기) chuẩn.
- **ja** — です・ます調 cho thân bài; nút/nhãn ngắn (予約する, メニューを見る). Dấu câu 、。「」.
- **ru** — xưng «вы» (viết thường), giọng thân thiện nhưng chuẩn mực; ngoặc «ёлочки»; gạch nối dài —.
- **th** — ภาษาเขียนสุภาพ เป็นกันเอง; không chêm ครับ/ค่ะ vào thân bài; nút/nhãn ngắn (จองโต๊ะ, ดูเมนู).

Nhãn giao diện dùng thống nhất trong toàn site:

| Tiếng Việt | zh | ko | ja | ru | th |
|---|---|---|---|---|---|
| Đặt bàn | 订座 | 예약하기 | 予約する | Забронировать | จองโต๊ะ |
| Trang chủ | 首页 | 홈 | ホーム | Главная | หน้าแรก |
| Trải nghiệm | 体验 | 체험 | 体験 | Впечатления | ประสบการณ์ |
| Menu (mục điều hướng) | 菜单 | 메뉴 | メニュー | Меню | เมนู |
| Blog | 博客 | 블로그 | ブログ | Блог | บล็อก |
| Đường đi | 交通指南 | 오시는 길 | アクセス | Как добраться | การเดินทาง |
| Cẩm nang | 攻略 | 가이드 | ガイド | Путеводитель | คู่มือ |
| Hotline | 热线 | 핫라인 | ホットライン | Горячая линия | ฮอตไลน์ |
| Bếp trưởng Xóm Lèo (tác giả) | Xóm Lèo 主厨 | Xóm Lèo 셰프 | Xóm Lèo 料理長 | шеф-повар Xóm Lèo | เชฟ Xóm Lèo |
| Tóm tắt nhanh | 快速摘要 | 핵심 요약 | 要点まとめ | Коротко | สรุปสั้น ๆ |
| Mục lục | 目录 | 목차 | 目次 | Содержание | สารบัญ |
| Câu hỏi thường gặp | 常见问题 | 자주 묻는 질문 | よくある質問 | Частые вопросы | คำถามที่พบบ่อย |
| Bài viết liên quan | 相关文章 | 관련 글 | 関連記事 | Читайте также | บทความที่เกี่ยวข้อง |
| X phút đọc | 阅读约 X 分钟 | X분 읽기 | 約 X 分で読めます | X мин чтения | อ่าน X นาที |

## 6. Tiêu đề và mô tả (SEO)

`<title>` / og:title: tự nhiên, có tên địa danh (大叻 / 달랏 / ダラット / Далат / ดาลัด) và chủ đề chính,
giữ ý chính của bản Việt. Độ dài gợi ý: zh/ja ≤ 32 ký tự, ko ≤ 40, th ≤ 55, ru ≤ 65.
Meta description: zh/ja ≤ 80 ký tự, ko ≤ 90, th ≤ 120, ru ≤ 155. Được rút gọn bớt ý phụ cho vừa.

## 7. Thuật ngữ địa danh và món (dùng đúng như bảng)

| Tiếng Việt | zh | ko | ja | ru | th |
|---|---|---|---|---|---|
| Đà Lạt | 大叻 | 달랏 | ダラット | Далат | ดาลัด |
| Lâm Đồng (tỉnh) | 林同省 | 럼동성 | ラムドン省 | провинция Ламдонг | จังหวัดเลิมด่ง |
| Việt Nam | 越南 | 베트남 | ベトナム | Вьетнам | เวียดนาม |
| Hồ Xuân Hương | 春香湖 | 쑤언흐엉 호수 | スアンフーン湖 | озеро Суанхыонг | ทะเลสาบซวนเฮือง |
| Ga Đà Lạt (ga xe lửa) | 大叻火车站 | 달랏 기차역 | ダラット駅 | вокзал Далата | สถานีรถไฟดาลัด |
| Chợ Đà Lạt / chợ đêm Đà Lạt | 大叻市场 / 大叻夜市 | 달랏 시장 / 달랏 야시장 | ダラット市場 / ダラット・ナイトマーケット | рынок Далата / ночной рынок Далата | ตลาดดาลัด / ตลาดกลางคืนดาลัด |
| Langbiang (núi, đỉnh) | 朗边山 | 랑비앙산 | ランビアン山 | гора Лангбианг | ภูเขาลังเบียง |
| Thung lũng Tình Yêu | 爱情谷 | 사랑의 계곡 | 愛の谷 | Долина любви | หุบเขาแห่งความรัก |
| Hồ Tuyền Lâm | 泉林湖 | 뚜옌럼 호수 | トゥエンラム湖 | озеро Туенлам | ทะเลสาบเตวี่ยนเลิม |
| Thiền viện Trúc Lâm | 竹林禅院 | 쭉럼 선원 | チュックラム禅院 | дзен-монастырь Чуклам | วัดเซนจุ๊กเลิม |
| Thác Datanla | 达坦拉瀑布 | 다딴라 폭포 | ダタンラの滝 | водопад Датанла | น้ำตกดาตันลา |
| Dinh Bảo Đại | 保大皇夏宫 | 바오다이 별궁 | バオダイ帝の離宮 | резиденция императора Бао Дая | พระราชวังฤดูร้อนจักรพรรดิเบ๋าได่ |
| Nhà thờ Con Gà | 公鸡教堂 | 닭 성당 | 鶏の教会 | Петушиный собор | โบสถ์ไก่ |
| Quảng trường Lâm Viên | 林园广场 | 럼비엔 광장 | ラムヴィエン広場 | площадь Ламвьен | จัตุรัสเลิมเวียน |
| Đồi Robin | 罗宾山 | 로빈 언덕 | ロビンの丘 | холм Робин | เนินเขาโรบิน |
| Đèo Prenn | 普伦山口 | 프렌 고개 | プレン峠 | перевал Пренн | ช่องเขาเพรนน์ |
| Chùa Linh Phước (chùa Ve Chai) | 灵福寺 | 린푸억 사원 | リンフオック寺 | пагода Линьфуок | วัดลินห์เฟือก |
| Cao đẳng Sư phạm Đà Lạt | 大叻师范学院 | 달랏 사범대학 | ダラット師範大学 | Далатский педагогический колледж | วิทยาลัยครุศาสตร์ดาลัด |
| Hồ Than Thở | 叹息湖 | 탄터 호수 | タントー湖 | озеро Тхантхо | ทะเลสาบทานเทอ |
| Đường hầm điêu khắc | 雕刻隧道 | 조각 터널 | 彫刻トンネル | Скульптурный туннель | อุโมงค์ประติมากรรม |
| Cổng trời Bali | 巴厘天空之门 | 발리 하늘문 | バリの天空の門 | «Небесные врата Бали» | ประตูสวรรค์บาหลี |
| Ga Xóm Lèo (bảng giờ của quán) | Xóm Lèo 站 | Xóm Lèo 역 | Xóm Lèo 駅 | станция Xóm Lèo | สถานี Xóm Lèo |
| tàu hỏa / xe lửa (đoàn tàu Đà Lạt – Trại Mát) | 观光小火车 / 火车 | 관광열차 / 기차 | 観光列車 / 列車 | туристический поезд / поезд | รถไฟท่องเที่ยว / รถไฟ |
| thung lũng nhà kính | 温室山谷 | 비닐하우스 계곡 | ビニールハウスの谷 | долина теплиц | หุบเขาเรือนกระจก |
| hoàng hôn | 日落 | 일몰 | 夕日 / サンセット | закат | พระอาทิตย์ตก |
| than hồng (nướng than hồng) | 炭火（炭火烧烤） | 숯불 (숯불구이) | 炭火（炭火焼き） | угли (гриль на углях) | ถ่านไฟแดง (ปิ้งย่างเตาถ่าน) |
| lẩu | 火锅 | 전골 | 鍋 | хотпот | หม้อไฟ |
| lẩu cá tầm | 鲟鱼火锅 | 철갑상어 전골 | チョウザメ鍋 | хотпот из осетра | หม้อไฟปลาสเตอร์เจียน |
| lẩu gà lá é | 罗勒叶鸡肉火锅 | 바질잎 닭 전골 | ホーリーバジル鶏鍋 | куриный хотпот с базиликом «э» | หม้อไฟไก่ใบแมงลัก |
| bò Kobe nướng tảng phô mai trứng muối | 芝士咸蛋黄烤神户牛肉块 | 치즈 솔티드에그 고베 소고기 덩어리 구이 | 神戸牛のかたまり焼き チーズ塩卵ソース | говядина Кобе куском под сыром и солёным желтком | เนื้อโกเบย่างทั้งก้อนซอสชีสไข่เค็ม |
| bò lúc lắc | 越式骰子牛肉 | 보룩락 (베트남식 큐브 스테이크) | ボールックラック（サイコロステーキ） | «бо лук лак» — говядина кубиками | เนื้อลุกลัก (สเต๊กเต๋าเวียดนาม) |
| cá tầm | 鲟鱼 | 철갑상어 | チョウザメ | осётр | ปลาสเตอร์เจียน |
| bánh tráng nướng | 烤米纸 | 반짱느엉 (베트남 피자) | バインチャンヌン（ベトナム風ピザ） | баньчанг нуонг («вьетнамская пицца») | บั๋นจ๋างเนื้อง (พิซซ่าเวียดนาม) |
| cẩm tú cầu | 绣球花 | 수국 | 紫陽花 | гортензия | ดอกไฮเดรนเยีย |
| dã quỳ | 野葵花 | 야생 해바라기 | ワイルドサンフラワー | дикий подсолнечник | ดอกบัวตอง |
| mai anh đào | 越南樱花 | 마이안다오 벚꽃 | ベトナム桜（マイアンダオ） | вьетнамская сакура | ซากุระเวียดนาม |
| sương mù | 雾 / 晨雾 | 안개 | 霧 | туман | หมอก |
| homestay | 民宿 | 홈스테이 | ホームステイ型の宿 | гостевой дом (homestay) | โฮมสเตย์ |
| check-in / sống ảo (chụp ảnh) | 打卡拍照 | 인생샷 / 사진 명소 | 映えスポット / 写真映え | фотолокация | จุดเช็กอิน / ถ่ายรูปสวย |

## 8. Quy ước đã chốt từ gói 1 — các gói sau theo đúng

**Chung cho mọi thứ tiếng**
- Gói 1 (trang chủ, Trải nghiệm, Menu, Blog, menu điều hướng, chân trang) là chuẩn giọng văn. Trước khi dịch
  gói khác, đọc lướt bản dịch gói 1 của thứ tiếng mình: `tools/dich/ban-dich/<ma>/viec-01.json` đối chiếu
  `tools/dich/viec/viec-01.json` — tên món, nhãn nút, cách gọi quán phải dùng lại y như ở đó.
- Lời đánh giá của khách (kể cả gốc tiếng Anh) cũng dịch sang ngôn ngữ đích; tên người đánh giá giữ nguyên.
- Giá giữ y nguyên (209.000đ, 209K). Số đếm bỏ dấu chấm nghìn kiểu Việt (1.978 → 1978).
- Tên đường phố Việt: giữ chữ Việt (khách đọc cho tài xế); zh được ghi tên Hán kèm tên Việt trong ngoặc,
  vd. 陈兴道路（Trần Hưng Đạo）.
- File nháp (nếu cần) đặt tên riêng có mã ngôn ngữ + số gói, vd. `nhap-zh-viec-07.txt` — nhiều agent chạy
  song song, tên chung sẽ bị ghi đè.

**zh** — xưng 您. "chill" → 惬意 / 松弛感. Ngày 2026年9月14日; km → 公里. Tuyến đường 大叻—Trại Mát.
Tiêu đề kiểu "大叻…烧烤店… - Xóm Lèo | …". quán nướng → 烧烤店; quán nướng view đẹp → 美景烧烤店;
best seller → 热销 / 人气招牌; món signature → 招牌菜; lai rai → 下酒小菜; món ăn kèm → 配菜;
no cái bụng → 饱腹主食; bàn view tàu → 火车景观座; trang trí bàn → 布置餐桌; đặt cọc → 订金;
nhóm đông → 多人聚餐 / 团体; giờ vàng → 黄金时刻; tàu cổ → 复古小火车; muối ớt / rang muối → 椒盐;
Tết Nguyên đán → 春节; mùng 2 → 大年初二; Đặt bàn ngay → 立即订座; Xem thực đơn → 查看菜单;
Chỉ đường → 查看路线; Đọc bài viết → 阅读全文; Cập nhật: → 更新于：; rượu mơ → 青梅酒; Tháp Chàm → 塔占.

**ru** — Tiêu đề viết hoa kiểu câu (không hoa từng chữ). «ёлочки», gạch dài —, "Далат — Trại Mát".
Ngày 14.09.2026; số thập phân dấu phẩy (4,8/5); 74,8 тыс., 1,2 млн. "chill" → уютный / расслабленный /
релакс (không viết «чилл»). quán nướng → гриль-ресторан (title/keywords: ресторан барбекю);
Đặt bàn ngay → Забронировать столик; Xem thực đơn → Смотреть меню; Chỉ đường → Маршрут;
Đọc bài viết → Читать статью; Cập nhật: → Обновлено:; lan can → перила; giờ vàng → «золотой час»;
xe lửa cổ → старинный поезд; xe máy → мотобайк; Tết Nguyên đán → Тэт (Лунный Новый год);
đường sắt răng cưa → зубчатая железная дорога; Tháp Chàm → Тхапчам; lai rai → закуски к пиву;
no cái bụng → сытные блюда; Tiger Bạc / Tiger Nâu → Tiger Crystal / Tiger Lager; táo đỏ → унаби;
tắc → каламанси; rượu mơ → абрикосовая настойка.

**ko** — Số đếm dấu phẩy nghìn (1,978), thập phân dấu chấm (4.8/5); giá vẫn 209.000đ, trợ từ sau giá theo
âm "동" (320.000đ이에요) hoặc để giá trong ngoặc. Ngày 2026년 9월 14일; khoảng dùng ~ (19~20시, 4~10명).
Quán tự xưng 가게; quán nướng: tiêu đề/SEO 바베큐 맛집, câu văn 고깃집; khách → 손님; "chill" → 힐링.
Đặt bàn ngay → 지금 예약하기; nút gửi form → 예약 신청하기; Xem thực đơn → 메뉴 보기; Chỉ đường → 길 찾기;
Giờ mở cửa → 영업시간; Cập nhật: → 업데이트:; Đọc bài viết → 글 읽기; nhà kính → 비닐하우스; lan can → 난간;
giờ vàng → 골든아워; chuyến tàu đêm → 야간 열차; đường sắt răng cưa → 톱니바퀴 철도; điểm check-in → 포토존;
chụp ảnh check-in → 인생샷; hot spot → 핫플; trứng muối → 솔티드에그; ba chỉ bò → 우삼겹; ba chỉ heo → 삼겹살;
muối ớt → 고추소금; muối tiêu → 후추소금; lai rai / đồ nhậu → 안주; nhậu → 술자리; rượu mơ → 매실주;
tắc → 깔라만시; táo đỏ → 대추; chanh → 라임; Tết Nguyên đán → 베트남 설(뗏); mùng 2 → 음력 1월 2일.

**ja** — Dấu cách nửa khổ quanh tên chữ Việt / tên Latin nhiều từ (Xóm Lèo の, Trại Mát 方面, Google Maps で);
từ mượn một chữ viết liền (BBQ, TikTok). Số liền đơn vị (5km, 1,978件, 15〜20分); khoảng dùng 〜 (15:00〜23:00).
Lời khách trong 「」, gạch dài ―. Ngày 2026年9月14日. 74.8K → 7.48万. Đặt bàn ngay → 今すぐ予約する;
Xem thực đơn → メニューを見る; Bỏ qua điều hướng → 本文へスキップ; Đọc bài viết → 記事を読む;
Chỉ đường → ルートを見る; Thời gian mở cửa → 営業時間; Cập nhật: → 更新日：; quán nướng → BBQレストラン / BBQ店
(từ khoá ダラット 焼肉, ダラット BBQ); chill → チル; lan can → 手すり; giờ vàng → ゴールデンアワー;
xe lửa cổ → レトロな列車; tàu chỉ chạy khi đủ khách → 乗客が集まった日のみ運行; Tết → テト（旧正月）;
đặt cọc → デポジット（前金）; lai rai → おつまみ; no cái bụng → お食事; món ăn kèm → サイドメニュー;
ba chỉ bò → 牛バラ; chân gà → 鶏もみじ; muối ớt → 塩唐辛子; trứng muối → 塩卵; nước mắm → ヌックマム（魚醤）;
tắc → カラマンシー; táo đỏ → なつめ; rượu mơ → 梅酒.

**th** — Không ครับ/ค่ะ; ngăn câu bằng khoảng trắng. Số kiểu Thái (1.978 → 1,978; 4,8 → 4.8; 5 km → 5 กม.);
giá giữ 209.000đ. Ngày "14 กันยายน 2026" (năm dương lịch), thẻ blog viết tắt "9 ต.ค. 2026". quán nướng → ร้านปิ้งย่าง;
nướng than hồng → ปิ้งย่างเตาถ่าน; lan can → ราวระเบียง / ราวไม้; nhà lồng → เรือนกระจก; giờ vàng → ช่วงแสงทอง;
chỉ chạy khi đủ khách → วิ่งเฉพาะเมื่อมีผู้โดยสารเพียงพอ; Tết Nguyên đán → เทศกาลเต๊ด (ตรุษญวน);
best seller → เมนูขายดี; món signature → เมนูซิกเนเจอร์; lai rai → กับแกล้ม; món ăn kèm → เครื่องเคียง;
no cái bụng → อิ่มท้อง; trà lạnh → ชาผลไม้เย็น (KHÔNG ชาเย็น); ba chỉ bò → เนื้อวัวสามชั้น; ba chỉ heo → หมูสามชั้น;
muối ớt → เกลือพริก; chiên mắm → ทอดน้ำปลา; chân gà → ตีนไก่; rượu mơ → เหล้าบ๊วย; Đặt bàn ngay → จองโต๊ะเลย;
Xem thực đơn → ดูเมนู; Chỉ đường → นำทาง; Đọc bài viết → อ่านบทความ; nhóm đông → กลุ่มใหญ่; nhậu → วงเหล้า;
check-in → เช็กอิน.
