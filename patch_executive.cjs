const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ExecutiveDashboard/ExecutiveDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import CanceladosModal')) {
  content = content.replace(/import GlobalSearch from '\.\.\/GlobalSearch\/GlobalSearch';/, 
    "import GlobalSearch from '../GlobalSearch/GlobalSearch';\nimport CanceladosModal from '../Modals/CanceladosModal';\nimport { Archive, Trash2, MoreVertical } from 'lucide-react';");
}

if (!content.includes('showArchived')) {
  content = content.replace(/const \[cargando, setCargando\] = useState\(true\);/, 
    "const [cargando, setCargando] = useState(true);\n  const [showArchived, setShowArchived] = useState(false);\n  const [showCancelados, setShowCancelados] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);");
}

// Modify activos filter
content = content.replace(/const activos = proyectos\.filter\(p => p\.estado !== 'Entregado y cerrado' && p\.estado !== 'Archivado' && !p\.estado\?\.includes\('Cancelado'\)\);/, 
  "const activos = proyectos.filter(p => p.estado !== 'Entregado y cerrado' && !p.estado?.includes('Cancelado') && (showArchived ? true : p.estado !== 'Archivado'));");

// Modify header to include toolbar buttons
const newHeader = `
      <header className={styles.header} style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.greeting}>
          <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Resumen Ejecutivo</p>
        </div>
        <div className={styles.toolbar} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <GlobalSearch onResultClick={(id) => setProyectoDetalleId(id)} />
          </div>
          
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
        </div>
      </header>`;

content = content.replace(/<header className=\{styles\.header\}[\s\S]*?<\/header>/, newHeader);

// Add CanceladosModal at the end
if (!content.includes('<CanceladosModal')) {
  content = content.replace(/<\/div>\s*$/m, 
    `  {showCancelados && <CanceladosModal onClose={() => setShowCancelados(false)} session={session} />}\n    </div>`);
}

fs.writeFileSync(file, content);
console.log('ExecutiveDashboard.jsx patched');
