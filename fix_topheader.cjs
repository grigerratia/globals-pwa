const fs = require('fs');
const file = './src/components/TopHeader/TopHeader.jsx';
let code = fs.readFileSync(file, 'utf8');

const roleCheck = `const isExecutiveRole = roleLower.includes('comercial') || roleLower.includes('operaciones');
  const isAdminRole = roleLower.includes('admin') || roleLower.includes('rrhh') || roleLower.includes('recurso');
  const vistaTexto = isAdminRole ? "Panel Admin" : "Vista Ejecutiva";`;

code = code.replace(/const isLider = [^;]+;/, roleCheck + '\n  const isLider = true;'); // keeping isLider for button visibility

code = code.replace(/<span>Vista Ejecutiva<\/span>/g, '<span>{vistaTexto}</span>');
code = code.replace(/title="Vista Ejecutiva"/g, 'title={vistaTexto}');

fs.writeFileSync(file, code);
