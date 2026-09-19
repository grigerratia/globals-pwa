import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripHorizontal, Settings, Sparkles } from 'lucide-react';
import styles from './KanbanColumn.module.scss';
import KanbanCard from '../KanbanCard/KanbanCard';

export default function KanbanColumn({ colorBg, colorText, titulo, cantidad, proyectos, idEstado, isOverlay, onAddProject, onCardClick, onSettingsClick, onBotClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: idEstado,
    data: { type: 'Column', idEstado }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const columnaClases = `${styles.column} ${isDragging ? styles.columnDragging : ''} ${isOverlay ? styles.columnOverlay : ''}`;

  return (
    <div ref={setNodeRef} style={{...style, backgroundColor: colorBg}} className={columnaClases}>
      <div className={styles.header} {...attributes} {...listeners} style={{ cursor: 'grab' }}>
        <h3 className={styles.titulo} style={{ color: colorText || '#1e293b' }}>{titulo}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className={styles.contador} style={{ backgroundColor: colorText, color: colorBg }}>{cantidad}</span>
          <GripHorizontal size={14} color={colorText || 'var(--text-muted)'} />
          {onSettingsClick && (
            <button 
              className={styles.settingsBtn} 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={(e) => { e.stopPropagation(); onSettingsClick(idEstado); }}
            >
              <Settings size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.listaTarjetas}>
        <SortableContext 
          items={proyectos.map(p => p.id)} 
          strategy={verticalListSortingStrategy}
        >
          {proyectos.map((proyecto) => (
            <KanbanCard key={proyecto.id} proyecto={proyecto} onClick={() => onCardClick && onCardClick(proyecto.id)} />
          ))}
        </SortableContext>
      </div>
      
      <div className={styles.columnFooter}>
        <button className={styles.botonAgregar} onClick={onAddProject}>
          <Plus size={16} /> Añadir proyecto
        </button>
        {idEstado.toLowerCase().includes('conversaci') && <button className={styles.botonBot} onClick={() => onBotClick(idEstado)}>
          <Sparkles size={16} />
        </button>}
      </div>
    </div>
  );
}