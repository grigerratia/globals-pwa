with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_update = """            if (p.id === active.id && cambioDeFase) {
              updateData.fecha_ultima_actualizacion = new Date().toISOString();
              updateData.dias_estancado = 0;
              if (motive) {
                updateData.motivo_cancelacion = motive;
              }
              logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });
            }"""

new_update = """            if (p.id === active.id && cambioDeFase) {
              updateData.fecha_ultima_actualizacion = new Date().toISOString();
              updateData.dias_estancado = 0;
              const isSpecial = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';
              if (motive) {
                updateData.motivo_cancelacion = motive;
              } else if (!isSpecial) {
                // Si lo movemos a una columna normal, limpiamos el motivo
                updateData.motivo_cancelacion = null;
              }
              logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });
            }"""

content = content.replace(old_update, new_update)
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
