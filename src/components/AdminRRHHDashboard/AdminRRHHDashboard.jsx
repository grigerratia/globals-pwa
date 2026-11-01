import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { ShoppingCart, DollarSign, Users, Bell, BellRing, Trash2, UserPlus } from 'lucide-react';
import styles from './AdminRRHHDashboard.module.scss';
import { logAudit } from '../../utils/audit';
import TopHeader from '../TopHeader/TopHeader';
import { requestFirebaseToken } from '../../firebase';

export default function AdminRRHHDashboard({ session }) {
  const [proyectos, setProyectos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('compras'); // compras, rrhh
  const [presupuestoTab, setPresupuestoTab] = useState('aprobados'); // aprobados, pendientes
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ nombre: '', email: '', password: '', rol: 'Líder de Producción', telefono: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [pushPermission, setPushPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  useEffect(() => {
    async function fetchData() {
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
        setEmpleados(empData.filter(e => !e.rol?.toLowerCase().includes('master')));
      }

      setLoading(false);
    }

    fetchData();

    // Evento local inmediato (cuando Dinamo o modales crean o mueven proyectos)
    const handleLocalChange = () => {
      fetchData();
    };
    window.addEventListener('globals:proyectos-changed', handleLocalChange);

    const channelName = `admin_dashboard_${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proyectos' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      window.removeEventListener('globals:proyectos-changed', handleLocalChange);
      supabase.removeChannel(channel);
    };
  }, []);

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

  const handleEnablePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Las notificaciones Push no están soportadas en este navegador.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        const token = await requestFirebaseToken();
        if (token && session?.user?.id) {
          await supabase.from('fcm_tokens').upsert({
            token,
            user_id: session.user.id
          });
        }
        alert('¡Notificaciones Push activadas exitosamente para el rol de Administración!');
      } else {
        alert('Permiso no concedido. Por favor habilítalo en la configuración del navegador.');
      }
    } catch (e) {
      console.error('Error al activar push:', e);
    }
  };

  const handleDeleteUser = async (emp) => {
    const nom = emp.nombre || emp.email;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${nom}" del sistema? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/admin/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: emp.id, requesterId: session?.user?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');

      setEmpleados(prev => prev.filter(e => e.id !== emp.id));
      alert(`Usuario "${nom}" eliminado exitosamente.`);
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      alert(`No se pudo eliminar al usuario: ${err.message}`);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserData.email || !newUserData.password) {
      alert('Email y contraseña son obligatorios');
      return;
    }
    setCreatingUser(true);
    try {
      let telNorm = (newUserData.telefono || '').replace(/[^0-9]/g, '');
      if (telNorm.startsWith('0')) telNorm = '58' + telNorm.substring(1);
      else if (telNorm.length === 10 && telNorm.startsWith('4')) telNorm = '58' + telNorm;

      const { error } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: {
            nombre: newUserData.nombre,
            telefono: telNorm,
            rol: newUserData.rol
          }
        }
      });
      if (error) throw error;

      alert(`Usuario "${newUserData.nombre || newUserData.email}" registrado exitosamente.`);
      setIsCreateModalOpen(false);
      setNewUserData({ nombre: '', email: '', password: '', rol: 'Líder de Producción', telefono: '' });

      // Notificar al backend de inmediato
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      if (backendUrl) {
        fetch(`${backendUrl}/api/admin/notify-user-change`, { method: 'POST' }).catch(() => {});
      }

      // Refrescar empleados
      const { data: empData } = await supabase.rpc('get_empleados');
      if (empData) {
        setEmpleados(empData.filter(e => !e.rol?.toLowerCase().includes('master')));
      }
    } catch (err) {
      console.error('Error creando usuario:', err);
      alert(`Error al crear usuario: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  // Derived state
  const proyectosConCompras = proyectos.filter(p => p.materiales && p.materiales.length > 0);
  const proyectosPresupuestoAprobado = proyectos.filter(p => !!p.presupuesto_aprobado);
  const proyectosPendientesPresupuesto = proyectos.filter(p => !p.presupuesto_aprobado);

  const materialsCount = proyectosConCompras.reduce((acc, p) => acc + (p.materiales?.filter(m => !m.comprado).length || 0), 0);

  if (loading) {
    return <div className={styles.loading}>Cargando panel de administración...</div>;
  }

  return (
    <>
      <TopHeader session={session} currentView="admin" />
      <div className={styles.dashboardContainer}>
        <header className={styles.header}>
          <div>
            <h1>Panel de Administración y RRHH</h1>
            <p>Gestiona compras, presupuestos y personal corporativo.</p>
          </div>
          <div className={styles.headerActions}>
            {pushPermission === 'granted' ? (
              <div className={styles.pushActiveBadge}>
                <Bell size={16} /> Notificaciones Push Activas
              </div>
            ) : (
              <button className={styles.pushActivateBtn} onClick={handleEnablePush}>
                <BellRing size={16} /> Activar Notificaciones Push
              </button>
            )}
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
                <h2>
                  <DollarSign size={20} /> 
                  {presupuestoTab === 'aprobados' 
                    ? `Presupuestos Aprobados (${proyectosPresupuestoAprobado.length})` 
                    : `Presupuestos por Aprobar (${proyectosPendientesPresupuesto.length})`}
                </h2>
                <div className={styles.filterPills}>
                  <button 
                    className={presupuestoTab === 'aprobados' ? styles.filterPillActive : styles.filterPill}
                    onClick={() => setPresupuestoTab('aprobados')}
                  >
                    Aprobados ({proyectosPresupuestoAprobado.length})
                  </button>
                  <button 
                    className={presupuestoTab === 'pendientes' ? styles.filterPillActive : styles.filterPill}
                    onClick={() => setPresupuestoTab('pendientes')}
                  >
                    Por Aprobar ({proyectosPendientesPresupuesto.length})
                  </button>
                </div>
              </div>
              <div className={styles.panelBody}>
                {presupuestoTab === 'aprobados' ? (
                  proyectosPresupuestoAprobado.length === 0 ? (
                    <p className={styles.empty}>No hay proyectos con presupuesto aprobado actualmente.</p>
                  ) : (
                    proyectosPresupuestoAprobado.map(p => (
                      <div key={p.id} className={styles.projectCard}>
                        <div className={styles.projectHeader}>
                          <h3>{p.titulo}</h3>
                          <span className={styles.badgeSuccess}>Aprobado</span>
                        </div>
                        <div className={styles.projectDetails}>
                          <p><strong>Contacto:</strong> {p.cliente_nombre || p.cliente_empresa || 'N/A'}</p>
                          <p><strong>Fase:</strong> {p.estado}</p>
                        </div>
                        <div className={styles.actions}>
                          <label className={styles.checkContainer}>
                            <input 
                              type="checkbox" 
                              checked={!!p.presupuesto_aprobado} 
                              onChange={(e) => handleUpdatePresupuesto(p.id, e.target.checked)}
                            />
                            <span className={styles.checkmark}></span>
                            Presupuesto Aprobado
                          </label>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  proyectosPendientesPresupuesto.length === 0 ? (
                    <p className={styles.empty}>Todos los proyectos tienen el presupuesto aprobado.</p>
                  ) : (
                    proyectosPendientesPresupuesto.map(p => (
                      <div key={p.id} className={styles.projectCard}>
                        <div className={styles.projectHeader}>
                          <h3>{p.titulo}</h3>
                          <span className={styles.badgeWarning}>Pendiente</span>
                        </div>
                        <div className={styles.projectDetails}>
                          <p><strong>Contacto:</strong> {p.cliente_nombre || p.cliente_empresa || 'N/A'}</p>
                          <p><strong>Fase:</strong> {p.estado}</p>
                        </div>
                        <div className={styles.actions}>
                          <label className={styles.checkContainer}>
                            <input 
                              type="checkbox" 
                              checked={!!p.presupuesto_aprobado} 
                              onChange={(e) => handleUpdatePresupuesto(p.id, e.target.checked)}
                            />
                            <span className={styles.checkmark}></span>
                            Marcar como Presupuesto Aprobado
                          </label>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'rrhh' && (
          <div className={styles.rrhhPanel}>
            <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2><Users size={20} /> Directorio de Empleados ({empleados.length})</h2>
              <button 
                className={styles.createUserBtn} 
                onClick={() => setIsCreateModalOpen(true)}
              >
                <UserPlus size={16} /> Registrar Usuario
              </button>
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
                      <p className={styles.empRole}>
                        {emp.rol === 'Líder Comercial' ? 'Director Comercial' :
                         emp.rol === 'Líder de Operaciones' ? 'Gerente de Operaciones' :
                         emp.rol === 'Líder de Producción' ? 'Asistente de Operaciones' :
                         (emp.rol === 'Administración' || emp.rol === 'Administracion' || emp.rol === 'Líder de Administración') ? 'Líder Administrativo y RRHH' :
                         emp.rol}
                      </p>
                      <p className={styles.empEmail}>{emp.email}</p>
                      {emp.telefono && <p className={styles.empTel}>📞 {emp.telefono}</p>}
                    </div>
                    <button 
                      className={styles.deleteUserBtn} 
                      onClick={() => handleDeleteUser(emp)}
                      title={`Eliminar ${emp.nombre || emp.email}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {empleados.length === 0 && <p>No se encontraron empleados.</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Registrar Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser}>
              <div className={styles.formGroup}>
                <label>Nombre y Apellido</label>
                <input 
                  type="text" 
                  value={newUserData.nombre} 
                  onChange={(e) => setNewUserData({ ...newUserData, nombre: e.target.value })} 
                  placeholder="Ej: María Hernández" 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={newUserData.email} 
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} 
                  placeholder="usuario@globals.com" 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Contraseña</label>
                <input 
                  type="password" 
                  value={newUserData.password} 
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} 
                  placeholder="Mínimo 6 caracteres" 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Rol en la Empresa</label>
                <select 
                  value={newUserData.rol} 
                  onChange={(e) => setNewUserData({ ...newUserData, rol: e.target.value })}
                >
                  <option value="Líder Administrativo y RRHH">Líder Administrativo y RRHH (Administración)</option>
                  <option value="Director Comercial">Director Comercial (Ventas)</option>
                  <option value="Gerente de Operaciones">Gerente de Operaciones</option>
                  <option value="Asistente de Operaciones">Asistente de Operaciones</option>
                  <option value="Diseñador">Diseñador</option>
                  <option value="Instalador">Instalador</option>
                  <option value="Impresor u Operador">Impresor u Operador</option>
                  <option value="Fabricante">Fabricante</option>
                  <option value="Logística y Compras">Logística y Compras</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono (WhatsApp)</label>
                <input 
                  type="tel" 
                  value={newUserData.telefono} 
                  onChange={(e) => setNewUserData({ ...newUserData, telefono: e.target.value })} 
                  placeholder="Ej: 04141234567" 
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={creatingUser}>
                  {creatingUser ? 'Registrando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

