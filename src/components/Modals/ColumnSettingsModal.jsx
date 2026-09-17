import { useState } from 'react';
import styles from './Modals.module.scss';

export default function ColumnSettingsModal({ columna, onClose, onUpdate, onDelete }) {
  const [nombre, setNombre] = useState(columna.estadoOriginal);
  const [colorBg, setColorBg] = useState(columna.color || '#f1f5f9');
  
  const PASTEL_COLORS = [
    { bg: '#f8fafc', text: '#334155', name: 'Gris' },
    { bg: '#fee2e2', text: '#991b1b', name: 'Rojo' },
    { bg: '#ffedd5', text: '#9a3412', name: 'Naranja' },
    { bg: '#fef3c7', text: '#92400e', name: 'Amarillo' },
    { bg: '#dcfce7', text: '#166534', name: 'Verde' },
    { bg: '#e0f2fe', text: '#075985', name: 'Azul' },
    { bg: '#ede9fe', text: '#5b21b6', name: 'Morado' },
    { bg: '#fce7f3', text: '#9d174d', name: 'Rosa' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim()) {
      onUpdate(columna.estadoOriginal, nombre.trim(), colorBg);
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
          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
            <label>Color de fondo (Pastel)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {PASTEL_COLORS.map(c => (
                <div 
                  key={c.bg}
                  title={c.name}
                  onClick={() => setColorBg(c.bg)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: c.bg,
                    cursor: 'pointer', border: colorBg === c.bg ? '2px solid ' + c.text : '1px solid #cbd5e1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: c.text, fontWeight: 'bold'
                  }}
                >
                  {colorBg === c.bg && '✓'}
                </div>
              ))}
            </div>
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

