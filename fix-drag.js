const fs = require("fs");
let content = fs.readFileSync("src/components/KanbanBoard/KanbanBoard.jsx", "utf8");

// We will find the handleDragEnd function and replace its body for Card drag
const search = `    if (type === 'Card') {
      const activeColumn = encontrarEstadoPorId(active.id);
      const overColumn = encontrarEstadoPorId(over.id);

      if (!activeColumn || !overColumn) return;

      setColumnas(prev => {`;

const newBody = `    if (type === 'Card') {
      const activeColumn = encontrarEstadoPorId(active.id);
      const overColumn = encontrarEstadoPorId(over.id);

      if (!activeColumn || !overColumn) return;

      let validUpdate = true;
      let finalColumnsToSave = null;
      let finalProjectsToUpdate = [];

      setColumnas(prev => {
        // RESTRICT REORDER IN SAME COLUMN
        const pryHover = prev.flatMap(c => c.proyectos).find(p => p.id === active.id);
        if (pryHover) {
          const isLider = session?.user?.user_metadata?.rol === 'Líder Comercial';
          const isEncargado = (pryHover.encargados || []).some(enc => enc.id === session?.user?.id);
          if (!isLider && !isEncargado) {
            validUpdate = false;
            showError("Acceso denegado: Solo el Líder Comercial o un encargado pueden reordenar este proyecto.");
            return originalColumnasRef.current || prev;
          }
        }

        const nuevasColumnas = prev.map(c => ({ ...c, proyectos: [...c.proyectos] }));
        const colIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === activeColumn);
        const proyectosColumna = nuevasColumnas[colIndex].proyectos;

        const activeIndex = proyectosColumna.findIndex(p => p.id === active.id);
        const overIndex = proyectosColumna.findIndex(p => p.id === over.id);

        const proyectosReordenados = arrayMove(proyectosColumna, activeIndex, overIndex);
        
        const cambioDeFase = estadoOrigenReal !== activeColumn;

        // VALIDADOR DE LEVANTAMIENTO
        if (estadoOrigenReal === 'Levantamiento' && activeColumn !== 'Levantamiento') {
          const pry = proyectosColumna.find(p => p.id === active.id);
          if (!pry.levantamiento_fecha) {
            validUpdate = false;
            showError('No puedes avanzar. Debes llenar la Hoja de Levantamiento primero.');
            return originalColumnasRef.current || prev;
          }
        }

        // OTHER GATES
        const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
        const destinoGlobalIdx = estados.indexOf(activeColumn);

        if (destinoGlobalIdx > origenGlobalIdx) {
          const pry = proyectosColumna.find(p => p.id === active.id);
          const presupIdx = estados.indexOf('Presupuesto enviado');
          if (presupIdx !== -1 && destinoGlobalIdx > presupIdx && !pry.presupuesto_aprobado) {
            validUpdate = false;
            showError("No puede avanzar: Falta aprobar el presupuesto.");
            return originalColumnasRef.current || prev;
          }

          const logisIdx = estados.indexOf('Logística y compras');
          if (logisIdx !== -1 && destinoGlobalIdx > logisIdx && !pry.materiales_comprados) {
            validUpdate = false;
            showError("No puede avanzar: Faltan materiales por comprar.");
            return originalColumnasRef.current || prev;
          }
        }

        const proyectosFinales = proyectosReordenados.map((p, i) => {
          if (p.id === active.id && cambioDeFase) {
            return { ...p, orden: i, dias: 0, fecha_ultima_actualizacion: new Date().toISOString() };
          }
          return { ...p, orden: i };
        });

        nuevasColumnas[colIndex].proyectos = proyectosFinales;
        finalColumnsToSave = nuevasColumnas;
        finalProjectsToUpdate = proyectosFinales;
        return nuevasColumnas;
      });

      if (validUpdate && finalProjectsToUpdate.length > 0) {
        const cambioDeFase = estadoOrigenReal !== activeColumn;
        // Run side-effects AFTER state is updated, ensuring it runs exactly once
        (async () => {
          for (const p of finalProjectsToUpdate) {
            const updateData = { orden: p.orden, estado: p.estado };
            if (p.id === active.id && cambioDeFase) {
              updateData.fecha_ultima_actualizacion = p.fecha_ultima_actualizacion;
              logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });
            }
            await supabase.from('proyectos').update(updateData).eq('id', p.id);
          }
        })();
      }

      return;
    }`;

// Wait, the regex replacement needs to match exactly. I will replace the whole if(type==='Card') block
// by slicing the file string.
const idxStart = content.indexOf(`    if (type === 'Card') {`);
const idxEnd = content.indexOf(`    }`, idxStart + 10) + 5; 
// Let's use string manipulation more safely
