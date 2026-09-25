with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

import re

old_alert = """        {esEstancado && (
          <div className={styles.stalledAlert}>
            <AlertTriangle size={18} />
            <span>Este proyecto no ha tenido movimiento en <strong>{diasEstancado} días</strong>.</span>
          </div>
        )}"""

new_alert = """        {esEstancado && (
          <div className={styles.stalledAlert}>
            <AlertTriangle size={18} />
            <span>Este proyecto no ha tenido movimiento en <strong>{diasEstancado} días</strong>.</span>
          </div>
        )}

        {(proyecto.estado?.toLowerCase().includes('espera') || proyecto.estado?.toLowerCase().includes('pausa') || proyecto.estado === 'Archivado' || proyecto.estado === 'Cancelado') && proyecto.motivo_cancelacion && (
           <div style={{ padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo ({proyecto.estado})</span>
             <span style={{ fontSize: '0.95rem', color: '#f8fafc', fontStyle: 'italic', lineHeight: '1.4' }}>"{proyecto.motivo_cancelacion}"</span>
           </div>
        )}"""

content = content.replace(old_alert, new_alert)
with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
