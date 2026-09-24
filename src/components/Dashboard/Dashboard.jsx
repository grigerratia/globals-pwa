import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ArrowLeft, TrendingUp, DollarSign, Activity, AlertCircle, Sparkles, Copy, ExternalLink, Briefcase, Clock, Users, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';
import ReactMarkdown from 'react-markdown';
import styles from './Dashboard.module.scss';

export default function Dashboard({ session }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('finanzas');
  const [aiResponse, setAiResponse] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('proyectos').select('*');
    if (!error && data) {
      setProyectos(data);
    }
    setLoading(false);
  };

  // KPI Calculations & MoM/YoY
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

  const calcSums = (arr) => {
    const p = arr.reduce((acc, x) => acc + (x.presupuesto_vendido || 0), 0);
    const c = arr.reduce((acc, x) => acc + (x.costo_materiales || 0) + (x.costo_operativo || 0), 0);
    return { p, g: p - c };
  };

  const total = calcSums(proyectos);
  const cm = calcSums(currentMonthProjects);
  const pm = calcSums(prevMonthProjects);
  const cy = calcSums(currentYearProjects);
  const py = calcSums(prevYearProjects);

  const calcDiff = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const revMoM = calcDiff(cm.p, pm.p);
  const revYoY = calcDiff(cy.p, py.p);
  
  const profitMoM = calcDiff(cm.g, pm.g);
  const profitYoY = calcDiff(cy.g, py.g);

  const totalProyectos = proyectos.length;
  const totalMoM = calcDiff(currentMonthProjects.length, prevMonthProjects.length);
  const totalYoY = calcDiff(currentYearProjects.length, prevYearProjects.length);

  const getExito = (arr) => {
    if (arr.length === 0) return 0;
    return (arr.filter(p => p.estado === 'Entregado y cerrado').length / arr.length) * 100;
  };
  const exitoCurrent = getExito(proyectos);
  const exitoMoM = calcDiff(getExito(currentMonthProjects), getExito(prevMonthProjects));

  // Nuevas Métricas
  const proyectosConPresupuesto = proyectos.filter(p => p.presupuesto_vendido > 0).length;
  const ticketPromedio = proyectosConPresupuesto > 0 ? total.p / proyectosConPresupuesto : 0;
  const tasaAbandono = proyectos.length > 0 ? (proyectos.filter(p => p.estado === 'Cancelado').length / proyectos.length) * 100 : 0;
  
  // Proyección Fin de Mes
  const daysPassed = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const projection = daysPassed > 0 ? (cm.p / daysPassed) * daysInMonth : 0;

  // Pipeline (Proyectos por fase con su valor)
  const pipeline = proyectos.reduce((acc, p) => {
    if (!acc[p.estado]) acc[p.estado] = { count: 0, value: 0 };
    acc[p.estado].count += 1;
    acc[p.estado].value += (p.presupuesto_vendido || 0);
    return acc;
  }, {});
  const estancados = proyectos.filter(p => {
    if (['Entregado y cerrado', 'Cancelado'].includes(p.estado)) return false;
    const diffDays = Math.ceil(Math.abs(now - new Date(p.fecha_ultima_actualizacion)) / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  });

  // Datos Gráfico de Líneas (Últimos 6 meses)
  const lineData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthProjs = proyectos.filter(p => {
      const pD = getMonthAndYear(p.fecha_creacion || p.created_at);
      return pD.m === m && pD.y === y;
    });
    const stats = calcSums(monthProjs);
    lineData.push({
      name: d.toLocaleString('es-ES', { month: 'short' }),
      Ingresos: stats.p,
      Ganancia: stats.g
    });
  }

  // Datos Gráfico de Embudo (Funnel)
  const funnelOrder = [
    { key: 'Nuevo', name: 'Contacto Inicial' },
    { key: 'Levantamiento', name: 'Levantamiento' },
    { key: 'Presupuesto enviado', name: 'Presupuesto' },
    { key: 'En Conversación', name: 'Negociación' },
    { key: 'En Diseño', name: 'Aprobados (Diseño/Fab/Inst)' },
    { key: 'Entregado y cerrado', name: 'Cerrados' }
  ];
  
  const getFunnelValue = (keys) => {
    return proyectos.filter(p => keys.includes(p.estado)).length;
  };
  
  const funnelData = [
    { name: 'Contacto Inicial', value: getFunnelValue(['Nuevo', 'Contactado']), fill: '#3b82f6' },
    { name: 'Levantamiento', value: getFunnelValue(['Levantamiento']), fill: '#8b5cf6' },
    { name: 'Presupuesto', value: getFunnelValue(['Presupuesto enviado', 'Cotizando']), fill: '#ec4899' },
    { name: 'Negociación', value: getFunnelValue(['En Conversación']), fill: '#f59e0b' },
    { name: 'Aprobados (En Proceso)', value: getFunnelValue(['En Diseño', 'En fabricación', 'En Instalación']), fill: '#10b981' },
    { name: 'Cerrados (Éxito)', value: getFunnelValue(['Entregado y cerrado']), fill: '#14b8a6' }
  ].filter(f => f.value > 0);

    const handleGeminiPro = async () => {
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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(promptText);
      setAiResponse(result.response.text());
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiResponse('Ocurrió un error al generar el reporte. Por favor, asegúrate de que VITE_GEMINI_API_KEY está configurado y es válido.');
    } finally {
      setIsLoadingAi(false);
    }
  };
  if (loading) return <div style={{ display:'flex', justifyContent:'center', marginTop:'3rem' }}>Cargando estadísticas...</div>;

  const Trend = ({ val }) => (
    <span className={val > 0 ? styles.positive : val < 0 ? styles.negative : styles.neutral}>
      {val > 0 ? '▲ +' : val < 0 ? '▼ ' : '■ '} {Math.abs(val).toFixed(1)}%
    </span>
  );

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => window.location.href = '/'}>
          <ArrowLeft size={20} /> Volver al Tablero
        </button>
        <h1>Panel Estadístico (Líder Comercial)</h1>
      </header>

      <div className={styles.aiCard}>
        <div className={styles.aiHeader}>
          <Sparkles size={20} className={styles.aiIcon} /> 
          <h2>Asesoría Avanzada con Gemini (COO & Analista Financiero)</h2>
        </div>
        <div className={styles.aiBody}>
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
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'finanzas' ? styles.activeTab : ''}`} onClick={() => setActiveTab('finanzas')}>Finanzas</button>
        <button className={`${styles.tab} ${activeTab === 'operaciones' ? styles.activeTab : ''}`} onClick={() => setActiveTab('operaciones')}>Operaciones / Pipeline</button>
        <button className={`${styles.tab} ${activeTab === 'atencion' ? styles.activeTab : ''}`} onClick={() => setActiveTab('atencion')}>Atención y CRM</button>
      </div>

      {activeTab === 'finanzas' && (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#dcfce7', color: '#16a34a' }}><DollarSign size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Presupuesto Cerrado</span>
                <span className={styles.kpiValue}>${total.p.toLocaleString()}</span>
                <div className={styles.kpiTrend}>
                  <span>MoM: <Trend val={revMoM} /></span>
                  <span>YoY: <Trend val={revYoY} /></span>
                </div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}><TrendingUp size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Ganancia Neta (Est.)</span>
                <span className={styles.kpiValue}>${total.g.toLocaleString()}</span>
                <div className={styles.kpiTrend}>
                  <span>MoM: <Trend val={profitMoM} /></span>
                  <span>YoY: <Trend val={profitYoY} /></span>
                </div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#ede9fe', color: '#8b5cf6' }}><Briefcase size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Proyección Fin de Mes</span>
                <span className={styles.kpiValue}>${projection.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                <div className={styles.kpiTrend}>
                  <span className={styles.neutral}>Velocidad actual mensual</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3>Ingresos vs Ganancia Neta (Últimos 6 Meses)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Ingresos" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Ganancia" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'operaciones' && (
        <>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#dbeafe', color: '#2563eb' }}><Activity size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Total Proyectos</span>
                <span className={styles.kpiValue}>{totalProyectos}</span>
                <div className={styles.kpiTrend}>
                  <span>MoM: <Trend val={totalMoM} /></span>
                  <span>YoY: <Trend val={totalYoY} /></span>
                </div>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: '#fee2e2', color: '#ef4444' }}><AlertCircle size={24} /></div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>Proyectos Estancados</span>
                <span className={styles.kpiValue}>{estancados.length}</span>
                <div className={styles.kpiTrend}>
                  <span className={styles.negative}>Inactivos +3 días</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3>Valor del Pipeline (Proyectos por Fase)</h3>
              <div className={styles.barList}>
                {Object.entries(pipeline).sort((a,b) => b[1].count - a[1].count).map(([estado, data]) => (
                  <div key={estado} className={styles.barItem}>
                    <div className={styles.barLabel}>
                      <span>{estado} <span style={{color: '#94a3b8'}}>({data.count})</span></span>
                      <span className={styles.barMoney}>${data.value.toLocaleString()}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${(data.count / proyectos.length) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.chartCard}>
              <h3>Embudo de Conversión (Leads)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <RechartsTooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'atencion' && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: '#e0f2fe', color: '#0ea5e9' }}><Target size={24} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Ticket Promedio</span>
              <span className={styles.kpiValue}>${ticketPromedio.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              <div className={styles.kpiTrend}>
                <span className={styles.neutral}>Por proyecto cobrado</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: '#ecfdf5', color: '#10b981' }}><Clock size={24} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>T. Respuesta WS</span>
              <span className={styles.kpiValue}>15 mins</span>
              <div className={styles.kpiTrend}>
                <span className={styles.neutral}>(Estimado / Bot)</span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: '#ffedd5', color: '#f97316' }}><Activity size={24} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Tasa de Éxito</span>
              <span className={styles.kpiValue}>{exitoCurrent.toFixed(1)}%</span>
              <div className={styles.kpiTrend}>
                <span>MoM: <Trend val={exitoMoM} /></span>
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: '#fce7f3', color: '#ec4899' }}><Users size={24} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Tasa de Abandono (Churn)</span>
              <span className={styles.kpiValue}>{tasaAbandono.toFixed(1)}%</span>
              <div className={styles.kpiTrend}>
                <span className={styles.neutral}>Proyectos cancelados</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
