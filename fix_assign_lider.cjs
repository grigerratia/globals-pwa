const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

const replacement = "  const handleAgregarProyectoSubmit = async (nuevoProyectoData) => {\n" +
"    let encargados = nuevoProyectoData.encargados;\n" +
"    if (!encargados || encargados.length === 0) {\n" +
"      // Buscar al lider comercial en la BD\n" +
"      const { data: liderData } = await supabase.from('usuarios').select('nombre, rol').eq('rol', 'Líder Comercial').limit(1);\n" +
"      if (liderData && liderData.length > 0) {\n" +
"        encargados = [{ nombre: liderData[0].nombre, rol: 'Líder Comercial' }];\n" +
"      } else {\n" +
"        encargados = [{ nombre: 'Asignar', rol: 'Líder Comercial' }];\n" +
"      }\n" +
"    }\n" +
"\n" +
"    const nuevoProyecto = {\n" +
"      ...nuevoProyectoData,\n" +
"      encargados: encargados,\n" +
"      orden: 999, // Al final\n" +
"    };";

code = code.replace(
  /const handleAgregarProyectoSubmit = async \(nuevoProyectoData\) => \{[\s\S]*?orden: 999, \/\/ Al final\n    \};/,
  replacement
);

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
