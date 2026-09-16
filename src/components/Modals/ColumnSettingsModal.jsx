import { useState } from 'react';
import styles from './Modals.module.scss';

export default function ColumnSettingsModal({ columna, onClose, onUpdate, onDelete }) {
  const [nombre, setNombre] = useState(columna.estadoOriginal);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim() && nombre !== columna.estadoOriginal) {
      onUpdate(columna.estadoOriginal, nombre.trim());
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>Ajustes de Columna</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Renombrar columna</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              autoFocus
              required
            />
          </div>
          
          <div className={styles.actions} style={{ justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={() => {
                if (confirm('¿Eliminar esta columna y todos sus proyectos?')) {
                  onDelete(columna.estadoOriginal);
                }
              }} 
              className={styles.btnCancel} 
              style={{ color: 'var(--danger)' }}
            >
              Eliminar columna
            </button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
              <button type="submit" className={styles.btnSubmit}>Guardar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

