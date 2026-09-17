import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabase';
import { Bot, BellRing, LogOut, Search, Archive } from 'lucide-react';
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
import { Plus, X } from 'lucide-react';
import styles from './KanbanBoard.module.scss';
import KanbanColumn from '../KanbanColumn/KanbanColumn';
import KanbanCard from '../KanbanCard/KanbanCard';
import AddColumnModal from '../Modals/AddColumnModal';
import AddProjectModal from '../Modals/AddProjectModal';
import ProjectDetailModal from '../Modals/ProjectDetailModal';
import ColumnSettingsModal from '../Modals/ColumnSettingsModal';
import AIAgentModal from '../Modals/AIAgentModal';
import { logAudit } from '../../utils/audit';

const defaultEstados = [
  'Levantamiento', 
  'Presupuesto enviado', 
  'Logística y compras', 
  'En fabricación', 
  'Listo para instalación', 
  'En instalación', 
  'Entregado y cerrado', 
  'En pausa/espera'
];

import BellNotifications from './BellNotifications';

export default function KanbanBoard({ session }) {
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
  const [boardError, setBoardError] = useState(null);

  // Drag to scroll logic
  const boardRef = useRef(null);
  const dragInfo = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });
  const originalColumnasRef = useRef(null);

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
      estadosActuales = colsData.map(c => c.nombre);
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

  const handleAgregarProyectoSubmit = async (nuevoProyectoData) => {
    const nuevoProyecto = {
      ...nuevoProyectoData,
      encargados: nuevoProyectoData.encargados?.length > 0 ? nuevoProyectoData.encargados : [{ nombre: 'Asignar', rol: 'Líder Comercial' }],
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
  };

  const agregarColumnaSubmit = async (nombre) => {
    if (session?.user?.user_metadata?.rol !== 'Líder Comercial') {
      showError('Acceso denegado: Solo el Líder Comercial puede agregar columnas.');
      return;
    }
    if (!estados.includes(nombre)) {
      const { error } = await supabase.from('columnas').insert([{ nombre, orden: estados.length }]);
      
      if (error) {
        showError('Error al crear la columna: ' + error.message);
      } else {
        setEstados(prev => [...prev, nombre]);
        setColumnas(prev => [...prev, { estadoOriginal: nombre, proyectos: [] }]);
      }
    }
    setIsAddColumnOpen(false);
  };

  const handleUpdateColumna = async (oldName, newName) => {
    if (session?.user?.user_metadata?.rol !== 'Líder Comercial') {
      showError('Acceso denegado: Solo el Líder Comercial puede editar columnas.');
      return;
    }
    // Optimistic update
    setEstados(prev => prev.map(e => e === oldName ? newName : e));
    setColumnas(prev => prev.map(c => c.estadoOriginal === oldName ? { ...c, estadoOriginal: newName } : c));
    setColumnSettingsId(null);
    
    // El trigger en supabase (ON UPDATE CASCADE) actualizará los proyectos
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
      const activeColumn = encontrarEstadoPorId(active.id);
      const overColumn = encontrarEstadoPorId(over.id);

      if (!activeColumn || !overColumn) return;

      const cambioDeFase = estadoOrigenReal !== activeColumn;
      
      // Compute from current state `columnas`
      const pryHover = columnas.flatMap(c => c.proyectos).find(p => p.id === active.id);
      if (pryHover) {
        const isLider = session?.user?.user_metadata?.rol === 'Líder Comercial';
        const isEncargado = (pryHover.encargados || []).some(enc => enc.user_id === session?.user?.id || enc.id === session?.user?.id);
        if (!isLider && !isEncargado) {
          showError("Acceso denegado: Solo el Líder Comercial o un encargado pueden reordenar este proyecto.");
          if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
          return;
        }
      }

      const nuevasColumnas = columnas.map(c => ({ ...c, proyectos: [...c.proyectos] }));
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

      const proyectosFinales = proyectosReordenados.map((p, i) => {
        if (p.id === active.id && cambioDeFase) {
          return { ...p, orden: i, dias: 0, fecha_ultima_actualizacion: new Date().toISOString() };
        }
        return { ...p, orden: i };
      });

      nuevasColumnas[colIndex].proyectos = proyectosFinales;
      
      // Update local state immediately
      setColumnas(nuevasColumnas);

      // Fire async database update EXACTLY once
      (async () => {
        for (const p of proyectosFinales) {
          const updateData = { orden: p.orden, estado: p.estado };
          if (p.id === active.id && cambioDeFase) {
            updateData.fecha_ultima_actualizacion = p.fecha_ultima_actualizacion;
            logAudit(session, 'Movió proyecto de fase', { proyecto_id: p.id, titulo: p.titulo, nuevo_estado: p.estado, origen: estadoOrigenReal });
          }
          await supabase.from('proyectos').update(updateData).eq('id', p.id);
        }
      })();
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
      <header className={styles.topHeader}>
        <div className={styles.logo}>
          <h2>Globals</h2>
          <span className={styles.hideOnMobile}>Kanban</span>
        </div>
        <div className={styles.userInfo}>
          


          <BellNotifications session={session} />

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
        <button 
          className={`${styles.btnArchive} ${showArchived ? styles.active : ''}`}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive size={18} />
          <span className={styles.hideOnMobile}>
            {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
          </span>
        </button>
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
                  titulo={col.estadoOriginal} 
                  cantidad={proyectosFiltrados.length}
                  proyectos={proyectosFiltrados}
                  idEstado={col.estadoOriginal}
                  onAddProject={() => setAddProjectColumnId(col.estadoOriginal)}
                  onCardClick={setProyectoDetalleId}
                  onSettingsClick={setColumnSettingsId}
                  onBotClick={() => setIsAgentOpen(true)}
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
          columna={columnas.find(c => c.estadoOriginal === columnSettingsId)}
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