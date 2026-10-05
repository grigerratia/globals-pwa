const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dinamo/DinamoAgent.module.scss');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/align-items:\s*flex-start;\n\s*justify-content:\s*center;/g, 
  'align-items: center;\n  justify-content: center;');

// BUT we need the overlay to stay flex-start so it can scroll
content = content.replace(/\.overlay\s*{[^}]*align-items:\s*center;/g, 
  (match) => match.replace('align-items: center;', 'align-items: flex-start;'));

fs.writeFileSync(file, content);
console.log('Dinamo flex patched');
