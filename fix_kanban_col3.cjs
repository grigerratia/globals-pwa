const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanColumn/KanbanColumn.jsx', 'utf-8');

code = code.replace(
  "export default function KanbanColumn({ colorBg, titulo, cantidad, proyectos, idEstado, isOverlay, onAddProject, onCardClick, onSettingsClick, onBotClick }) {",
  "export default function KanbanColumn({ colorBg, colorText, titulo, cantidad, proyectos, idEstado, isOverlay, onAddProject, onCardClick, onSettingsClick, onBotClick }) {"
);

code = code.replace(
  "<h3 className={styles.titulo}>{titulo}</h3>",
  "<h3 className={styles.titulo} style={{ color: colorText || '#1e293b' }}>{titulo}</h3>"
);

code = code.replace(
  /<span className=\{styles\.contador\}>\{cantidad\}<\/span>/,
  "<span className={styles.contador} style={{ backgroundColor: colorText, color: colorBg }}>{cantidad}</span>"
);

code = code.replace(
  /<GripHorizontal size=\{14\} color="var\(--text-muted\)" \/>/,
  "<GripHorizontal size={14} color={colorText || 'var(--text-muted)'} />"
);

fs.writeFileSync('src/components/KanbanColumn/KanbanColumn.jsx', code);
