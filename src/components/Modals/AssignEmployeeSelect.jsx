import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import styles from './ProjectDetailModal.module.scss';

export default function AssignEmployeeSelect({ onSelect, defaultRole = 'Líder Comercial' }) {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [manualName, setManualName] = useState('');

  const ROLES = [
    "Líder Comercial", "Líder de Operaciones", "Ventas", "Diseño", "Producción", "Logística", "Instalación", "Administración", "Externo"
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

  const filteredEmpleados = empleados.filter(emp => emp.rol === selectedRole || (selectedRole === 'Producción' && emp.rol === 'Produccion') || (selectedRole === 'Logística' && emp.rol === 'Logistica') || (selectedRole === 'Instalación' && emp.rol === 'Instalacion') || (selectedRole === 'Administración' && emp.rol === 'Administracion') || (selectedRole === 'Ventas' && emp.rol === 'Ventas y Atención') || (selectedRole === 'Diseño' && emp.rol === 'Diseño Gráfico'));

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
