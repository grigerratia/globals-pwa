const fs = require('fs');
const file = 'src/components/Modals/ProjectDetailModal.jsx';
let code = fs.readFileSync(file, 'utf-8');

const target1 = `Este proyecto está en fase de levantamiento. Haz clic para llenar el formato oficial.`;
const target2 = `<FileText size={16} /> Llenar Hoja de Levantamiento`;

const replacement1 = `Accede al formato oficial de levantamiento del proyecto.`;
const replacement2 = `<FileText size={16} /> Ver/Editar Hoja de Levantamiento`;

if (code.includes(target1) && code.includes(target2)) {
  code = code.replace(target1, replacement1);
  code = code.replace(target2, replacement2);
  fs.writeFileSync(file, code);
  console.log("Fixed wording");
} else {
  console.log("Target not found");
}
