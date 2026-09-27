import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# Add replyingTo state
states_old = """  const [editingCommentText, setEditingCommentText] = useState('');
  const [cargando, setCargando] = useState(true);"""
states_new = """  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [cargando, setCargando] = useState(true);"""
content = content.replace(states_old, states_new)

# Modify handleAddComentario to inject tag
add_old = """    const { data, error } = await supabase.from('comentarios').insert([{
      proyecto_id: proyectoId,
      texto: nuevoComentario,
      autor_email: autorEmail
    }]).select();

    if (!error && data) {
      setComentarios([data[0], ...comentarios]);
      setNuevoComentario('');
    }"""
add_new = """    const finalString = replyingTo ? `[REPLY_TO:${replyingTo.id}] ${nuevoComentario}` : nuevoComentario;
    const { data, error } = await supabase.from('comentarios').insert([{
      proyecto_id: proyectoId,
      texto: finalString,
      autor_email: autorEmail
    }]).select();

    if (!error && data) {
      // Realtime listener will handle adding to list, but we can do it optimistically too.
      // Actually, if we do it optimistically, we might get duplicates if realtime fires too fast.
      // For now, let's keep it optimistic but check for duplicates, or just rely on realtime? 
      // The user said realtime didn't work, so keep optimistic.
      setComentarios(prev => prev.some(c => c.id === data[0].id) ? prev : [data[0], ...prev]);
      setNuevoComentario('');
      setReplyingTo(null);
    }"""
content = content.replace(add_old, add_new)

# Modify parseComment to extract replyId
parse_old = """    let isDeleted = false;
    let isEdited = false;
    let currentText = rawText || '';
    let originalText = '';

    if (currentText.includes('[DELETED] ')) {"""
parse_new = """    let isDeleted = false;
    let isEdited = false;
    let currentText = rawText || '';
    let originalText = '';
    let replyToId = null;

    const replyMatch = currentText.match(/\\[REPLY_TO:(.*?)\\] /);
    if (replyMatch) {
      replyToId = replyMatch[1];
      currentText = currentText.replace(/\\[REPLY_TO:.*?\\] /, '');
    }

    if (currentText.includes('[DELETED] ')) {"""
content = content.replace(parse_old, parse_new)
content = content.replace("return { currentText, originalText, isEdited, isDeleted };", "return { currentText, originalText, isEdited, isDeleted, replyToId };")

# Restructure the render block
# We will build a threaded list.
render_old = """                <form onSubmit={handleAddComentario} className={styles.commentForm}>
                  <div className={styles.commentBox}>
                    <textarea 
                      ref={textareaRef}
                      placeholder="Escribe un comentario..." 
                      rows="2"
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComentario(e);
                        }
                      }}
                    />
                  </div>
                  <button type="submit" className={styles.btnSubmitComment} disabled={!nuevoComentario.trim()}>
                    Guardar
                  </button>
                </form>

                <div className={styles.commentsList}>
                  {comentarios.map(c => {
                    const parsed = parseComment(c.texto);
                    const isSuperUser = (userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones');
                    const canEdit = c.autor_email === autorEmail;
                    const canDelete = isSuperUser || c.autor_email === autorEmail;
                    
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
                          {!parsed.isDeleted && (
                            <span style={{ marginLeft: '10px' }}>
                              <button onClick={() => { setNuevoComentario(prev => prev + `@${c.autor_email.split('@')[0]}: `); setTimeout(() => textareaRef.current?.focus(), 100); }} style={{ background:'transparent', border:'none', color:'#10b981', cursor:'pointer', fontSize:'0.8rem' }}>Responder</button>
                              {canEdit && <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(parsed.currentText); }} style={{ background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'0.8rem', marginLeft: '5px' }}>Editar</button>}
                              {canDelete && <button onClick={() => handleDeleteComment(c.id, c.texto)} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem', marginLeft: '5px' }}>Eliminar</button>}
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
                      
                    </div>
                  )})}
                  {comentarios.length === 0 && (
                    <p className={styles.noComments}>No hay actividad reciente en este proyecto.</p>
                  )}
                </div>"""

# New render using grouping
# A helper function `renderCommentNode` will be built inside the render block
render_new = """                <form onSubmit={handleAddComentario} className={styles.commentForm}>
                  {replyingTo && (
                    <div style={{ background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <span>Respondiendo a <strong>{replyingTo.email}</strong></span>
                      <button type="button" onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>✕ Cancelar</button>
                    </div>
                  )}
                  <div className={styles.commentBox} style={replyingTo ? { borderRadius: '0 0 8px 8px', borderTop: 'none' } : {}}>
                    <textarea 
                      ref={textareaRef}
                      placeholder={replyingTo ? "Escribe tu respuesta..." : "Escribe un comentario..."}
                      rows="2"
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComentario(e);
                        }
                      }}
                    />
                  </div>
                  <button type="submit" className={styles.btnSubmitComment} disabled={!nuevoComentario.trim()}>
                    {replyingTo ? 'Enviar Respuesta' : 'Guardar'}
                  </button>
                </form>

                <div className={styles.commentsList}>
                  {(() => {
                    const parsedMap = new Map();
                    comentarios.forEach(c => parsedMap.set(c.id, { ...c, parsed: parseComment(c.texto) }));
                    
                    const roots = [];
                    const childrenMap = new Map();
                    
                    // Organize tree
                    comentarios.forEach(c => {
                      const parsed = parsedMap.get(c.id).parsed;
                      if (parsed.replyToId && parsedMap.has(parsed.replyToId)) {
                        if (!childrenMap.has(parsed.replyToId)) childrenMap.set(parsed.replyToId, []);
                        childrenMap.get(parsed.replyToId).push(c);
                      } else {
                        roots.push(c);
                      }
                    });

                    // Sort roots descending (newest first), but children ascending (oldest first under parent)
                    roots.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
                    
                    const isSuperUser = (userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones');

                    const renderNode = (c, depth = 0) => {
                      const pData = parsedMap.get(c.id);
                      const parsed = pData.parsed;
                      const canEdit = c.autor_email === autorEmail;
                      const canDelete = isSuperUser || c.autor_email === autorEmail;
                      
                      const marginLeft = depth > 0 ? `${depth * 20}px` : '0';
                      const borderLeft = depth > 0 ? '2px solid #334155' : (parsed.isDeleted ? '3px solid #ef4444' : 'none');

                      const replies = childrenMap.get(c.id) || [];
                      replies.sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));

                      if (parsed.isDeleted && !isSuperUser) {
                        return (
                          <div key={c.id}>
                            <div className={styles.commentItem} style={{ opacity: 0.6, marginLeft, borderLeft }}>
                              <div className={styles.commentHeader}>
                                <strong>{c.autor_email || 'Usuario'}</strong>
                                <span>{new Date(c.fecha_creacion).toLocaleString()}</span>
                              </div>
                              <p className={styles.commentText} style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                                (Mensaje eliminado)
                              </p>
                            </div>
                            {replies.map(r => renderNode(r, depth + 1))}
                          </div>
                        );
                      }

                      return (
                        <div key={c.id}>
                          <div className={styles.commentItem} style={{ marginLeft, borderLeft, opacity: parsed.isDeleted ? 0.6 : 1, ...(parsed.isDeleted && depth === 0 ? { borderLeft: '3px solid #ef4444' } : {}) }}>
                            <div className={styles.commentHeader}>
                              <strong>{c.autor_email || 'Usuario'}</strong>
                              <span>
                                {new Date(c.fecha_creacion).toLocaleString()}
                                {!parsed.isDeleted && (
                                  <span style={{ marginLeft: '10px' }}>
                                    <button onClick={() => { setReplyingTo({ id: c.id, email: c.autor_email }); setTimeout(() => textareaRef.current?.focus(), 100); }} style={{ background:'transparent', border:'none', color:'#10b981', cursor:'pointer', fontSize:'0.8rem' }}>Responder</button>
                                    {canEdit && <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(parsed.currentText); }} style={{ background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'0.8rem', marginLeft: '5px' }}>Editar</button>}
                                    {canDelete && <button onClick={() => handleDeleteComment(c.id, c.texto)} style={{ background:'transparent', border:'none', color:'#ef4444', cursor:'pointer', fontSize:'0.8rem', marginLeft: '5px' }}>Eliminar</button>}
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
                          </div>
                          {replies.map(r => renderNode(r, depth + 1))}
                        </div>
                      );
                    };

                    return roots.map(r => renderNode(r, 0));
                  })()}
                  {comentarios.length === 0 && (
                    <p className={styles.noComments}>No hay actividad reciente en este proyecto.</p>
                  )}
                </div>"""

content = content.replace(render_old, render_new)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)

