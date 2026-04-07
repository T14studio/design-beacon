// Script to resolve git merge conflicts by keeping HEAD version
const fs = require('fs');
const path = require('path');

function resolveConflicts(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes('<<<<<<< HEAD')) return false;
  
  // Replace all conflict markers, keeping HEAD content
  const regex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [^\r\n]+\r?\n/g;
  const resolved = content.replace(regex, '$1');
  
  fs.writeFileSync(filePath, resolved, 'utf-8');
  console.log('Fixed:', path.basename(filePath));
  return true;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      walkDir(fullPath);
    } else if (entry.isFile() && /\.(tsx?|css)$/.test(entry.name)) {
      resolveConflicts(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done!');
