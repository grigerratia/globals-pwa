import re

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

# 1. Fix the timestamp issue
content = content.replace("updateData.fecha_ultima_actualizacion = p.fecha_ultima_actualizacion;", "updateData.fecha_ultima_actualizacion = new Date().toISOString();")

# 2. Add state for motive prompt
content = content.replace("const [showCancelados, setShowCancelados] = useState(false);", "const [showCancelados, setShowCancelados] = useState(false);\n  const [motivePrompt, setMotivePrompt] = useState(null);")

# 3. Modify handleDragEnd logic to intercept
drag_end_idx = content.find("const handleDragEnd = async (event) => {")
# We need to replace the logic inside `if (type === 'Card') {`

old_save_logic = """
      const nuevasColumnas = columnasRef.current.map(c => ({ ...c, proyectos: [...c.proyectos] }));
      const colIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === activeColumn);
      const proyectosColumna = nuevasColumnas[colIndex].proyectos;

      const activeIndex = proyectosColumna.findIndex(p => p.id === active.id);
      const overIndex = proyectosColumna.findIndex(p => p.id === over.id);

      const proyectosReordenados = arrayMove(proyectosColumna, activeIndex, overIndex);

      
      // REGLA: COLUMNA "En espera"
      if (activeColumn === 'En espera' && estadoOrigenReal !== 'En espera') {
        const isLider = session?.user?.user_metadata?.rol === 'Líder Comercial';
        if (!isLider) {
          showError("Acceso denegado: Solo el Líder Comercial puede mover proyectos a 'En espera'.");
          if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
          return;
        }
      } else {
        // VALIDADOR DE LEVANTAMIENTO
        if (estadoOrigenReal === 'Levantamiento' && activeColumn !== 'Levantamiento') {
          const pry = proyectosColumna.find(p => p.id === active.id);
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
          const pry = proyectosColumna.find(p => p.id === active.id);
          const presupIdx = estados.indexOf('Presupuesto enviado');
          if (origenGlobalIdx < presupIdx && destinoGlobalIdx >= presupIdx) {
            if (!pry.presupuesto_aprobado) {
              showError("No puede ser movido: Falta aprobar el presupuesto.");
              if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
              return;
            }
          }
          const logistIdx = estados.indexOf('Logística y compras');
          if (origenGlobalIdx <= logistIdx && destinoGlobalIdx > logistIdx) {
            if (!pry.materiales_comprados) {
              showError("No puede ser movido: Faltan materiales por comprar.");
              if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
              return;
            }
          }
        }
      }

      nuevasColumnas[colIndex].proyectos = proyectosReordenados.map((p, i) => ({ ...p, orden: i, estado: activeColumn }));
      setColumnas(nuevasColumnas);
      originalColumnasRef.current = null;

      (async () => {
        for (let p of nuevasColumnas[colIndex].proyectos) {
          const updateData = { orden: p.orden, estado: p.estado };
          if (p.id === active.id && cambioDeFase) {
            updateData.fecha_ultima_actualizacion = new Date().toISOString();
            updateData.dias_estancado = 0;
            logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });
          }
          await supabase.from('proyectos').update(updateData).eq('id', p.id);
        }
      })();
    }
"""

new_save_logic = """
      const pry = columnasRef.current.flatMap(c => c.proyectos).find(p => p.id === active.id);
      
      // REGLA: COLUMNA "En pausa/espera"
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
          if (origenGlobalIdx < presupIdx && destinoGlobalIdx >= presupIdx) {
            if (!pry.presupuesto_aprobado) {
              showError("No puede ser movido: Falta aprobar el presupuesto.");
              if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
              return;
            }
          }
          const logistIdx = estados.indexOf('Logística y compras');
          if (origenGlobalIdx <= logistIdx && destinoGlobalIdx > logistIdx) {
            if (!pry.materiales_comprados) {
              showError("No puede ser movido: Faltan materiales por comprar.");
              if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
              return;
            }
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
    }
"""

content = content.replace(old_save_logic, new_save_logic)

# 4. Add popup JSX
popup_jsx = """
      {motivePrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem' }}>{motivePrompt.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>Por favor, indica el motivo detallado de esta acción.</p>
            <textarea 
              id="motiveInput"
              autoFocus
              placeholder="Ej. Falta de material, decisión del cliente..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={motivePrompt.onCancel} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
              <button 
                onClick={() => {
                  const val = document.getElementById('motiveInput').value;
                  if (!val.trim()) { alert('Debes ingresar un motivo'); return; }
                  motivePrompt.onConfirm(val);
                }} 
                style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showCancelados && (
"""
content = content.replace("      {showCancelados && (", popup_jsx)
content = content.replace("if (!val.trim()) { alert('Debes ingresar un motivo'); return; }", "if (!val.trim()) { window.alert('Debes ingresar un motivo'); return; }") # Fix later to avoid alert! Actually, I'll use simple alert here and change it immediately. No, user said NO ALERTS.
# Let's fix that inline
content = content.replace("if (!val.trim()) { window.alert('Debes ingresar un motivo'); return; }", "if (!val.trim()) { return; }")

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
