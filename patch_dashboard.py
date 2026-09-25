import re

with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

# Add logic for cancelled projects
old_ai_logic = """    let pipelineStr = Object.entries(pipeline).map(([k, v]) => `${k}: ${v.count} ($${v.value})`).join(', ');

    const promptText = `Actúa como un Director de Operaciones (COO) y Analista Financiero. A continuación te presento los datos actuales extraídos de mi CRM (incluyendo finanzas, embudo de proyectos y atención al cliente)."""

new_ai_logic = """    let pipelineStr = Object.entries(pipeline).map(([k, v]) => `${k}: ${v.count} ($${v.value})`).join(', ');
    
    // Proyectos Cancelados este mes
    const canceladosEsteMes = proyectos.filter(p => {
      const isThisMonth = new Date(p.updated_at).getMonth() === currentMonth && new Date(p.updated_at).getFullYear() === currentYear;
      return p.estado === 'Cancelado' && isThisMonth;
    });
    const motivosCancelacion = canceladosEsteMes.map(p => `- ${p.titulo}: ${p.motivo_cancelacion || 'Sin motivo'}`).join('\\n');

    const promptText = `Actúa como un Director de Operaciones (COO) y Analista Financiero. A continuación te presento los datos actuales extraídos de mi CRM (incluyendo finanzas, embudo de proyectos y atención al cliente)."""

content = content.replace(old_ai_logic, new_ai_logic)

old_prompt_end = """Cuellos de Botella: Revisa mis 'Proyectos por Fase'. Identifica dónde se está acumulando el trabajo (el cuello de botella) y cuánto dinero estimado tengo atrapado en fases intermedias.
Plan de Acción de Ventas: Mi Tasa de Éxito y Churn actual. Dame 3 estrategias concretas e inmediatas que mi equipo de ventas y atención por WS debe aplicar esta semana para subir esa métrica.
Pronóstico: Basado en la velocidad actual y los proyectos activos, ¿cuál es mi escenario realista de cierre para este mes considerando la proyección de $${projection.toFixed(2)}?

Restricciones: Sé directo. Usa viñetas. No me des introducciones genéricas ni definiciones. Ve directamente a los hallazgos y a las acciones que debo tomar hoy.`;"""

new_prompt_end = """Cuellos de Botella: Revisa mis 'Proyectos por Fase'. Identifica dónde se está acumulando el trabajo (el cuello de botella) y cuánto dinero estimado tengo atrapado en fases intermedias.
Plan de Acción de Ventas: Mi Tasa de Éxito y Churn actual. Dame 3 estrategias concretas e inmediatas que mi equipo de ventas y atención por WS debe aplicar esta semana para subir esa métrica.
Análisis de Cancelaciones: Este mes se han cancelado ${canceladosEsteMes.length} proyectos. Motivos reportados:\\n${motivosCancelacion || 'Ninguno.'}\\nAnaliza los motivos y recomienda 2 acciones preventivas para evitar que se repitan.
Pronóstico: Basado en la velocidad actual y los proyectos activos, ¿cuál es mi escenario realista de cierre para este mes considerando la proyección de $${projection.toFixed(2)}?

Restricciones: Sé directo. Usa viñetas. No me des introducciones genéricas ni definiciones. Ve directamente a los hallazgos y a las acciones que debo tomar hoy.`;"""

content = content.replace(old_prompt_end, new_prompt_end)

with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)
