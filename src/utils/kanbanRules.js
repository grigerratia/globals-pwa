export const validateProjectMove = (proyecto, destColumn, estadosList, session) => {
  const isLider = session?.user?.user_metadata?.rol === 'Líder Comercial' || session?.user?.user_metadata?.rol === 'Líder de Operaciones';
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

    // Reglas de Avance (Hitos requeridos para avanzar)
    if (isAvance) {
      const findIdx = (str) => estadosList.findIndex(e => e.toLowerCase().includes(str.toLowerCase()));

      const presupIdx = findIdx('presupuesto');
      if (presupIdx !== -1 && destinoGlobalIdx > presupIdx && !proyecto.presupuesto_aprobado) {
         return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Presupuesto aprobado por el cliente'.", rule: "PRESUPUESTO" };
      }

      const disenoIdx = findIdx('diseño');
      if (disenoIdx !== -1 && destinoGlobalIdx > disenoIdx && !proyecto.diseno_terminado) {
         // Solo es obligatorio si el proyecto está saliendo de 'En Diseño'.
         // Si la tarjeta salta directamente desde una columna previa sin pasar por 'En Diseño', no se bloquea.
         if (origenGlobalIdx === disenoIdx) {
            return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Diseño terminado'.", rule: "DISENO" };
         }
      }

      const logisIdx = findIdx('logística');
      if (logisIdx !== -1 && destinoGlobalIdx > logisIdx && !proyecto.materiales_comprados) {
         return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Materiales comprados o en inventario'.", rule: "MATERIALES" };
      }

      const fabIdx = findIdx('fabricación');
      if (fabIdx !== -1 && destinoGlobalIdx > fabIdx && !proyecto.fabricado_listo) {
         return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Fabricado listo'.", rule: "FABRICACION" };
      }

      const listoInstIdx = findIdx('listo para instalación');
      if (listoInstIdx !== -1 && destinoGlobalIdx > listoInstIdx && !proyecto.fecha_instalacion) {
         return { isValid: false, error: "No puede ser movido: Falta asignar la fecha de instalación.", rule: "FECHA_INSTALACION" };
      }

      const enInstIdx = findIdx('en instalación');
      if (enInstIdx !== -1 && destinoGlobalIdx > enInstIdx && !proyecto.instalado) {
         return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Instalado correctamente'.", rule: "INSTALACION" };
      }

      const entregadoIdx = estadosList.findIndex(e => {
        const lower = e.toLowerCase();
        return lower === 'entregado' || (lower.includes('entregado') && !lower.includes('cerrado'));
      });
      if (entregadoIdx !== -1 && destinoGlobalIdx > entregadoIdx && !proyecto.pagado_completo) {
         return { isValid: false, error: "No puede ser movido: Falta completar el hito 'Pago cancelado por completo'.", rule: "PAGADO" };
      }
    }
  }

  const entregadoIdx = estadosList.findIndex(e => {
    const lower = e.toLowerCase();
    return lower === 'entregado' || (lower.includes('entregado') && !lower.includes('cerrado'));
  });
  const isEntregadoOAdelante = (entregadoIdx !== -1 && destinoGlobalIdx >= entregadoIdx) ||
    destColumn.toLowerCase() === 'entregado' ||
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
