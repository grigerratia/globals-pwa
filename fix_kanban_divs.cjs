const fs = require('fs');
const file = 'src/components/KanbanBoard/KanbanBoard.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/      <\/div>\n      <\/div>\n\n      <\/div>\n      \{boardError && \(/, 
  '      </div>\n      </div>\n      {boardError && (');

fs.writeFileSync(file, content);
console.log('Fixed divs');
