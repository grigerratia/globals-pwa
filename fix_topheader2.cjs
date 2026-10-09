const fs = require('fs');
const file = './src/components/TopHeader/TopHeader.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const isLider = true;/, "const isLider = roleLower.includes('comercial') || roleLower.includes('operaciones') || roleLower.includes('admin') || roleLower.includes('rrhh') || roleLower.includes('recurso');");

fs.writeFileSync(file, code);
