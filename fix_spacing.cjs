const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/ProjectDetailModal.module.scss', 'utf-8');

code = code.replace(/margin-bottom: 1rem;/g, 'margin-bottom: 0.5rem;');
// We also want to reduce gap in .section
code = code.replace(/gap: 1rem;/g, 'gap: 0.5rem;');
code = code.replace(/padding: 1.25rem;/g, 'padding: 1rem;');

fs.writeFileSync('src/components/Modals/ProjectDetailModal.module.scss', code);
console.log("Updated Spacing");
