import { useState } from 'react';
import { supabase } from '../../supabase';
import styles from './Login.module.scss';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState('Ventas');

  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    let authError;

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            nombre: nombre,
            telefono: telefono,
            rol: rol
          }
        }
      });
      authError = error;
      if (!error) {
        setSuccessMsg("Registro exitoso. Si tienes confirmación de email activada, revisa tu correo.");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
      if (data?.session) {
        onLogin(data.session);
      }
    }

    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        <p className={styles.subtitle}>Gestor de Proyectos Globals</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {isRegistering && (
            <>
              <div className={styles.inputGroup}>
                <label>Nombre y Apellido</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  required 
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Rol (Departamento)</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)} required className={styles.selectRol}>
                  <option value="Líder Comercial">Líder Comercial</option>
                  <option value="Ventas">Ventas y Atención</option>
                  <option value="Diseño">Diseño Gráfico</option>
                  <option value="Produccion">Producción / Fabricación</option>
                  <option value="Logistica">Logística y Compras</option>
                  <option value="Instalacion">Instalación</option>
                  <option value="Administracion">Administración</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>WhatsApp (solo números)</label>
                <input 
                  type="tel" 
                  value={telefono} 
                  onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ''))} 
                  required 
                  placeholder="Ej: 584141234567"
                />
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          {successMsg && <div className={styles.success}>{successMsg}</div>}
          
          <button type="submit" disabled={loading} className={styles.btnSubmit}>
            {loading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Entrar')}
          </button>
        </form>
        
        <button 
          className={styles.btnToggle} 
          onClick={() => setIsRegistering(!isRegistering)}
          type="button"
        >
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
}

