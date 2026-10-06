const fs = require('fs');
const file = 'src/components/Modals/ProjectDetailModal.module.scss';
let content = fs.readFileSync(file, 'utf-8');

// Reduce mobile modal padding from 1rem to 0.5rem
content = content.replace(/padding:\s*1rem\s*!important;/g, 'padding: 0.5rem !important;');

// In .section, add mobile optimization
content = content.replace(/\.section \{([\s\S]*?)box-shadow:.*?;/g, `.section {$1box-shadow: 0 2px 4px rgba(0,0,0,0.04);\n  @media (max-width: 768px) {\n    padding: 0.75rem;\n    margin-bottom: 0.25rem;\n    border: none;\n    border-radius: 6px;\n  }`);

// Make textareaBox have less padding and a modern blue tint
content = content.replace(/background: linear-gradient\(135deg, #e0e7ff 0%, #f8fafc 100%\);/g, 'background: rgba(59, 130, 246, 0.05);');
content = content.replace(/padding: 1rem;/g, 'padding: 0.75rem;');

fs.writeFileSync(file, content);
console.log('Fixed padding in ProjectDetailModal');
