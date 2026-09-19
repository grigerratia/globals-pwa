const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

code = code.replace(/updateData\.fecha_ultima_actualizacion = p\.fecha_ultima_actualizacion;/g, 
  'updateData.fecha_ultima_actualizacion = p.fecha_ultima_actualizacion;\n            updateData.dias_estancado = 0;');

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
console.log('Fixed dias_estancado in KanbanBoard');
