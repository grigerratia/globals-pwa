import { useState } from 'react';
import styles from './Modals.module.scss';
import AssignEmployeeSelect from './AssignEmployeeSelect';
import { X } from 'lucide-react';

export default function AddProjectModal({ columnaEstado, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    titulo: '',
    cliente_telefono: '',
    cliente_nombre: '',
    cliente_empresa: '',
    notas: '',
    presupuesto_aprobado: false,
    materiales_comprados: false,
    encargados: []
  });

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      titulo: 'Generando título con IA...',
      estado: columnaEstado,
      fecha_ultima_actualizacion: new Date().toISOString(),
      dias_estancado: 0
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>Añadir proyecto a '{columnaEstado}'</h3>
        <form onSubmit={handleSubmit} className={styles.formGrid}>

          <div className={styles.formGroup}>
            <label>Teléfono del Cliente</label>
            <input 
              type="text" 
              name="cliente_telefono" 
              value={formData.cliente_telefono} 
              onChange={handleChange} 
              placeholder="+1 234 567 890"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Cliente (Empresa/Negocio)</label>
            <input 
              type="text" 
              name="cliente_empresa" 
              value={formData.cliente_empresa || ''} 
              onChange={handleChange} 
              placeholder="Ej. Hato Grill"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Persona de Contacto</label>
            <input 
              type="text" 
              name="cliente_nombre" 
              value={formData.cliente_nombre || ''} 
              onChange={handleChange} 
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Notas / Descripción</label>
            <textarea 
              name="notas" 
              value={formData.notas} 
              onChange={handleChange} 
              rows="3" 
              placeholder="Detalles importantes..."
            />
          </div>
          <div className={styles.checkboxGroup}>
            <label>
              <input type="checkbox" name="presupuesto_aprobado" checked={formData.presupuesto_aprobado} onChange={handleChange} />
              <span>Presupuesto Aprobado</span>
            </label>
          </div>
          <div className={styles.checkboxGroup}>
            <label>
              <input type="checkbox" name="materiales_comprados" checked={formData.materiales_comprados} onChange={handleChange} />
              <span>Materiales Comprados</span>
            </label>
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Encargados (Opcional)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {formData.encargados.map((enc, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{enc.nombre}</span>
                  <span style={{ fontSize: '0.75rem', background: '#3b82f6', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'white', marginLeft: 'auto' }}>{enc.rol}</span>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, encargados: prev.encargados.filter((_, i) => i !== idx) }))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={14}/></button>
                </div>
              ))}
            </div>
            <AssignEmployeeSelect 
              onSelect={(newEnc) => setFormData(prev => ({ ...prev, encargados: [...prev.encargados, newEnc] }))}
            />
          </div>

          <div className={`${styles.actions} ${styles.fullWidth}`}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
            <button type="submit" className={styles.btnSubmit}>Crear Proyecto</button>
          </div>
        </form>
      </div>
    </div>
  );
}

