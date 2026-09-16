import { supabase } from '../supabase';

export const logAudit = async (session, accion, detalles = {}) => {
  if (!session?.user) return;
  const usuario_id = session.user.id;
  const usuario_nombre = session.user.user_metadata?.nombre || session.user.email;

  try {
    await supabase.from('audit_logs').insert([{
      usuario_id,
      usuario_nombre,
      accion,
      detalles
    }]);
  } catch (err) {
    console.error('Error logging audit:', err);
  }
};
