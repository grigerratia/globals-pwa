const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanColumn/KanbanColumn.jsx', 'utf-8');

code = code.replace(/<Sparkles size=\{16\} \/>\n\s*<\/button>\n\s*<\/div>/, '<Sparkles size={16} />\n        </button>}\n      </div>');

fs.writeFileSync('src/components/KanbanColumn/KanbanColumn.jsx', code);
