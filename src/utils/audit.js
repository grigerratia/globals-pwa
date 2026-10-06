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
      console.error("AUDIT_LOG_ERROR:", logErr);
      alert("Error en DB (audit_logs): " + logErr.message);
    }
  } catch (err) {
    console.error('Error logging audit:', err);
  }
};
