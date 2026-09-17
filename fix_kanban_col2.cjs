const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanColumn/KanbanColumn.jsx', 'utf-8');

code = code.replace(
  "export default function KanbanColumn({ titulo, cantidad, proyectos, idEstado, isOverlay, onAddProject, onCardClick, onSettingsClick, onBotClick }) {",
  "export default function KanbanColumn({ colorBg, titulo, cantidad, proyectos, idEstado, isOverlay, onAddProject, onCardClick, onSettingsClick, onBotClick }) {"
);

// We need to merge style={style} and style={{ backgroundColor: colorBg }} properly
code = code.replace(
  "<div ref={setNodeRef} style={style} className={columnaClases}>",
  "<div ref={setNodeRef} style={{...style, backgroundColor: colorBg}} className={columnaClases}>"
);

fs.writeFileSync('src/components/KanbanColumn/KanbanColumn.jsx', code);
