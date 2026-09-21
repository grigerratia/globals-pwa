import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ArrowLeft, TrendingUp, DollarSign, Activity, AlertCircle, Sparkles, Copy, ExternalLink } from 'lucide-react';
import styles from './Dashboard.module.scss';

export default function Dashboard({ session }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleGeminiPro = () => {
    const presupuestos = proyectos.reduce((acc, p) => acc + (p.presupuesto_vendido || 0), 0);
    const costos = proyectos.reduce((acc, p) => acc + (p.costo_materiales || 0) + (p.costo_operativo || 0), 0);
    const ganancia = presupuestos - costos;
    
    const estadosCount = proyectos.reduce((acc, p) => {
      acc[p.estado] = (acc[p.estado] || 0) + 1;
      return acc;
    }, {});
    
    const hoy = new Date();
    const estancados = proyectos.filter(p => {
      if (['Entregado y cerrado', 'Cancelado'].includes(p.estado)) return false;
      const fUltima = new Date(p.fecha_ultima_actualizacion);
      const diffTime = Math.abs(hoy - fUltima);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 3;
    });

    const promptText = `Eres un asesor de negocios experto en agencias de publicidad. Analiza las siguientes estadísticas de Global's y proporciona un resumen ejecutivo (3-4 párrafos cortos). Felicita por lo bueno, alerta sobre lo malo (ej. proyectos estancados, baja rentabilidad si la hay), y dale una recomendación clave al líder comercial sobre en qué enfocarse hoy para cerrar más ventas y mantener el flujo. Usa un tono motivador, directo y profesional.

Estadísticas actuales:
- Total proyectos: ${proyectos.length}
- Presupuesto Total Vendido: $${presupuestos}
- Costos Totales: $${costos}
- Ganancia Estimada (Rentabilidad): $${ganancia}
- Proyectos por estado: ${JSON.stringify(estadosCount)}
- Proyectos estancados (>3 días sin cambios): ${estancados.length}`;

    navigator.clipboard.writeText(promptText)
      .then(() => {
        alert("¡Datos copiados al portapapeles! Se abrirá Gemini Pro. Solo pega (Ctrl+V) el mensaje para obtener tu análisis sin costo.");
        window.open('https://gemini.google.com/app', '_blank');
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        alert("No se pudo copiar al portapapeles automáticamente. Intenta de nuevo.");
      });
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
          <h2>Asesoría con Gemini Advanced (Cero Costo)</h2>
        </div>
        <div className={styles.aiBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
          <p style={{ margin: 0 }}>Usa tu suscripción personal de Gemini Advanced para analizar las estadísticas de la agencia sin gastar tokens de la API.</p>
          <button 
            onClick={handleGeminiPro} 
            style={{ 
              background: 'white', color: '#3b82f6', border: 'none', padding: '0.75rem 1.5rem', 
              borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' 
            }}
          >
            <Copy size={18} /> Copiar Datos y Abrir Gemini <ExternalLink size={18} />
          </button>
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
