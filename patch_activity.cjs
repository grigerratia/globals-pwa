const fs = require('fs');
const file = 'src/components/ExecutiveDashboard/ExecutiveDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Change limit(15) to limit(30)
content = content.replace(/\.limit\(15\)/, '.limit(30)');

const oldRender = `                  <div className={styles.activityMain}>
                    <h4 style={{ fontSize: '0.95rem' }}>{log.accion}</h4>
                    {title && <span className={styles.badge} style={{ opacity: 0.8 }}>{title}</span>}
                  </div>
                  <div className={styles.activityMeta} style={{ marginTop: '0.25rem' }}>
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                    <span>• {log.usuario_nombre}</span>
                  </div>`;

const newRender = `                  <div className={styles.activityMain}>
                    <h4 style={{ fontSize: '0.95rem' }}>{log.accion}</h4>
                    {log.detalles?.titulo && <span className={styles.badge} style={{ opacity: 0.8 }}>{log.detalles.titulo}</span>}
                  </div>
                  <div className={styles.activityDetails} style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                    {log.accion === 'Movió proyecto de fase' && (
                      <span>De <strong>{log.detalles?.origen || '...'}</strong> a <strong>{log.detalles?.nuevo_estado || '...'}</strong></span>
                    )}
                    {log.detalles?.motivo && <span> (Motivo: {log.detalles.motivo})</span>}
                  </div>
                  <div className={styles.activityMeta} style={{ marginTop: '0.25rem' }}>
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                    <span>• {log.usuario_nombre}</span>
                  </div>`;

content = content.replace(oldRender, newRender);

fs.writeFileSync(file, content);
console.log("Patched successfully.");
