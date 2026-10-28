import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import styles from './ProjectDetailModal.module.scss';

export default function AssignEmployeeSelect({ onSelect, defaultRole = 'Director Comercial' }) {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [manualName, setManualName] = useState('');

  const ROLES = [
    "Director Comercial", "Gerente de Operaciones", "Asistente de Operaciones", "Ventas", "Diseño", "Logística", "Instalación", "Líder Administrativo y RRHH", "Externo"
  ];

  useEffect(() => {
    async function fetchEmpleados() {
      setLoading(true);
      // Calls RPC 'get_empleados'
      const { data, error } = await supabase.rpc('get_empleados');
      if (!error && data) {
        setEmpleados(data);
      }
      setLoading(false);
    }
    fetchEmpleados();
  }, []);

  const filteredEmpleados = empleados.filter(emp => {
    if (emp.rol === selectedRole) return true;
    if (selectedRole === 'Director Comercial' && (emp.rol === 'Líder Comercial' || emp.rol === 'Lider Comercial')) return true;
    if (selectedRole === 'Gerente de Operaciones' && (emp.rol === 'Líder de Operaciones' || emp.rol === 'Lider de Operaciones' || emp.rol === 'Líder Operativo')) return true;
    if (selectedRole === 'Asistente de Operaciones' && (emp.rol === 'Líder de Producción' || emp.rol === 'Lider de Produccion')) return true;
    if (selectedRole === 'Líder Administrativo y RRHH' && (emp.rol === 'Administración' || emp.rol === 'Administracion' || emp.rol === 'Líder de Administración')) return true;
    if (selectedRole === 'Logística' && emp.rol === 'Logistica') return true;
    if (selectedRole === 'Instalación' && emp.rol === 'Instalacion') return true;
    if (selectedRole === 'Ventas' && emp.rol === 'Ventas y Atención') return true;
    if (selectedRole === 'Diseño' && emp.rol === 'Diseño Gráfico') return true;
    return false;
  });

  const handleAdd = () => {
    if (selectedRole === 'Externo') {
      if (manualName.trim()) {
        onSelect({ nombre: manualName.trim(), rol: 'Externo' });
        setManualName('');
      }
    } else {
      if (selectedUserId) {
        const emp = empleados.find(e => e.id === selectedUserId);
        if (emp) {
          onSelect({ 
            nombre: emp.nombre || emp.email, 
            rol: selectedRole, 
            user_id: emp.id,
            telefono: emp.telefono 
          });
        }
      }
    }
  };

  return (
    <div className={styles.addEncargadoBox}>
      <select value={selectedRole} onChange={e => { setSelectedRole(e.target.value); setSelectedUserId(''); }}>
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      
      {selectedRole === 'Externo' ? (
        <input 
          type="text" 
          placeholder="Nombre del externo..." 
          value={manualName}
          onChange={e => setManualName(e.target.value)}
        />
      ) : (
        <select 
          value={selectedUserId} 
          onChange={e => setSelectedUserId(e.target.value)}
          disabled={loading || filteredEmpleados.length === 0}
        >
          <option value="">{loading ? 'Cargando...' : 'Selecciona empleado...'}</option>
          {filteredEmpleados.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nombre || emp.email}</option>
          ))}
        </select>
      )}

      <button onClick={handleAdd}>Añadir</button>
    </div>
  );
}
