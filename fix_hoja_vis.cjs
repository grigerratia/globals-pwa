const fs = require('fs');
const file = 'src/components/Modals/ProjectDetailModal.jsx';
let code = fs.readFileSync(file, 'utf-8');

const target = `{proyecto.estado === 'Levantamiento' && (`;
const replacement = `            {!['Nuevo', 'Contactado', 'Cotizando'].includes(proyecto.estado) && (`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Fixed visibility");
} else {
  console.log("Target not found");
}
