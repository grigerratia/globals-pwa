const fs = require('fs');
const files = [
  'src/components/Modals/Modals.module.scss',
  'src/components/Modals/ProjectDetailModal.module.scss',
  'src/components/Modals/LevantamientoFormModal.module.scss'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    code += "\n@media (max-width: 600px) {\n  .modal {\n    padding: 1rem !important;\n  }\n}\n";
    fs.writeFileSync(file, code);
  }
});
