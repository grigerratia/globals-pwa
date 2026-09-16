const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

if (!code.includes('WhatsAppAdmin')) {
  code = code.replace(/import KanbanBoard from '\.\/components\/KanbanBoard\/KanbanBoard';/, \`import KanbanBoard from './components/KanbanBoard/KanbanBoard';\\nimport WhatsAppAdmin from './components/WhatsAppAdmin';\`);
  
  code = code.replace(/return \\(\\n\\s+<>\\n\\s+<KanbanBoard session={session} \/>\\n\\s+<\/\\>\\n\\s+\\);/, \`if (window.location.pathname === '/admin/whatsapp') {\\n    return <WhatsAppAdmin />;\\n  }\\n\\n  return (\\n    <>\\n      <KanbanBoard session={session} />\\n    </>\\n  );\`);
  
  fs.writeFileSync('src/App.jsx', code);
}
