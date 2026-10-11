import { useState, useEffect, useRef } from 'react';
import { validateProjectMove } from '../../utils/kanbanRules';
import { supabase } from '../../supabase';
import { X, XCircle, Layout, Edit2, Check, AlignLeft, CheckSquare, MessageSquare, Trash2, MessageCircle, Users, AlertTriangle, Archive, Paperclip, Upload, FileText, DownloadCloud, DollarSign } from 'lucide-react';
import styles from './ProjectDetailModal.module.scss';
import AssignEmployeeSelect from './AssignEmployeeSelect';
import CustomSelect from '../CustomSelect/CustomSelect';
import imageCompression from 'browser-image-compression';
import { logAudit } from '../../utils/audit';
import LevantamientoFormModal from './LevantamientoFormModal';

const generateStorageFileName = (originalName) => {
  const fileExt = originalName.split('.').pop();
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
};

export default function ProjectDetailModal({ proyectoId, estados, onClose, onProjectUpdated, onProjectDeleted, session }) {
  const [proyecto, setProyecto] = useState(null);
  const proyectoRef = useRef(null);
  useEffect(() => {
    proyectoRef.current = proyecto;
  }, [proyecto]);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const textareaRef = useRef(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  const [showLevantamiento, setShowLevantamiento] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);

  const autorEmail = session?.user?.email || 'Usuario';

  const [msg, setMsg] = useState({ text: '', type: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [motivePrompt, setMotivePrompt] = useState(null);
  const [diasEstimadosPrompt, setDiasEstimadosPrompt] = useState(null);
  const [confirmPrompt, setConfirmPrompt] = useState(null);
  const [archiveMotive, setArchiveMotive] = useState('');
  const [cancelMotive, setCancelMotive] = useState('');

  const [empleadosList, setEmpleadosList] = useState([]);
  const [selectedMaterialEmpId, setSelectedMaterialEmpId] = useState('');
  const [manualMaterialEmpName, setManualMaterialEmpName] = useState('');

  const promptAutoAdvance = (nextColName, milestoneName, extraProjectData = {}) => {
    const matchedCol = estados?.find(e => e.toLowerCase() === nextColName.toLowerCase()) || nextColName;
    setConfirmPrompt({
      title: 'Hito Completado',
      message: `Has completado "${milestoneName}". ¿Deseas avanzar automáticamente este proyecto a la etapa "${matchedCol}"?`,
      confirmText: `Avanzar a ${matchedCol}`,
      cancelText: 'Mantener en fase actual',
      variant: 'primary',
      onConfirm: () => handleChange('estado', matchedCol, extraProjectData)
    });
  };

  useEffect(() => {
    const fetchDatos = async () => {
      const { data: proyData, error: proyError } = await supabase.from('proyectos').select('*').eq('id', proyectoId).single();
      if (!proyError && proyData) {
        setProyecto(proyData);
        proyectoRef.current = proyData;
      }
      
      const { data: comData, error: comError } = await supabase.from('comentarios').select('*').eq('proyecto_id', proyectoId).order('fecha_creacion', { ascending: false });
      if (!comError && comData) {
        setComentarios(comData);
      }

      const { data: empData } = await supabase.rpc('get_empleados');
      if (empData) {
        setEmpleadosList(empData);
      }

      setCargando(false);
    };
    fetchDatos();

    const channel = supabase.channel(`comentarios_${proyectoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comentarios', filter: `proyecto_id=eq.${proyectoId}` }, (payload) => {
         if (payload.eventType === 'INSERT') {
           setComentarios(prev => prev.some(c => c.id === payload.new.id) ? prev : [payload.new, ...prev]);
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
  }, [proyectoId]);

  
  const handleEditCommentSubmit = async (cId, oldRawText) => {
    if (!editingCommentText.trim()) return;
    let finalTexto = editingCommentText;
    const hasOriginal = oldRawText.match(/\[ORIGINAL:[\s\S]*?\]/);
    if (!hasOriginal) {
      finalTexto = `${editingCommentText}\n[ORIGINAL: ${oldRawText}]`;
    } else {
      const orig = oldRawText.match(/(\[ORIGINAL:[\s\S]*?\])/)[1];
      finalTexto = `${editingCommentText}\n${orig}`;
    }
    const { error } = await supabase.from('comentarios').update({ texto: finalTexto }).eq('id', cId);
    if (!error) {
      setComentarios(prev => prev.map(c => c.id === cId ? { ...c, texto: finalTexto } : c));
      setEditingCommentId(null);
    }
  };

  const handleDeleteComment = async (cId, oldRawText) => {
    setConfirmPrompt({
      title: 'Eliminar Comentario',
      message: '¿Estás seguro de que deseas eliminar este comentario?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: async () => {
        const finalTexto = `[DELETED] ${oldRawText}`;
        const { error } = await supabase.from('comentarios').update({ texto: finalTexto }).eq('id', cId);
        if (!error) setComentarios(prev => prev.map(c => c.id === cId ? { ...c, texto: finalTexto } : c));
      }
    });
  };

  const parseComment = (rawText) => {
    let isDeleted = false;
    let isEdited = false;
    let currentText = rawText || '';
    let originalText = '';
    let replyToId = null;

    const replyMatch = currentText.match(/\[REPLY_TO:(.*?)\] /);
    if (replyMatch) {
      replyToId = replyMatch[1];
      currentText = currentText.replace(/\[REPLY_TO:.*?\] /, '');
    }

    if (currentText.includes('[DELETED] ')) {
      isDeleted = true;
      currentText = currentText.replace('[DELETED] ', '').trim();
    }

    const originalMatch = currentText.match(/\[ORIGINAL:([\s\S]*?)\]/);
    if (originalMatch) {
      isEdited = true;
      originalText = originalMatch[1].trim();
      currentText = currentText.replace(/\[ORIGINAL:[\s\S]*?\]/g, '').trim();
    }
    return { currentText, originalText, isEdited, isDeleted, replyToId };
  };

  const handleAddComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    const finalString = replyingTo ? `[REPLY_TO:${replyingTo.id}] ${nuevoComentario}` : nuevoComentario;
    const autorNombre = session?.user?.user_metadata?.nombre || session?.user?.user_metadata?.full_name || session?.user?.email || 'Usuario';
    const autorRol = session?.user?.user_metadata?.rol || '';
    
    let insertPayload = {
      proyecto_id: proyectoId,
      texto: finalString,
      autor_email: autorEmail,
      autor_nombre: autorNombre,
      autor_rol: autorRol
    };

    let { data, error } = await supabase.from('comentarios').insert([insertPayload]).select();

    // Fallback escalonado si autor_rol o autor_nombre no existen aún en Supabase
    if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('autor_'))) {
      delete insertPayload.autor_rol;
      let retry = await supabase.from('comentarios').insert([insertPayload]).select();
      if (retry.error && (retry.error.code === 'PGRST204' || retry.error.message?.includes('column') || retry.error.message?.includes('autor_'))) {
        delete insertPayload.autor_nombre;
        retry = await supabase.from('comentarios').insert([insertPayload]).select();
      }
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      setComentarios(prev => prev.some(c => c.id === data[0].id) ? prev : [data[0], ...prev]);
      setNuevoComentario('');
      setReplyingTo(null);
      await logAudit(session, "Añadió comentario a proyecto", { proyecto_id: proyectoId, titulo: proyecto.titulo });
    } else {
      console.error(error);
      setMsg({ text: 'Error al guardar comentario: ' + (error?.message || 'Error desconocido'), type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    }
  };

  const handleChange = async (field, value, extraCurrentProject = {}) => {
    const currentProy = { ...(proyectoRef.current || proyecto), ...extraCurrentProject };
    if (field === 'estado') {
       const validation = validateProjectMove(currentProy, value, estados, session);
       
       if (!validation.isValid) {
         setMsg({ text: validation.error, type: 'error' });
         setTimeout(() => setMsg({ text: '', type: '' }), 5000);
         return; // Revert select visual state (React state wasn't updated so it snaps back)
       }

       const executeStateChange = async (motive = null, notasExtras = null, overrideNotas = null) => {
         const updates = { estado: value };
         if (motive) updates.motivo_cancelacion = motive;
         else if (validation.requiresMotive === null) updates.motivo_cancelacion = null;
         
         if (overrideNotas !== null) {
           updates.notas = overrideNotas;
         } else if (notasExtras) {
           updates.notas = currentProy.notas ? currentProy.notas + '\n\n' + notasExtras : notasExtras;
         }

         updates.fecha_ultima_actualizacion = new Date().toISOString();
         updates.dias_estancado = 0;

         const updatedFull = { ...currentProy, ...updates };
         proyectoRef.current = updatedFull;
         setProyecto(updatedFull);
         const { error } = await supabase.from('proyectos').update(updates).eq('id', proyectoId);
         if (!error) {
           onProjectUpdated(updatedFull);
           await logAudit(session, 'Cambió estado de proyecto', { proyecto_id: proyectoId, titulo: currentProy.titulo, nuevo_estado: value });
           setMsg({ text: 'Estado actualizado', type: 'success' });
           setTimeout(() => setMsg({ text: '', type: '' }), 3000);
         }
       };

       if (validation.requiresMotive) {
         setMotivePrompt({
           title: `Motivo de ${validation.requiresMotive}`,
           onConfirm: (motive) => {
             executeStateChange(motive);
             setMotivePrompt(null);
           },
           onCancel: () => setMotivePrompt(null)
         });
       } else if (validation.isRetroceso) {
         setMotivePrompt({
           title: 'Motivo de Retroceso',
           onConfirm: (motive) => {
             const notaAnadida = `[RETROCESO] De "${currentProy.estado}" a "${value}": ${motive}`;
             executeStateChange(null, notaAnadida);
             setMotivePrompt(null);
           },
           onCancel: () => setMotivePrompt(null)
         });
       } else if (validation.requiresDias) {
         setDiasEstimadosPrompt({
           columna: value,
           error: null,
           onConfirm: (dias) => {
             if (currentProy.fecha_entrega) {
               const entrega = new Date(currentProy.fecha_entrega + 'T00:00:00');
               const estimadoDate = new Date();
               estimadoDate.setDate(estimadoDate.getDate() + dias);
               if (estimadoDate > entrega) {
                 setDiasEstimadosPrompt(prev => ({ ...prev, error: `Los días superan la fecha de entrega final (${currentProy.fecha_entrega}). Introduce un número menor.` }));
                 return;
               }
             }
             const notaAnadida = `[DÍAS ESTIMADOS FASE ACTUAL: ${dias}]`;
             let cleanNotas = currentProy.notas ? currentProy.notas.replace(/\[DÍAS ESTIMADOS FASE ACTUAL: \d+\]\n?/g, '').trim() : '';
             const nuevasNotas = cleanNotas ? cleanNotas + '\n\n' + notaAnadida : notaAnadida;
             executeStateChange(null, null, nuevasNotas);
             setDiasEstimadosPrompt(null);
           },
           onCancel: () => setDiasEstimadosPrompt(null)
         });
       } else {
         executeStateChange();
       }
    } else {
      const updates = { [field]: value, fecha_ultima_actualizacion: new Date().toISOString() };
      const updatedFull = { ...currentProy, ...updates };
      proyectoRef.current = updatedFull;
      setProyecto(updatedFull);
      const { error } = await supabase.from('proyectos').update(updates).eq('id', proyectoId);
      if (!error) {
        onProjectUpdated(updatedFull);
        const fname = {
          titulo: 'título', cliente_nombre: 'persona de contacto', cliente_empresa: 'empresa/cliente',
          cliente_telefono: 'teléfono', notas: 'notas/descripción', presupuesto_aprobado: 'estado de presupuesto',
          materiales_comprados: 'estado de materiales', presupuesto_vendido: 'presupuesto vendido',
          costo_materiales: 'costo de materiales', costo_operativo: 'costo operativo', encargados: 'encargados'
        }[field] || field;
        if (field !== 'presupuesto_aprobado' && field !== 'materiales_comprados') {
          await logAudit(session, `Actualizó ${fname} de proyecto`, { proyecto_id: proyectoId, titulo: currentProy.titulo });
        }
      } else {
        setMsg({ text: `Error al actualizar ${field}: ` + error.message, type: 'error' });
        setTimeout(() => setMsg({ text: '', type: '' }), 5000);
      }
    }
  };

  const handleMultipleChange = async (updates) => {
    updates.fecha_ultima_actualizacion = new Date().toISOString();
    const updatedFull = { ...(proyectoRef.current || proyecto), ...updates };
    proyectoRef.current = updatedFull;
    setProyecto(updatedFull);
    const { error } = await supabase.from('proyectos').update(updates).eq('id', proyectoId);
    if (!error) {
      onProjectUpdated(updatedFull);
      await logAudit(session, `Actualizó detalles de materiales`, { proyecto_id: proyectoId, titulo: updatedFull.titulo });
    } else {
      setMsg({ text: `Error al actualizar: ` + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };

  const handleSaveMaterialEncargados = async (updatedList) => {
    const currentProy = proyectoRef.current || proyecto;
    const updatedFull = {
      ...currentProy,
      encargados_materiales: updatedList,
      fecha_ultima_actualizacion: new Date().toISOString()
    };
    proyectoRef.current = updatedFull;
    setProyecto(updatedFull);

    // Intentamos actualizar directamente la columna encargados_materiales
    let { error } = await supabase.from('proyectos').update({
      encargados_materiales: updatedList,
      fecha_ultima_actualizacion: new Date().toISOString()
    }).eq('id', proyectoId);

    // Fallback si la columna no existe en Supabase (PGRST204)
    if (error && (error.code === 'PGRST204' || error.message?.includes('encargados_materiales'))) {
      console.warn("Columna encargados_materiales no encontrada, usando fallback en columna encargados:", error);
      const otherEncs = (currentProy.encargados || []).filter(e => !e.es_materiales && e.rol !== 'Materiales');
      const mergedEncs = [
        ...otherEncs,
        ...updatedList.map(e => ({ ...e, es_materiales: true }))
      ];
      const fbRes = await supabase.from('proyectos').update({
        encargados: mergedEncs,
        fecha_ultima_actualizacion: new Date().toISOString()
      }).eq('id', proyectoId);
      error = fbRes.error;
      if (!error) {
        const withMergedEncs = { ...updatedFull, encargados: mergedEncs };
        proyectoRef.current = withMergedEncs;
        setProyecto(withMergedEncs);
        onProjectUpdated(withMergedEncs);
        await logAudit(session, 'Actualizó encargados de materiales', { proyecto_id: proyectoId, titulo: currentProy.titulo });
        setMsg({ text: 'Encargados de materiales guardados', type: 'success' });
        setTimeout(() => setMsg({ text: '', type: '' }), 3500);
        return;
      }
    }

    if (!error) {
      onProjectUpdated(updatedFull);
      await logAudit(session, 'Actualizó encargados de materiales', { proyecto_id: proyectoId, titulo: currentProy.titulo });
      setMsg({ text: 'Encargados de materiales guardados', type: 'success' });
    } else {
      setMsg({ text: 'Error al guardar encargados: ' + error.message, type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  };

  const handleAddMaterialEncargado = async () => {
    if (!selectedMaterialEmpId) return;

    let newEnc;
    if (selectedMaterialEmpId === 'externo') {
      if (!manualMaterialEmpName.trim()) {
        setMsg({ text: 'Ingresa el nombre del encargado', type: 'error' });
        setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        return;
      }
      newEnc = { nombre: manualMaterialEmpName.trim(), rol: 'Externo' };
      setManualMaterialEmpName('');
    } else {
      const emp = empleadosList.find(e => e.id === selectedMaterialEmpId);
      if (!emp) return;
      newEnc = {
        id: emp.id,
        user_id: emp.id,
        nombre: emp.nombre || emp.email,
        email: emp.email,
        rol: emp.rol || 'Materiales',
        telefono: emp.telefono
      };
    }

    const currentList = (proyectoRef.current || proyecto)?.encargados_materiales || 
      ((proyectoRef.current || proyecto)?.encargados || []).filter(e => e.es_materiales || e.rol === 'Materiales');
    
    if (newEnc.user_id && currentList.some(e => (e.user_id || e.id) === newEnc.user_id)) {
      setMsg({ text: 'Esta persona ya está asignada como encargado de materiales', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }

    const updated = [...currentList, newEnc];
    setSelectedMaterialEmpId('');
    await handleSaveMaterialEncargados(updated);
  };

  const handleRemoveMaterialEncargado = async (indexToRemove) => {
    const currentList = (proyectoRef.current || proyecto)?.encargados_materiales || 
      ((proyectoRef.current || proyecto)?.encargados || []).filter(e => e.es_materiales || e.rol === 'Materiales');
    const updated = currentList.filter((_, idx) => idx !== indexToRemove);
    await handleSaveMaterialEncargados(updated);
  };

  const handleArchiveProject = async () => {
    if (!archiveMotive.trim()) {
      setMsg({ text: 'Debes ingresar un motivo de archivo', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }
    
    // Asegurarse de que el estado 'Archivado' exista en la tabla columnas para evitar el error de Foreign Key
    const { data: colData } = await supabase.from('columnas').select('nombre').eq('nombre', 'Archivado').single();
    if (!colData) {
      const { error: insErr } = await supabase.from('columnas').insert([{ nombre: 'Archivado', orden: 998 }]);
      if (insErr) {
        setMsg({ text: 'Error creando estado: ' + insErr.message, type: 'error' });
        setConfirmArchive(false);
        return;
      }
    }

    const currentNotas = proyecto.notas || '';
    const dateStr = new Date().toLocaleDateString();
    const notasActualizadas = currentNotas ? currentNotas + `\n\n[ARCHIVADO el ${dateStr}]: ${archiveMotive}` : `[ARCHIVADO el ${dateStr}]: ${archiveMotive}`;

    const { error } = await supabase.from('proyectos').update({ estado: 'Archivado', notas: notasActualizadas, motivo_cancelacion: archiveMotive, fecha_ultima_actualizacion: new Date().toISOString() }).eq('id', proyectoId);
    if (!error) {
      await logAudit(session, 'Archivó proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, motivo: archiveMotive });
      onProjectUpdated({ ...proyecto, estado: 'Archivado', notas: notasActualizadas, motivo_cancelacion: archiveMotive, fecha_ultima_actualizacion: new Date().toISOString() });
      setConfirmArchive(false);
      onClose();
    } else {
      console.error("Error al archivar:", error);
      setConfirmArchive(false);
      setMsg({ text: 'Error al archivar: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    }
  };

  const handleCancelProject = async () => {
    if (!cancelMotive.trim()) {
      setMsg({ text: 'Debes ingresar un motivo de cancelación', type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      return;
    }
    
    // Asegurarse de que el estado 'Cancelado' exista en la tabla columnas para evitar el error de Foreign Key
    const { data: colData } = await supabase.from('columnas').select('nombre').eq('nombre', 'Cancelado').single();
    if (!colData) {
      const { error: insErr } = await supabase.from('columnas').insert([{ nombre: 'Cancelado', orden: 999 }]);
      if (insErr) {
        setMsg({ text: 'Error creando estado: ' + insErr.message, type: 'error' });
        setConfirmDelete(false);        return;
      }
    }

    const { error } = await supabase.from('proyectos').update({ estado: 'Cancelado', motivo_cancelacion: cancelMotive }).eq('id', proyectoId);
    if (!error) {
      await logAudit(session, 'Canceló proyecto', { proyecto_id: proyectoId, titulo: proyecto.titulo, motivo: cancelMotive });
      onProjectDeleted(proyectoId);
      onClose();
    } else {
      console.error("Error al cancelar:", error);
      setConfirmDelete(false);
      setMsg({ text: 'Error al cancelar: ' + error.message, type: 'error' });
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
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

    const fileName = generateStorageFileName(file.name);
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
  
  const currentUserId = session?.user?.id;
  const currentUserEmail = session?.user?.email?.toLowerCase();
  const userRole = session?.user?.user_metadata?.rol;

  const isLiderAdmin = userRole === 'Administración' || 
                       userRole === 'Administrador' || 
                       userRole === 'Líder de Administración' || 
                       (typeof userRole === 'string' && userRole.toLowerCase().includes('administra'));

  const roleNormalized = (userRole || '').trim().toLowerCase();
  const isLiderComercial = roleNormalized === 'líder comercial' || roleNormalized === 'lider comercial';
  const isLiderOperativo = roleNormalized === 'líder de operaciones' || roleNormalized === 'lider de operaciones' || roleNormalized === 'líder operativo' || roleNormalized === 'lider operativo' || roleNormalized === 'operaciones';
  const isLiderProduccion = roleNormalized === 'líder de producción' || roleNormalized === 'lider de produccion' || roleNormalized === 'producción' || roleNormalized === 'produccion';

  const canAssignEncargados = isLiderComercial || isLiderOperativo || isLiderProduccion || isLiderAdmin;

  const encargadosMateriales = (proyecto.encargados_materiales && Array.isArray(proyecto.encargados_materiales))
    ? proyecto.encargados_materiales
    : (proyecto.encargados || []).filter(e => e.es_materiales || e.rol === 'Materiales');

  const isEncargadoMat = encargadosMateriales.some(enc => 
    (enc.user_id && enc.user_id === currentUserId) ||
    (enc.id && enc.id === currentUserId) ||
    (enc.email && currentUserEmail && enc.email.toLowerCase() === currentUserEmail)
  );

  const canCheckMateriales = isLiderAdmin || isEncargadoMat;
  const canViewFinances = userRole === 'Administración' || userRole === 'Administrador' || userRole === 'Líder Comercial';
  if (showLevantamiento) {
    return (
      <LevantamientoFormModal 
        proyecto={proyecto} 
        session={session}
        onProjectUpdated={(updatedProject) => {
          const wasInLevantamiento = (proyectoRef.current || proyecto)?.estado === 'Levantamiento';
          const hadNoLevantamiento = !(proyectoRef.current || proyecto)?.levantamiento_fecha;
          proyectoRef.current = updatedProject;
          setProyecto(updatedProject);
          onProjectUpdated(updatedProject);
          if (wasInLevantamiento && hadNoLevantamiento && updatedProject.levantamiento_fecha) {
            promptAutoAdvance('Presupuesto enviado', 'Hoja de Levantamiento guardada', { levantamiento_fecha: updatedProject.levantamiento_fecha });
          }
        }}
        onClose={() => setShowLevantamiento(false)} 
      />
    );
  }

  let diasEstimadosNota = null;
  if (proyecto && proyecto.notas) {
    const match = proyecto.notas.match(/\[DÍAS ESTIMADOS FASE ACTUAL: (\d+)\]/);
    if (match) {
      const diasTotales = parseInt(match[1], 10);
      const hoy = new Date();
      const ultima = new Date(proyecto.fecha_ultima_actualizacion || proyecto.fecha_creacion);
      const diff = Math.floor((hoy - ultima) / 86400000);
      let restantes = diasTotales - diff;
      diasEstimadosNota = restantes >= 0 ? restantes : 0;
    }
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
            <textarea 
              className={styles.titleInput} 
              value={proyecto.titulo} 
              rows={1}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }
              }}
              onChange={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                setProyecto(prev => ({ ...prev, titulo: e.target.value }));
              }}
              onBlur={(e) => handleChange('titulo', e.target.value)}
            />
            <p className={styles.subtitle}>
              en la lista 
              <CustomSelect 
                value={proyecto.estado} 
                options={estados}
                onChange={(val) => handleChange('estado', val)}
              />
            </p>
          </div>
        </div>
        
        {esEstancado && (
          <div className={styles.stalledAlert}>
            <AlertTriangle size={18} />
            <span>Este proyecto no ha tenido movimiento en <strong>{diasEstancado} días</strong>.</span>
          </div>
        )}

        {diasEstimadosNota !== null && (
           <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', borderLeft: '4px solid #3b82f6', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
             <span style={{ fontSize: '0.9rem', color: '#93c5fd', fontWeight: 500 }}>
               Días estimados para terminar esta fase: <strong style={{ color: '#ffffff' }}>{diasEstimadosNota} días</strong>
             </span>
           </div>
        )}

        {(proyecto.estado?.toLowerCase().includes('espera') || proyecto.estado?.toLowerCase().includes('pausa') || proyecto.estado === 'Archivado' || proyecto.estado === 'Cancelado') && proyecto.motivo_cancelacion && (
           <div style={{ padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px', borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo ({proyecto.estado})</span>
             <span style={{ fontSize: '0.95rem', color: '#f8fafc', fontStyle: 'italic', lineHeight: '1.4' }}>"{proyecto.motivo_cancelacion}"</span>
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
                      <label>Cliente (Empresa):</label>
                      <input 
                        type="text" 
                        value={proyecto.cliente_empresa || ''} 
                        placeholder="Ej. Hato Grill"
                        onChange={(e) => setProyecto(prev => ({ ...prev, cliente_empresa: e.target.value }))}
                        onBlur={(e) => handleChange('cliente_empresa', e.target.value)}
                      />

                      <label>Persona de Contacto:</label>
                      <input 
                        type="text" 
                        value={proyecto.cliente_nombre || ''} 
                        placeholder="Nombre del Contacto"
                        onChange={(e) => setProyecto(prev => ({ ...prev, cliente_nombre: e.target.value }))}
                        onBlur={(e) => handleChange('cliente_nombre', e.target.value)}
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
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Cliente (Empresa)</span>
                      <span style={{ color: '#0f172a' }}>{proyecto.cliente_empresa || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Persona de Contacto</span>
                      <span style={{ color: '#0f172a' }}>{proyecto.cliente_nombre || '—'}</span>
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
            <div className={styles.section} style={{ flexGrow: 1 }}>
              <div className={styles.sectionContent} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}><CheckSquare className={styles.icon} size={20} /> Lista de Materiales y Tareas</h3>
                  
                  {canCheckMateriales ? (
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Permiso para compras
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '12px', fontWeight: 500 }}>
                      Solo lectura
                    </span>
                  )}
                </div>

                {/* ENCARGADO(S) DE MATERIALES (Solo visible para Líder Comercial, Líder Operativo, Líder de Producción y Administración) */}
                {canAssignEncargados ? (
                  <div className={styles.materialsEncargadosBox}>
                    <div className={styles.materialsEncargadosHeader}>
                      <span className={styles.materialsEncargadosLabel}>
                        <Users size={15} /> Encargado(s) de Compras / Materiales:
                      </span>
                    </div>

                    <div className={styles.materialsEncargadosList}>
                      {encargadosMateriales.map((enc, idx) => (
                        <div key={idx} className={styles.materialsEncargadoChip}>
                          <span className={styles.chipName}>{enc.nombre}</span>
                          {enc.rol && <span className={styles.chipRole}>{enc.rol}</span>}
                          <button 
                            type="button" 
                            className={styles.chipRemoveBtn}
                            title="Quitar de encargados de materiales"
                            onClick={() => handleRemoveMaterialEncargado(idx)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {encargadosMateriales.length === 0 && (
                        <span className={styles.materialsNoEncargadosText}>
                          Sin comprador asignado aún.
                        </span>
                      )}
                    </div>

                    <div className={styles.materialsAssignRow}>
                      <select
                        value={selectedMaterialEmpId}
                        onChange={(e) => setSelectedMaterialEmpId(e.target.value)}
                        className={styles.materialsEmpSelect}
                      >
                        <option value="">+ Asignar comprador / encargado...</option>
                        {empleadosList
                          .filter(emp => !encargadosMateriales.some(enc => (enc.user_id || enc.id) === emp.id))
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.nombre || emp.email} ({emp.rol || 'General'})
                            </option>
                          ))
                        }
                        <option value="externo">+ Persona externa o personalizada...</option>
                      </select>

                      {selectedMaterialEmpId === 'externo' && (
                        <input 
                          type="text"
                          placeholder="Nombre del comprador..."
                          value={manualMaterialEmpName}
                          onChange={(e) => setManualMaterialEmpName(e.target.value)}
                          className={styles.materialsManualInput}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddMaterialEncargado();
                            }
                          }}
                        />
                      )}

                      {selectedMaterialEmpId && (
                        <button
                          type="button"
                          className={styles.materialsAssignBtn}
                          onClick={handleAddMaterialEncargado}
                        >
                          Asignar
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  encargadosMateriales.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <Users size={14} color="#3b82f6" />
                      <span>Encargado de compras: <strong style={{ color: '#0f172a' }}>{encargadosMateriales.map(e => e.nombre).join(', ')}</strong></span>
                    </div>
                  )
                )}
                
                <div className={styles.progressBar}>
                  <div 
                    className={`${styles.progressFill} ${progressPercent === 100 ? styles.progressComplete : ''}`} 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                <div className={styles.checklist}>
                  {(proyecto.materiales || []).map((mat, index) => (
                    <label 
                      key={index} 
                      className={`${styles.checkItem} ${!canCheckMateriales ? styles.disabledCheckItem : ''}`}
                      onClick={(e) => {
                        if (!canCheckMateriales) {
                          e.preventDefault();
                          setMsg({
                            text: 'Solo el encargado de materiales asignado o el Líder de Administración pueden marcar o desmarcar compras.',
                            type: 'error'
                          });
                          setTimeout(() => setMsg({ text: '', type: '' }), 4000);
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={mat.comprado || false} 
                        disabled={!canCheckMateriales}
                        title={!canCheckMateriales ? "Permiso requerido: Encargado de materiales o Líder de Administración" : ""}
                        onChange={async (e) => {
                          if (!canCheckMateriales) return;
                          const mats = (proyecto.materiales || []).map(m => ({...m}));
                          mats[index].comprado = e.target.checked;
                          
                          let isAllBought = false;
                          if (mats.length > 0 && mats.every(m => m.comprado)) {
                            isAllBought = true;
                          }

                          await handleMultipleChange({ materiales: mats, materiales_comprados: isAllBought });
                          const current = proyectoRef.current || proyecto;
                          if (isAllBought && current?.estado?.toLowerCase().includes('logística')) {
                            promptAutoAdvance('En fabricación', 'Materiales en almacén / comprados', { materiales: mats, materiales_comprados: true });
                          }
                        }}
                      />
                      <span className={mat.comprado ? styles.checkedText : ''}>{mat.nombre}</span>
                      {canCheckMateriales && (
                        <button className={styles.btnDeleteMat} onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const mats = (proyecto.materiales || []).filter((_, i) => i !== index);
                          
                          let isAllBought = false;
                          if (mats.length > 0 && mats.every(m => m.comprado)) {
                            isAllBought = true;
                          }
                          
                          await handleMultipleChange({ materiales: mats, materiales_comprados: isAllBought });
                          const current = proyectoRef.current || proyecto;
                          if (isAllBought && current?.estado?.toLowerCase().includes('logística')) {
                            promptAutoAdvance('En fabricación', 'Materiales en almacén / comprados', { materiales: mats, materiales_comprados: true });
                          }
                        }}><Trash2 size={14}/></button>
                      )}
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

                <div className={styles.checklist} style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <h4 style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Hitos Requeridos para Avanzar</h4>
                  
                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={!!proyecto.presupuesto_aprobado} onChange={async (e) => {
                      const checked = e.target.checked;
                      await handleChange('presupuesto_aprobado', checked);
                      const current = proyectoRef.current || proyecto;
                      if (checked && current?.estado?.toLowerCase().includes('presupuesto')) {
                        promptAutoAdvance('En Diseño', 'Presupuesto aprobado por el cliente', { presupuesto_aprobado: true });
                      }
                    }}/> <span>Presupuesto aprobado por el cliente</span>
                  </label>

                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={!!proyecto.diseno_terminado} onChange={async (e) => {
                      const checked = e.target.checked;
                      await handleChange('diseno_terminado', checked);
                      const current = proyectoRef.current || proyecto;
                      if (checked && current?.estado?.toLowerCase().includes('diseño')) {
                        promptAutoAdvance('Logística y compras', 'Diseño terminado', { diseno_terminado: true });
                      }
                    }}/> <span>Diseño terminado</span>
                  </label>
                  
                  <label 
                    className={`${styles.checkItem} ${!canCheckMateriales ? styles.disabledCheckItem : ''}`}
                    onClick={(e) => {
                      if (!canCheckMateriales) {
                        e.preventDefault();
                        setMsg({
                          text: 'Solo el encargado de materiales asignado o el Líder de Administración pueden marcar materiales comprados.',
                          type: 'error'
                        });
                        setTimeout(() => setMsg({ text: '', type: '' }), 4000);
                      }
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={!!proyecto.materiales_comprados} 
                      disabled={!canCheckMateriales}
                      title={!canCheckMateriales ? "Permiso requerido: Encargado de materiales o Líder de Administración" : ""}
                      onChange={async (e) => {
                        if (!canCheckMateriales) return;
                        const checked = e.target.checked;
                        await handleChange('materiales_comprados', checked);
                        const current = proyectoRef.current || proyecto;
                        if (checked && current?.estado?.toLowerCase().includes('logística')) {
                          promptAutoAdvance('En fabricación', 'Materiales en almacén / comprados', { materiales_comprados: true });
                        }
                      }}
                    /> <span>Material en almacén / comprado</span>
                  </label>

                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={!!proyecto.fabricado_listo} onChange={async (e) => {
                      const checked = e.target.checked;
                      await handleChange('fabricado_listo', checked);
                      const current = proyectoRef.current || proyecto;
                      if (checked && current?.estado?.toLowerCase().includes('fabricación')) {
                        promptAutoAdvance('Listo para instalación', 'Fabricado listo', { fabricado_listo: true });
                      }
                    }}/> <span>Fabricado listo</span>
                  </label>
                  
                  <div className={styles.checkItem} style={{ padding: '0.25rem 0' }}>
                    <span style={{ marginRight: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>📅 Fecha de Instalación:</span>
                    <input type="date" value={proyecto.fecha_instalacion || ''} onChange={async (e) => {
                      const val = e.target.value;
                      await handleChange('fecha_instalacion', val);
                      const current = proyectoRef.current || proyecto;
                      if (val && current?.estado?.toLowerCase().includes('listo para instalación')) {
                        promptAutoAdvance('En instalación', 'Fecha de instalación asignada', { fecha_instalacion: val });
                      }
                    }} style={{ padding: '0.2rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>

                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={!!proyecto.instalado} onChange={async (e) => {
                      const checked = e.target.checked;
                      await handleChange('instalado', checked);
                      const current = proyectoRef.current || proyecto;
                      if (checked && current?.estado?.toLowerCase().includes('en instalación')) {
                        promptAutoAdvance('Entregado', 'Instalación completada', { instalado: true });
                      }
                    }}/> <span>Instalado correctamente</span>
                  </label>

                  <label className={styles.checkItem}>
                    <input type="checkbox" checked={!!proyecto.pagado_completo} onChange={async (e) => {
                      const checked = e.target.checked;
                      await handleChange('pagado_completo', checked);
                      const current = proyectoRef.current || proyecto;
                      const est = current?.estado || '';
                      if (checked && (est === 'Entregado' || (est.toLowerCase().includes('entregado') && !est.toLowerCase().includes('cerrado')))) {
                        promptAutoAdvance('Pagado y cerrado', 'Pago cancelado por completo', { pagado_completo: true });
                      }
                    }}/> <span>Pago cancelado por completo</span>
                  </label>
                  
                </div>
              </div>
            </div>            

                        {!['Nuevo', 'Contactado', 'Cotizando', 'En Conversación'].includes(proyecto.estado) && (
              <div className={styles.section} style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div className={styles.sectionContent}>
                <h3 style={{ color: '#1e3a8a' }}><FileText className={styles.icon} size={20} style={{ color: '#2563eb' }} /> Hoja de Levantamiento de Trabajo</h3>
                  <p style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '0.75rem' }}>
                    Accede al formato oficial de levantamiento del proyecto.
                  </p>
                  <button 
                    className={styles.actionButton} 
                    style={{ background: '#3b82f6', color: 'white', borderColor: '#2563eb' }}
                    onClick={() => setShowLevantamiento(true)}
                  >
                    <FileText size={16} /> Ver/Editar Hoja de Levantamiento
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

                      const enc = (proyecto.encargados || []).find(e => (e.email && e.email === c.autor_email) || (e.nombre && e.nombre === c.autor_nombre));
                      const authorName = c.autor_nombre || enc?.nombre || (c.autor_email?.includes('@') ? c.autor_email.split('@')[0] : c.autor_email) || 'Usuario';
                      const authorRole = c.autor_rol || enc?.rol || (c.autor_email === session?.user?.email ? session?.user?.user_metadata?.rol : '') || (c.autor_email === 'Dinamo AI ✨' ? 'Asistente IA' : '');

                      if (parsed.isDeleted && !isSuperUser) {
                        return (
                          <div key={c.id}>
                            <div className={styles.commentItem} style={{ opacity: 0.6, marginLeft, borderLeft }}>
                              <div className={styles.commentHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <strong>{authorName}</strong>
                                  {authorRole && (
                                    <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                                      {authorRole}
                                    </span>
                                  )}
                                </div>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <strong>{authorName}</strong>
                                {authorRole && (
                                  <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                                    {authorRole}
                                  </span>
                                )}
                              </div>
                              <span>
                                {new Date(c.fecha_creacion).toLocaleString()}
                                {!parsed.isDeleted && (
                                  <span style={{ marginLeft: '10px' }}>
                                    <button onClick={() => { setReplyingTo({ id: c.id, email: authorName }); setTimeout(() => textareaRef.current?.focus(), 100); }} style={{ background:'transparent', border:'none', color:'#10b981', cursor:'pointer', fontSize:'0.8rem' }}>Responder</button>
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
                              <>
                                <p className={styles.commentText}>
                                  {parsed.isDeleted ? <span style={{color: '#ef4444', fontWeight: 'bold'}}>(ELIMINADO) </span> : null}
                                  {parsed.currentText}
                                  {parsed.isEdited && !parsed.isDeleted && <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#94a3b8', marginLeft: '8px' }}>(Mensaje editado)</span>}
                                </p>
                                {isSuperUser && (parsed.isEdited || parsed.isDeleted) && parsed.originalText && (
                                  <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                                    <strong>Texto original antes de su modificación/eliminación:</strong><br/>
                                    {parsed.originalText}
                                  </div>
                                )}
                              </>
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
                </div>
              </div>
            </div>
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
                  {(userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones' || userRole === 'Líder Operativo') && (
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

            {((userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones') || (proyecto.encargados || []).some(e => e.id === session?.user?.id)) && (
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
            {proyecto.estado !== 'Archivado' && (userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones') && (
              <button 
                className={`${styles.actionButton} ${styles.warning}`} 
                onClick={() => setConfirmArchive(true)}
                style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a', marginBottom: '0' }}
              >
                <Archive size={16} /> Archivar Proyecto
              </button>
            )}

            {(userRole === 'Líder Comercial' || userRole === 'Líder de Operaciones') && (
              <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Cancelar Proyecto
              </button>
            )}
          </div>
        </div>

      </div>



      
      {diasEstimadosPrompt && (
        <div onClick={(e) => { e.stopPropagation(); diasEstimadosPrompt.onCancel(); }} style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem' }}>Días Estimados en Fase Actual</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>Para avanzar a "{diasEstimadosPrompt.columna}", ¿cuántos días estimados aproximados estará en esta fase?</p>
            {diasEstimadosPrompt.error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(248,113,113,0.1)', borderRadius: '4px' }}>{diasEstimadosPrompt.error}</p>}
            <input 
              type="number"
              id="dropdownDiasInput"
              autoFocus
              min="1"
              defaultValue="1"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={diasEstimadosPrompt.onCancel} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
              <button 
                onClick={() => {
                  const val = document.getElementById('dropdownDiasInput').value;
                  if (!val || Number(val) < 1) {
                    setDiasEstimadosPrompt(prev => ({ ...prev, error: 'Por favor ingresa un número válido mayor a 0' }));
                    return;
                  }
                  diasEstimadosPrompt.onConfirm(Number(val));
                }}
                style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >Confirmar</button>
            </div>
          </div>
        </div>
      )}

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

      {confirmArchive && (
        <div onClick={(e) => { e.stopPropagation(); setConfirmArchive(false); }} style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Archive size={20} color="#d97706" /> Motivo de Archivo
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
              Por favor, indica el motivo por el cual se archiva este proyecto.
            </p>
            <textarea 
              autoFocus
              value={archiveMotive}
              onChange={(e) => setArchiveMotive(e.target.value)}
              placeholder="Ej: Cliente pospuso para el próximo año..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', marginBottom: '1.5rem', background: '#0f172a', color: 'white', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmArchive(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Volver</button>
              <button onClick={handleArchiveProject} disabled={!archiveMotive.trim()} style={{ padding: '0.5rem 1rem', background: archiveMotive.trim() ? '#d97706' : '#92400e', color: 'white', border: 'none', borderRadius: '6px', cursor: archiveMotive.trim() ? 'pointer' : 'not-allowed', fontWeight: 500, transition: 'background 0.2s' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
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

      {confirmPrompt && (
        <div onClick={(e) => { e.stopPropagation(); if (confirmPrompt.onCancel) confirmPrompt.onCancel(); setConfirmPrompt(null); }} style={{ position: 'fixed', top: 0, left: 0, inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1e293b', padding: '1.75rem', borderRadius: '16px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '10px', 
                background: confirmPrompt.variant === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: confirmPrompt.variant === 'danger' ? '#ef4444' : '#3b82f6',
                flexShrink: 0
              }}>
                {confirmPrompt.variant === 'danger' ? <AlertTriangle size={22} /> : <CheckSquare size={22} />}
              </div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', fontWeight: 600 }}>{confirmPrompt.title}</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {confirmPrompt.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  if (confirmPrompt.onCancel) confirmPrompt.onCancel();
                  setConfirmPrompt(null);
                }} 
                style={{ padding: '0.6rem 1.1rem', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
              >
                {confirmPrompt.cancelText || 'Cancelar'}
              </button>
              <button 
                onClick={() => {
                  confirmPrompt.onConfirm();
                  setConfirmPrompt(null);
                }} 
                style={{ 
                  padding: '0.6rem 1.25rem', 
                  background: confirmPrompt.variant === 'danger' ? '#ef4444' : '#2563eb', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                }}
              >
                {confirmPrompt.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

