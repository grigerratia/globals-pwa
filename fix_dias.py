with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

# 1. Add diasEstimadosPrompt state
old_states = """  const [motivePrompt, setMotivePrompt] = useState(null);
  const [boardError, setBoardError] = useState(null);"""
new_states = """  const [motivePrompt, setMotivePrompt] = useState(null);
  const [diasEstimadosPrompt, setDiasEstimadosPrompt] = useState(null);
  const [boardError, setBoardError] = useState(null);"""
content = content.replace(old_states, new_states)

# 2. Add the modal UI
old_modal = """      {motivePrompt && ("""
new_modal = """      {diasEstimadosPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem' }}>Días Estimados para la Fase</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
              ¿Cuántos días estimas que tomará esta tarjeta en la columna <strong>{diasEstimadosPrompt.columna}</strong>?
            </p>
            {diasEstimadosPrompt.error && (
              <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem' }}>{diasEstimadosPrompt.error}</div>
            )}
            <input 
              type="number"
              id="diasEstimadosInput"
              autoFocus
              min="1"
              placeholder="Ej. 3"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={diasEstimadosPrompt.onCancel} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
              <button 
                onClick={() => {
                  const val = parseInt(document.getElementById('diasEstimadosInput').value, 10);
                  if (!val || isNaN(val)) { return; }
                  diasEstimadosPrompt.onConfirm(val);
                }} 
                style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {motivePrompt && ("""
content = content.replace(old_modal, new_modal)

# 3. Add logic in handleDragEnd
old_logic = """             executeMove(null, nuevasNotas);
             setMotivePrompt(null);
           },
           onCancel: () => {
             if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
             setMotivePrompt(null);
           }
        });
      } else {
        executeMove();
      }
    }
  };"""

new_logic = """             executeMove(null, nuevasNotas);
             setMotivePrompt(null);
           },
           onCancel: () => {
             if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
             setMotivePrompt(null);
           }
        });
      } else if (cambioDeFase && !isSpecialDest && destinoGlobalIdx > origenGlobalIdx) {
        setDiasEstimadosPrompt({
           columna: activeColumn,
           error: null,
           onConfirm: (dias) => {
             // Validate against fecha_entrega if exists
             if (pry.fecha_entrega) {
               const entrega = new Date(pry.fecha_entrega + 'T00:00:00');
               const estimadoDate = new Date();
               estimadoDate.setDate(estimadoDate.getDate() + dias);
               if (estimadoDate > entrega) {
                 setDiasEstimadosPrompt(prev => ({ ...prev, error: `Los días estimados superan la fecha de entrega final (${pry.fecha_entrega}). Introduce un número menor.` }));
                 return; // Do not close modal
               }
             }

             // Clean old tags
             let currentNotas = pry.notas || '';
             currentNotas = currentNotas.replace(/\[DÍAS ESTIMADOS FASE ACTUAL: \d+\]\\n?/g, '').trim();
             
             // Append new tag
             const notaAnadida = `[DÍAS ESTIMADOS FASE ACTUAL: ${dias}]`;
             const nuevasNotas = currentNotas ? currentNotas + '\\n\\n' + notaAnadida : notaAnadida;

             executeMove(null, nuevasNotas);
             setDiasEstimadosPrompt(null);
           },
           onCancel: () => {
             if (originalColumnasRef.current) setColumnas(originalColumnasRef.current);
             setDiasEstimadosPrompt(null);
           }
        });
      } else {
        executeMove();
      }
    }
  };"""
content = content.replace(old_logic, new_logic)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
