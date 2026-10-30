import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ArrowLeft, Activity, Wrench, CheckCircle, Briefcase, AlertCircle, Sparkles, Clock, Layers } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import ReactMarkdown from 'react-markdown';
import styles from './Dashboard.module.scss';

const Trend = ({ val }) => (
  <span className={val > 0 ? styles.positive : val < 0 ? styles.negative : styles.neutral}>
    {val > 0 ? '▲ +' : val < 0 ? '▼ ' : '■ '} {Math.abs(val).toFixed(1)}%
  </span>
);

export default function Dashboard() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('produccion');
  const [aiResponse, setAiResponse] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const fetchData = async () => {
    const { data, error } = await supabase.from('proyectos').select('*');
    if (!error && data) {
      setProyectos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fechas y cálculos temporales MoM/YoY
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevYear = currentYear - 1;

  const getMonthAndYear = (dateStr) => {
    const d = new Date(dateStr);
    return { m: d.getMonth(), y: d.getFullYear() };
  };

  const currentMonthProjects = proyectos.filter(p => {
    const d = getMonthAndYear(p.fecha_creacion || p.created_at);
    return d.m === currentMonth && d.y === currentYear;
  });

  const prevMonthProjects = proyectos.filter(p => {
    const d = getMonthAndYear(p.fecha_creacion || p.created_at);
    return d.m === prevMonth && d.y === prevMonthYear;
  });

  const currentYearProjects = proyectos.filter(p => getMonthAndYear(p.fecha_creacion || p.created_at).y === currentYear);
  const prevYearProjects = proyectos.filter(p => getMonthAndYear(p.fecha_creacion || p.created_at).y === prevYear);

  const calcDiff = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  // Métricas Operativas y de Producción
  const totalProyectos = proyectos.length;
  const totalMoM = calcDiff(currentMonthProjects.length, prevMonthProjects.length);
  const totalYoY = calcDiff(currentYearProjects.length, prevYearProjects.length);

  const activos = proyectos.filter(p => !['Entregado y cerrado', 'Pagado y cerrado', 'Cancelado', 'Cancelado_Oculto', 'Archivado'].includes(p.estado));
  const completados = proyectos.filter(p => p.estado === 'Entregado y cerrado' || p.estado === 'Pagado y cerrado');

  const produccionFases = ['Logística y compras', 'En fabricación', 'Listo para instalación', 'En instalación'];
  const enProduccion = activos.filter(p => produccionFases.includes(p.estado));

  const disenoFases = ['Levantamiento', 'En Conversación', 'En Diseño', 'En diseño'];
  const enDiseno = activos.filter(p => disenoFases.includes(p.estado));

  const estancados = activos.filter(p => {
    if (p.estado?.includes('Pausa')) return true;
    if (!p.fecha_ultima_actualizacion) return false;
    const diffDays = Math.ceil(Math.abs(now - new Date(p.fecha_ultima_actualizacion)) / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  });

  const tasaExito = totalProyectos > 0 ? (completados.length / totalProyectos) * 100 : 0;
  const tasaCancelacion = totalProyectos > 0 ? (proyectos.filter(p => ['Cancelado', 'Cancelado_Oculto'].includes(p.estado)).length / totalProyectos) * 100 : 0;

  // Conteo por fase (Pipeline de Carga de Trabajo)
  const pipeline = proyectos.reduce((acc, p) => {
    const estado = p.estado || 'Sin estado';
    if (!acc[estado]) acc[estado] = { count: 0 };
    acc[estado].count += 1;
    return acc;
  }, {});

  // Datos Gráfico de Líneas Operativo (Últimos 6 meses: Creados vs Culminados)
  const lineData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const nuevosCount = proyectos.filter(p => {
      const pD = getMonthAndYear(p.fecha_creacion || p.created_at);
      return pD.m === m && pD.y === y;
    }).length;
    const cerradosCount = proyectos.filter(p => {
      if (p.estado !== 'Entregado y cerrado' && p.estado !== 'Pagado y cerrado') return false;
      const pD = getMonthAndYear(p.fecha_ultima_actualizacion || p.fecha_creacion);
      return pD.m === m && pD.y === y;
    }).length;
    lineData.push({
      name: d.toLocaleString('es-ES', { month: 'short' }),
      'Proyectos Creados': nuevosCount,
      'Proyectos Culminados': cerradosCount
    });
  }

  // Embudo de Flujo de Trabajo (Funnel Operativo)
  const getFunnelValue = (keys) => {
    return proyectos.filter(p => keys.includes(p.estado)).length;
  };

  const funnelData = [
    { name: '1. Contacto / Requerimiento', value: getFunnelValue(['Nuevo', 'Contactado', 'En Conversación']), fill: '#3b82f6' },
    { name: '2. Levantamiento', value: getFunnelValue(['Levantamiento']), fill: '#6366f1' },
    { name: '3. En Diseño', value: getFunnelValue(['En Diseño', 'En diseño']), fill: '#8b5cf6' },
    { name: '4. Logística y Compras', value: getFunnelValue(['Logística y compras']), fill: '#ec4899' },
    { name: '5. Fabricación en Taller', value: getFunnelValue(['En fabricación']), fill: '#f59e0b' },
    { name: '6. Instalación', value: getFunnelValue(['Listo para instalación', 'En instalación']), fill: '#10b981' },
    { name: '7. Entregado y Cerrado', value: getFunnelValue(['Entregado y cerrado', 'Pagado y cerrado']), fill: '#14b8a6' }
  ].filter(f => f.value > 0);

  // Proyectos Detenidos este mes
  const detenidosEsteMes = proyectos.filter(p => {
    const d = new Date(p.fecha_ultima_actualizacion || p.fecha_creacion);
    const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    const isDetenido = ['Cancelado', 'Cancelado_Oculto', 'Archivado'].includes(p.estado) || (p.estado && (p.estado.toLowerCase().includes('espera') || p.estado.toLowerCase().includes('pausa')));
    return isDetenido && isThisMonth;
  });
  const motivosDetencion = detenidosEsteMes.map(p => `- [${p.estado}] ${p.titulo}: ${p.motivo_cancelacion || 'Sin motivo especificado'}`).join('\n');
  const retrocesosInfo = proyectos.filter(p => p.notas?.includes('[RETROCESO]')).map(p => {
    const retrocesos = p.notas.split('\n').filter(l => l.includes('[RETROCESO]')).join(' | ');
    return `- ${p.titulo}: ${retrocesos}`;
  }).join('\n');

  const handleGeminiPro = async () => {
    setIsLoadingAi(true);
    const pipelineStr = Object.entries(pipeline).map(([k, v]) => `${k}: ${v.count} proyectos`).join(', ');

    const promptText = `Actúa como un Director de Operaciones (COO) y Jefe de Producción de una empresa de publicidad exterior e interior. A continuación te presento los datos operativos y de flujo de trabajo extraídos del sistema:

Total de Proyectos Históricos: ${totalProyectos}
Proyectos Activos en Curso: ${activos.length}
Proyectos en Fase de Producción (Taller / Logística / Instalación): ${enProduccion.length}
Proyectos en Levantamiento y Diseño: ${enDiseno.length}
Proyectos Completados con Éxito: ${completados.length} (${tasaExito.toFixed(1)}% tasa de culminación)
Proyectos Estancados (>3 días inactivos o en pausa): ${estancados.length}
Tasa de Cancelación / Deserción: ${tasaCancelacion.toFixed(1)}%

Distribución de Carga de Trabajo por Fase:
${pipelineStr}

Detenciones y Cancelaciones este mes (${detenidosEsteMes.length}):
${motivosDetencion || 'Ninguno reportado.'}

Retrocesos en el tablero:
${retrocesosInfo || 'Ninguno reportado.'}

Tu tarea es entregar un reporte operativo y de producción enfocado en estos 4 puntos clave:
1. Cuellos de Botella en Taller e Instalación: Identifica en qué fases se está acumulando el trabajo y dónde corren riesgo los plazos de entrega.
2. Flujo de Trabajo y Eficiencia: Evalúa el ritmo de entrada de proyectos vs culminación. ¿Cómo agilizar el paso de diseño a taller y de taller a instalación?
3. Prevención de Retenciones y Retrocesos: Analiza las causas de los proyectos estancados o con retrocesos y recomienda 3 acciones preventivas para los encargados de producción e instalación.
4. Plan de Acción Semanal: 3 prioridades operativas concretas que el equipo debe ejecutar esta semana para acelerar la entrega de proyectos sin comprometer la calidad.

Restricciones: Sé directo, estructurado en viñetas y profesional. No incluyas precios, presupuestos ni datos comerciales. Enfócate exclusivamente en operaciones, logística, producción y calidad.`;

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const fallbackModels = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3-flash-preview"];
      let success = false;
      let lastError = null;

      for (const modelName of fallbackModels) {
        try {
          const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(promptText);
          setAiResponse(`(Generado con: ${modelName})\n\n` + result.response.text());
          success = true;
          break;
        } catch (err) {
          console.warn(`Error con ${modelName}:`, err);
          lastError = err;
        }
      }

      if (!success) {
        console.error('Error generating AI response with all models:', lastError);
        setAiResponse(`Ocurrió un error (incluso tras probar modelos de respaldo): ${lastError?.message}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiResponse(`Ocurrió un error: ${error.message}`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', marginTop:'3rem' }}>Cargando estadísticas operativas...</div>;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => window.location.href = '/'}>
          <ArrowLeft size={20} /> Volver al Tablero
        </button>
        <h1>Panel de Control Operativo y Producción</h1>
      </header>

      <div className={styles.aiCard}>
        <div className={styles.aiHeader}>
          <Sparkles size={20} className={styles.aiIcon} /> 
          <h2>Asesoría Operativa con Gemini (COO & Producción)</h2>
        </div>
        <div className={styles.aiBody}>
          {!aiResponse && !isLoadingAi && (
            <>
              <p style={{ margin: 0 }}>Analiza los indicadores de producción, descubre cuellos de botella en el taller o instalación y genera recomendaciones operativas accionables.</p>
              <button onClick={handleGeminiPro} className={styles.geminiBtn}>
                <Sparkles size={18} /> Generar Reporte Operativo Inline
              </button>
            </>
          )}
          {isLoadingAi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1' }}>
              <Sparkles size={18} className={styles.pulse} /> Generando análisis operativo...
            </div>
          )}
          {aiResponse && (
            <div className={styles.aiResultWrapper}>
              <ReactMarkdown>{aiResponse}</ReactMarkdown>
              <button onClick={() => setAiResponse(null)} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                Cerrar Reporte
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'produccion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('produccion')}>
          Producción y Taller
        </button>
        <button className={`${styles.tab} ${activeTab === 'flujo' ? styles.activeTab : ''}`} onClick={() => setActiveTab('flujo')}>
          Flujo de Trabajo y Embudo
        </button>
        <button className={`${styles.tab} ${activeTab === 'incidencias' ? styles.activeTab : ''}`} onClick={() => setActiveTab('incidencias')}>
          Control de Retenciones e Incidencias
        </button>
      </div>

      {activeTab === 'produccion' && (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#dbeafe', color: '#2563eb' }}><Wrench size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>En Producción Activa</span>
                <span className={styles.kpiValue}>{enProduccion.length}</span>
                <div className={styles.kpiTrend}>
                  <span className={styles.neutral}>Taller, fabricación e instalación</span>
                </div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#ede9fe', color: '#8b5cf6' }}><Layers size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>En Diseño y Preparación</span>
                <span className={styles.kpiValue}>{enDiseno.length}</span>
                <div className={styles.kpiTrend}>
                  <span className={styles.neutral}>Levantamiento y arte gráfico</span>
                </div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#dcfce7', color: '#16a34a' }}><CheckCircle size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Proyectos Culminados</span>
                <span className={styles.kpiValue}>{completados.length}</span>
                <div className={styles.kpiTrend}>
                  <span className={styles.positive}>{tasaExito.toFixed(1)}% tasa de culminación</span>
                </div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#fee2e2', color: '#ef4444' }}><AlertCircle size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Proyectos Estancados</span>
                <span className={styles.kpiValue}>{estancados.length}</span>
                <div className={styles.kpiTrend}>
                  <span className={styles.negative}>Inactivos +3 días o en pausa</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3>Flujo Operativo: Proyectos Creados vs Culminados (Últimos 6 Meses)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Proyectos Creados" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Proyectos Culminados" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <h3>Carga de Trabajo por Fase (Pipeline Operativo)</h3>
              <div className={styles.barList}>
                {Object.entries(pipeline).sort((a,b) => b[1].count - a[1].count).map(([estado, data]) => {
                  const pct = totalProyectos > 0 ? Math.round((data.count / totalProyectos) * 100) : 0;
                  return (
                    <div key={estado} className={styles.barItem}>
                      <div className={styles.barLabel}>
                        <span>{estado}</span>
                        <span style={{ fontWeight: 700, color: '#334155' }}>{data.count} ({pct}%)</span>
                      </div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'flujo' && (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#dbeafe', color: '#2563eb' }}><Activity size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Total Proyectos Históricos</span>
                <span className={styles.kpiValue}>{totalProyectos}</span>
                <div className={styles.kpiTrend}>
                  <span>MoM: <Trend val={totalMoM} /></span>
                  <span>YoY: <Trend val={totalYoY} /></span>
                </div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}><Briefcase size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Proyectos en Curso</span>
                <span className={styles.kpiValue}>{activos.length}</span>
                <div className={styles.kpiTrend}>
                  <span className={styles.neutral}>Flujo activo en tablero</span>
                </div>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#ecfdf5', color: '#10b981' }}><Clock size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Tasa de Culminación</span>
                <span className={styles.kpiValue}>{tasaExito.toFixed(1)}%</span>
                <div className={styles.kpiTrend}>
                  <span className={styles.positive}>{completados.length} cerrados</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
              <h3>Embudo de Avance de Proyectos (Funnel Operativo)</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                Visualización de volumen de proyectos a través de las etapas del proceso publicitario.
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <FunnelChart>
                  <RechartsTooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="right" fill="#1e293b" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'incidencias' && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: '#fee2e2', color: '#ef4444' }}><AlertCircle size={24} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Proyectos Estancados</span>
              <span className={styles.kpiValue}>{estancados.length}</span>
              <div className={styles.kpiTrend}>
                <span className={styles.negative}>Inactivos por &gt; 3 días</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: '#fff1f2', color: '#f43f5e' }}><AlertCircle size={24} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Tasa de Cancelación</span>
              <span className={styles.kpiValue}>{tasaCancelacion.toFixed(1)}%</span>
              <div className={styles.kpiTrend}>
                <span className={styles.neutral}>Proyectos cancelados</span>
              </div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}><Clock size={24} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Detenidos Este Mes</span>
              <span className={styles.kpiValue}>{detenidosEsteMes.length}</span>
              <div className={styles.kpiTrend}>
                <span className={styles.neutral}>Cancelados o pausados</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
