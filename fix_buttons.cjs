const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

const oldButtons = `          <button className={styles.btnActionMobile} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }} onClick={() => window.location.href = '/cotizador'}>
            <span style={{fontWeight: 'bold'}}>Cotizador</span>
          </button>
          
          <button className={styles.btnActionMobile} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#25D366', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => window.location.href = '/admin/whatsapp'}>
            <span style={{fontWeight: 'bold'}}>WhatsApp Admin</span>
          </button>`;

const newButtons = `          {/* <button className={styles.btnActionMobile} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }} onClick={() => window.location.href = '/cotizador'}>
            <span style={{fontWeight: 'bold'}}>Cotizador</span>
          </button> */}
          
          <button 
            className={styles.btnActionMobile} 
            title="WhatsApp Admin"
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={() => window.location.href = '/admin/whatsapp'}
          >
            <QrCode size={20} />
          </button>`;

if (code.includes(oldButtons)) {
  code = code.replace(oldButtons, newButtons);
  if (!code.includes('QrCode')) {
    code = code.replace("import { Plus, X } from 'lucide-react';", "import { Plus, X, QrCode } from 'lucide-react';");
  }
  fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
}
