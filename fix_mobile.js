const fs = require('fs');
let c = fs.readFileSync('en/index.html', 'utf8');

const target = `<video autoPlay loop muted playsInline
        class="absolute inset-0 w-full h-full object-cover object-center scale-105 opacity-60">
        <source src="../uploads/1775619540162-191150330-xomleo-desktop.mp4" type="video/mp4" />
      </video>`;

const replacement = `<video autoPlay loop muted playsInline preload="metadata" poster="../uploads/1775619688243-610230636-img2.webp" aria-hidden="true"
        class="absolute inset-0 w-full h-full object-cover object-center scale-105 opacity-60">
        <source src="../uploads/tiktok-1.mp4" type="video/mp4" media="(max-width: 768px)" />
        <source src="../uploads/1775619540162-191150330-xomleo-desktop.mp4" type="video/mp4" />
      </video>`;

// normalize line endings in case they differ
function normalize(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

c = normalize(c).replace(normalize(target), replacement);

fs.writeFileSync('en/index.html', c);
console.log('en/index.html updated');
