const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.module.scss');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // Change width: 100% !important; to width: calc(100% - 2rem) !important; in modals
  if (content.includes('width: 100% !important;')) {
    content = content.replace(/width:\s*100%\s*!important;/g, 'width: calc(100% - 2rem) !important;');
    changed = true;
  }
  
  if (content.includes('width: 100%;') && content.includes('.modal')) {
    // only if it's inside a media query or modal, let's be careful.
    // Actually, setting padding: 1rem on overlay and max-width: 100% is better.
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
