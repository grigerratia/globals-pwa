const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/ProjectDetailModal.jsx', 'utf-8');

// 1. Add Edit2 and Check to lucide-react imports
if (!code.includes('Edit2')) {
  code = code.replace(/import \{ X, Layout,/, 'import { X, Layout, Edit2, Check,');
}

// 2. Add state
if (!code.includes('isEditingClient')) {
  code = code.replace(/const \[showMoreInfo, setShowMoreInfo\] = useState\(false\);/, 
    'const [showMoreInfo, setShowMoreInfo] = useState(false);\n  const [isEditingClient, setIsEditingClient] = useState(false);');
}

// 3. Replace the Client Info Box block
const clientInfoRegex = /\{\/\* INFO DEL CLIENTE \*\/\}\s*<div className=\{styles\.clientInfoBox\}>[\s\S]*?<\/div>\s*<\/div>/;

const newClientInfo = `{/* INFO DEL CLIENTE */}
            <div className={styles.section}>
              <div className={styles.sectionContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Datos del Cliente</h3>
                  <button 
                    onClick={() => setIsEditingClient(!isEditingClient)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}
                  >
                    {isEditingClient ? <Check size={18} color="#22c55e" /> : <Edit2 size={18} />}
                  </button>
                </div>
                
                {isEditingClient ? (
                  <div className={styles.clientInfoBox} style={{ border: 'none', padding: 0, margin: 0, background: 'transparent' }}>
                    <div className={styles.clientField}>
                      <label>Cliente:</label>
                      <input 
                        type="text" 
                        value={proyecto.cliente_nombre || ''} 
                        placeholder="Nombre del Cliente"
                        onChange={(e) => setProyecto(prev => ({ ...prev, cliente_nombre: e.target.value }))}
                        onBlur={(e) => handleChange('cliente_nombre', e.target.value)}
                      />
                    </div>
                    <div className={styles.clientField}>
                      <label>Empresa:</label>
                      <input 
                        type="text" 
                        value={proyecto.cliente_empresa || ''} 
                        placeholder="Nombre de Empresa"
                        onChange={(e) => setProyecto(prev => ({ ...prev, cliente_empresa: e.target.value }))}
                        onBlur={(e) => handleChange('cliente_empresa', e.target.value)}
                      />
                    </div>
                    <div className={styles.clientField}>
                      <label>Teléfono:</label>
                      <input 
                        type="text" 
                        value={proyecto.cliente_telefono || ''} 
                        placeholder="Número (Ej: +58414...)"
                        onChange={(e) => setProyecto(prev => ({ ...prev, cliente_telefono: e.target.value }))}
                        onBlur={(e) => handleChange('cliente_telefono', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Cliente</span>
                      <span style={{ color: '#0f172a' }}>{proyecto.cliente_nombre || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Empresa</span>
                      <span style={{ color: '#0f172a' }}>{proyecto.cliente_empresa || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Teléfono</span>
                      <span style={{ color: '#0f172a' }}>{proyecto.cliente_telefono || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>`;

code = code.replace(clientInfoRegex, newClientInfo);

fs.writeFileSync('src/components/Modals/ProjectDetailModal.jsx', code);
console.log("Updated UI for Client Info");
