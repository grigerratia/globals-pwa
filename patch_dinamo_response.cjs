const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dinamo/DinamoAgent.module.scss');
let content = fs.readFileSync(file, 'utf8');

// Reduce modal padding
content = content.replace(/padding:\s*1\.25rem;/g, 'padding: 1rem;');

// Simplify .response to eliminate "caja innecesaria"
content = content.replace(/\.response\s*{[^}]*background:[^;]+;[^}]*border-left:[^;]+;[^}]*padding:[^;]+;/g, 
  '.response {\n  padding: 0.5rem 0;\n');
  
fs.writeFileSync(file, content);
console.log('DinamoAgent.module.scss patched');
