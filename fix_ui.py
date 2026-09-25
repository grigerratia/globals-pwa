with open('src/components/Modals/AddProjectModal.jsx', 'r') as f:
    content = f.read()

old_str = """          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Notas / Descripción</label>"""

new_str = """          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
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
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Notas / Descripción</label>"""

content = content.replace(old_str, new_str)
with open('src/components/Modals/AddProjectModal.jsx', 'w') as f:
    f.write(content)
