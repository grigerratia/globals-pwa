import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, AlertCircle, Clock } from 'lucide-react';
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

  const limite = SLA_LIMITS[proyecto.estado] || 2;
  const isStalled = proyecto.dias > limite;

  // 2. Extraemos el contenido renderizado para no declararlo como un componente interno
  const renderCardContent = () => (
    <>
      <h4 className={styles.titulo}>{proyecto.titulo}</h4>
      <div className={styles.detalles}>
        <div className={styles.infoGroup}>
          <Phone size={12} />
          <span>{proyecto.cliente_telefono || 'Sin Tlf'}</span>
        </div>
        
        {isStalled ? (
          <span className={styles.alerta}>
            <AlertCircle size={12} />
            {proyecto.dias} d (¡Atascado!)
          </span>
        ) : (
          <span className={styles.diasLabel}>
            <Clock size={12} />
            {proyecto.dias} d
          </span>
        )}
      </div>
      <div className={styles.creadoLabel}>
        Creado: {proyecto.created_at ? new Date(proyecto.created_at).toLocaleDateString() : 'N/A'}
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
        className={`${styles.card} ${styles.cardDragging} ${isStalled ? styles.cardStalled : ''}`} 
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
      className={`${styles.card} ${isStalled ? styles.cardStalled : ''}`}
      onClick={(e) => {
        // ...
        onClick(proyecto.id);
      }}
    >
      {renderCardContent()}
    </div>
  );
}