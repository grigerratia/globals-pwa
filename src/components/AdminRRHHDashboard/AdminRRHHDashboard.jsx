import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ShoppingCart, DollarSign, Users } from 'lucide-react';
import styles from './AdminRRHHDashboard.module.scss';
import { logAudit } from '../../utils/audit';
import TopHeader from '../TopHeader/TopHeader';

export default function AdminRRHHDashboard({ session }) {
  const [proyectos, setProyectos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('compras'); // compras, rrhh

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch proyectos
    const { data: proyData, error: proyError } = await supabase
      .from('proyectos')
      .select('*')
      .neq('estado', 'Cancelado')
      .neq('estado', 'Archivado');
    
    if (!proyError && proyData) {
      setProyectos(proyData);
    }

    // Fetch empleados
    const { data: empData, error: empError } = await supabase.rpc('get_empleados');
    if (!empError && empData) {
      setEmpleados(empData);
    }

    setLoading(false);
  };

  const handleUpdateMaterial = async (proyecto, matIndex, newValue) => {
    const updatedMats = [...(proyecto.materiales || [])];
    updatedMats[matIndex].comprado = newValue;

    const isAllBought = updatedMats.length > 0 && updatedMats.every(m => m.comprado);

    const updates = { 
      materiales: updatedMats, 
      materiales_comprados: isAllBought,
      fecha_ultima_actualizacion: new Date().toISOString()
    };

    setProyectos(prev => prev.map(p => p.id === proyecto.id ? { ...p, ...updates } : p));

    await supabase.from('proyectos').update(updates).eq('id', proyecto.id);
    logAudit(session, 'Actualizó estado de material (Compras)', { proyecto_id: proyecto.id, material: updatedMats[matIndex].nombre });
  };

  const handleUpdatePresupuesto = async (proyectoId, newValue) => {
    const updates = { 
      presupuesto_aprobado: newValue,
      fecha_ultima_actualizacion: new Date().toISOString()
    };

    setProyectos(prev => prev.map(p => p.id === proyectoId ? { ...p, ...updates } : p));

    await supabase.from('proyectos').update(updates).eq('id', proyectoId);
    const p = proyectos.find(p => p.id === proyectoId);
    logAudit(session, 'Actualizó aprobación de presupuesto (Admin)', { proyecto_id: proyectoId, titulo: p?.titulo });
  };

  // Derived state
  const proyectosConCompras = proyectos.filter(p => p.materiales && p.materiales.length > 0);
  const proyectosPendientesPresupuesto = proyectos.filter(p => !p.presupuesto_aprobado);

  const materialsCount = proyectosConCompras.reduce((acc, p) => acc + (p.materiales?.filter(m => !m.comprado).length || 0), 0);

  if (loading) {
    return <div className={styles.loading}>Cargando panel de administración...</div>;
  }

  return (
    <>
      <TopHeader session={session} currentView="ejecutivo" />
      <div className={styles.dashboardContainer}>
        <header className={styles.header}>
          <div>
            <h1>Panel de Administración y RRHH</h1>
            <p>Gestiona compras, presupuestos y personal corporativo.</p>
          </div>
      </header>

      <div className={styles.tabs}>
        <button 
          className={activeTab === 'compras' ? styles.activeTab : ''} 
          onClick={() => setActiveTab('compras')}
        >
          <ShoppingCart size={18} /> Compras y Presupuestos
        </button>
        <button 
          className={activeTab === 'rrhh' ? styles.activeTab : ''} 
          onClick={() => setActiveTab('rrhh')}
        >
          <Users size={18} /> Recursos Humanos
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'compras' && (
          <div className={styles.comprasGrid}>
            
            {/* Panel de Compras */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2><ShoppingCart size={20} /> Lista de Compras Pendientes ({materialsCount})</h2>
              </div>
              <div className={styles.panelBody}>
                {proyectosConCompras.length === 0 ? (
                  <p className={styles.empty}>No hay proyectos con materiales registrados.</p>
                ) : (
                  proyectosConCompras.map(p => {
                    const pendientes = p.materiales?.filter(m => !m.comprado) || [];
                    if (pendientes.length === 0) return null; // Solo mostrar si hay pendientes
                    return (
                      <div key={p.id} className={styles.projectCard}>
                        <div className={styles.projectHeader}>
                          <h3>{p.titulo}</h3>
                          <span className={styles.badge}>{p.estado}</span>
                        </div>
                        <ul className={styles.materialList}>
                          {p.materiales.map((m, idx) => {
                            if (m.comprado) return null; // Solo mostramos los no comprados en detalle general
                            return (
                              <li key={idx}>
                                <label className={styles.checkContainer}>
                                  <input 
                                    type="checkbox" 
                                    checked={m.comprado} 
                                    onChange={(e) => handleUpdateMaterial(p, idx, e.target.checked)}
                                  />
                                  <span className={styles.checkmark}></span>
                                  {m.nombre}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Panel de Presupuestos */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2><DollarSign size={20} /> Presupuestos por Aprobar ({proyectosPendientesPresupuesto.length})</h2>
              </div>
              <div className={styles.panelBody}>
                {proyectosPendientesPresupuesto.length === 0 ? (
                  <p className={styles.empty}>Todos los proyectos tienen el presupuesto aprobado.</p>
                ) : (
                  proyectosPendientesPresupuesto.map(p => (
                    <div key={p.id} className={styles.projectCard}>
                      <div className={styles.projectHeader}>
                        <h3>{p.titulo}</h3>
                        <span className={styles.badgeWarning}>Pendiente</span>
                      </div>
                      <div className={styles.projectDetails}>
                        <p><strong>Cliente:</strong> {p.cliente_empresa || p.cliente_nombre || 'N/A'}</p>
                        <p><strong>Fase:</strong> {p.estado}</p>
                      </div>
                      <div className={styles.actions}>
                        <label className={styles.checkContainer}>
                          <input 
                            type="checkbox" 
                            checked={p.presupuesto_aprobado} 
                            onChange={(e) => handleUpdatePresupuesto(p.id, e.target.checked)}
                          />
                          <span className={styles.checkmark}></span>
                          Marcar como Presupuesto Aprobado y Entregado
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'rrhh' && (
          <div className={styles.rrhhPanel}>
            <div className={styles.panelHeader}>
              <h2><Users size={20} /> Directorio de Empleados</h2>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.employeeGrid}>
                {empleados.map(emp => (
                  <div key={emp.id} className={styles.employeeCard}>
                    <div className={styles.empAvatar}>
                      {emp.nombre ? emp.nombre.charAt(0).toUpperCase() : emp.email.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.empInfo}>
                      <h4>{emp.nombre || 'Sin nombre'}</h4>
                      <p className={styles.empRole}>{emp.rol}</p>
                      <p className={styles.empEmail}>{emp.email}</p>
                      {emp.telefono && <p className={styles.empTel}>📞 {emp.telefono}</p>}
                    </div>
                  </div>
                ))}
                {empleados.length === 0 && <p>No se encontraron empleados.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

