with open('src/components/Modals/AddProjectModal.jsx', 'r') as f:
    content = f.read()

import re

# Remove the title input
old_title_input = """          <div className={styles.formGroup}>
            <label>Título del Proyecto *</label>
            <input 
              type="text" 
              name="titulo" 
              value={formData.titulo} 
              onChange={handleChange} 
              placeholder="Ej. Casa Familia Pérez"
              required 
              autoFocus 
            />
          </div>"""

content = content.replace(old_title_input, "")

# Modify handleSubmit
old_submit = """  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.titulo.trim()) {
      onAdd({
        ...formData,
        estado: columnaEstado,
        fecha_ultima_actualizacion: new Date().toISOString(),
        dias_estancado: 0
      });
    }
  };"""

new_submit = """  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      titulo: 'Generando título con IA...',
      estado: columnaEstado,
      fecha_ultima_actualizacion: new Date().toISOString(),
      dias_estancado: 0
    });
  };"""

content = content.replace(old_submit, new_submit)

with open('src/components/Modals/AddProjectModal.jsx', 'w') as f:
    f.write(content)
