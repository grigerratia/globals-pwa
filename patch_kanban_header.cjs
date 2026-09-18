const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

if (!code.includes("window.location.href = '/cotizador'")) {
  const replacement = `
          <button className={styles.btnActionMobile} onClick={() => window.location.href = '/cotizador'}>
            <Calculator size={18} /> <span className={styles.hideOnMobile}>Cotizador</span>
          </button>
          
          <button className={styles.btnActionMobile} onClick={() => window.location.href = '/admin/whatsapp'}>
`;
  
  code = code.replace(
    /          <button className=\{styles\.btnActionMobile\} onClick=\{\(\) => window\.location\.href = '\/admin\/whatsapp'\}>/,
    replacement
  );
  
  if (!code.includes('Calculator')) {
    code = code.replace(
      "import { Search, Plus, Archive, LogOut, MoreVertical, X, Sparkles, MessageCircle } from 'lucide-react';",
      "import { Search, Plus, Archive, LogOut, MoreVertical, X, Sparkles, MessageCircle, Calculator } from 'lucide-react';"
    );
  }
  
  fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
}
