const fs = require('fs');
const p = require('path');

function getF(d) {
  let r = [];
  for (let f of fs.readdirSync(d)) {
    f = p.join(d, f);
    if (fs.statSync(f).isDirectory()) r = r.concat(getF(f));
    else if (f.endsWith('.html')) r.push(f);
  }
  return r;
}

for (let f of getF('./static-html-version')) {
  let c = fs.readFileSync(f, 'utf8');
  let newC = c;

  // Add alt and loading=lazy to img tags
  newC = newC.replace(/<img(.*?)>/gi, (m, g1) => {
    let out = m;
    if (!/alt\s*=\s*['"][^'"]+['"]/i.test(m)) {
      if (!/alt\s*=/i.test(m)) {
        out = out.replace(/<img/i, '<img alt="Hình ảnh Tiệm Nướng Xóm Lèo Đà Lạt"');
      } else {
        out = out.replace(/alt\s*=\s*['"]['"]/i, 'alt="Hình ảnh Tiệm Nướng Xóm Lèo Đà Lạt"');
      }
    }
    if (!/loading\s*=\s*['"]lazy['"]/i.test(m) && !/hero|logo/i.test(m)) {
      out = out.replace(/<img/i, '<img loading="lazy"');
    }
    return out;
  });

  // Add poster to video tags where missing
  newC = newC.replace(/<video(.*?)>/gi, (m, g1) => {
    if (!/poster\s*=/i.test(m)) {
      return `<video poster="../uploads/1775619688243-610230636-img2.webp"${g1}>`;
    }
    return m;
  });

  if (c !== newC) {
    fs.writeFileSync(f, newC);
    console.log('Fixed ' + f);
  }
}
