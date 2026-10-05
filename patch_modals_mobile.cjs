const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.module.scss')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/components');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('100vw !important') || content.includes('100vh !important')) {
    content = content.replace(/max-width:\s*100vw\s*!important;/g, 'max-width: 100% !important;');
    content = content.replace(/width:\s*100vw\s*!important;/g, 'width: 100% !important;');
    content = content.replace(/width:\s*100%\s*!important;/g, 'width: 100% !important;');
    content = content.replace(/height:\s*100vh\s*!important;/g, 'max-height: 90vh !important; height: auto !important;');
    content = content.replace(/margin:\s*0\s*!important;/g, 'margin: 0 auto !important;');
    content = content.replace(/border-radius:\s*0\s*!important;/g, 'border-radius: 12px !important;');
    changed = true;
  }

  // Find media query block and replace padding of overlay
  if (content.includes('.overlay {') && content.includes('padding: 0.5rem;')) {
    content = content.replace(/padding:\s*0\.5rem;/g, 'padding: 1rem;');
    changed = true;
  }
  
  if (content.includes('.modal {') && content.includes('padding: 0.5rem !important;')) {
    // Keep internal modal padding a bit small, but not too small. Let's make it 1.25rem or just remove the !important override
    content = content.replace(/padding:\s*0\.5rem\s*!important;/g, 'padding: 1rem !important;');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Patched mobile modals in', file);
  }
});
