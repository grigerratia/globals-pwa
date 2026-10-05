const fs = require('fs');
const file = 'src/services/ai/dinamoService.js';
let content = fs.readFileSync(file, 'utf8');

// Improve modificar_proyecto description
content = content.replace(/description: 'Modifica cualquier otro campo de un proyecto \(título, cliente, fecha de entrega, presupuesto, etc\). IMPORTANTE: Confirma con el usuario antes de hacer cambios destructivos.',/, `description: 'Modifica campos de un proyecto. IMPORTANTE: Si el usuario te pide agregar un teléfono, usa el parámetro cliente_telefono explícitamente, NUNCA lo metas en las notas a menos que lo pida.',`);

// Fix Lider Comercial assignment
const oldLiderLogic = `      let encargadosPorDefecto = [];
      const { data: empleadosData } = await supabase.rpc('get_empleados');
      if (empleadosData) {
        const lider = empleadosData.find(e => e.rol === 'Líder Comercial' || e.rol?.toLowerCase().includes('comercial'));
        const ope = empleadosData.find(e => e.rol === 'Líder de Operaciones' || e.rol?.toLowerCase().includes('operaciones'));
        if (lider) encargadosPorDefecto.push({ id: lider.id, nombre: lider.nombre, rol: lider.rol, user_id: lider.id });
        if (ope) encargadosPorDefecto.push({ id: ope.id, nombre: ope.nombre, rol: ope.rol, user_id: ope.id });
      }`;

const newLiderLogic = `      let encargadosPorDefecto = [];
      const { data: authData } = await supabase.auth.getUser();
      const sessionUser = authData?.user;
      
      const { data: empleadosData } = await supabase.rpc('get_empleados');
      let lider = empleadosData ? empleadosData.find(e => e.rol === 'Líder Comercial' || e.rol?.toLowerCase().includes('comercial')) : null;
      let ope = empleadosData ? empleadosData.find(e => e.rol === 'Líder de Operaciones' || e.rol?.toLowerCase().includes('operaciones')) : null;
      
      if (!lider && sessionUser?.user_metadata?.rol === 'Líder Comercial') {
        lider = { id: sessionUser.id, nombre: sessionUser.user_metadata.nombre || 'Líder', rol: 'Líder Comercial', user_id: sessionUser.id };
      }
      if (!ope && sessionUser?.user_metadata?.rol === 'Líder de Operaciones') {
        ope = { id: sessionUser.id, nombre: sessionUser.user_metadata.nombre || 'Líder Op', rol: 'Líder de Operaciones', user_id: sessionUser.id };
      }

      if (lider) encargadosPorDefecto.push({ id: lider.id, nombre: lider.nombre, rol: lider.rol, user_id: lider.id });
      if (ope) encargadosPorDefecto.push({ id: ope.id, nombre: ope.nombre, rol: ope.rol, user_id: ope.id });`;

content = content.replace(oldLiderLogic, newLiderLogic);

fs.writeFileSync(file, content);
console.log("Patched dinamoService.js successfully.");
