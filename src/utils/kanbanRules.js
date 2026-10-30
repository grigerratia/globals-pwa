export const validateProjectMove = (proyecto, destColumn, estadosList, session) => {
  const userRole = (session?.user?.user_metadata?.rol || '').toLowerCase();
  const isMaster = userRole === 'masterusuario' || userRole.includes('master');
  
  if (isMaster) {
    // Masterusuario tiene permiso total e irrestricto en todo el tablero
    return { isValid: true, requiresMotive: null, isRetroceso: false, requiresDias: false };
  }

  const isLider = userRole.includes('comercial') || userRole.includes('operaciones') || userRole.includes('operativo') || userRole.includes('producci');
  const isEncargado = (proyecto.encargados || []).some(enc => enc.user_id === session?.user?.id || enc.id === session?.user?.id);
  
  const estadoOrigenReal = proyecto.estado;
  const origenGlobalIdx = estadosList.indexOf(estadoOrigenReal);
  const destinoGlobalIdx = estadosList.indexOf(destColumn);
  
  const isSpecialDest = destColumn.toLowerCase().includes('espera') || destColumn.toLowerCase().includes('pausa') || destColumn === 'Archivado' || destColumn === 'Cancelado';
  const isRoutineArchive = destColumn === 'Archivado' && (estadoOrigenReal === 'Entregado y cerrado' || estadoOrigenReal === 'Pagado y cerrado');
  const cambioDeFase = estadoOrigenReal !== destColumn;
  const isRetroceso = cambioDeFase && (destinoGlobalIdx < origenGlobalIdx) && !isSpecialDest;
  const isAvance = cambioDeFase && (destinoGlobalIdx > origenGlobalIdx) && !isSpecialDest;

  if (!cambioDeFase) {
    return { isValid: true, requiresMotive: null, isRetroceso: false, requiresDias: false };
  }

  // Regla de permisos general
  if (!isLider && !isEncargado) {
    return { isValid: false, error: "Acceso denegado: Solo los líderes o un encargado pueden reordenar este proyecto." };
  }

  if (destColumn.toLowerCase().includes('espera') || destColumn.toLowerCase().includes('pausa')) {
    if (!isLider) {
      return { isValid: false, error: "Acceso denegado: Solo la Dirección Comercial o el equipo de Operaciones pueden mover proyectos a Pausa/Espera." };
    }
  } else {
    // Regla de Levantamiento
    const isOrigenLevantamiento = estadoOrigenReal.toLowerCase().includes('levantamiento');
    if (isOrigenLevantamiento && !destColumn.toLowerCase().includes('levantamiento') && !isSpecialDest) {
      if (!proyecto.levantamiento_fecha && !proyecto.omitir_levantamiento) {
         return { isValid: false, error: "No puedes mover el proyecto. Debes llenar la Hoja de Levantamiento primero.", rule: "LEVANTAMIENTO" };
      }
    }

    // Reglas de Avance (Hitos requeridos para avanzar)
    if (isAvance) {
      const findIdx = (str) => estadosList.findIndex(e => e.toLowerCase().includes(str.toLowerCase()));

      const disenoIdx = findIdx('diseño');
      if (disenoIdx !== -1 && destinoGlobalIdx > disenoIdx && !proyecto.diseno_terminado) {
         // Solo es obligatorio si el proyecto está saliendo de 'Diseño y Aprobación'.
         // Si la tarjeta salta directamente desde una columna previa sin pasar por diseño, no se bloquea.
         if (origenGlobalIdx === disenoIdx) {
            return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Diseño terminado' (aprobado por el cliente).", rule: "DISENO" };
         }
      }

      const logisIdx = findIdx('logística') !== -1 ? findIdx('logística') : findIdx('material');
      if (logisIdx !== -1 && destinoGlobalIdx > logisIdx && !proyecto.materiales_comprados) {
         return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Materiales comprados o en almacén'.", rule: "MATERIALES" };
      }

      const fabIdx = findIdx('fabricación');
      if (fabIdx !== -1 && destinoGlobalIdx > fabIdx && !proyecto.fabricado_listo) {
         return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Fabricado listo'.", rule: "FABRICACION" };
      }

      const instIdx = findIdx('instalación');
      if (instIdx !== -1 && destinoGlobalIdx > instIdx && !proyecto.instalado) {
         return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Instalado correctamente'.", rule: "INSTALACION" };
      }
    }
  }

  const entregadoIdx = estadosList.findIndex(e => {
    const lower = e.toLowerCase();
    return lower.includes('entregado') || lower.includes('cerrado');
  });
  const isEntregadoOAdelante = (entregadoIdx !== -1 && destinoGlobalIdx >= entregadoIdx) ||
    destColumn.toLowerCase().includes('entregado') ||
    destColumn.toLowerCase().includes('pagado') ||
    destColumn.toLowerCase().includes('cerrado') ||
    destColumn === 'Archivado' ||
    destColumn === 'Cancelado';

  return {
    isValid: true,
    requiresMotive: (destColumn.toLowerCase().includes('espera') || destColumn.toLowerCase().includes('pausa') || destColumn === 'Cancelado' || (destColumn === 'Archivado' && !isRoutineArchive)) 
                    ? (destColumn === 'Archivado' ? 'Archivo' : (destColumn === 'Cancelado' ? 'Cancelación' : 'Pausa')) 
                    : null,
    isRetroceso,
    requiresDias: isAvance && !isEntregadoOAdelante
  };
};

export const formatDateVE = (dateStrOrObj) => {
  if (!dateStrOrObj) return '';
  if (typeof dateStrOrObj === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStrOrObj)) {
    const [y, m, d] = dateStrOrObj.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  const d = dateStrOrObj instanceof Date ? dateStrOrObj : new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return String(dateStrOrObj);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTimeVE = (dateStrOrObj) => {
  if (!dateStrOrObj) return '';
  const d = dateStrOrObj instanceof Date ? dateStrOrObj : new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return String(dateStrOrObj);
  return d.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
