const fs = require('fs');
let code = fs.readFileSync('src/components/KanbanBoard/KanbanBoard.jsx', 'utf-8');

// Replace the fallback logic for encargados
const oldLogic = `    let encargados = nuevoProyectoData.encargados;
    if (!encargados || encargados.length === 0) {
      // Buscar al lider comercial en la BD
      const { data: liderData } = await supabase.from('usuarios').select('nombre, rol').eq('rol', 'Líder Comercial').limit(1);
      if (liderData && liderData.length > 0) {
        encargados = [{ nombre: liderData[0].nombre, rol: 'Líder Comercial' }];
      } else {
        encargados = [{ nombre: 'Asignar', rol: 'Líder Comercial' }];
      }
    }`;

const newLogic = `    let encargados = nuevoProyectoData.encargados;
    if (!encargados || encargados.length === 0) {
      // Si el usuario que crea el proyecto es el líder comercial, nos asignamos a nosotros mismos
      if (session?.user?.user_metadata?.rol === 'Líder Comercial') {
        encargados = [{ id: session.user.id, nombre: session.user.user_metadata.nombre || session.user.email, rol: 'Líder Comercial' }];
      } else {
        // Sino, buscamos al primer líder comercial de la base de datos para asignarlo por defecto
        const { data: liderData } = await supabase.from('usuarios').select('id, nombre, rol').eq('rol', 'Líder Comercial').limit(1);
        if (liderData && liderData.length > 0) {
          encargados = [{ id: liderData[0].id, nombre: liderData[0].nombre, rol: 'Líder Comercial' }];
        } else {
          // Si no existe, dejamos solo el rol
          encargados = [{ nombre: 'Asignar', rol: 'Líder Comercial' }];
        }
      }
    }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/KanbanBoard/KanbanBoard.jsx', code);
console.log("Updated KanbanBoard.jsx");
