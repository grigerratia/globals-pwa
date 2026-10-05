import re

with open('src/components/ExecutiveDashboard/ExecutiveDashboard.jsx', 'r') as f:
    content = f.read()

# Add auditLogs state
if 'const [auditLogs, setAuditLogs] = useState([]);' not in content:
    content = content.replace(
        'const [proyectoDetalleId, setProyectoDetalleId] = useState(null);',
        'const [proyectoDetalleId, setProyectoDetalleId] = useState(null);\n  const [auditLogs, setAuditLogs] = useState([]);'
    )

# Fetch audit logs
if "from('audit_logs')" not in content:
    fetch_code = """
      const { data: proys } = await supabase.from('proyectos').select('*');
      if (proys) {
        setProyectos(proys);
      }

      const { data: logs } = await supabase.from('audit_logs')
        .select('*')
        .neq('accion', 'Inició sesión')
        .order('created_at', { ascending: false })
        .limit(10);
      if (logs) {
        setAuditLogs(logs);
      }
"""
    content = re.sub(r"const \{ data: proys \}.*?setProyectos\(proys\);\n\s*\}", fetch_code.strip(), content, flags=re.DOTALL)


# Replace 'Actividad Reciente' rendering
old_activity = """
          <div className={styles.activityList}>
            {recientes.map(p => (
              <div key={p.id} className={styles.activityItem} onClick={() => setProyectoDetalleId(p.id)}>
                <div className={styles.activityMain}>
                  <h4>{p.titulo}</h4>
                  <span className={styles.badge}>{p.estado}</span>
                </div>
                <div className={styles.activityMeta}>
                  <span>Actualizado: {new Date(p.fecha_ultima_actualizacion).toLocaleDateString()}</span>
                  {p.presupuesto_vendido && <span>• {formatCurrency(p.presupuesto_vendido)}</span>}
                </div>
              </div>
            ))}
          </div>
"""

new_activity = """
          <div className={styles.activityList}>
            {auditLogs.map(log => {
              const projectId = log.detalles?.proyecto_id || log.detalles?.id;
              const title = log.detalles?.titulo || log.detalles?.nuevo_estado || '';
              return (
                <div key={log.id} className={styles.activityItem} onClick={() => projectId && setProyectoDetalleId(projectId)} style={{ cursor: projectId ? 'pointer' : 'default' }}>
                  <div className={styles.activityMain}>
                    <h4 style={{ fontSize: '0.95rem' }}>{log.accion}</h4>
                    {title && <span className={styles.badge} style={{ opacity: 0.8 }}>{title}</span>}
                  </div>
                  <div className={styles.activityMeta} style={{ marginTop: '0.25rem' }}>
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                    <span>• {log.usuario_nombre}</span>
                  </div>
                </div>
              );
            })}
          </div>
"""

if 'auditLogs.map' not in content:
    content = content.replace(old_activity.strip(), new_activity.strip())

with open('src/components/ExecutiveDashboard/ExecutiveDashboard.jsx', 'w') as f:
    f.write(content)

print("Patched ExecutiveDashboard.jsx")
