import { useState } from 'react';
import styles from './Modals.module.scss';

export default function ColumnSettingsModal({ columna, onClose, onUpdate, onDelete }) {
  const [nombre, setNombre] = useState(columna.estadoOriginal);
  const [colorBg, setColorBg] = useState(columna.color || '#f1f5f9');
  
  const MODERN_GRADIENTS = [
    { bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', text: '#78350f', name: 'Sunrise' },
    { bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', text: '#064e3b', name: 'Ocean' },
    { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', text: '#4c1d95', name: 'Dream' },
    { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', text: '#831843', name: 'Cherry' },
    { bg: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', text: '#312e81', name: 'Dusk' },
    { bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', text: '#312e81', name: 'Amethyst' },
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#082f49', name: 'Sky' },
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: '#064e3b', name: 'Mint' },
    { bg: '#f1f5f9', text: '#334155', name: 'Gris Clásico' }
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
            <label>Color de fondo (Degradado)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {MODERN_GRADIENTS.map(c => (
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

