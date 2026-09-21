import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabase';
import { X, FileText, Camera, Download, Save, Trash2 } from 'lucide-react';
import styles from './Modals.module.scss';
import jsPDF from 'jspdf';
import imageCompression from 'browser-image-compression';
import { logAudit } from '../../utils/audit';

export default function LevantamientoFormModal({ proyecto, onClose, onProjectUpdated, session }) {
  const [formData, setFormData] = useState({
    cliente: proyecto.cliente_empresa || '',
    contacto: proyecto.cliente_nombre || '',
    telefono: proyecto.cliente_telefono || '',
    responsableGlobals: (proyecto.encargados || []).map(e => e.nombre).join(', ') || '',
    motivo: '',
    fechaEntrega: proyecto.fecha_entrega ? proyecto.fecha_entrega.split('T')[0] : '',
    responsableMedidas: '',
    descripcion: proyecto.notas || '',
    imagenUrl: null,
    imagenFile: null
  });

  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    async function fetchEmpleados() {
      const { data, error } = await supabase.rpc('get_empleados');
      if (!error && data) setEmpleados(data);
    }
    fetchEmpleados();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
      try {
        const compressedBlob = await imageCompression(file, options);
        file = new File([compressedBlob], file.name, { type: compressedBlob.type });
      } catch (err) {
        console.error("Error comprimiendo:", err);
      }
      setFormData(prev => ({ 
        ...prev, 
        imagenFile: file, 
        imagenUrl: URL.createObjectURL(file) 
      }));
    }
  };

  const handleSave = async (conFechaLevantamiento = true) => {
    const updateData = {
      cliente_empresa: formData.cliente,
      cliente_nombre: formData.contacto,
      cliente_telefono: formData.telefono,
      notas: formData.descripcion,
    };
    
    if (formData.fechaEntrega) updateData.fecha_entrega = formData.fechaEntrega;
    if (conFechaLevantamiento) updateData.levantamiento_fecha = new Date().toISOString();

    const { error } = await supabase.from('proyectos').update(updateData).eq('id', proyecto.id);
    if (!error) {
      if (onProjectUpdated) {
        onProjectUpdated({ ...proyecto, ...updateData });
      }
      logAudit(session, 'Guardó Hoja de Levantamiento', { proyecto_id: proyecto.id, titulo: proyecto.titulo });
      if (conFechaLevantamiento) onClose();
    }
  };

  const updateMateriales = async (mats) => {
    const isAllBought = mats.length > 0 && mats.every(m => m.comprado);
    const { error } = await supabase.from('proyectos').update({ materiales: mats, materiales_comprados: isAllBought }).eq('id', proyecto.id);
    if (!error) {
      onProjectUpdated({ ...proyecto, materiales: mats, materiales_comprados: isAllBought });
    }
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Título
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("HOJA DE LEVANTAMIENTO DE TRABAJO", 105, yPos, { align: "center" });
    
    yPos += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const addLine = (label, text) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(text || '___________________', 70, yPos);
      yPos += 10;
    };

    addLine("Cliente", formData.cliente);
    addLine("Persona Contacto", formData.contacto);
    addLine("Teléfono", formData.telefono);
    addLine("Responsable Global's", formData.responsableGlobals);
    addLine("Responsable Medidas", formData.responsableMedidas);
    addLine("Fecha de Entrega", formData.fechaEntrega);
    addLine("Motivo del Trabajo", formData.motivo);
    
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Materiales Requeridos:", 20, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    const textMats = (proyecto.materiales || []).map(m => `- ${m.nombre} (${m.comprado ? 'Comprado' : 'Pendiente'})`).join('\n');
    const splitMateriales = doc.splitTextToSize(textMats || '___________________', 170);
    doc.text(splitMateriales, 20, yPos);
    yPos += splitMateriales.length * 7 + 5;

    doc.setFont("helvetica", "bold");
    doc.text("Descripción / Observaciones:", 20, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(formData.descripcion || '___________________', 170);
    doc.text(splitDesc, 20, yPos);
    yPos += splitDesc.length * 7 + 5;

    if (formData.imagenUrl) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text("Gráfica / Evidencia:", 20, yPos);
      yPos += 10;
      
      // Necesitamos cargar la imagen para jsPDF
      const img = new Image();
      img.src = formData.imagenUrl;
      await new Promise((resolve) => {
        img.onload = () => {
          doc.addImage(img, 'JPEG', 20, yPos, 160, 100);
          resolve();
        };
      });
    }

    doc.save(`Levantamiento_${formData.cliente || 'Proyecto'}.pdf`);
    
    // Guardar al exportar
    await handleSave(true);
  };

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'transparent', border: 'none', color: '#94a3b8',
            cursor: 'pointer', padding: '0.5rem', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
        >
          <X size={24} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', paddingRight: '2rem', marginBottom: '2rem' }}>
          <FileText size={32} style={{ color: '#3b82f6', marginTop: '0.2rem' }} />
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem', fontWeight: 600 }}>Hoja de Levantamiento</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>Llene los datos del levantamiento para guardar o exportar el documento.</p>
          </div>
        </div>
        
        {proyecto.levantamiento_fecha && (
          <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
            ✅ Llenada el: {new Date(proyecto.levantamiento_fecha).toLocaleString()}
          </div>
        )}

        <div className={styles.formGrid}>
          
          <div className={styles.formGroup}>
            <label>Cliente</label>
            <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Persona Contacto</label>
            <input type="text" name="contacto" value={formData.contacto} onChange={handleChange} />
          </div>
          
          <div className={styles.formGroup}>
            <label>Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Responsable Global's</label>
            <select name="responsableGlobals" value={formData.responsableGlobals} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.nombre || emp.email}>{emp.nombre || emp.email}</option>
              ))}
              {formData.responsableGlobals && !empleados.some(e => (e.nombre || e.email) === formData.responsableGlobals) && (
                <option value={formData.responsableGlobals}>{formData.responsableGlobals}</option>
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Responsable de Medidas</label>
            <select name="responsableMedidas" value={formData.responsableMedidas} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.nombre || emp.email}>{emp.nombre || emp.email}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Fecha de Entrega (Aprox)</label>
            <input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Motivo del Trabajo</label>
            <input type="text" name="motivo" value={formData.motivo} onChange={handleChange} />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Materiales Requeridos (Sincronizado con Proyecto)</label>
            <div className={styles.checklist} style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {(proyecto.materiales || []).map((mat, index) => (
                <label key={index} className={styles.checkItem}>
                  <input 
                    type="checkbox" 
                    checked={mat.comprado || false}
                    onChange={(e) => {
                      const mats = [...(proyecto.materiales || [])];
                      mats[index] = { ...mats[index], comprado: e.target.checked };
                      updateMateriales(mats);
                    }}
                  />
                  <span className={mat.comprado ? styles.checkedText : ''}>{mat.nombre}</span>
                  <button className={styles.btnDeleteMat} onClick={(e) => {
                    e.preventDefault();
                    const mats = (proyecto.materiales || []).filter((_, i) => i !== index);
                    updateMateriales(mats);
                  }}><Trash2 size={14}/></button>
                </label>
              ))}
              <div className={styles.addMaterialBox}>
                <input 
                  type="text" 
                  placeholder="Añadir material y presionar Enter..."
                  id="levantamiento-mat"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.target.value.trim()) {
                        const mats = [...(proyecto.materiales || []), { nombre: e.target.value.trim(), comprado: false }];
                        updateMateriales(mats);
                        e.target.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Descripción / Observaciones (Sincronizado con Proyecto)</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Gráfica / Foto del Lugar</label>
            <label style={{ cursor: 'pointer', display: 'block' }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} capture="environment" style={{ display: 'none' }} />
              {!formData.imagenUrl ? (
                <div 
                  style={{ padding: '2.5rem 1rem', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc', transition: 'all 0.2s' }} 
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} 
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                >
                  <Camera size={32} style={{ color: '#94a3b8', margin: '0 auto 0.5rem auto' }} />
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Haz clic para tomar foto o subir archivo</span>
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={formData.imagenUrl} alt="Gráfica" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 500 }}>Cambiar imagen</div>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
          <button className={styles.btnSubmit} onClick={() => handleSave(true)} style={{ background: '#10b981' }}>
            <Save size={18} /> Guardar Hoja
          </button>
          <button className={styles.btnSubmit} onClick={handleExportPDF} style={{ background: '#64748b' }}>
            <Download size={18} /> Exportar PDF
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
