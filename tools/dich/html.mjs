// Cửa vào duy nhất tới parse5 cho bộ dịch. parse5 không nằm trong repo (package.json và
// node_modules bị .gitignore), cài một lần ở thư mục này:
//   cd tools/dich && npm install --no-save --no-package-lock parse5@7.3.0
let p5;
try {
  p5 = await import('parse5');
} catch {
  console.error('Thiếu parse5. Chạy: cd tools/dich && npm install --no-save --no-package-lock parse5@7.3.0');
  process.exit(2);
}
export const { parse, parseFragment, serialize } = p5;
