with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_insert = """    const nuevoProyecto = {
      ...nuevoProyectoData,
      encargados: encargados,
      orden: 999, // Al final
    };

    const { data, error } = await supabase.from('proyectos').insert([nuevoProyecto]).select('*');"""

new_insert = """    const targetIdx = estados.indexOf(nuevoProyectoData.estado);
    const levantamientoIdx = estados.indexOf('Levantamiento');
    const presupIdx = estados.indexOf('Presupuesto enviado');
    const logisIdx = estados.indexOf('Logística y compras');

    if (targetIdx > levantamientoIdx && levantamientoIdx !== -1) {
      nuevoProyectoData.levantamiento_fecha = new Date().toISOString();
    }
    if (targetIdx > presupIdx && presupIdx !== -1) {
      nuevoProyectoData.presupuesto_aprobado = true;
    }
    if (targetIdx > logisIdx && logisIdx !== -1) {
      nuevoProyectoData.materiales_comprados = true;
    }

    const nuevoProyecto = {
      ...nuevoProyectoData,
      encargados: encargados,
      orden: 999, // Al final
    };

    const { data, error } = await supabase.from('proyectos').insert([nuevoProyecto]).select('*');"""

content = content.replace(old_insert, new_insert)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
