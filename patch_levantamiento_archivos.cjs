const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/LevantamientoFormModal.jsx', 'utf-8');

// 1. Add state for uploading
const stateRegex = /const \[empleados, setEmpleados\] = useState\(\[\]\);/;
code = code.replace(stateRegex, `const [empleados, setEmpleados] = useState([]);\n  const [uploadingImage, setUploadingImage] = useState(false);`);

// 2. Replace handleImageUpload
const handleUploadRegex = /const handleImageUpload = async \(e\) => \{[\s\S]*?\}\n    \}\n  \};\n/m;
const newHandleUpload = `const handleImageUpload = async (e) => {
    let file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);

    if (file.type.startsWith('image/')) {
      try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1600, useWebWorker: true };
        const compressedBlob = await imageCompression(file, options);
        file = new File([compressedBlob], file.name, { type: compressedBlob.type });
      } catch (err) {
        console.error("Error comprimiendo:", err);
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = \`\${Math.random()}.\${fileExt}\`;
    const filePath = \`\${proyecto.id}/\${fileName}\`;

    try {
      const { error: uploadError } = await supabase.storage.from('archivos_proyectos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('archivos_proyectos').getPublicUrl(filePath);

      const nuevoArchivo = { name: file.name, url: urlData.publicUrl };
      const archivosActualizados = [...(proyecto.archivos || []), nuevoArchivo];

      await supabase.from('proyectos').update({ archivos: archivosActualizados }).eq('id', proyecto.id);

      if (onProjectUpdated) {
        onProjectUpdated({ ...proyecto, archivos: archivosActualizados });
      }
      
      setFormData(prev => ({ ...prev, imagenUrl: urlData.publicUrl }));
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      alert("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };
`;
code = code.replace(handleUploadRegex, newHandleUpload);

// 3. Update UI to show existing images and the upload button
const uiTarget = /<div className=\{\`\$\{styles\.formGroup\} \$\{styles\.fullWidth\}\`\}>\s*<label>Gráfica \/ Foto del Lugar<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<div className=\{styles\.actions\}>/;

const newUi = `<div className={\`\${styles.formGroup} \${styles.fullWidth}\`}>
            <label>Gráfica / Foto del Lugar para el PDF</label>
            
            {proyecto.archivos && proyecto.archivos.filter(a => a.url.match(/\\.(jpeg|jpg|gif|png|webp)/i)).length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                {proyecto.archivos.filter(a => a.url.match(/\\.(jpeg|jpg|gif|png|webp)/i)).map((arch, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setFormData(prev => ({ ...prev, imagenUrl: arch.url }))}
                    style={{ 
                      minWidth: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                      border: formData.imagenUrl === arch.url ? '3px solid #3b82f6' : '1px solid #e2e8f0',
                      opacity: formData.imagenUrl === arch.url ? 1 : 0.6
                    }}
                  >
                    <img src={arch.url} alt="Archivo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}

            <label style={{ cursor: uploadingImage ? 'wait' : 'pointer', display: 'block' }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} capture="environment" style={{ display: 'none' }} disabled={uploadingImage} />
              {!formData.imagenUrl ? (
                <div 
                  style={{ padding: '2.5rem 1rem', border: '2px dashed #cbd5e1', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc', transition: 'all 0.2s' }} 
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} 
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                >
                  <Camera size={32} style={{ color: '#94a3b8', margin: '0 auto 0.5rem auto' }} />
                  <span style={{ color: '#64748b', fontWeight: 500 }}>{uploadingImage ? 'Subiendo imagen...' : 'Selecciona una imagen de arriba, o haz clic para subir una nueva'}</span>
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={formData.imagenUrl} alt="Gráfica" style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 500 }}>
                    {uploadingImage ? 'Subiendo...' : 'Subir otra imagen'}
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className={styles.actions}>`;

code = code.replace(uiTarget, newUi);

fs.writeFileSync('src/components/Modals/LevantamientoFormModal.jsx', code);
console.log("LevantamientoFormModal updated");
