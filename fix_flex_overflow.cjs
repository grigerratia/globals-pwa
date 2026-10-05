const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/Modals/ProjectDetailModal.module.scss');
let content = fs.readFileSync(file, 'utf8');

// Fix .checkItem span
content = content.replace(/span\s*{\s*font-size:\s*0\.95rem;\s*color:\s*#334155;\s*cursor:\s*pointer;/g, 
  `span {\n    font-size: 0.95rem;\n    color: #334155;\n    cursor: pointer;\n    flex: 1;\n    min-width: 0;\n    word-wrap: break-word;\n    overflow-wrap: break-word;\n    white-space: normal;`);

// Also fix .textareaBox just in case
content = content.replace(/\.textareaBox\s*{[\s\S]*?width:\s*100%;/, 
  (match) => match + '\n  max-width: 100%;\n  box-sizing: border-box;');

fs.writeFileSync(file, content);
console.log('Flex overflow fixed');
