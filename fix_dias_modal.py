with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

import re

# Insert calculation
old_calc = """  // Cleanup URLs en unmount
  useEffect(() => {
    return () => {"""

new_calc = """  let diasEstimadosNota = null;
  if (proyecto.notas) {
    const match = proyecto.notas.match(/\\[DÍAS ESTIMADOS FASE ACTUAL: (\\d+)\\]/);
    if (match) {
      const diasTotales = parseInt(match[1], 10);
      const hoy = new Date();
      const ultima = new Date(proyecto.fecha_ultima_actualizacion || proyecto.fecha_creacion);
      const diff = Math.floor((hoy - ultima) / 86400000);
      let restantes = diasTotales - diff;
      diasEstimadosNota = restantes >= 0 ? restantes : 0;
    }
  }

  // Cleanup URLs en unmount
  useEffect(() => {
    return () => {"""
content = content.replace(old_calc, new_calc)

# Insert UI
old_ui = """        {(proyecto.estado?.toLowerCase().includes('espera') || proyecto.estado?.toLowerCase().includes('pausa') || proyecto.estado === 'Archivado' || proyecto.estado === 'Cancelado') && proyecto.motivo_cancelacion && ("""

new_ui = """        {diasEstimadosNota !== null && (
           <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', borderLeft: '4px solid #3b82f6', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
             <span style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 500 }}>
               Días estimados para terminar esta fase: <strong style={{ color: '#ffffff' }}>{diasEstimadosNota} días</strong>
             </span>
           </div>
        )}

        {(proyecto.estado?.toLowerCase().includes('espera') || proyecto.estado?.toLowerCase().includes('pausa') || proyecto.estado === 'Archivado' || proyecto.estado === 'Cancelado') && proyecto.motivo_cancelacion && ("""
content = content.replace(old_ui, new_ui)

# Finally, clean the tag from the notes shown in the textarea!
old_textarea = """                <textarea 
                  value={localNotas}
                  onChange={(e) => setLocalNotas(e.target.value)}
                  onBlur={handleNotasBlur}"""
new_textarea = """                <textarea 
                  value={localNotas.replace(/\\[DÍAS ESTIMADOS FASE ACTUAL: \\d+\\]\\n?/g, '').trim()}
                  onChange={(e) => {
                     // Keep the tag hidden but preserve it on save
                     let tag = '';
                     const match = localNotas.match(/\\[DÍAS ESTIMADOS FASE ACTUAL: \\d+\\]/);
                     if (match) tag = match[0] + '\\n\\n';
                     setLocalNotas(tag + e.target.value);
                  }}
                  onBlur={handleNotasBlur}"""
# Wait, this onChange is too hacky. It's better to just display it as is in the textarea, or strip it in useEffect and re-append on save.
# But actually, `[DÍAS ESTIMADOS FASE ACTUAL: X]` inside the notes is fine. It acts as a history tag. The user said "dentro de una nota discreta". I can just display it and keep it in the textarea.

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
