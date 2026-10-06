const fs = require('fs');
const file = 'src/components/Modals/ProjectDetailModal.module.scss';
let content = fs.readFileSync(file, 'utf-8');

// Reduce mobile padding
content = content.replace(/padding:\s*1rem\s*!important;/g, 'padding: 0.5rem !important;');

// Better section on mobile
content = content.replace(/\.section \{([\s\S]*?)box-shadow:.*?;/g, `.section {$1box-shadow: 0 2px 4px rgba(0,0,0,0.04);\n  @media (max-width: 768px) {\n    padding: 0.5rem;\n    border: none;\n  }`);

content = content.replace(/background: linear-gradient\(135deg, #e0e7ff 0%, #f8fafc 100%\);/g, 'background: rgba(59, 130, 246, 0.04);');

fs.writeFileSync(file, content);
console.log('Fixed padding');
