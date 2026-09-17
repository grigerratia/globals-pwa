const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

// 1. Add state
code = code.replace(
  "const [boardError, setBoardError] = useState(null);",
  "const [boardError, setBoardError] = useState(null);\n" +
  "  const [columnColors, setColumnColors] = useState(() => {\n" +
  "    try { return JSON.parse(localStorage.getItem('globals_column_colors') || '{}'); } catch(e) { return {}; }\n" +
  "  });"
);

// 2. Update handleUpdateColumna
const regexUpdate = /const handleUpdateColumna = async \(oldName, newName\) => \{([\s\S]*?)await supabase\.from\('columnas'\)\.update\(\{ nombre: newName \}\)\.eq\('nombre', oldName\);\n  \};/;
const updateBody = "const handleUpdateColumna = async (oldName, newName, color) => {\n" +
"    if (session?.user?.user_metadata?.rol !== 'Líder Comercial') {\n" +
"      showError('Acceso denegado: Solo el Líder Comercial puede editar columnas.');\n" +
"      return;\n" +
"    }\n" +
"    setEstados(prev => prev.map(e => e === oldName ? newName : e));\n" +
"    setColumnas(prev => prev.map(c => c.estadoOriginal === oldName ? { ...c, estadoOriginal: newName } : c));\n" +
"    setColumnSettingsId(null);\n" +
"\n" +
"    if (color) {\n" +
"      setColumnColors(prev => {\n" +
"         const updated = { ...prev, [newName]: color };\n" +
"         if (oldName !== newName) delete updated[oldName];\n" +
"         localStorage.setItem('globals_column_colors', JSON.stringify(updated));\n" +
"         return updated;\n" +
"      });\n" +
"    }\n" +
"    await supabase.from('columnas').update({ nombre: newName }).eq('nombre', oldName);\n" +
"  };";
code = code.replace(regexUpdate, updateBody);

// 3. Pass color and id down to ColumnSettingsModal
code = code.replace(
  "columna={columnas.find(c => c.estadoOriginal === columnSettingsId)}",
  "columna={{ ...columnas.find(c => c.estadoOriginal === columnSettingsId), color: columnColors[columnSettingsId] }}"
);

// 4. Pass color down to KanbanColumn
code = code.replace(
  "columna={columna}",
  "columna={columna} colorBg={columnColors[columna.estadoOriginal] || '#f8fafc'}"
);

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
