const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/KanbanBoard/KanbanBoard.jsx');
let content = fs.readFileSync(file, 'utf8');

// Ensure lucide-react imports have MoreVertical
if (!content.includes('MoreVertical')) {
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
    return `import {${p1}, MoreVertical} from 'lucide-react';`;
  });
}

const toolbarHtml = `
      <div className={styles.toolbar}>
        <GlobalSearch onResultClick={(id) => setProyectoDetalleId(id)} />
        
        {(session?.user?.user_metadata?.rol === 'Líder Comercial' || session?.user?.user_metadata?.rol === 'Líder de Operaciones') && (
          <>
            <div className={styles.desktopToolbarActions}>
              <button 
                className={\`\${styles.btnArchive} \${showArchived ? styles.active : ''}\`}
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive size={18} />
                <span className={styles.hideOnMobile}>
                  {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
                </span>
              </button>
              <button 
                className={styles.btnArchive}
                style={{ background: '#ef4444', color: 'white', borderColor: '#b91c1c' }}
                onClick={() => setShowCancelados(true)}
              >
                <Trash2 size={18} />
                <span className={styles.hideOnMobile}>Cancelados</span>
              </button>
            </div>

            <div className={styles.mobileToolbarActions}>
              <button 
                className={styles.btnMobileMenu}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                title="Menú de opciones"
              >
                <MoreVertical size={20} />
              </button>
              
              {isMobileMenuOpen && (
                <div className={styles.mobileToolbarDropdown}>
                  <button 
                    onClick={() => { setShowArchived(!showArchived); setIsMobileMenuOpen(false); }}
                  >
                    <Archive size={16} />
                    {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
                  </button>
                  <button 
                    style={{ color: '#ef4444' }}
                    onClick={() => { setShowCancelados(true); setIsMobileMenuOpen(false); }}
                  >
                    <Trash2 size={16} />
                    Ver Cancelados
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>`;

content = content.replace(/<div className=\{styles\.toolbar\}>[\s\S]*?<\/div>\s*<\/div>/, toolbarHtml + '\n      </div>');

fs.writeFileSync(file, content);
console.log('KanbanBoard.jsx patched');
