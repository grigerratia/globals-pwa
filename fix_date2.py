with open('src/components/Modals/LevantamientoFormModal.jsx', 'r') as f:
    content = f.read()

import re

old_handleSave = """  const handleSave = async (conFechaLevantamiento = true) => {
    const daysDiff = getDaysDiff(formData.fechaEntrega);
    if (daysDiff !== null && daysDiff < 5 && !proceedAnyway) {
      setShowDateWarning(true);
      setTimeout(() => {
        document.getElementById('date-warning-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    setShowDateWarning(false);
    
    let finalNotas = formData.descripcion;
    if (daysDiff !== null && daysDiff < 5 && proceedAnyway) {
       const hasUrgencia = finalNotas.includes('[URGENCIA APROBADA POR:');
       if (!hasUrgencia) {
           const userName = session?.user?.user_metadata?.nombre || session?.user?.user_metadata?.full_name || session?.user?.email || 'Usuario';
           finalNotas = `[URGENCIA APROBADA POR: ${userName}]\\n\\n` + finalNotas;
       }
    }

    const updateData = {
      cliente_empresa: formData.cliente,
      cliente_nombre: formData.contacto,
      cliente_telefono: formData.telefono,
      notas: finalNotas,
    };"""

new_handleSave = """  const handleSave = async (conFechaLevantamiento = true) => {
    if (!formData.responsableGlobals || !formData.responsableMedidas || !formData.fechaEntrega) {
      showError('Por favor completa Responsables y Fecha de Entrega.');
      return;
    }

    const daysDiff = getDaysDiff(formData.fechaEntrega);
    if (daysDiff !== null && daysDiff < 6) {
      showError('No se permiten proyectos con un plazo menor a 6 días. Por favor, selecciona una fecha más lejana.');
      return;
    }
    
    let finalNotas = formData.descripcion;

    const updateData = {
      cliente_empresa: formData.cliente,
      cliente_nombre: formData.contacto,
      cliente_telefono: formData.telefono,
      notas: finalNotas,
    };"""

content = content.replace(old_handleSave, new_handleSave)

# We also need to remove proceedAnyway from dependencies or anywhere else if it exists
content = re.sub(r'proceedAnyway,?\s*', '', content)

with open('src/components/Modals/LevantamientoFormModal.jsx', 'w') as f:
    f.write(content)
