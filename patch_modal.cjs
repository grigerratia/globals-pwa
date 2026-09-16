const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/ProjectDetailModal.jsx', 'utf8');
const replacement = `              <div className={styles.clientField}>
                <label>Teléfono:</label>
                <input 
                  type="text" 
                  value={proyecto.cliente_telefono || ''} 
                  placeholder="Número (Ej: +58414...)"
                  onChange={(e) => setProyecto(prev => ({ ...prev, cliente_telefono: e.target.value }))}
                  onBlur={(e) => handleChange('cliente_telefono', e.target.value)}
                />
              </div>
            </div>`;
code = code.replace('            </div>\n\n            {/* DESCRIPCIÓN */}', replacement + '\n\n            {/* DESCRIPCIÓN */}');
fs.writeFileSync('src/components/Modals/ProjectDetailModal.jsx', code);
