with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

import re

# Add motivePrompt state to ProjectDetailModal
content = content.replace("const [confirmArchive, setConfirmArchive] = useState(false);", "const [confirmArchive, setConfirmArchive] = useState(false);\n  const [motivePrompt, setMotivePrompt] = useState(null);")

# Change the select onChange
old_select = """              <select 
                value={proyecto.estado} 
                onChange={(e) => handleChange('estado', e.target.value)}
                className={styles.statusSelect}
              >"""

new_select = """              <select 
                value={proyecto.estado} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.toLowerCase().includes('espera') || val.toLowerCase().includes('pausa')) {
                    if (session?.user?.user_metadata?.rol !== 'Líder Comercial') {
                      alert('Solo el Líder Comercial puede pausar proyectos.');
                      return;
                    }
                    setMotivePrompt({
                      title: 'Motivo de Pausa',
                      onConfirm: async (motive) => {
                        await handleMultipleChange({ estado: val, motivo_cancelacion: motive });
                        setMotivePrompt(null);
                      },
                      onCancel: () => setMotivePrompt(null)
                    });
                  } else {
                    handleChange('estado', val);
                  }
                }}
                className={styles.statusSelect}
              >"""

content = content.replace(old_select, new_select)

# Add the motivePrompt UI to ProjectDetailModal
motive_ui = """
      {motivePrompt && (
        <div onClick={(e) => { e.stopPropagation(); setMotivePrompt(null); }} style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem' }}>{motivePrompt.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>Por favor, indica el motivo detallado de esta acción.</p>
            <textarea 
              id="dropdownMotiveInput"
              autoFocus
              placeholder="Ej. Falta de material..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={motivePrompt.onCancel} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
              <button 
                onClick={() => {
                  const val = document.getElementById('dropdownMotiveInput').value;
                  if (!val.trim()) return;
                  motivePrompt.onConfirm(val);
                }} 
                style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {confirmArchive && ("""

content = content.replace("      {confirmArchive && (", motive_ui)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
