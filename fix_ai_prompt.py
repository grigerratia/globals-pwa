with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

import re

old_prompt_vars = """    const motivosDetencion = detenidosEsteMes.map(p => `- [${p.estado}] ${p.titulo}: ${p.motivo_cancelacion || 'Sin motivo'}`).join('\\n');

    const promptText = `Actúa como un Director de Operaciones (COO) y Analista Financiero. A continuación te presento los datos actuales extraídos de mi CRM (incluyendo finanzas, embudo de proyectos y atención al cliente)."""

new_prompt_vars = """    const motivosDetencion = detenidosEsteMes.map(p => `- [${p.estado}] ${p.titulo}: ${p.motivo_cancelacion || 'Sin motivo'}`).join('\\n');
    const retrocesosInfo = proyectos.filter(p => p.notas?.includes('[RETROCESO]')).map(p => {
      const retrocesos = p.notas.split('\\n').filter(l => l.includes('[RETROCESO]')).join(' | ');
      return `- ${p.titulo}: ${retrocesos}`;
    }).join('\\n');

    const promptText = `Actúa como un Director de Operaciones (COO) y Analista Financiero. A continuación te presento los datos actuales extraídos de mi CRM (incluyendo finanzas, embudo de proyectos y atención al cliente)."""

content = content.replace(old_prompt_vars, new_prompt_vars)

old_prompt_section = """Análisis de Cancelaciones: Este mes se han cancelado ${canceladosEsteMes.length} proyectos. Motivos reportados:\\n${motivosCancelacion || 'Ninguno.'}\\nAnaliza los motivos y recomienda 2 acciones preventivas para evitar que se repitan."""

new_prompt_section = """Análisis de Cancelaciones y Detenciones: Este mes se han detenido o cancelado ${detenidosEsteMes.length} proyectos. Motivos reportados:\\n${motivosDetencion || 'Ninguno.'}\\nAdemás, estos proyectos sufrieron retrocesos en el tablero:\\n${retrocesosInfo || 'Ninguno.'}\\nAnaliza los motivos (tanto de detención como de retroceso) y recomienda 3 acciones preventivas para evitar cuellos de botella y que los proyectos retrocedan o se cancelen."""

content = content.replace(old_prompt_section, new_prompt_section)

with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)
