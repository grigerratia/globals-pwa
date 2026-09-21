import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ArrowLeft, TrendingUp, DollarSign, Activity, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import styles from './Dashboard.module.scss';

export default function Dashboard({ session }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase.from('proyectos').select('*');
    if (!error && data) {
      setProyectos(data);
      generateAiInsight(data);
    }
    setLoading(false);
  };

  const generateAiInsight = async (data) => {
    setLoadingAi(true);
    
    const presupuestos = data.reduce((acc, p) => acc + (p.presupuesto_vendido || 0), 0);
    const costos = data.reduce((acc, p) => acc + (p.costo_materiales || 0) + (p.costo_operativo || 0), 0);
    const ganancia = presupuestos - costos;
    
    const estadosCount = data.reduce((acc, p) => {
      acc[p.estado] = (acc[p.estado] || 0) + 1;
      return acc;
    }, {});
    
    const hoy = new Date();
    const estancados = data.filter(p => {
      if (['Entregado y cerrado', 'Cancelado'].includes(p.estado)) return false;
      const fUltima = new Date(p.fecha_ultima_actualizacion);
      const diffTime = Math.abs(hoy - fUltima);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 3;
    });

    const statsText = `
      Total proyectos: ${data.length}
      Presupuesto Total: $${presupuestos}
      Costos Totales: $${costos}
      Ganancia Estimada: $${ganancia}
      Proyectos por estado: ${JSON.stringify(estadosCount)}
      Proyectos estancados (>3 días sin cambios): ${estancados.length}
    `;

    const systemInstruction = `Eres un asesor de negocios experto en agencias de publicidad. Analiza las siguientes estadísticas de Global's y proporciona un resumen ejecutivo (3-4 párrafos cortos). Felicita por lo bueno, alerta sobre lo malo (ej. proyectos estancados, baja rentabilidad si la hay), y dale una recomendación clave al líder comercial sobre en qué enfocarse hoy para cerrar más ventas y mantener el flujo. Usa un tono motivador, directo y profesional.`;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setAiInsight("No se configuró la API de Gemini para generar insights.");
      setLoadingAi(false);
      return;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: statsText }] }]
        })
      });
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error.message);
      setAiInsight(resData.candidates[0].content.parts[0].text);
    } catch (err) {
      console.error(err);
      setAiInsight("Error al conectar con la IA.");
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', marginTop:'3rem' }}>Cargando estadísticas...</div>;

  const presupuestos = proyectos.reduce((acc, p) => acc + (p.presupuesto_vendido || 0), 0);
  const costos = proyectos.reduce((acc, p) => acc + (p.costo_materiales || 0) + (p.costo_operativo || 0), 0);
  const ganancia = presupuestos - costos;
  
  const entregados = proyectos.filter(p => p.estado === 'Entregado y cerrado').length;
  
  const estadosCount = proyectos.reduce((acc, p) => {
    acc[p.estado] = (acc[p.estado] || 0) + 1;
    return acc;
  }, {});

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
          <h2>Análisis Estratégico AI</h2>
        </div>
        <div className={styles.aiBody}>
          {loadingAi ? (
            <div className={styles.loadingAi}>Generando análisis profundo de tus métricas... <span className={styles.spinner}></span></div>
          ) : (
            <div style={{ whiteSpace: 'pre-line' }}>{aiInsight}</div>
          )}
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#dbeafe', color: '#2563eb' }}><Activity size={24} /></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Proyectos</span>
            <span className={styles.kpiValue}>{proyectos.length}</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#dcfce7', color: '#16a34a' }}><DollarSign size={24} /></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Presupuesto Cerrado</span>
            <span className={styles.kpiValue}>${presupuestos.toLocaleString()}</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}><TrendingUp size={24} /></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Ganancia Neta (Est.)</span>
            <span className={styles.kpiValue}>${ganancia.toLocaleString()}</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: '#fee2e2', color: '#ef4444' }}><AlertCircle size={24} /></div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Tasa de Éxito</span>
            <span className={styles.kpiValue}>{proyectos.length > 0 ? Math.round((entregados / proyectos.length) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Proyectos por Fase</h3>
          <div className={styles.barList}>
            {Object.entries(estadosCount).sort((a,b) => b[1] - a[1]).map(([estado, count]) => (
              <div key={estado} className={styles.barItem}>
                <div className={styles.barLabel}>
                  <span>{estado}</span>
                  <span>{count}</span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${(count / proyectos.length) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
