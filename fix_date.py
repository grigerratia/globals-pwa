with open('src/components/Modals/LevantamientoFormModal.jsx', 'r') as f:
    content = f.read()

import re

# We will remove the showDateWarning state entirely, and just enforce `min` on the input.
# Or just block saving if the date is too short.

old_handleSave = """  const handleSave = async (checkDate = false) => {
    if (!formData.responsableGlobals || !formData.responsableMedidas || !formData.fechaEntrega) {
      showError('Por favor completa Responsables y Fecha de Entrega.');
      return;
    }

    if (checkDate) {
      const hoy = new Date();
      const entrega = new Date(formData.fechaEntrega);
      const diffTime = entrega - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 5 && !proceedAnyway) {
        setShowDateWarning(true);
        setTimeout(() => {
          const warningBox = document.getElementById('date-warning-box');
          if (warningBox) {
            warningBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
    }"""

new_handleSave = """  const handleSave = async () => {
    if (!formData.responsableGlobals || !formData.responsableMedidas || !formData.fechaEntrega) {
      showError('Por favor completa Responsables y Fecha de Entrega.');
      return;
    }

    const hoy = new Date();
    const entrega = new Date(formData.fechaEntrega);
    const diffTime = entrega - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 6) {
      showError('No se permiten proyectos con un plazo menor a 6 días. Por favor, selecciona una fecha más lejana.');
      return;
    }"""

content = content.replace(old_handleSave, new_handleSave)

old_jsx = """            <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={(e) => {
               handleChange(e);
               setShowDateWarning(false);
               setProceedAnyway(false);
            }} />
            {showDateWarning && (
              <div id="date-warning-box" style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem' }}>
                ⚠️ <strong>Aviso:</strong> El tiempo de entrega es menor a 5 días. Este plazo es muy corto.
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" checked={proceedAnyway} onChange={e => setProceedAnyway(e.target.checked)} />
                  Entiendo el riesgo, guardar fecha
                </label>
              </div>
            )}"""

new_jsx = """            <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} min={new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0]} />"""

content = content.replace(old_jsx, new_jsx)

# Also remove states
old_states = """  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDateWarning, setShowDateWarning] = useState(false);
  const [proceedAnyway, setProceedAnyway] = useState(false);"""

new_states = """  const [uploadingImage, setUploadingImage] = useState(false);"""

content = content.replace(old_states, new_states)

# Fix onClick handleSave
old_btn = """<button className={styles.btnSubmit} onClick={() => handleSave(true)} style={{ background: '#10b981' }}>"""
new_btn = """<button className={styles.btnSubmit} onClick={() => handleSave()} style={{ background: '#10b981' }}>"""
content = content.replace(old_btn, new_btn)

with open('src/components/Modals/LevantamientoFormModal.jsx', 'w') as f:
    f.write(content)
