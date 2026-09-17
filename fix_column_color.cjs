const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanColumn/KanbanColumn.jsx', 'utf-8');

code = code.replace(
  "export default function KanbanColumn({ columna, session, onEdit, onAdd, onBotClick }) {",
  "export default function KanbanColumn({ columna, colorBg, session, onEdit, onAdd, onBotClick }) {"
);

code = code.replace(
  /className=\{styles\.columna\}/g,
  "className={styles.columna} style={{ backgroundColor: colorBg }}"
);

fs.writeFileSync('src/components/KanbanColumn/KanbanColumn.jsx', code);
