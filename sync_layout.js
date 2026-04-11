const fs = require('fs');
const path = require('path');

const srcFile = 'index.html';
const destFiles = ['about.html', 'menu.html', 've-chung-toi.html', 'blog.html', 'en.html', 'about-en.html', 'menu-en.html', 'about-us-en.html', 'blog-en.html'];

let srcContent = fs.readFileSync(path.join(__dirname, srcFile), 'utf8');

// Advanced extraction using index-based slicing to prevent regex greedy issues
function extractBlock(content, startStr, endStr) {
    const startIndex = content.indexOf(startStr);
    if (startIndex === -1) return null;
    const endIndex = content.indexOf(endStr, startIndex + startStr.length);
    if (endIndex === -1) return null;
    return content.substring(startIndex, endIndex + endStr.length);
}

// Extract Nav
const navBlock = extractBlock(srcContent, '<nav id="navbar"', '</nav>');
// Extract Mobile Menu
const mobileMenuBlock = extractBlock(srcContent, '<div id="mobile-menu"', '  </div>\n\n  <!-- HERO -->') || 
                        extractBlock(srcContent, '<div id="mobile-menu"', '  </div>\n\n  <!-- PAGE HEADER -->') ||
                        extractBlock(srcContent, '<div id="mobile-menu"', '  </div>\n\n  <!--') ||
                        extractBlock(srcContent, '<div id="mobile-menu"', '</div>\n\n  <');

// Extract Footer
const footerBlock = extractBlock(srcContent, '<!-- FOOTER -->\n  <footer', '</footer>');

if (!navBlock || !mobileMenuBlock || !footerBlock) {
    console.error('Failed to extract one of the blocks from index.html.');
    process.exit(1);
}

console.log('Successfully extracted blocks.');

destFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Nav
    const currentNav = extractBlock(content, '<nav id="navbar"', '</nav>');
    if (currentNav) content = content.replace(currentNav, navBlock);

    // Replace Mobile Menu
    // Try to find the end of mobile menu
    let currentMobile = extractBlock(content, '<div id="mobile-menu"', '  </div>\n\n  <!-- HERO -->') || 
                        extractBlock(content, '<div id="mobile-menu"', '  </div>\n\n  <!-- PAGE HEADER -->') ||
                        extractBlock(content, '<div id="mobile-menu"', '  </div>\n\n  <') ||
                        extractBlock(content, '<div id="mobile-menu"', '</div>\n\n');
    
    if (currentMobile) {
        // Since mobile menu extraction might grab slightly different trailing characters,
        // let's just do a string replace of the exact current block with the new block
        content = content.replace(currentMobile, mobileMenuBlock);
    }

    // Replace Footer
    const currentFooter = extractBlock(content, '<!-- FOOTER -->\n  <footer', '</footer>');
    if (currentFooter) content = content.replace(currentFooter, footerBlock);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Synced layouts for ${file}`);
});
