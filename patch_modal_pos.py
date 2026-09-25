import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# Extract the confirmDelete block
block_start = "{confirmDelete && ("
block_end = "      )}\n    </div>"
# wait, the block is:
#      {confirmDelete && (
#        <div onClick...
#      )}
#    </div>
#  );
# }
old_tail = """      {confirmDelete && (
        <div onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }} style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={20} color="#ef4444" /> Cancelar Proyecto
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Por favor, ingresa el motivo de la cancelación. Este dato será analizado por la IA para estadísticas futuras.</p>
            <textarea 
              value={cancelMotive} 
              onChange={(e) => setCancelMotive(e.target.value)}
              placeholder="Ej: El cliente no tiene presupuesto, el cliente desapareció..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Volver</button>
              <button onClick={handleCancelProject} disabled={!cancelMotive.trim()} style={{ padding: '0.5rem 1rem', background: cancelMotive.trim() ? '#ef4444' : '#7f1d1d', color: 'white', border: 'none', borderRadius: '6px', cursor: cancelMotive.trim() ? 'pointer' : 'not-allowed', fontWeight: 500, transition: 'background 0.2s' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""

# Move it outside the `.modal` div. The `.modal` div is closed right before `{confirmDelete && (`
# Wait, let's see exactly what's before `{confirmDelete && (`
