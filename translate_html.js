const fs = require('fs');
const path = require('path');

const files = ['about-en.html', 'menu-en.html', 'about-us-en.html', 'blog-en.html'];

const replacements = [
  // Links
  { s: /href="index\.html"/g, r: 'href="en.html"' },
  { s: /href="about\.html"/g, r: 'href="about-en.html"' },
  { s: /href="menu\.html"/g, r: 'href="menu-en.html"' },
  { s: /href="ve-chung-toi\.html"/g, r: 'href="about-us-en.html"' },
  { s: /href="blog\.html"/g, r: 'href="blog-en.html"' },
  
  // Navbar Texts
  { s: />Trang chủ<\/a>/g, r: '>Home</a>' },
  { s: />Trải[\s\n]*nghiệm<\/a>/g, r: '>Experience</a>' },
  { s: />Về[\s\n]*chúng tôi<\/a>/g, r: '>About Us</a>' },
  { s: />Đặt bàn<\/a>/g, r: '>Book Table</a>' },
  { s: />ĐẶT BÀN NGAY<\/a>/g, r: '>BOOK NOW</a>' },
  { s: />Giữ Chỗ \/ Đặt Bàn<\/a>/g, r: '>Reserve Table</a>' },
  
  // Footer
  { s: /Ẩn mình giữa đồi thông xanh ngát — chốn dừng chân của những tâm hồn tìm kiếm sự bình yên giữa cái lạnh Đà Lạt\./g, r: 'Hidden among the lush pine hills — a sanctuary for kindred spirits seeking peace amidst the signature chill of Da Lat.' },
  { s: />Liên kết<\/h4>/g, r: '>Links</h4>' },
  { s: />Liên hệ<\/h4>/g, r: '>Contact</h4>' },
  { s: />Thời gian mở cửa<\/span>/g, r: '>Opening Hours</span>' },
  { s: /15:00 – 23:00 hàng ngày/g, r: '15:00 – 23:00 everyday' },
  { s: />Địa chỉ<\/span>/g, r: '>Address</span>' },
  { s: /113 Huỳnh Tấn Phát, P11, Đà Lạt \(Khu vực Xóm Lèo\)/g, r: '113 Huynh Tan Phat, Ward 11, Da Lat (Xom Leo Area)' },
  { s: />Bản đồ<\/h4>/g, r: '>Map</h4>' },
  { s: />Xem đường đi<\/a>/g, r: '>Get Directions</a>' },
  { s: /© 2026 Tiệm Nướng &amp; Chill Xóm Lèo\. Đà Lạt, Việt Nam\./g, r: '© 2026 Tiem Nuong &amp; Chill Xom Leo. Da Lat, Vietnam.' },
  { s: />Thực Đơn<\/a>/g, r: '>Menu</a>' },
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    replacements.forEach(({ s, r }) => {
      content = content.replace(s, r);
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Translated basic layouts for ${file}`);
  }
});
