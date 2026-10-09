import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, AlertCircle, Clock, Building } from 'lucide-react';
import styles from './KanbanCard.module.scss';

export default function KanbanCard({ proyecto, isOverlay, onClick }) {
  // 1. LLAMAMOS AL HOOK SIEMPRE AL PRINCIPIO
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: proyecto.id,
    data: { type: 'Card', proyecto },
  });

  const SLA_LIMITS = {
    'En Conversación': 2,
    'Levantamiento': 1,
    'Presupuesto Enviado': 2,
    'Aprobado': 2,
    'Logística y compras': 2,
    'En fabricación': 4,
    'Listo para instalación': 2,
    'En instalación': 2,
    'Entregado y cerrado': 999,
    'En pausa/espera': 999
  };

  const isArchivedOrCanceled = ['Archivado', 'Cancelado', 'Cancelado_Oculto'].includes(proyecto.estado);
  const limite = SLA_LIMITS[proyecto.estado] || 2;
  const isStalled = !isArchivedOrCanceled && (proyecto.dias > limite);

  let isOverdue = false;
  let daysOverdue = 0;
  if (proyecto.fecha_entrega && !isArchivedOrCanceled && !['Entregado y cerrado'].includes(proyecto.estado)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entrega = new Date(proyecto.fecha_entrega + 'T00:00:00');
    if (today > entrega) {
      isOverdue = true;
      daysOverdue = Math.floor((today - entrega) / (1000 * 60 * 60 * 24));
    }
  }

  // 2. Extraemos el contenido renderizado para no declararlo como un componente interno
  const renderCardContent = () => (
    <>
      <h4 className={styles.titulo}>{proyecto.titulo}</h4>
      {proyecto.cliente_empresa && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
          <Building size={12} /> {proyecto.cliente_empresa}
        </div>
      )}
      <div className={styles.detalles}>
        <div className={styles.infoGroup}>
          <Phone size={12} />
          <span>{proyecto.cliente_telefono || 'Sin Tlf'}</span>
        </div>
        
        {!isArchivedOrCanceled && (
          isOverdue ? (
            <span className={styles.alerta} style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>
              <AlertCircle size={12} />
              Vencido {daysOverdue} d
            </span>
          ) : isStalled ? (
            <span className={styles.alerta}>
              <AlertCircle size={12} />
              {proyecto.dias} d (¡Atascado!)
            </span>
          ) : (
            <span className={styles.diasLabel}>
              <Clock size={12} />
              {proyecto.dias} d
            </span>
          )
        )}
      </div>
      <div className={styles.creadoLabel}>
        Creado: {proyecto.fecha_creacion ? new Date(proyecto.fecha_creacion).toLocaleDateString() : 'N/A'}
      </div>
    </>
  );

  const style = {
    transform: CSS.Translate.toString(transform),
    transition, 
  };

  // 3. Manejamos la vista condicional
  if (isOverlay) {
    return (
      <div 
        className={`${styles.card} ${styles.cardDragging} ${isOverdue || isStalled ? styles.cardStalled : ''}`} 
        style={style}
      >
        {renderCardContent()}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.card} ${isOverdue || isStalled ? styles.cardStalled : ''}`}
      onClick={(e) => {
        // ...
        onClick(proyecto.id);
      }}
    >
      {renderCardContent()}
    </div>
  );
}