const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

if (!code.includes('import Cotizador')) {
  code = code.replace(
    "import WhatsAppAdmin from './components/WhatsAppAdmin';",
    "import WhatsAppAdmin from './components/WhatsAppAdmin';\nimport Cotizador from './components/Cotizador/Cotizador';"
  );
  
  code = code.replace(
    "  if (window.location.pathname === '/admin/whatsapp') {\n    return <WhatsAppAdmin />;\n  }",
    "  if (window.location.pathname === '/admin/whatsapp') {\n    return <WhatsAppAdmin />;\n  }\n\n  if (window.location.pathname === '/cotizador') {\n    return <Cotizador />;\n  }"
  );
  
  fs.writeFileSync('src/App.jsx', code);
}
