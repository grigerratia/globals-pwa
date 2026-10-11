import { supabase } from '../supabase';

export const logAudit = async (session, accion, detalles = {}) => {
  if (!session?.user) return;
  const usuario_id = session.user.id;
  const usuario_nombre = session.user.user_metadata?.nombre || session.user.email;

  try {
    const { error: logErr } = await supabase.from('audit_logs').insert([{
      usuario_id,
      usuario_nombre,
      accion,
      detalles
    }]);
    
    if (logErr) {
      console.warn("AUDIT_LOG_ERROR (silenced):", logErr.message || logErr);
    }
  } catch (err) {
    console.warn('Error logging audit (silenced):', err.message || err);
  }
};
