const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.module.scss', 'utf-8');

code = code.replace(
  /\.board \{\n  display: flex;/g,
  ".board {\n  display: flex;\n  flex: 1;"
);

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.module.scss', code);
