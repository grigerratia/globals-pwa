with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

# Find the start of REGLA: COLUMNA "En espera" and the end of the (async () => {})() block
# We will replace everything from "// REGLA: COLUMNA" to the end of the `if (type === 'Card')` block.

start_str = '      // REGLA: COLUMNA "En espera"'
end_str = "      })();\n    }"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx) + len(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find the block to replace!")
else:
    old_block = content[start_idx:end_idx]
    
    new_block = """      // REGLA: COLUMNA "En pausa/espera"
      const pry = columnasRef.current.flatMap(c => c.proyectos).find(p => p.id === active.id);
      
      if (activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa')) {
        const isLider = session?.user?.user_metadata?.rol === 'Líder Comercial';
        if (!isLider) {
          showError("Acceso denegado: Solo el Líder Comercial puede mover proyectos a Pausa/Espera.");
          if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
          return;
        }
      } else {
        // VALIDADOR DE LEVANTAMIENTO
        if (estadoOrigenReal === 'Levantamiento' && activeColumn !== 'Levantamiento') {
          if (!pry.levantamiento_fecha) {
            showError('No puedes mover el proyecto. Debes llenar la Hoja de Levantamiento primero.');
            if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
            return;
          }
        }

        // OTHER GATES
        const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
        const destinoGlobalIdx = estados.indexOf(activeColumn);

        if (destinoGlobalIdx > origenGlobalIdx) {
          const presupIdx = estados.indexOf('Presupuesto enviado');
          if (presupIdx !== -1 && destinoGlobalIdx > presupIdx && !pry.presupuesto_aprobado) {
            showError("No puede ser movido: Falta aprobar el presupuesto.");
            if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
            return;
          }

          const logisIdx = estados.indexOf('Logística y compras');
          if (logisIdx !== -1 && destinoGlobalIdx > logisIdx && !pry.materiales_comprados) {
            showError("No puede ser movido: Faltan materiales por comprar.");
            if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
            return;
          }
        }
      }

      const executeMove = (motive = null) => {
        const nuevasColumnas = columnasRef.current.map(c => ({ ...c, proyectos: [...c.proyectos] }));
        const colIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === activeColumn);
        const proyectosColumna = nuevasColumnas[colIndex].proyectos;
  
        const activeIndex = proyectosColumna.findIndex(p => p.id === active.id);
        const overIndex = proyectosColumna.findIndex(p => p.id === over.id);
  
        const proyectosReordenados = arrayMove(proyectosColumna, activeIndex, overIndex);
        nuevasColumnas[colIndex].proyectos = proyectosReordenados.map((p, i) => ({ ...p, orden: i, estado: activeColumn }));
        setColumnas(nuevasColumnas);
        originalColumnasRef.current = null;
  
        (async () => {
          for (let p of nuevasColumnas[colIndex].proyectos) {
            const updateData = { orden: p.orden, estado: p.estado };
            if (p.id === active.id && cambioDeFase) {
              updateData.fecha_ultima_actualizacion = new Date().toISOString();
              updateData.dias_estancado = 0;
              if (motive) {
                updateData.motivo_cancelacion = motive;
              }
              logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });
            }
            await supabase.from('proyectos').update(updateData).eq('id', p.id);
          }
        })();
      };

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
      }
    }"""
    
    content = content[:start_idx] + new_block + content[end_idx:]
    with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
        f.write(content)
    print("Replaced successfully!")
