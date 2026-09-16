import { useState } from 'react';
import styles from './Modals.module.scss';

export default function AddColumnModal({ onClose, onAdd }) {
  const [nombre, setNombre] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim()) {
      onAdd(nombre.trim());
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
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
            <button type="submit" className={styles.btnSubmit}>Añadir Columna</button>
          </div>
        </form>
      </div>
    </div>
  );
}

