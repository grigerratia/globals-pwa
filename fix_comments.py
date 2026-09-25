import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# Add states
old_states = """  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');"""
new_states = """  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');"""
content = content.replace(old_states, new_states)

# Add edit/delete methods
new_methods = """
  const handleEditCommentSubmit = async (cId, oldRawText) => {
    if (!editingCommentText.trim()) return;
    let finalTexto = editingCommentText;
    const hasOriginal = oldRawText.match(/\\[ORIGINAL:[\\s\\S]*?\\]/);
    if (!hasOriginal) {
      finalTexto = `${editingCommentText}\\n[ORIGINAL: ${oldRawText}]`;
    } else {
      const orig = oldRawText.match(/(\\[ORIGINAL:[\\s\\S]*?\\])/)[1];
      finalTexto = `${editingCommentText}\\n${orig}`;
    }
    const { error } = await supabase.from('comentarios').update({ texto: finalTexto }).eq('id', cId);
    if (!error) {
      fetchComentarios();
      setEditingCommentId(null);
    }
  };

  const handleDeleteComment = async (cId, oldRawText) => {
    if (!confirm('¿Seguro que deseas eliminar este comentario?')) return;
    const finalTexto = `[DELETED] ${oldRawText}`;
    const { error } = await supabase.from('comentarios').update({ texto: finalTexto }).eq('id', cId);
    if (!error) fetchComentarios();
  };

  const parseComment = (rawText) => {
    let isDeleted = false;
    let isEdited = false;
    let currentText = rawText || '';
    let originalText = '';

    if (currentText.includes('[DELETED] ')) {
      isDeleted = true;
      currentText = currentText.replace('\\[DELETED\\] ', '').trim();
    }

    const originalMatch = currentText.match(/\\[ORIGINAL:([\\s\\S]*?)\\]/);
    if (originalMatch) {
      isEdited = true;
      originalText = originalMatch[1].trim();
      currentText = currentText.replace(/\\[ORIGINAL:[\\s\\S]*?\\]/g, '').trim();
    }
    return { currentText, originalText, isEdited, isDeleted };
  };
"""

content = content.replace("const handleAddComentario = async (e) => {", new_methods + "\n  const handleAddComentario = async (e) => {")

# Replace render block
old_render = """                <div className={styles.commentsList}>
                  {comentarios.map(c => (
                    <div key={c.id} className={styles.commentItem}>
                      <div className={styles.commentHeader}>
                        <strong>{c.autor_email || 'Usuario'}</strong>
                        <span>{new Date(c.fecha_creacion).toLocaleString()}</span>
                      </div>
                      <p className={styles.commentText}>{c.texto}</p>
                    </div>
                  ))}"""
new_render = """                <div className={styles.commentsList}>
                  {comentarios.map(c => {
                    const parsed = parseComment(c.texto);
                    const isSuperUser = (userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones');
                    const canEdit = isSuperUser || c.autor_email === autorEmail;
                    
                    if (parsed.isDeleted && !isSuperUser) {
                      return (
                        <div key={c.id} className={styles.commentItem} style={{ opacity: 0.6 }}>
                          <div className={styles.commentHeader}>
                            <strong>{c.autor_email || 'Usuario'}</strong>
                            <span>{new Date(c.fecha_creacion).toLocaleString()}</span>
                          </div>
                          <p className={styles.commentText} style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                            (Mensaje eliminado)
                          </p>
                        </div>
                      );
                    }

                    return (
                    <div key={c.id} className={styles.commentItem} style={parsed.isDeleted ? { opacity: 0.6, borderLeft: '3px solid #ef4444' } : {}}>
                      <div className={styles.commentHeader}>
                        <strong>{c.autor_email || 'Usuario'}</strong>
                        <span>
                          {new Date(c.fecha_creacion).toLocaleString()}
                          {canEdit && !parsed.isDeleted && (
                            <span style={{ marginLeft: '10px' }}>
                              <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(parsed.currentText); }} style={{ background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'0.8rem' }}>Editar</button>
                              <button onClick={() => handleDeleteComment(c.id, c.texto)} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem', marginLeft: '5px' }}>Eliminar</button>
                            </span>
                          )}
                        </span>
                      </div>
                      {editingCommentId === c.id ? (
                        <div style={{ marginTop: '10px' }}>
                          <textarea 
                            value={editingCommentText}
                            onChange={e => setEditingCommentText(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                          />
                          <div style={{ marginTop: '5px' }}>
                            <button onClick={() => handleEditCommentSubmit(c.id, c.texto)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Guardar</button>
                            <button onClick={() => setEditingCommentId(null)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <p className={styles.commentText}>
                          {parsed.isDeleted ? <span style={{color: '#ef4444', fontWeight: 'bold'}}>(ELIMINADO) </span> : null}
                          {parsed.currentText}
                          {parsed.isEdited && !parsed.isDeleted && <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#94a3b8', marginLeft: '8px' }}>(Mensaje editado)</span>}
                        </p>
                      )}
                      
                      {isSuperUser && (parsed.isEdited || parsed.isDeleted) && parsed.originalText && (
                        <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                          <strong>Texto Original (Visible solo para Líderes):</strong><br/>
                          {parsed.originalText}
                        </div>
                      )}
                    </div>
                  )})}"""

content = content.replace(old_render, new_render)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
