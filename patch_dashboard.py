import re

with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

# 1. Update the filter
old_filter = """    // Proyectos Cancelados este mes
    const canceladosEsteMes = proyectos.filter(p => {
      const isThisMonth = new Date(p.updated_at).getMonth() === currentMonth && new Date(p.updated_at).getFullYear() === currentYear;
      return ['Cancelado', 'Cancelado_Oculto'].includes(p.estado) && isThisMonth;
    });
    const motivosCancelacion = canceladosEsteMes.map(p => `- ${p.titulo}: ${p.motivo_cancelacion || 'Sin motivo'}`).join('\\n');"""

new_filter = """    // Proyectos Detenidos este mes (Cancelados, Archivados, Pausados)
    const detenidosEsteMes = proyectos.filter(p => {
      // Usar fecha_ultima_actualizacion en su lugar (updated_at no existe en la BD de supabase, antes usabamos updated_at por error)
      const d = new Date(p.fecha_ultima_actualizacion || p.fecha_creacion);
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const isDetenido = ['Cancelado', 'Cancelado_Oculto', 'Archivado'].includes(p.estado) || (p.estado && (p.estado.toLowerCase().includes('espera') || p.estado.toLowerCase().includes('pausa')));
      return isDetenido && isThisMonth;
    });
    const motivosDetencion = detenidosEsteMes.map(p => `- [${p.estado}] ${p.titulo}: ${p.motivo_cancelacion || 'Sin motivo'}`).join('\\n');"""

content = content.replace(old_filter, new_filter)

# 2. Update prompt
old_prompt = """Motivos de proyectos cancelados este mes:
${motivosCancelacion || 'Ningún proyecto cancelado este mes.'}

Por favor, en tu respuesta enfócate en dar recomendaciones prácticas basadas en estos datos para el próximo mes. Especialmente analiza los motivos de cancelación si los hay, para prevenir futuras fugas."""

new_prompt = """Motivos de proyectos detenidos (Cancelados, Archivados o Pausados) este mes:
${motivosDetencion || 'Ningún proyecto detenido este mes.'}

Por favor, en tu respuesta enfócate en dar recomendaciones prácticas basadas en estos datos para el próximo mes. Analiza detalladamente los motivos de los proyectos pausados, archivados o cancelados (si los hay) para dar sugerencias estratégicas y prevenir futuras fugas o retrasos."""

content = content.replace(old_prompt, new_prompt)

with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)
