with open('src/components/Modals/AddProjectModal.jsx', 'r') as f:
    content = f.read()

import re

# Add state
old_state = """    notas: '',
    presupuesto_aprobado: false,
    materiales_comprados: false,
    encargados: []
  });"""
new_state = """    notas: '',
    diasEstimados: 3,
    presupuesto_aprobado: false,
    materiales_comprados: false,
    encargados: []
  });"""
content = content.replace(old_state, new_state)

# Add input UI
old_ui = """          <div className={styles.formGroup}>
            <label>Notas / Descripción</label>"""
new_ui = """          <div className={styles.formGroup}>
            <label>Días Estimados en esta Columna</label>
            <input 
              type="number"
              name="diasEstimados"
              min="1"
              value={formData.diasEstimados}
              onChange={handleChange}
              placeholder="Ej. 3"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Notas / Descripción</label>"""
content = content.replace(old_ui, new_ui)

with open('src/components/Modals/AddProjectModal.jsx', 'w') as f:
    f.write(content)
