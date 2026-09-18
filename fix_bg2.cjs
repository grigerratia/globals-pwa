const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.module.scss', 'utf-8');

code = code.replace(
  /\.boardContainer \{\n  min-height: calc\(100vh - 120px\);\n  display: flex;\n  flex-direction: column;\n\}/g,
  ".boardContainer {\n  min-height: calc(100vh - 120px);\n  display: flex;\n  flex-direction: column;\n  background: linear-gradient(135deg, #0079bf 0%, #0052cc 100%);\n}"
);

code = code.replace(
  /\s*\/\* Fondo moderno estilo Trello \*\/\n\s*background: linear-gradient\(135deg, #0079bf 0%, #0052cc 100%\);/g,
  ""
);

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.module.scss', code);
