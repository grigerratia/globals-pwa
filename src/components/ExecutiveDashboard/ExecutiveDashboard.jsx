import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Mic, Kanban, TrendingUp, AlertCircle, CheckCircle, Briefcase, Activity, Wrench } from 'lucide-react';
import styles from './ExecutiveDashboard.module.scss';
import GlobalSearch from '../GlobalSearch/GlobalSearch';
import ProjectDetailModal from '../Modals/ProjectDetailModal';

export default function ExecutiveDashboard({ session }) {
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [proyectoDetalleId, setProyectoDetalleId] = useState(null);
  const [estados, setEstados] = useState([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch columns
      const { data: colsData } = await supabase.from('columnas').select('nombre').order('orden', { ascending: true });
      if (colsData) {
        setEstados(colsData.map(c => c.nombre));
      }

      // Fetch projects
      const { data: proys } = await supabase.from('proyectos').select('*');
      if (proys) {
        setProyectos(proys);
      }
      setCargando(false);
    }
    fetchData();
  }, []);

  const goToKanban = () => {
    // If we use localStorage or session state for routing
    window.location.href = '/kanban';
  };

  const handleMicClick = () => {
    alert("Activando Monster AI... (Próximamente)");
  };

  if (cargando) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando vista ejecutiva...</p>
      </div>
    );
  }

  // Cálculos de KPIs
  const userRole = session?.user?.user_metadata?.rol;
  const isLiderComercial = userRole === 'Líder Comercial';

  const activos = proyectos.filter(p => p.estado !== 'Entregado y cerrado' && p.estado !== 'Archivado' && !p.estado.includes('Cancelado'));
  const completados = proyectos.filter(p => p.estado === 'Entregado y cerrado');
  
  // Financieros (Líder Comercial)
  const ingresosProyectados = activos.reduce((sum, p) => sum + (Number(p.precio_venta) || 0), 0);
  const ingresosCompletados = completados.reduce((sum, p) => sum + (Number(p.precio_venta) || 0), 0);
  
  // Operativos (Líder de Operaciones)
  const produccionFases = ['Logística y compras', 'En fabricación', 'Listo para instalación', 'En instalación'];
  const enProduccion = activos.filter(p => produccionFases.includes(p.estado));
  
  const estancados = activos.filter(p => p.dias_estancado > 5); // Ejemplo: > 5 días sin mover
  
  // Resumen rápido de últimos movidos
  const recientes = [...activos].sort((a, b) => new Date(b.fecha_ultima_actualizacion) - new Date(a.fecha_ultima_actualizacion)).slice(0, 5);

  return (
    <div className={styles.executiveContainer}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.greeting}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>Hola, {session?.user?.user_metadata?.nombre?.split(' ')[0] || 'Líder'}</h1>
              <span className={styles.badge} style={{ marginLeft: 0, marginTop: '4px' }}>
                {userRole || 'Usuario'}
              </span>
            </div>
            <p>Resumen Ejecutivo</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnKanban} onClick={goToKanban} title="Ver Tablero Completo">
              <Kanban size={20} />
              <span className={styles.hideMobile}>Tablero</span>
            </button>
          </div>
        </div>
        
        <div className={styles.searchSection}>
          <GlobalSearch onResultClick={(id) => setProyectoDetalleId(id)} />
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.kpiGrid}>
          
          {isLiderComercial ? (
            <>
              <div className={`${styles.kpiCard} ${styles.cardProyectados}`}>
                <div className={styles.kpiHeader}>
                  <TrendingUp size={20} />
                  <h3>Ingresos Proyectados</h3>
                </div>
                <div className={styles.kpiValue}>
                  ${ingresosProyectados.toLocaleString('en-US')}
                </div>
                <div className={styles.kpiSub}>
                  En {activos.length} proyectos activos
                </div>
              </div>

              <div className={`${styles.kpiCard} ${styles.cardCerrados}`}>
                <div className={styles.kpiHeader}>
                  <CheckCircle size={20} />
                  <h3>Ingresos Cerrados</h3>
                </div>
                <div className={styles.kpiValue}>
                  ${ingresosCompletados.toLocaleString('en-US')}
                </div>
                <div className={styles.kpiSub}>
                  Histórico completado
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={`${styles.kpiCard} ${styles.cardProyectados}`}>
                <div className={styles.kpiHeader}>
                  <Wrench size={20} />
                  <h3>En Producción</h3>
                </div>
                <div className={styles.kpiValue}>
                  {enProduccion.length}
                </div>
                <div className={styles.kpiSub}>
                  Proyectos en logística, fab. o inst.
                </div>
              </div>

              <div className={`${styles.kpiCard} ${styles.cardCerrados}`}>
                <div className={styles.kpiHeader}>
                  <CheckCircle size={20} />
                  <h3>Proyectos Completados</h3>
                </div>
                <div className={styles.kpiValue}>
                  {completados.length}
                </div>
                <div className={styles.kpiSub}>
                  Histórico cerrado
                </div>
              </div>
            </>
          )}

          <div className={`${styles.kpiCard} ${styles.cardActivos}`}>
            <div className={styles.kpiHeader}>
              <Briefcase size={20} />
              <h3>Proyectos Activos</h3>
            </div>
            <div className={styles.kpiValue}>
              {activos.length}
            </div>
            <div className={styles.kpiSub}>
              En progreso
            </div>
          </div>

          <div className={`${styles.kpiCard} ${styles.cardAtencion}`}>
            <div className={styles.kpiHeader}>
              <AlertCircle size={20} />
              <h3>Atención Requerida</h3>
            </div>
            <div className={styles.kpiValue}>
              {estancados.length}
            </div>
            <div className={styles.kpiSub}>
              Estancados por &gt; 5 días
            </div>
          </div>
        </section>

        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <Activity size={18} />
            <h2>Actividad Reciente</h2>
          </div>
          <div className={styles.activityList}>
            {recientes.map(p => (
              <div key={p.id} className={styles.activityItem} onClick={() => setProyectoDetalleId(p.id)}>
                <div className={styles.activityMain}>
                  <h4>{p.titulo}</h4>
                  <span className={styles.badge}>{p.estado}</span>
                </div>
                <div className={styles.activityMeta}>
                  <span>Actualizado: {new Date(p.fecha_ultima_actualizacion).toLocaleDateString()}</span>
                  {p.precio_venta && <span>• ${Number(p.precio_venta).toLocaleString('en-US')}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {proyectoDetalleId && (
        <ProjectDetailModal
          proyectoId={proyectoDetalleId}
          estados={estados}
          session={session}
          onClose={() => setProyectoDetalleId(null)}
          onProjectUpdated={(updatedProject) => {
            setProyectos(prev => prev.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p));
          }}
        />
      )}
    </div>
  );
}
