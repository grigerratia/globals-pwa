const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/ColumnSettingsModal.jsx', 'utf-8');

code = code.replace(
  "const [nombre, setNombre] = useState(columna.estadoOriginal);",
  "const [nombre, setNombre] = useState(columna.estadoOriginal);\n" +
  "  const [colorBg, setColorBg] = useState(columna.color || '#f1f5f9');\n" +
  "  \n" +
  "  const PASTEL_COLORS = [\n" +
  "    { bg: '#f8fafc', text: '#334155', name: 'Gris' },\n" +
  "    { bg: '#fee2e2', text: '#991b1b', name: 'Rojo' },\n" +
  "    { bg: '#ffedd5', text: '#9a3412', name: 'Naranja' },\n" +
  "    { bg: '#fef3c7', text: '#92400e', name: 'Amarillo' },\n" +
  "    { bg: '#dcfce7', text: '#166534', name: 'Verde' },\n" +
  "    { bg: '#e0f2fe', text: '#075985', name: 'Azul' },\n" +
  "    { bg: '#ede9fe', text: '#5b21b6', name: 'Morado' },\n" +
  "    { bg: '#fce7f3', text: '#9d174d', name: 'Rosa' },\n" +
  "  ];"
);

code = code.replace(
  "if (nombre.trim() && nombre !== columna.estadoOriginal) {",
  "if (nombre.trim()) {"
);

code = code.replace(
  "onUpdate(columna.estadoOriginal, nombre.trim());",
  "onUpdate(columna.estadoOriginal, nombre.trim(), colorBg);"
);

const colorsHtml = "\n" +
"          <div className={styles.formGroup} style={{ marginTop: '1rem' }}>\n" +
"            <label>Color de fondo (Pastel)</label>\n" +
"            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>\n" +
"              {PASTEL_COLORS.map(c => (\n" +
"                <div \n" +
"                  key={c.bg}\n" +
"                  title={c.name}\n" +
"                  onClick={() => setColorBg(c.bg)}\n" +
"                  style={{\n" +
"                    width: '32px', height: '32px', borderRadius: '50%', background: c.bg,\n" +
"                    cursor: 'pointer', border: colorBg === c.bg ? '2px solid ' + c.text : '1px solid #cbd5e1',\n" +
"                    display: 'flex', alignItems: 'center', justifyContent: 'center',\n" +
"                    color: c.text, fontWeight: 'bold'\n" +
"                  }}\n" +
"                >\n" +
"                  {colorBg === c.bg && '✓'}\n" +
"                </div>\n" +
"              ))}\n" +
"            </div>\n" +
"          </div>";

code = code.replace(
  "</div>\n          \n          <div className={styles.actions}",
  "</div>" + colorsHtml + "\n          <div className={styles.actions}"
);

fs.writeFileSync('src/components/Modals/ColumnSettingsModal.jsx', code);
