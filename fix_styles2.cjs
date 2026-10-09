const fs = require('fs');
const file = './src/components/Modals/ProjectDetailModal.module.scss';
let css = fs.readFileSync(file, 'utf8');

css = css.replace(/line-height: 1\.3;/, "line-height: 1.3;\n    white-space: pre-wrap;\n    word-wrap: break-word;\n    word-break: break-word;");

fs.writeFileSync(file, css);
