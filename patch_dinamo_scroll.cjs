const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dinamo/DinamoAgent.module.scss');
let content = fs.readFileSync(file, 'utf8');

// Overlay
content = content.replace(/\.overlay\s*{[\s\S]*?z-index:\s*10000;/, 
  `.overlay {\n  position: fixed;\n  inset: 0;\n  padding: 1rem;\n  background: rgba(15, 23, 42, 0.85);\n  backdrop-filter: blur(8px);\n  z-index: 10000;\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;`);

content = content.replace(/align-items:\s*center;\n\s*justify-content:\s*center;/g, 
  'align-items: flex-start;\n  justify-content: center;');

// Modal
content = content.replace(/\.modal\s*{[\s\S]*?width:/, 
  `.modal {\n  background: linear-gradient(135deg, #0f172a, #1e3a8a);\n  margin: auto;\n  margin-top: 2rem;\n  margin-bottom: 2rem;\n  width:`);

// Remove max-height and overflow from modal since overlay handles it
content = content.replace(/max-height:\s*90vh;\n\s*overflow-y:\s*auto;/g, '');

fs.writeFileSync(file, content);
console.log('Dinamo scroll patched');
