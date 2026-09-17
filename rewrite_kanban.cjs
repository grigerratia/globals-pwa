const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

// The validation block starts around line 367
// Let's replace the whole validation block
const valBlockRegex = /\/\/ VALIDADOR DE LEVANTAMIENTO[\s\S]*?(const proyectosFinales = proyectosReordenados\.map)/;

const newBlock = `
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

      $1`;

code = code.replace(valBlockRegex, newBlock);
fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
