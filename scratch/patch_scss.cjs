const fs = require('fs');
let content = fs.readFileSync('src/components/Modals/ProjectDetailModal.module.scss', 'utf8');

const regex = /select\s*\{[\s\S]*?&:hover\s*\{[\s\S]*?\}\s*\}/;
content = content.replace(regex, '');

fs.writeFileSync('src/components/Modals/ProjectDetailModal.module.scss', content, 'utf8');
console.log("SCSS patched");
