import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { X, Layout, Edit2, Check, AlignLeft, CheckSquare, MessageSquare, Trash2, MessageCircle, Users, AlertTriangle, Archive, Paperclip, Upload, FileText, DownloadCloud, DollarSign } from 'lucide-react';
import styles from './ProjectDetailModal.module.scss';
import AssignEmployeeSelect from './AssignEmployeeSelect';
import imageCompression from 'browser-image-compression';
import { logAudit } from '../../utils/audit';
import LevantamientoFormModal from './LevantamientoFormModal';

export default function ProjectDetailModal({ proyectoId, estados, onClose, onProjectUpdated, onProjectDeleted, session }) {
  const [proyecto, setProyecto] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [cargando, setCargando] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showLevantamiento, setShowLevantamiento] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);

  const autorEmail = session?.user?.email || 'Usuario';

  const [msg, setMsg] = useState({ text: '', type: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const fetchDatos = async () => {
      const { data: proyData, error: proyError } = await supabase.from('proyectos').select('*').eq('id', proyectoId).single();
      if (!proyError && proyData) {
        setProyecto(proyData);
      }
      
      const { data: comData, error: comError } = await supabase.from('comentarios').select('*').eq('proyecto_id', proyectoId).order('fecha_creacion', { ascending: false });
      if (!comError && comData) {
        setComentarios(comData);
      }
      setCargando(false);
    };
    fetchDatos();
  }, [proyectoId]);

  const handleAddComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    const { data, error } = await supabase.from('comentarios').insert([{
      proyecto_id: proyectoId,
      texto: nuevoComentario,
      autor_email: autorEmail
    }]).select();

    if (!error && data) {
      setComentarios([data[0], ...comentarios]);
      setNuevoComentario('');
    } else {
      console.error(error);
      setMsg({ text: 'Aún no existe la tabla comentarios o hubo un error.', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  const handleChange = async (field, value) => {
    setProyecto(prev => ({ ...prev, [field]: value }));
    const { error } = await supabase.from('proyectos').update({ [field]: value }).eq('id', proyectoId);
    if (!error) {
      onProjectUpdated({ ...proyecto, [field]: value });
      logAudit(session, 'Editó campo de proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, campo: field, valor: value });
    }
  };

  const handleMultipleChange = async (updates) => {
    setProyecto(prev => ({ ...prev, ...updates }));
    const { error } = await supabase.from('proyectos').update(updates).eq('id', proyectoId);
    if (!error) {
      onProjectUpdated({ ...proyecto, ...updates });
      logAudit(session, 'Editó múltiples campos de proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, campos_actualizados: Object.keys(updates) });
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('proyectos').delete().eq('id', proyectoId);
    if (!error) {
      logAudit(session, 'Eliminó proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo });
      onProjectDeleted(proyectoId);
      onClose();
    } else {
      setMsg({ text: 'Error al eliminar', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  const handleWhatsAppCliente = () => {
    if (!proyecto.cliente_telefono || proyecto.cliente_telefono.trim() === '') {
      setMsg({ text: 'No hay un teléfono registrado para este cliente.', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }
    const tel = proyecto.cliente_telefono.replace(/[^0-9]/g, '');
    const mensaje = `Hola, te escribo de Globals respecto a tu proyecto "${proyecto.titulo}".`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleWhatsAppEquipo = () => {
    const mensaje = `🚨 *Aviso de Proyecto*\nEl proyecto "${proyecto.titulo}" está en la etapa "${proyecto.estado}". Por favor revisemos los siguientes pasos.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleFileUpload = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setMsg({ text: 'Comprimiendo...', type: 'info' });

    if (file.type.startsWith('image/')) {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true
        };
        const compressedBlob = await imageCompression(file, options);
        file = new File([compressedBlob], file.name, { type: compressedBlob.type });
      } catch (err) {
        console.error("Error comprimiendo:", err);
      }
    }

    setMsg({ text: 'Subiendo...', type: 'info' });

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${proyectoId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('archivos_proyectos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('archivos_proyectos')
        .getPublicUrl(filePath);

      const nuevoArchivo = {
        name: file.name,
        url: urlData.publicUrl,
        path: filePath,
        type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString()
      };

      const archivosActualizados = [...(proyecto.archivos || []), nuevoArchivo];
      
      setProyecto(prev => ({ ...prev, archivos: archivosActualizados }));
      await handleChange('archivos', archivosActualizados);
      
      setMsg({ text: 'Archivo subido con éxito', type: 'success' });
    } catch (error) {
      console.error(error);
      setMsg({ text: 'Error al subir archivo', type: 'error' });
    } finally {
      setUploadingFile(false);
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  const handleFileDelete = async (fileObj) => {
    try {
      const { error: deleteError } = await supabase.storage
        .from('archivos_proyectos')
        .remove([fileObj.path]);

      if (deleteError) throw deleteError;

      const archivosActualizados = (proyecto.archivos || []).filter(a => a.path !== fileObj.path);
      
      setProyecto(prev => ({ ...prev, archivos: archivosActualizados }));
      await handleChange('archivos', archivosActualizados);

      setMsg({ text: 'Archivo eliminado', type: 'success' });
    } catch (error) {
      console.error(error);
      setMsg({ text: 'Error al eliminar archivo', type: 'error' });
    } finally {
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    }
  };

  if (cargando || !proyecto) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <p>Cargando detalles...</p>
        </div>
      </div>
    );
  }

  // Calculamos progreso del checklist
  const mats = proyecto.materiales || [];
  const totalChecks = mats.length;
  const checkedCount = mats.filter(m => m.comprado).length;
  const progressPercent = totalChecks === 0 ? 0 : (checkedCount / totalChecks) * 100;

  // Calculamos días estancado
  const hoy = new Date();
  const fechaUltima = new Date(proyecto.fecha_ultima_actualizacion);
  const diasEstancado = Math.floor((hoy - fechaUltima) / (1000 * 60 * 60 * 24));
  const esEstancado = diasEstancado >= 3;

  // Calculamos Rentabilidad
  const presupuestoVendido = Number(proyecto.presupuesto_vendido) || 0;
  const costoMateriales = Number(proyecto.costo_materiales) || 0;
  const costoOperativo = Number(proyecto.costo_operativo) || 0;
  const gananciaNeta = presupuestoVendido - costoMateriales - costoOperativo;
  const margenRentabilidad = presupuestoVendido > 0 ? ((gananciaNeta / presupuestoVendido) * 100).toFixed(1) : 0;
  
  const userRole = session?.user?.user_metadata?.rol;
  const canViewFinances = userRole === 'Administración' || userRole === 'Administrador' || userRole === 'Líder Comercial';
  if (showLevantamiento) {
    return (
      <LevantamientoFormModal 
        proyecto={proyecto} 
        session={session}
        onProjectUpdated={(updatedProject) => {
          setProyecto(updatedProject);
          onProjectUpdated(updatedProject);
        }}
        onClose={() => setShowLevantamiento(false)} 
      />
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.btnClose} onClick={onClose}>
          <X size={24} />
        </button>

        {/* HEADER */}
        <div className={styles.header}>
          <Layout className={styles.icon} size={24} />
          <div className={styles.titleWrapper}>
            <input 
              type="text" 
              className={styles.titleInput} 
              value={proyecto.titulo} 
              onChange={(e) => setProyecto(prev => ({ ...prev, titulo: e.target.value }))}
              onBlur={(e) => handleChange('titulo', e.target.value)}
            />
            <p className={styles.subtitle}>
              en la lista 
              <select 
                value={proyecto.estado} 
                onChange={(e) => handleChange('estado', e.target.value)}
              >
                {estados.map(est => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </p>
          </div>
        </div>
        
        {esEstancado && (
          <div className={styles.stalledAlert}>
            <AlertTriangle size={18} />
            <span>Este proyecto no ha tenido movimiento en <strong>{diasEstancado} días</strong>.</span>
          </div>
        )}

        <div className={styles.content}>
          {/* COLUMNA PRINCIPAL */}
          <div className={styles.mainCol}>
            {/* INFO DEL CLIENTE */}
            <div className={styles.section}>
              <div className={styles.sectionContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Datos del Cliente</h3>
                  <button 
                    onClick={() => setIsEditingClient(!isEditingClient)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}
                  >
                    {isEditingClient ? <Check size={18} color="#22c55e" /> : <Edit2 size={18} />}
                  </button>
                </div>
                
                {isEditingClient ? (
                  <div className={styles.clientInfoBox} style={{ border: 'none', padding: 0, margin: 0, background: 'transparent' }}>
                    <div className={styles.clientField}>
                      <label>Cliente:</label>
                      <input 
                        type="text" 
                        value={proyecto.cliente_nombre || ''} 
                        placeholder="Nombre del Cliente"
                        onChange={(e) => setProyecto(prev => ({ ...prev, cliente_nombre: e.target.value }))}
                        onBlur={(e) => handleChange('cliente_nombre', e.target.value)}
                      />
                    </div>
                    <div className={styles.clientField}>
                      <label>Empresa:</label>
                      <input 
                        type="text" 
                        value={proyecto.cliente_empresa || ''} 
                        placeholder="Nombre de Empresa"
                        onChange={(e) => setProyecto(prev => ({ ...prev, cliente_empresa: e.target.value }))}
                        onBlur={(e) => handleChange('cliente_empresa', e.target.value)}
                      />
                    </div>
                    <div className={styles.clientField}>
                      <label>Teléfono:</label>
                      <input 
                        type="text" 
                        value={proyecto.cliente_telefono || ''} 
                        placeholder="Número (Ej: +58414...)"
                        onChange={(e) => setProyecto(prev => ({ ...prev, cliente_telefono: e.target.value }))}
                        onBlur={(e) => handleChange('cliente_telefono', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Cliente</span>
                      <span style={{ color: '#0f172a' }}>{proyecto.cliente_nombre || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Empresa</span>
                      <span style={{ color: '#0f172a' }}>{proyecto.cliente_empresa || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Teléfono</span>
                      <span style={{ color: '#0f172a' }}>{proyecto.cliente_telefono || '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className={styles.section}>
              <div className={styles.sectionContent}>
                <h3><AlignLeft className={styles.icon} size={20} /> Descripción</h3>
                <textarea 
                  className={styles.textareaBox}
                  placeholder="Añadir una descripción más detallada..."
                  value={proyecto.notas || ''}
                  onChange={(e) => setProyecto(prev => ({ ...prev, notas: e.target.value }))}
                  onBlur={(e) => handleChange('notas', e.target.value)}
                />
              </div>
            </div>

            {/* CHECKLIST DE MATERIALES */}
            <div className={styles.section}>
              <div className={styles.sectionContent}>
                <h3><CheckSquare className={styles.icon} size={20} /> Lista de Materiales y Tareas</h3>
                
                <div className={styles.progressBar}>
                  <div 
                    className={`${styles.progressFill} ${progressPercent === 100 ? styles.progressComplete : ''}`} 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                <div className={styles.checklist}>
                  {(proyecto.materiales || []).map((mat, index) => (
                    <label key={index} className={styles.checkItem}>
                      <input 
                        type="checkbox" 
                        checked={mat.comprado || false} 
                        onChange={async (e) => {
                          const mats = (proyecto.materiales || []).map(m => ({...m}));
                          mats[index].comprado = e.target.checked;
                          
                          let isAllBought = false;
                          if (mats.length > 0 && mats.every(m => m.comprado)) {
                            isAllBought = true;
                          }

                          await handleMultipleChange({ materiales: mats, materiales_comprados: isAllBought });
                        }}
                      />
                      <span className={mat.comprado ? styles.checkedText : ''}>{mat.nombre}</span>
                      <button className={styles.btnDeleteMat} onClick={async (e) => {
                        e.preventDefault();
                        const mats = (proyecto.materiales || []).filter((_, i) => i !== index);
                        
                        let isAllBought = false;
                        if (mats.length > 0 && mats.every(m => m.comprado)) {
                          isAllBought = true;
                        }
                        
                        await handleMultipleChange({ materiales: mats, materiales_comprados: isAllBought });
                      }}><Trash2 size={14}/></button>
                    </label>
                  ))}
                </div>

                <div className={styles.addMaterialBox}>
                  <input 
                    type="text" 
                    placeholder="Ej. Acrílico 3mm..."
                    id="new-material-input"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.target.value.trim()) {
                          const mats = [...(proyecto.materiales || []), { nombre: e.target.value.trim(), comprado: false }];
                          await handleMultipleChange({ materiales: mats, materiales_comprados: false });
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button onClick={async () => {
                    const input = document.getElementById('new-material-input');
                    if (input.value.trim()) {
                      const mats = [...(proyecto.materiales || []), { nombre: input.value.trim(), comprado: false }];
                      await handleMultipleChange({ materiales: mats, materiales_comprados: false });
                      input.value = '';
                    }
                  }}>Agregar</button>
                </div>

                <div className={styles.checklist} style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <label className={styles.checkItem}>
                    <input 
                      type="checkbox" 
                      checked={proyecto.presupuesto_aprobado} 
                      onChange={(e) => handleChange('presupuesto_aprobado', e.target.checked)}
                    />
                    <span>Presupuesto aprobado por el cliente</span>
                  </label>
                  <label className={styles.checkItem}>
                    <input 
                      type="checkbox" 
                      checked={proyecto.materiales_comprados} 
                      onChange={(e) => handleChange('materiales_comprados', e.target.checked)}
                    />
                    <span>Material en almacén verificado / comprado</span>
                  </label>
                </div>
              </div>
            </div>

            
            <button 
              className={styles.toggleMoreBtn} 
              onClick={() => setShowMoreInfo(!showMoreInfo)}
            >
              {showMoreInfo ? 'Ocultar información adicional' : 'Ver más información (Archivos, Finanzas, etc.)'}
            </button>

            {showMoreInfo && (
              <>
                        {!['Nuevo', 'Contactado', 'Cotizando'].includes(proyecto.estado) && (
              <div className={styles.section} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div className={styles.sectionContent}>
                <h3 style={{ color: '#1e3a8a' }}><FileText className={styles.icon} size={20} style={{ color: '#2563eb' }} /> Hoja de Levantamiento de Trabajo</h3>
                  <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '0.75rem' }}>
                    Este proyecto está en fase de levantamiento. Haz clic para llenar el formato oficial.
                  </p>
                  <button 
                    className={styles.actionButton} 
                    style={{ background: '#3b82f6', color: 'white', borderColor: '#2563eb' }}
                    onClick={() => setShowLevantamiento(true)}
                  >
                    <FileText size={16} /> Llenar Hoja de Levantamiento
                  </button>
                </div>
              </div>
            )}


            {/* FINANZAS Y RENTABILIDAD (Solo Admin / Lider) */}
            {canViewFinances && (
              <div className={styles.section}>
                <div className={styles.sectionContent}>
                <h3><DollarSign className={styles.icon} size={20} /> Costos y Rentabilidad (Privado)</h3>
                  
                  <div className={styles.financeGrid}>
                    <div className={styles.financeField}>
                      <label>Presupuesto Vendido ($)</label>
                      <input 
                        type="number" 
                        value={proyecto.presupuesto_vendido || ''}
                        onChange={e => setProyecto(prev => ({...prev, presupuesto_vendido: e.target.value}))}
                        onBlur={e => handleChange('presupuesto_vendido', Number(e.target.value) || 0)}
                        placeholder="Ej. 1000"
                      />
                    </div>
                    <div className={styles.financeField}>
                      <label>Costo Materiales ($)</label>
                      <input 
                        type="number" 
                        value={proyecto.costo_materiales || ''}
                        onChange={e => setProyecto(prev => ({...prev, costo_materiales: e.target.value}))}
                        onBlur={e => handleChange('costo_materiales', Number(e.target.value) || 0)}
                        placeholder="Ej. 400"
                      />
                    </div>
                    <div className={styles.financeField}>
                      <label>Costo Operativo/Instalación ($)</label>
                      <input 
                        type="number" 
                        value={proyecto.costo_operativo || ''}
                        onChange={e => setProyecto(prev => ({...prev, costo_operativo: e.target.value}))}
                        onBlur={e => handleChange('costo_operativo', Number(e.target.value) || 0)}
                        placeholder="Ej. 150"
                      />
                    </div>
                  </div>

                  <div className={styles.financeSummary}>
                    <div className={styles.summaryItem}>
                      <span>Ganancia Neta:</span>
                      <strong className={gananciaNeta >= 0 ? styles.positive : styles.negative}>${gananciaNeta.toLocaleString()}</strong>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>Margen de Rentabilidad:</span>
                      <strong className={margenRentabilidad >= 30 ? styles.positive : (margenRentabilidad >= 0 ? styles.warningText : styles.negative)}>
                        {margenRentabilidad}%
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ARCHIVOS ADJUNTOS */}
            <div className={styles.section}>
              <div className={styles.sectionContent}>
                <h3><Paperclip className={styles.icon} size={20} /> Archivos y Bocetos</h3>
                
                <div className={styles.filesList}>
                  {(proyecto.archivos || []).map((file, idx) => (
                    <div key={idx} className={styles.fileCard}>
                      {file.type && file.type.startsWith('image/') ? (
                        <div className={styles.filePreview} style={{ backgroundImage: `url(${file.url})` }} />
                      ) : (
                        <div className={styles.filePreviewIcon}><FileText size={24}/></div>
                      )}
                      <div className={styles.fileInfo}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.fileName}>{file.name}</a>
                        <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className={styles.fileActions}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer"><DownloadCloud size={16}/></a>
                        <button onClick={() => handleFileDelete(file)}><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                  {(proyecto.archivos || []).length === 0 && (
                    <p className={styles.noFiles}>No hay archivos adjuntos.</p>
                  )}
                </div>

                <div className={styles.uploadBox}>
                  <input 
                    type="file" 
                    id="fileUpload" 
                    onChange={handleFileUpload} 
                    style={{display: 'none'}}
                    disabled={uploadingFile}
                  />
                  <label htmlFor="fileUpload" className={styles.uploadBtn}>
                    {uploadingFile ? <span className={styles.spinner}></span> : <><Upload size={16}/> Subir Archivo</>}
                  </label>
                </div>
              </div>
            </div>

            {/* COMENTARIOS */}
            <div className={styles.section}>
              <div className={styles.sectionContent}>
                <h3><MessageSquare className={styles.icon} size={20} /> Comentarios y Actividad</h3>
                
                <form onSubmit={handleAddComentario} className={styles.commentForm}>
                  <div className={styles.commentBox}>
                    <textarea 
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
                  {comentarios.map(c => (
                    <div key={c.id} className={styles.commentItem}>
                      <div className={styles.commentHeader}>
                        <strong>{c.autor_email || 'Usuario'}</strong>
                        <span>{new Date(c.fecha_creacion).toLocaleString()}</span>
                      </div>
                      <p className={styles.commentText}>{c.texto}</p>
                    </div>
                  ))}
                  {comentarios.length === 0 && (
                    <p className={styles.noComments}>No hay actividad reciente en este proyecto.</p>
                  )}
                </div>
              </div>
            </div>
            </>
            )}
          </div>

          {/* SIDEBAR (Acciones) */}
          <div className={styles.sidebar}>
            {msg.text && (
              <div className={`${styles.msgBanner} ${styles[msg.type]}`}>
                {msg.text}
              </div>
            )}

            <h4>Encargados</h4>
            <div className={styles.encargadosList}>
              {(proyecto.encargados || []).map((enc, idx) => (
                <div key={idx} className={styles.encargadoTag}>
                  <span className={styles.encName}>{enc.nombre}</span>
                  <span className={styles.encRole}>{enc.rol}</span>
                  {(userRole === 'Líder Comercial' || (proyecto.encargados || []).some(e => e.id === session?.user?.id)) && (
                    <button onClick={async () => {
                      const encs = (proyecto.encargados || []).filter((_, i) => i !== idx);
                      setProyecto(prev => ({ ...prev, encargados: encs }));
                      await handleChange('encargados', encs);
                    }}><X size={12}/></button>
                  )}
                </div>
              ))}
              {(proyecto.encargados || []).length === 0 && <p className={styles.noEncargados}>Nadie asignado aún.</p>}
            </div>

            {(userRole === 'Líder Comercial' || (proyecto.encargados || []).some(e => e.id === session?.user?.id)) && (
              <AssignEmployeeSelect 
                onSelect={async (newEnc) => {
                  const encs = [...(proyecto.encargados || []), newEnc];
                  setProyecto(prev => ({ ...prev, encargados: encs }));
                  await handleChange('encargados', encs);
                }}
              />
            )}

            <h4 style={{marginTop: '2rem'}}>Contacto y Avisos</h4>
            <button className={styles.actionButton} onClick={handleWhatsAppCliente}>
              <MessageCircle size={16} color="#25D366" /> Mensaje al Cliente
            </button>
            <button className={styles.actionButton} onClick={handleWhatsAppEquipo}>
              <Users size={16} /> Avisar al Equipo
            </button>

            <h4 style={{ marginTop: '1rem' }}>Acciones</h4>
            {proyecto.estado !== 'Archivado' && (
              <button 
                className={`${styles.actionButton} ${styles.warning}`} 
                onClick={async () => {
                  await handleChange('estado', 'Archivado');
                  onProjectUpdated({ ...proyecto, estado: 'Archivado' });
                  onClose();
                }}
                style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a', marginBottom: '0' }}
              >
                <Archive size={16} /> Archivar Proyecto
              </button>
            )}

            {!confirmDelete ? (
              <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Eliminar Proyecto
              </button>
            ) : (
              <div className={styles.confirmDeleteBox}>
                <p>¿Estás seguro de eliminar este proyecto?</p>
                <div className={styles.confirmActions}>
                  <button className={styles.btnCancel} onClick={() => setConfirmDelete(false)}>Cancelar</button>
                  <button className={styles.btnConfirm} onClick={handleDelete}>Sí, eliminar</button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

