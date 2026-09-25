import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabase';
import { Bot, BellRing, LogOut, Search, Archive, Trash2 } from 'lucide-react';
import { requestFirebaseToken } from '../../firebase';
import { 
  DndContext, 
  DragOverlay, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors,
  closestCorners 
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { BarChart2, Plus, X, QrCode } from 'lucide-react';
import styles from './KanbanBoard.module.scss';
import KanbanColumn from '../KanbanColumn/KanbanColumn';
import KanbanCard from '../KanbanCard/KanbanCard';
import AddColumnModal from '../Modals/AddColumnModal';
import AddProjectModal from '../Modals/AddProjectModal';
import ProjectDetailModal from '../Modals/ProjectDetailModal';
import CanceladosModal from '../Modals/CanceladosModal';
import ColumnSettingsModal from '../Modals/ColumnSettingsModal';
import AIAgentModal from '../Modals/AIAgentModal';
import { logAudit } from '../../utils/audit';
import logo from '../../assets/logo.png';

const defaultEstados = [
  'Levantamiento', 
  'En Diseño', 
  'Presupuesto enviado', 
  'Logística y compras', 
  'En fabricación', 
  'Listo para instalación', 
  'En instalación', 
  'Entregado y cerrado', 
  'En pausa/espera'
];

import BellNotifications from './BellNotifications';


const getTextForBg = (bg) => {
  const map = {
    '#f8fafc': '#334155',
    '#fee2e2': '#991b1b',
    '#ffedd5': '#9a3412',
    '#fef3c7': '#92400e',
    '#dcfce7': '#166534',
    '#e0f2fe': '#075985',
    '#ede9fe': '#5b21b6',
    '#fce7f3': '#9d174d'
  };
  return map[bg] || '#334155';
};

export default function KanbanBoard({ session }) {
  const userRole = session?.user?.user_metadata?.rol;
  const canViewFinances = userRole === "Administración" || userRole === "Administrador" || userRole === "Líder Comercial";
  const [estados, setEstados] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [columnaActiva, setColumnaActiva] = useState(null);
  const [estadoOrigenReal, setEstadoOrigenReal] = useState(null);

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } });
  const sensors = useSensors(mouseSensor, touchSensor);

  // Estados para los modales
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [addProjectColumnId, setAddProjectColumnId] = useState(null);
  const [proyectoDetalleId, setProyectoDetalleId] = useState(null);
  const [columnSettingsId, setColumnSettingsId] = useState(null);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showCancelados, setShowCancelados] = useState(false);
  const [motivePrompt, setMotivePrompt] = useState(null);
  const [diasEstimadosPrompt, setDiasEstimadosPrompt] = useState(null);
  const [boardError, setBoardError] = useState(null);
  const [columnColors, setColumnColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem('globals_column_colors') || '{}'); } catch(e) { return {}; }
  });

  // Drag to scroll logic
  const boardRef = useRef(null);
  const dragInfo = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const originalColumnasRef = useRef(null);
  const columnasRef = useRef(columnas);
  useEffect(() => { columnasRef.current = columnas; }, [columnas]);

  const handleMouseDown = (e) => {
    // Only apply drag-to-scroll if clicking directly on the board background
    if (e.target !== boardRef.current) return;
    dragInfo.current.isDragging = true;
    dragInfo.current.startX = e.pageX - boardRef.current.offsetLeft;
    dragInfo.current.scrollLeft = boardRef.current.scrollLeft;
    boardRef.current.classList.add(styles.isDraggingBoard); 
    document.body.style.userSelect = 'none'; 
  };
  const handleMouseLeave = () => {
    dragInfo.current.isDragging = false;
    if (boardRef.current) boardRef.current.classList.remove(styles.isDraggingBoard);
    document.body.style.userSelect = '';
  };
  const handleMouseUp = () => {
    dragInfo.current.isDragging = false;
    if (boardRef.current) boardRef.current.classList.remove(styles.isDraggingBoard);
    document.body.style.userSelect = '';
  };
  const handleMouseMove = (e) => {
    if (!dragInfo.current.isDragging) return;
    e.preventDefault(); // Evita scroll o selección nativa extra
    const x = e.pageX - boardRef.current.offsetLeft;
    const walk = (x - dragInfo.current.startX) * 1.5; 
    boardRef.current.scrollLeft = dragInfo.current.scrollLeft - walk;
  };

  const showError = (msg) => {
    setBoardError(msg);
    setTimeout(() => setBoardError(null), 4000);
  };

  const fetchData = useCallback(async (ignore = false) => {
    let estadosActuales;

    // 1. Obtener columnas
    const { data: colsData, error: colsError } = await supabase
      .from('columnas')
      .select('*')
      .order('orden', { ascending: true });
      
    if (!colsError && colsData && colsData.length > 0) {
      estadosActuales = colsData.map(c => c.nombre).filter(n => n !== 'Cancelado' && n !== 'Cancelado_Oculto');
    } else {
      estadosActuales = defaultEstados;
    }

    if (!estadosActuales.includes('Archivado')) {
      estadosActuales.push('Archivado');
    }

    if (!ignore) setEstados(estadosActuales);

    // 2. Obtener proyectos
    const { data, error } = await supabase.from('proyectos').select('*');
    if (error || ignore) return;

    const agrupados = estadosActuales.map((estado) => {
      const proyectosEnEstado = data.filter(p => p.estado === estado).sort((a, b) => a.orden - b.orden); 
      const proyectosMapeados = proyectosEnEstado.map(p => {
        const fechaUltima = new Date(p.fecha_ultima_actualizacion);
        const hoy = new Date();
        const dias = Math.floor((hoy - fechaUltima) / (1000 * 60 * 60 * 24));
        return { ...p, telefono: p.cliente_telefono || 'Sin teléfono', dias: dias >= 0 ? dias : 0 };
      });
      return { estadoOriginal: estado, proyectos: proyectosMapeados };
    });

    if (!ignore) {
      setColumnas(agrupados);
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(ignore);

    // 3. Suscripción a Realtime
    const channel = supabase
      .channel('proyectos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => {
        fetchData(ignore);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columnas' }, () => {
        fetchData(ignore);
      })
      .subscribe();

    return () => { 
      ignore = true; 
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const encontrarEstadoPorId = (id) => {
    if (estados.includes(id)) return id; 
    for (let col of columnas) {
      if (col.proyectos.find(p => p.id === id)) return col.estadoOriginal; 
    }
    return null;
  };

    const generateTitleWithAI = async (projectData) => {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
        const prompt = `Actúa como un gestor de proyectos. Genera un título corto, directo y descriptivo (máximo 5-7 palabras) para un nuevo proyecto de rotulación/publicidad, usando estos datos iniciales:
Cliente/Empresa: ${projectData.cliente_empresa || 'Desconocido'}
Contacto: ${projectData.cliente_nombre || 'Desconocido'}
Notas/Descripción: ${projectData.notas || 'Sin descripción'}

Devuelve ÚNICAMENTE el título generado, sin comillas, ni introducciones, ni puntos finales. Ejemplos de formato esperado: "Letrero Luminoso Hato Grill" o "Pendones 2x2 para María"`;
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
        return text;
      } catch (err) {
        console.error("Error generando título con IA:", err);
        return "Proyecto " + (projectData.cliente_empresa || "Nuevo");
      }
    };

    const handleAgregarProyectoSubmit = async (nuevoProyectoData) => {
    let encargados = nuevoProyectoData.encargados;
    if (!encargados || encargados.length === 0) {
      // Si el usuario que crea el proyecto es el líder comercial, nos asignamos a nosotros mismos
      if (session?.user?.user_metadata?.rol === 'Líder Comercial') {
        encargados = [{ id: session.user.id, nombre: session.user.user_metadata.nombre || session.user.email, rol: 'Líder Comercial' }];
      } else {
        // Sino, buscamos al primer líder comercial de la base de datos para asignarlo por defecto
        const { data: liderData } = await supabase.from('usuarios').select('id, nombre, rol').eq('rol', 'Líder Comercial').limit(1);
        if (liderData && liderData.length > 0) {
          encargados = [{ id: liderData[0].id, nombre: liderData[0].nombre, rol: 'Líder Comercial' }];
        } else {
          // Si no existe, dejamos solo el rol
          encargados = [{ nombre: 'Asignar', rol: 'Líder Comercial' }];
        }
      }
    }

    const nuevoProyecto = {
      ...nuevoProyectoData,
      encargados: encargados,
      orden: 999, // Al final
    };

    const { data, error } = await supabase.from('proyectos').insert([nuevoProyecto]).select('*');

    if (error || !data) {
      console.error('Detalles del error al crear proyecto:', error);
      showError('Error al crear el proyecto: ' + error?.message);
      return;
    }

    setAddProjectColumnId(null);
    logAudit(session, 'Creó un proyecto nuevo', { proyecto_id: data[0].id, titulo: data[0].titulo, estado: data[0].estado });

    const proyectoInsertado = { ...data[0], dias: 0, telefono: data[0].cliente_telefono || 'Sin teléfono' };

    setColumnas(prev => prev.map(c => {
      if (c.estadoOriginal === nuevoProyectoData.estado) {
        return { ...c, proyectos: [...c.proyectos, proyectoInsertado] };
      }
      return c;
    }));
    
    setAddProjectColumnId(null); // Cerrar modal

    // Disparar generación de título en background
    generateTitleWithAI(nuevoProyectoData).then(async (aiTitle) => {
       const { error: updErr } = await supabase.from('proyectos').update({ titulo: aiTitle }).eq('id', proyectoInsertado.id);
       if (!updErr) {
         setColumnas(prevCols => prevCols.map(col => {
           if (col.estadoOriginal === proyectoInsertado.estado) {
             return {
               ...col,
               proyectos: col.proyectos.map(p => p.id === proyectoInsertado.id ? { ...p, titulo: aiTitle } : p)
             };
           }
           return col;
         }));
       }
    });
  };

  const agregarColumnaSubmit = async (nombre, dias_defecto = 7) => {
    if (session?.user?.user_metadata?.rol !== 'Líder Comercial') {
      showError('Acceso denegado: Solo el Líder Comercial puede agregar columnas.');
      return;
    }
    const nombreLower = nombre.toLowerCase().trim();
    const existe = estados.some(est => est.toLowerCase().trim() === nombreLower);
    if (existe) {
      showError(`Ya existe una columna con el nombre "${nombre}".`);
      return;
    }

    const { error } = await supabase.from('columnas').insert([{ nombre, orden: estados.length, dias_defecto }]);
    
    if (error) {
      showError('Error al crear la columna: ' + error.message);
    } else {
      setEstados(prev => [...prev, nombre]);
      setColumnas(prev => [...prev, { estadoOriginal: nombre, proyectos: [] }]);
    }
    
    setIsAddColumnOpen(false);
  };

  const handleUpdateColumna = async (oldName, newName, color) => {
    if (session?.user?.user_metadata?.rol !== 'Líder Comercial') {
      showError('Acceso denegado: Solo el Líder Comercial puede editar columnas.');
      return;
    }
    setEstados(prev => prev.map(e => e === oldName ? newName : e));
    setColumnas(prev => prev.map(c => c.estadoOriginal === oldName ? { ...c, estadoOriginal: newName } : c));
    setColumnSettingsId(null);

    if (color) {
      setColumnColors(prev => {
         const updated = { ...prev, [newName]: color };
         if (oldName !== newName) delete updated[oldName];
         localStorage.setItem('globals_column_colors', JSON.stringify(updated));
         return updated;
      });
    }
    await supabase.from('columnas').update({ nombre: newName }).eq('nombre', oldName);
  };

  const handleDeleteColumna = async (nombre) => {
    if (session?.user?.user_metadata?.rol !== 'Líder Comercial') {
      showError('Acceso denegado: Solo el Líder Comercial puede eliminar columnas.');
      return;
    }
    setEstados(prev => prev.filter(e => e !== nombre));
    setColumnas(prev => prev.filter(c => c.estadoOriginal !== nombre));
    setColumnSettingsId(null);
    
    await supabase.from('columnas').delete().eq('nombre', nombre);
  };

  const handleDragStart = (event) => {
    originalColumnasRef.current = JSON.parse(JSON.stringify(columnas));
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'Column') {
      const col = columnas.find(c => c.estadoOriginal === active.id);
      setColumnaActiva(col);
      return;
    }

    if (type === 'Card') {
      const proyecto = active.data.current?.proyecto;
      setProyectoActivo(proyecto);
      setEstadoOrigenReal(proyecto.estado);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    if (activeType === 'Column') return; 

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeColumn = encontrarEstadoPorId(activeId);
    const overColumn = encontrarEstadoPorId(overId);
    if (!activeColumn || !overColumn) return;

    if (activeColumn !== overColumn) {
      setColumnas(prev => {
        const nuevasColumnas = prev.map(c => ({ ...c, proyectos: [...c.proyectos] }));
        const colOrigenIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === activeColumn);
        const colDestinoIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === overColumn);

        const activeItems = nuevasColumnas[colOrigenIndex].proyectos;
        const overItems = nuevasColumnas[colDestinoIndex].proyectos;

        const activeIndex = activeItems.findIndex(p => p.id === activeId);
        const overIndex = overItems.findIndex(p => p.id === overId);

        const proyectoA_Mover = activeItems[activeIndex];


        const proyectoMovido = { ...proyectoA_Mover, estado: overColumn };
        activeItems.splice(activeIndex, 1);
        
        const isOverColumn = estados.includes(overId);
        const nuevoIndice = isOverColumn ? overItems.length : (overIndex >= 0 ? overIndex : overItems.length);
        overItems.splice(nuevoIndice, 0, proyectoMovido);

        return nuevasColumnas;
      });
    }
  };

  const encontrarEstadoPorIdEnRef = (id) => {
    if (estados.includes(id)) return id; 
    for (let col of columnasRef.current) {
      if (col.proyectos.find(p => p.id === id)) return col.estadoOriginal; 
    }
    return null;
  };
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setProyectoActivo(null);
    setColumnaActiva(null);

    if (!over) return;

    const type = active.data.current?.type;

    if (type === 'Column') {
      if (session?.user?.user_metadata?.rol !== 'Líder Comercial') {
        showError("Acceso denegado: Solo el Líder Comercial puede mover columnas.");
        return;
      }

      if (active.id !== over.id) {
        const oldIndex = estados.indexOf(active.id);
        const newIndex = estados.indexOf(over.id);
        const nuevosEstados = arrayMove(estados, oldIndex, newIndex);
        setEstados(nuevosEstados);
        setColumnas(prev => arrayMove(prev, oldIndex, newIndex));
        
        // Guardar el nuevo orden de las columnas en Supabase
        (async () => {
          for (let i = 0; i < nuevosEstados.length; i++) {
            await supabase.from('columnas').update({ orden: i }).eq('nombre', nuevosEstados[i]);
          }
        })();
      }
      return;
    }

    if (type === 'Card') {
      const activeColumn = encontrarEstadoPorIdEnRef(active.id);
      const overColumn = encontrarEstadoPorIdEnRef(over.id);

      if (!activeColumn || !overColumn) return;

      const origenGlobalIdx = estados.indexOf(estadoOrigenReal);
      const destinoGlobalIdx = estados.indexOf(activeColumn);
      const isSpecialDest = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';

      const cambioDeFase = estadoOrigenReal !== activeColumn;
      
      // Compute from current state `columnas`
      const pryHover = columnasRef.current.flatMap(c => c.proyectos).find(p => p.id === active.id);
      if (pryHover) {
        const isLider = session?.user?.user_metadata?.rol === 'Líder Comercial';
        const isEncargado = (pryHover.encargados || []).some(enc => enc.user_id === session?.user?.id || enc.id === session?.user?.id);
        if (!isLider && !isEncargado) {
          showError("Acceso denegado: Solo el Líder Comercial o un encargado pueden reordenar este proyecto.");
          if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
          return;
        }
      }

      const nuevasColumnas = columnasRef.current.map(c => ({ ...c, proyectos: [...c.proyectos] }));
      const colIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === activeColumn);
      const proyectosColumna = nuevasColumnas[colIndex].proyectos;

      const activeIndex = proyectosColumna.findIndex(p => p.id === active.id);
      const overIndex = proyectosColumna.findIndex(p => p.id === over.id);

      const proyectosReordenados = arrayMove(proyectosColumna, activeIndex, overIndex);

      
      // REGLA: COLUMNA "En pausa/espera"
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
        const isSpecialDestForLev = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';
        if (estadoOrigenReal === 'Levantamiento' && activeColumn !== 'Levantamiento' && !isSpecialDestForLev) {
          if (!pry.levantamiento_fecha) {
            showError('No puedes mover el proyecto. Debes llenar la Hoja de Levantamiento primero.');
            if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
            return;
          }
        }

        // OTHER GATES
        if (destinoGlobalIdx > origenGlobalIdx && !isSpecialDest) {
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

      const executeMove = (motive = null, nuevasNotas = null) => {
        const nuevasColumnas = columnasRef.current.map(c => ({ ...c, proyectos: [...c.proyectos] }));
        const colIndex = nuevasColumnas.findIndex(c => c.estadoOriginal === activeColumn);
        const proyectosColumna = nuevasColumnas[colIndex].proyectos;
  
        let proyectosReordenados = proyectosColumna;
        if (!cambioDeFase) {
          const activeIndex = proyectosColumna.findIndex(p => p.id === active.id);
          let overIndex = proyectosColumna.findIndex(p => p.id === over.id);
          if (overIndex === -1) overIndex = proyectosColumna.length - 1;
          proyectosReordenados = arrayMove(proyectosColumna, activeIndex, overIndex);
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
              const isSpecial = activeColumn.toLowerCase().includes('espera') || activeColumn.toLowerCase().includes('pausa') || activeColumn === 'Archivado' || activeColumn === 'Cancelado';
              if (motive) {
                updateData.motivo_cancelacion = motive;
              } else if (!isSpecial) {
                updateData.motivo_cancelacion = null;
              }
              if (nuevasNotas) {
                updateData.notas = nuevasNotas;
              }
              logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });
            }
            await supabase.from('proyectos').update(updateData).eq('id', p.id);
          }
        })();
      };

      const isRetroceso = cambioDeFase && (destinoGlobalIdx < origenGlobalIdx) && !isSpecialDest;
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
             const nuevasNotas = pry.notas ? pry.notas + '\n\n' + notaAnadida : notaAnadida;
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
      } else if (cambioDeFase && !isSpecialDest && destinoGlobalIdx > origenGlobalIdx) {
        setDiasEstimadosPrompt({
           columna: activeColumn,
           error: null,
           onConfirm: (dias) => {
             // Validate against fecha_entrega if exists
             if (pry.fecha_entrega) {
               const entrega = new Date(pry.fecha_entrega + 'T00:00:00');
               const estimadoDate = new Date();
               estimadoDate.setDate(estimadoDate.getDate() + dias);
               if (estimadoDate > entrega) {
                 setDiasEstimadosPrompt(prev => ({ ...prev, error: `Los días estimados superan la fecha de entrega final (${pry.fecha_entrega}). Introduce un número menor.` }));
                 return; // Do not close modal
               }
             }

             // Clean old tags
             let currentNotas = pry.notas || '';
             currentNotas = currentNotas.replace(/\[DÍAS ESTIMADOS FASE ACTUAL: \d+\]\n?/g, '').trim();
             
             // Append new tag
             const notaAnadida = `[DÍAS ESTIMADOS FASE ACTUAL: ${dias}]`;
             const nuevasNotas = currentNotas ? currentNotas + '\n\n' + notaAnadida : notaAnadida;

             executeMove(null, nuevasNotas);
             setDiasEstimadosPrompt(null);
           },
           onCancel: () => {
             if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
             setDiasEstimadosPrompt(null);
           }
        });
      } else {
        executeMove();
      }
    }
  };

  if (cargando) return (
    <div className={styles.board} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div className={styles.spinner}></div>
        <p style={{ fontWeight: 500 }}>Cargando tablero...</p>
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.stickyHeader}>
      <header className={styles.topHeader}>
        <div className={styles.logo}>
          <img src={logo} alt="Globals Logo" style={{ height: "40px" }} />
          
        </div>
        <div className={styles.userInfo}>
          



          <BellNotifications session={session} />

          {/* <button className={styles.btnActionMobile} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', background: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }} onClick={() => window.location.href = '/cotizador'}>
            <span style={{fontWeight: 'bold'}}>Cotizador</span>
          </button> */}
          
          {canViewFinances && (
            <button 
              className={styles.btnActionMobile} 
              title="Dashboard"
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => window.location.href = '/dashboard'}
            >
              <BarChart2 size={20} />
            </button>
          )}

          <button 
            className={styles.btnActionMobile} 
            title="WhatsApp Admin"
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={() => window.location.href = '/admin/whatsapp'}
          >
            <QrCode size={20} />
          </button>

          <span className={styles.userEmail}>

            {session?.user?.user_metadata?.nombre || session?.user?.email}
          </span>
          <button className={styles.btnLogout} onClick={() => supabase.auth.signOut()}>
            <LogOut size={18} /> <span className={styles.hideOnMobile}>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        {session?.user?.user_metadata?.rol === 'Líder Comercial' && (
        <button 
          className={`${styles.btnArchive} ${showArchived ? styles.active : ''}`}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive size={18} />
          <span className={styles.hideOnMobile}>
            {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
          </span>
        </button>
        )}
        {session?.user?.user_metadata?.rol === 'Líder Comercial' && (
        <button 
          className={styles.btnArchive}
          style={{ background: '#ef4444', color: 'white', borderColor: '#b91c1c' }}
          onClick={() => setShowCancelados(true)}
        >
          <Trash2 size={18} />
          <span className={styles.hideOnMobile}>
            Cancelados
          </span>
        </button>
        )}
      </div>

      </div>
      {boardError && (
        <div className={styles.boardError}>
          <span>{boardError}</span>
          <button className={styles.btnCloseError} onClick={() => setBoardError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.boardContainer}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => { setProyectoActivo(null); setColumnaActiva(null); }}
      >
        <div 
          className={`${styles.board} ${proyectoActivo || columnaActiva ? styles.boardDragging : ''}`}
          ref={boardRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <SortableContext items={estados} strategy={horizontalListSortingStrategy}>
            {columnas.map((col) => {
              // Filtrar si el estado es 'Archivado' y no queremos verlo
              if (col.estadoOriginal === 'Archivado' && !showArchived) return null;
              // Si no está archivado pero SÍ queremos ver SOLO archivados, ¿qué hacemos?
              // Normalmente 'Archivado' es una columna más, o ocultamos las demás.
              // Mejor mostramos la columna 'Archivado' si showArchived es true.

              // Filtrar proyectos según la búsqueda
              const normalizeStr = (str) => {
                if (!str) return '';
                return str
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "") // quita acentos
                  .replace(/[.,/#!$%^&*;:{}=_`~()-]/g,"") // quita signos de puntuación
                  .toLowerCase();
              };

              const proyectosFiltrados = col.proyectos.filter(p => {
                const s = normalizeStr(searchTerm);
                if (!s) return true;
                return (
                  normalizeStr(p.titulo).includes(s) ||
                  normalizeStr(p.cliente_telefono).includes(s) ||
                  normalizeStr(p.notas).includes(s)
                );
              });

              // Si hay término de búsqueda, tal vez queramos ocultar columnas vacías, pero lo dejaremos así.
              return (
                <KanbanColumn 
                  key={col.estadoOriginal} 
                  colorBg={columnColors[col.estadoOriginal] || '#f8fafc'}
                  colorText={getTextForBg(columnColors[col.estadoOriginal] || '#f8fafc')}
                  titulo={col.estadoOriginal} 
                  cantidad={proyectosFiltrados.length}
                  proyectos={proyectosFiltrados}
                  idEstado={col.estadoOriginal}
                  onAddProject={() => setAddProjectColumnId(col.estadoOriginal)}
                  onCardClick={setProyectoDetalleId}
                  onSettingsClick={setColumnSettingsId}
                  onBotClick={() => setIsAgentOpen(col.estadoOriginal)}
                />
              );
            })}
          </SortableContext>
          
          <button className={styles.botonAgregarColumna} onClick={() => setIsAddColumnOpen(true)}>
            <Plus size={20} /> Añadir columna
          </button>
        </div>

        <DragOverlay>
          {columnaActiva ? (
            <KanbanColumn 
              colorBg={columnColors[columnaActiva.estadoOriginal] || '#f8fafc'}
              colorText={getTextForBg(columnColors[columnaActiva.estadoOriginal] || '#f8fafc')}
              titulo={columnaActiva.estadoOriginal} 
              cantidad={columnaActiva.proyectos.length}
              proyectos={columnaActiva.proyectos}
              idEstado={columnaActiva.estadoOriginal}
              isOverlay={true}
            />
          ) : proyectoActivo ? (
            <KanbanCard proyecto={proyectoActivo} isOverlay={true} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {isAddColumnOpen && (
        <AddColumnModal 
          onClose={() => setIsAddColumnOpen(false)} 
          onAdd={agregarColumnaSubmit} 
        />
      )}

      {addProjectColumnId && (
        <AddProjectModal 
          columnaEstado={addProjectColumnId} 
          onClose={() => setAddProjectColumnId(null)} 
          onAdd={handleAgregarProyectoSubmit} 
        />
      )}


      {diasEstimadosPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem' }}>Días Estimados para la Fase</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
              ¿Cuántos días estimas que tomará esta tarjeta en la columna <strong>{diasEstimadosPrompt.columna}</strong>?
            </p>
            {diasEstimadosPrompt.error && (
              <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>{diasEstimadosPrompt.error}</div>
            )}
            <input 
              type="number"
              id="diasEstimadosInput"
              autoFocus
              min="1"
              placeholder="Ej. 3"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={diasEstimadosPrompt.onCancel} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
              <button 
                onClick={() => {
                  const val = parseInt(document.getElementById('diasEstimadosInput').value, 10);
                  if (!val || isNaN(val)) { return; }
                  diasEstimadosPrompt.onConfirm(val);
                }} 
                style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

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
                  if (!val.trim()) { return; }
                  motivePrompt.onConfirm(val);
                }} 
                style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showCancelados && (

        <CanceladosModal 
          session={session}
          onClose={() => setShowCancelados(false)}
        />
      )}

      {proyectoDetalleId && (
        <ProjectDetailModal
          proyectoId={proyectoDetalleId}
          estados={estados}
          session={session}
          onClose={() => setProyectoDetalleId(null)}
          onProjectUpdated={(updatedProject) => {
            setColumnas(prev => {
              let cleaned = prev.map(c => ({
                ...c,
                proyectos: c.proyectos.filter(p => p.id !== updatedProject.id)
              }));
              return cleaned.map(c => {
                if (c.estadoOriginal === updatedProject.estado) {
                  return { ...c, proyectos: [...c.proyectos, updatedProject].sort((a,b) => a.orden - b.orden) };
                }
                return c;
              });
            });
          }}
          onProjectDeleted={(id) => {
            setColumnas(prev => prev.map(c => ({
              ...c,
              proyectos: c.proyectos.filter(p => p.id !== id)
            })));
          }}
        />
      )}

      {columnSettingsId && (
        <ColumnSettingsModal
          columna={{ ...columnas.find(c => c.estadoOriginal === columnSettingsId), color: columnColors[columnSettingsId] }}
          onClose={() => setColumnSettingsId(null)}
          onUpdate={handleUpdateColumna}
          onDelete={handleDeleteColumna}
        />
      )}

      {isAgentOpen && (
        <AIAgentModal 
          estadoPredefinido={typeof isAgentOpen === 'string' ? isAgentOpen : null}
          onClose={() => setIsAgentOpen(false)}
          onProjectCreated={handleAgregarProyectoSubmit}
        />
      )}
      </div>
    </>
  );
}