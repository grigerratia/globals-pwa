import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# 1. Remove showMoreInfo
content = re.sub(r"const \[showMoreInfo, setShowMoreInfo\] = useState\(false\);\n\s*", "", content)

toggle_btn = r"""            <button 
              className={styles.toggleMoreBtn} 
              onClick={\(\) => setShowMoreInfo\(!showMoreInfo\)}
            >
              \{showMoreInfo \? 'Ocultar información adicional' : 'Ver más información \(Archivos, Finanzas, etc\.\)'\}
            </button>

            \{showMoreInfo && \(
              <>"""
content = re.sub(toggle_btn, "", content)

# Remove the closing tags for showMoreInfo
closing_tags = r"""            </>
            \)\}
          </div>

          \{\/\* SIDEBAR \(Acciones\) \*\/\}"""
new_closing_tags = r"""          </div>

          {/* SIDEBAR (Acciones) */}"""
content = content.replace("            </>\n            )}\n          </div>\n\n          {/* SIDEBAR (Acciones) */}", new_closing_tags)

# 2. Add real-time comments logic
effect_end = """      setCargando(false);
    };
    fetchDatos();
  }, [proyectoId]);"""

new_effect_end = """      setCargando(false);
    };
    fetchDatos();

    const channel = supabase.channel(`comentarios_${proyectoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comentarios', filter: `proyecto_id=eq.${proyectoId}` }, (payload) => {
         if (payload.eventType === 'INSERT') {
           setComentarios(prev => [payload.new, ...prev]);
         } else if (payload.eventType === 'UPDATE') {
           setComentarios(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
         } else if (payload.eventType === 'DELETE') {
           setComentarios(prev => prev.filter(c => c.id !== payload.old.id));
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proyectoId]);"""

content = content.replace(effect_end, new_effect_end)

# 3. Modify "Responder" and "Original" visibility
# For ref, add textareaRef
content = content.replace("const [nuevoComentario, setNuevoComentario] = useState('');", "const [nuevoComentario, setNuevoComentario] = useState('');\n  const textareaRef = React.useRef(null);")

# Wait, `import React from 'react'` might not be there. Let's use `import { useState, useEffect, useRef }`
content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, useRef } from 'react';")
content = content.replace("const textareaRef = React.useRef(null);", "const textareaRef = useRef(null);")

# Remove "Texto Original" block
original_block = r"""                      \{isSuperUser && \(parsed\.isEdited \|\| parsed\.isDeleted\) && parsed\.originalText && \(
                        <div style=\{\{ marginTop: '8px', padding: '8px', background: 'rgba\(0,0,0,0\.2\)', borderRadius: '4px', fontSize: '0\.85rem', color: '#64748b' \}\}>
                          <strong>Texto Original \(Visible solo para Líderes\):<\/strong><br\/>
                          \{parsed\.originalText\}
                        <\/div>
                      \)\}"""
content = re.sub(original_block, "", content)

# Change canEdit so superusers cannot edit, ONLY author. And superuser can delete.
canedit_old = r"const canEdit = isSuperUser \|\| c\.autor_email === autorEmail;"
canedit_new = r"""const canEdit = c.autor_email === autorEmail;
                    const canDelete = isSuperUser || c.autor_email === autorEmail;"""
content = re.sub(canedit_old, canedit_new, content)

# Update the buttons logic
btn_old = r"""                          \{canEdit && !parsed\.isDeleted && \(
                            <span style=\{\{ marginLeft: '10px' \}\}>
                              <button onClick=\{\(\) => \{ setEditingCommentId\(c\.id\); setEditingCommentText\(parsed\.currentText\); \}\} style=\{\{ background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'0\.8rem' \}\}>Editar<\/button>
                              <button onClick=\{\(\) => handleDeleteComment\(c\.id, c\.texto\)\} style=\{\{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0\.8rem', marginLeft: '5px' \}\}>Eliminar<\/button>
                            <\/span>
                          \)\}"""

btn_new = r"""                          {!parsed.isDeleted && (
                            <span style={{ marginLeft: '10px' }}>
                              <button onClick={() => { setNuevoComentario(prev => prev + `@${c.autor_email.split('@')[0]}: `); setTimeout(() => textareaRef.current?.focus(), 100); }} style={{ background:'transparent', border:'none', color:'#10b981', cursor:'pointer', fontSize:'0.8rem' }}>Responder</button>
                              {canEdit && <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(parsed.currentText); }} style={{ background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'0.8rem', marginLeft: '5px' }}>Editar</button>}
                              {canDelete && <button onClick={() => handleDeleteComment(c.id, c.texto)} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem', marginLeft: '5px' }}>Eliminar</button>}
                            </span>
                          )}"""
content = re.sub(btn_old, btn_new, content)

# Attach ref to textarea
textarea_old = r"""                    <textarea 
                      placeholder="Escribe un comentario\.\.\." 
                      rows="2"
                      value=\{nuevoComentario\}"""
textarea_new = r"""                    <textarea 
                      ref={textareaRef}
                      placeholder="Escribe un comentario..." 
                      rows="2"
                      value={nuevoComentario}"""
content = re.sub(textarea_old, textarea_new, content)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)

print("Modal refactored successfully")
