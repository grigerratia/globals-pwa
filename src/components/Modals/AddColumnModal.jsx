import { useState } from 'react';
import styles from './Modals.module.scss';

export default function AddColumnModal({ onClose, onAdd }) {
  const [nombre, setNombre] = useState('');
  const [diasDefecto, setDiasDefecto] = useState(7);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim() && diasDefecto > 0) {
      onAdd(nombre.trim(), parseInt(diasDefecto, 10));
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>Añadir nueva columna</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nombre de la columna</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              placeholder="Ej. Revisión final"
              autoFocus
              required
            />
          </div>
          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label>Días por defecto permitidos</label>
            <input 
              type="number" 
              value={diasDefecto} 
              onChange={e => setDiasDefecto(e.target.value)} 
              min="1"
              required
            />
            <small style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
              El tiempo máximo sugerido para que un proyecto permanezca en esta columna.
            </small>
          </div>
          <div className={styles.actions} style={{ marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
            <button type="submit" className={styles.btnSubmit}>Añadir Columna</button>
          </div>
        </form>
      </div>
    </div>
  );
}
