const fs = require('fs');

let content = fs.readFileSync('src/components/Modals/ProjectDetailModal.jsx', 'utf8');

// Add import
if (!content.includes('import CustomSelect')) {
  content = content.replace(
    "import { X, Calendar, Clock, DollarSign, User, AlertTriangle, FileText, CheckCircle, Package, Archive, Trash2 } from 'lucide-react';",
    "import { X, Calendar, Clock, DollarSign, User, AlertTriangle, FileText, CheckCircle, Package, Archive, Trash2 } from 'lucide-react';\nimport CustomSelect from '../CustomSelect/CustomSelect';"
  );
}

// Replace select
const targetSelect = `<select 
                value={proyecto.estado} 
                onChange={(e) => handleChange('estado', e.target.value)}
              >
                {estados.map(est => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>`;

const newSelect = `<CustomSelect 
                value={proyecto.estado} 
                options={estados}
                onChange={(val) => handleChange('estado', val)}
              />`;

if (content.includes(targetSelect)) {
  content = content.replace(targetSelect, newSelect);
  fs.writeFileSync('src/components/Modals/ProjectDetailModal.jsx', content, 'utf8');
  console.log("Select patched successfully.");
} else {
  console.log("Select not found.");
}
