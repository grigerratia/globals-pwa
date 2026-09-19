const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

// Add columnasRef
code = code.replace(/const originalColumnasRef = useRef\(null\);/, 
  'const originalColumnasRef = useRef(null);\n  const columnasRef = useRef(columnas);\n  useEffect(() => { columnasRef.current = columnas; }, [columnas]);');

// Replace `columnas` with `columnasRef.current` inside handleDragEnd
code = code.replace(/const activeColumn = encontrarEstadoPorId\(active\.id\);/g, `const activeColumn = encontrarEstadoPorIdEnRef(active.id);`);
code = code.replace(/const overColumn = encontrarEstadoPorId\(over\.id\);/g, `const overColumn = encontrarEstadoPorIdEnRef(over.id);`);

// Create encontrarEstadoPorIdEnRef function right before handleDragEnd
code = code.replace(/const handleDragEnd = async \(event\) => \{/, 
  `const encontrarEstadoPorIdEnRef = (id) => {
    if (estados.includes(id)) return id; 
    for (let col of columnasRef.current) {
      if (col.proyectos.find(p => p.id === id)) return col.estadoOriginal; 
    }
    return null;
  };
  const handleDragEnd = async (event) => {`);

// In handleDragEnd, replace `columnas` with `columnasRef.current`
code = code.replace(/const pryHover = columnas\.flatMap/g, 'const pryHover = columnasRef.current.flatMap');
code = code.replace(/const nuevasColumnas = columnas\.map/g, 'const nuevasColumnas = columnasRef.current.map');

fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
console.log('Fixed handleDragEnd closure in KanbanBoard');
