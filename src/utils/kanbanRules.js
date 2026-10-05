export const validateProjectMove = (proyecto, destColumn, estadosList, session) => {
  const isLider = session?.user?.user_metadata?.rol === 'Líder Comercial' || session?.user?.user_metadata?.rol === 'Líder de Operaciones';
  const isEncargado = (proyecto.encargados || []).some(enc => enc.user_id === session?.user?.id || enc.id === session?.user?.id);
  
  const estadoOrigenReal = proyecto.estado;
  const origenGlobalIdx = estadosList.indexOf(estadoOrigenReal);
  const destinoGlobalIdx = estadosList.indexOf(destColumn);
  
  const isSpecialDest = destColumn.toLowerCase().includes('espera') || destColumn.toLowerCase().includes('pausa') || destColumn === 'Archivado' || destColumn === 'Cancelado';
  const isRoutineArchive = destColumn === 'Archivado' && estadoOrigenReal === 'Entregado y cerrado';
  const cambioDeFase = estadoOrigenReal !== destColumn;
  const isRetroceso = cambioDeFase && (destinoGlobalIdx < origenGlobalIdx) && !isSpecialDest;
  const isAvance = cambioDeFase && (destinoGlobalIdx > origenGlobalIdx) && !isSpecialDest;

  if (!cambioDeFase) {
    return { isValid: true, requiresMotive: null, isRetroceso: false, requiresDias: false };
  }

  // Regla de permisos general
  if (!isLider && !isEncargado) {
    return { isValid: false, error: "Acceso denegado: Solo el Líder o un encargado pueden reordenar este proyecto." };
  }

  if (destColumn.toLowerCase().includes('espera') || destColumn.toLowerCase().includes('pausa')) {
    if (!isLider) {
      return { isValid: false, error: "Acceso denegado: Solo el Líder puede mover proyectos a Pausa/Espera." };
    }
  } else {
    // Regla de Levantamiento
    if (estadoOrigenReal === 'Levantamiento' && destColumn !== 'Levantamiento' && !isSpecialDest) {
      if (!proyecto.levantamiento_fecha && !proyecto.omitir_levantamiento) {
         return { isValid: false, error: "No puedes mover el proyecto. Debes llenar la Hoja de Levantamiento primero.", rule: "LEVANTAMIENTO" };
      }
    }

    // Reglas de Avance (Casillas)
    if (isAvance) {
      const presupIdx = estadosList.indexOf('Presupuesto enviado');
      if (presupIdx !== -1 && destinoGlobalIdx > presupIdx && !proyecto.presupuesto_aprobado) {
         return { isValid: false, error: "No puede ser movido: Falta aprobar el presupuesto.", rule: "PRESUPUESTO" };
      }
      const logisIdx = estadosList.indexOf('Logística y compras');
      if (logisIdx !== -1 && destinoGlobalIdx > logisIdx && !proyecto.materiales_comprados) {
         return { isValid: false, error: "No puede ser movido: Faltan materiales por comprar.", rule: "MATERIALES" };
      }
    }
  }

  return {
    isValid: true,
    requiresMotive: (destColumn.toLowerCase().includes('espera') || destColumn.toLowerCase().includes('pausa') || destColumn === 'Cancelado' || (destColumn === 'Archivado' && !isRoutineArchive)) 
                    ? (destColumn === 'Archivado' ? 'Archivo' : (destColumn === 'Cancelado' ? 'Cancelación' : 'Pausa')) 
                    : null,
    isRetroceso,
    requiresDias: isAvance
  };
};
