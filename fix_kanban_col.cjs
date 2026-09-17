const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

code = code.replace(
  /<KanbanColumn\s+key=\{col\.estadoOriginal\}\s+titulo=\{col\.estadoOriginal\}/,
  "<KanbanColumn \n                  key={col.estadoOriginal} \n                  colorBg={columnColors[col.estadoOriginal] || '#f8fafc'}\n                  titulo={col.estadoOriginal}"
);

code = code.replace(
  /<KanbanColumn\s+titulo=\{columnaActiva\.estadoOriginal\}/,
  "<KanbanColumn \n              colorBg={columnColors[columnaActiva.estadoOriginal] || '#f8fafc'}\n              titulo={columnaActiva.estadoOriginal}"
);

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
