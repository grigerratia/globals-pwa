with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_logic = """      console.log("Checking if modal should open:", { cambioDeFase, activeColumn, estadoOrigenReal });
      if (cambioDeFase && (activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado') && estadoOrigenReal !== 'Entregado y cerrado') {
        setMotivePrompt({
           title: `Motivo de ${activeColumn === 'Archivado' ? 'Archivo' : 'Pausa'}`,
           onConfirm: (motive) => {
             executeMove(motive);
             setMotivePrompt(null);
           },
           onCancel: () => {
             if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
             setMotivePrompt(null);
           }
        });
      } else {
        executeMove();
      }"""

new_logic = """      const isRetroceso = cambioDeFase && (destinoGlobalIdx < origenGlobalIdx) && !isSpecialDest;
      if (cambioDeFase && (activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado') && estadoOrigenReal !== 'Entregado y cerrado') {
        setMotivePrompt({
           title: `Motivo de ${activeColumn === 'Archivado' ? 'Archivo' : 'Pausa'}`,
           onConfirm: (motive) => {
             executeMove(motive);
             setMotivePrompt(null);
           },
           onCancel: () => {
             if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
             setMotivePrompt(null);
           }
        });
      } else if (isRetroceso) {
        setMotivePrompt({
           title: 'Motivo de Retroceso',
           onConfirm: (motive) => {
             // Append to notas
             const notaAnadida = `[RETROCESO] De "${estadoOrigenReal}" a "${activeColumn}": ${motive}`;
             const nuevasNotas = pry.notas ? pry.notas + '\\n\\n' + notaAnadida : notaAnadida;
             // We pass motive to executeMove but it expects motivo_cancelacion. 
             // We can just update notas directly in executeMove.
             executeMove(null, nuevasNotas);
             setMotivePrompt(null);
           },
           onCancel: () => {
             if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
             setMotivePrompt(null);
           }
        });
      } else {
        executeMove();
      }"""

content = content.replace(old_logic, new_logic)

# Now update executeMove to accept nuevasNotas
old_executeMove = """      const executeMove = (motive = null) => {"""
new_executeMove = """      const executeMove = (motive = null, nuevasNotas = null) => {"""
content = content.replace(old_executeMove, new_executeMove)

old_updateData = """              if (motive) {
                updateData.motivo_cancelacion = motive;
              } else if (!isSpecial) {
                // Si lo movemos a una columna normal, limpiamos el motivo
                updateData.motivo_cancelacion = null;
              }
              logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });"""
new_updateData = """              if (motive) {
                updateData.motivo_cancelacion = motive;
              } else if (!isSpecial) {
                updateData.motivo_cancelacion = null;
              }
              if (nuevasNotas) {
                updateData.notas = nuevasNotas;
              }
              logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });"""
content = content.replace(old_updateData, new_updateData)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
