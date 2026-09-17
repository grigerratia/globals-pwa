const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

const mapping = `
const getTextForBg = (bg) => {
  const map = {
    '#f8fafc': '#334155',
    '#fee2e2': '#991b1b',
    '#ffedd5': '#9a3412',
    '#fef3c7': '#92400e',
    '#dcfce7': '#166534',
    '#e0f2fe': '#075985',
    '#ede9fe': '#5b21b6',
    '#fce7f3': '#9d174d'
  };
  return map[bg] || '#334155';
};
`;

if (!code.includes('getTextForBg')) {
  code = code.replace("export default function KanbanBoard({ session }) {", mapping + "\nexport default function KanbanBoard({ session }) {");
}

code = code.replace(
  /<KanbanColumn\s+key=\{col\.estadoOriginal\}\s+colorBg=\{columnColors\[col\.estadoOriginal\] \|\| '#f8fafc'\}/,
  "<KanbanColumn \n                  key={col.estadoOriginal} \n                  colorBg={columnColors[col.estadoOriginal] || '#f8fafc'}\n                  colorText={getTextForBg(columnColors[col.estadoOriginal] || '#f8fafc')}"
);

code = code.replace(
  /<KanbanColumn\s+colorBg=\{columnColors\[columnaActiva\.estadoOriginal\] \|\| '#f8fafc'\}/,
  "<KanbanColumn \n              colorBg={columnColors[columnaActiva.estadoOriginal] || '#f8fafc'}\n              colorText={getTextForBg(columnColors[columnaActiva.estadoOriginal] || '#f8fafc')}"
);

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
