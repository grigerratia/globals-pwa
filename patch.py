import re

with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

# Replace states
content = re.sub(
    r"const \[activeTab, setActiveTab\] = useState\('finanzas'\);",
    "const [activeTab, setActiveTab] = useState('finanzas');\n  const [aiResponse, setAiResponse] = useState(null);\n  const [isLoadingAi, setIsLoadingAi] = useState(false);",
    content
)

# Replace handleGeminiPro
old_func_pattern = r"const handleGeminiPro = \(\) => \{.*?^\s*\}\s*;\s*\n"
new_func = """  const handleGeminiPro = async () => {
    setIsLoadingAi(true);
    let pipelineStr = Object.entries(pipeline).map(([k, v]) => `${k}: ${v.count} ($${v.value})`).join(', ');

    const promptText = `Actúa como un Director de Operaciones (COO) y Analista Financiero. A continuación te presento los datos actuales extraídos de mi CRM (incluyendo finanzas, embudo de proyectos y atención al cliente).

Presupuesto Cerrado Total: $${total.p} (MoM: ${revMoM > 0 ? '+' : ''}${revMoM.toFixed(1)}%)
Ganancia Neta Total: $${total.g} (Margen: ${total.p > 0 ? Math.round((total.g/total.p)*100) : 0}%)
Tasa de Éxito: ${exitoCurrent.toFixed(1)}% (MoM: ${exitoMoM > 0 ? '+' : ''}${exitoMoM.toFixed(1)}%)
Ticket Promedio: $${ticketPromedio.toFixed(2)}
Proyección de Ingresos a fin de mes: $${projection.toFixed(2)}
Tasa de Abandono (Churn): ${tasaAbandono.toFixed(1)}%

Distribución y Valor del Pipeline:
${pipelineStr}
Proyectos estancados (>3 días): ${estancados.length}

Tu tarea es entregar un reporte ejecutivo respondiendo a estos 4 puntos clave:

Diagnóstico Financiero: Analiza el margen de ganancia neta sobre el presupuesto cerrado. ¿Es saludable para una agencia/empresa de servicios?
Cuellos de Botella: Revisa mis 'Proyectos por Fase'. Identifica dónde se está acumulando el trabajo (el cuello de botella) y cuánto dinero estimado tengo atrapado en fases intermedias.
Plan de Acción de Ventas: Mi Tasa de Éxito y Churn actual. Dame 3 estrategias concretas e inmediatas que mi equipo de ventas y atención por WS debe aplicar esta semana para subir esa métrica.
Pronóstico: Basado en la velocidad actual y los proyectos activos, ¿cuál es mi escenario realista de cierre para este mes considerando la proyección de $${projection.toFixed(2)}?

Restricciones: Sé directo. Usa viñetas. No me des introducciones genéricas ni definiciones. Ve directamente a los hallazgos y a las acciones que debo tomar hoy.`;

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(promptText);
      setAiResponse(result.response.text());
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiResponse('Ocurrió un error al generar el reporte. Por favor, asegúrate de que VITE_GEMINI_API_KEY está configurado y es válido.');
    } finally {
      setIsLoadingAi(false);
    }
  };
"""

content = re.sub(old_func_pattern, new_func, content, flags=re.DOTALL | re.MULTILINE)

# Replace AI render block
old_render_block = r"<div className=\{styles\.aiBody\}>.*?<\/div>"

new_render_block = """<div className={styles.aiBody}>
          {!aiResponse && !isLoadingAi && (
            <>
              <p style={{ margin: 0 }}>Analiza los indicadores financieros, descubre cuellos de botella en la operación y genera estrategias de venta accionables usando Gemini Advanced.</p>
              <button onClick={handleGeminiPro} className={styles.geminiBtn}>
                <Sparkles size={18} /> Generar Reporte Ejecutivo Inline
              </button>
            </>
          )}
          {isLoadingAi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1' }}>
              <Sparkles size={18} className={styles.pulse} /> Generando análisis estratégico...
            </div>
          )}
          {aiResponse && (
            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ReactMarkdown>{aiResponse}</ReactMarkdown>
              <button onClick={() => setAiResponse(null)} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                Cerrar Reporte
              </button>
            </div>
          )}
        </div>"""

content = re.sub(old_render_block, new_render_block, content, count=1, flags=re.DOTALL)

with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)
