const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

const replacement = `
          <BellNotifications session={session} />

          <button className={styles.btnActionMobile} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }} onClick={() => window.location.href = '/cotizador'}>
            <span style={{fontWeight: 'bold'}}>Cotizador</span>
          </button>
          
          <button className={styles.btnActionMobile} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#25D366', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => window.location.href = '/admin/whatsapp'}>
            <span style={{fontWeight: 'bold'}}>WhatsApp Admin</span>
          </button>

          <span className={styles.userEmail}>
`;

if (!code.includes("window.location.href = '/cotizador'")) {
  code = code.replace(
    `          <BellNotifications session={session} />

          <span className={styles.userEmail}>`,
    replacement
  );
  fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
}
