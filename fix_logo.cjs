const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

code = code.replace(
  "import { logAudit } from '../../utils/audit';",
  "import { logAudit } from '../../utils/audit';\nimport logo from '../../assets/logo.png';"
);

code = code.replace(
  /<img src="\/src\/assets\/logo\.png"/,
  '<img src={logo}'
);

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
