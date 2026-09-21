const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

const importRegex = /import \{[\s\S]*?\} from 'lucide-react';/;
if (code.match(importRegex) && !code.includes('BarChart2')) {
  code = code.replace("import {", "import { BarChart2, ");
}

const target = /<button \n\s*className=\{styles\.btnActionMobile\} \n\s*title="WhatsApp Admin"/;

const replacement = `{canViewFinances && (
            <button 
              className={styles.btnActionMobile} 
              title="Dashboard"
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => window.location.href = '/dashboard'}
            >
              <BarChart2 size={20} />
            </button>
          )}

          <button 
            className={styles.btnActionMobile} 
            title="WhatsApp Admin"`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
console.log("KanbanBoard updated");
