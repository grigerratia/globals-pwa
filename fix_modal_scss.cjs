const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/ProjectDetailModal.module.scss', 'utf-8');

// 1. Change modal background
code = code.replace('.modal {\n  background: #ffffff;', '.modal {\n  background: #f8fafc;'); // Slate 50

// 2. Tweak section shadow
code = code.replace('box-shadow: 0 1px 3px rgba(0,0,0,0.02);', 'box-shadow: 0 2px 4px rgba(0,0,0,0.04);');

fs.writeFileSync('src/components/Modals/ProjectDetailModal.module.scss', code);
console.log("Updated SCSS background.");
