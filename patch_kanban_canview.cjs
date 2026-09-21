const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

if (!code.includes('const canViewFinances')) {
  const target = /const autorEmail = session\?\.user\?\.email \|\| 'Usuario';/;
  const replacement = `const autorEmail = session?.user?.email || 'Usuario';\n  const userRole = session?.user?.user_metadata?.rol;\n  const canViewFinances = userRole === 'Administración' || userRole === 'Administrador' || userRole === 'Líder Comercial';`;
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
  console.log("canViewFinances defined");
}
