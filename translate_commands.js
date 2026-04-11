const fs = require('fs');
const path = require('path');

const commandsDir = 'e:/tiemnuongchillxomleo/project/static-html-version/.claude/commands';
const jsonDataPath = 'e:/tiemnuongchillxomleo/project/static-html-version/.claude/scripts/commands_data.json';

const translations = JSON.parse(fs.readFileSync(jsonDataPath, 'utf8'));

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.md')) {
            translateFile(fullPath);
        }
    }
}

function translateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.relative(commandsDir, filePath).replace(/\\/g, '/');
    
    // Find matching translation by path
    const translation = translations.find(t => t.path === fileName);
    
    if (translation && translation.description) {
        // Replace description in frontmatter
        // Match description: ... until next line or ---
        const regex = /description:\s*(.*)/;
        if (regex.test(content)) {
            content = content.replace(regex, `description: ${translation.description}`);
            fs.writeFileSync(filePath, content);
            console.log(`Translated: ${fileName}`);
        } else {
            // If no description, add one after the first ---
            const frontmatterRegex = /^---\n/;
            if (frontmatterRegex.test(content)) {
                content = content.replace(frontmatterRegex, `---\ndescription: ${translation.description}\n`);
                fs.writeFileSync(filePath, content);
                console.log(`Added & Translated: ${fileName}`);
            }
        }
    }
}

walkDir(commandsDir);
