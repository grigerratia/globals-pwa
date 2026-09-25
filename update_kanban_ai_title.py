with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

import re

old_submit = """    const handleAgregarProyectoSubmit = async (nuevoProyectoData) => {
    const tituloLower = nuevoProyectoData.titulo.toLowerCase().trim();
    const existe = columnas.some(col => col.proyectos.some(p => p.titulo.toLowerCase().trim() === tituloLower));
    if (existe) {
      showError(`Ya existe un proyecto con el título "${nuevoProyectoData.titulo}".`);
      return;
    }

    let encargados = nuevoProyectoData.encargados;"""

new_submit = """    const generateTitleWithAI = async (projectData) => {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
        const prompt = `Actúa como un gestor de proyectos. Genera un título corto, directo y descriptivo (máximo 5-7 palabras) para un nuevo proyecto de rotulación/publicidad, usando estos datos iniciales:
Cliente/Empresa: ${projectData.cliente_empresa || 'Desconocido'}
Contacto: ${projectData.cliente_nombre || 'Desconocido'}
Notas/Descripción: ${projectData.notas || 'Sin descripción'}

Devuelve ÚNICAMENTE el título generado, sin comillas, ni introducciones, ni puntos finales. Ejemplos de formato esperado: "Letrero Luminoso Hato Grill" o "Pendones 2x2 para María"`;
        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
        return text;
      } catch (err) {
        console.error("Error generando título con IA:", err);
        return "Proyecto " + (projectData.cliente_empresa || "Nuevo");
      }
    };

    const handleAgregarProyectoSubmit = async (nuevoProyectoData) => {
    let encargados = nuevoProyectoData.encargados;"""

content = content.replace(old_submit, new_submit)

# Find where the project is inserted:
old_insert = """    const { data: cols } = await supabase.from('columnas').select('orden').eq('nombre', nuevoProyectoData.estado).single();
    nuevoProyectoData.orden = cols ? cols.orden : 0;
    
    const { data, error } = await supabase.from('proyectos').insert([nuevoProyectoData]).select();
    if (error) {
      showError('Error creando el proyecto: ' + error.message);
    } else if (data) {
      logAudit(session, 'Creó proyecto', { proyecto_id: data[0].id, titulo: data[0].titulo });
      
      const newCols = columnas.map(col => {
        if (col.nombre === data[0].estado) {
          return { ...col, proyectos: [...col.proyectos, data[0]] };
        }
        return col;
      });
      setColumnas(newCols);
      setMostrarAddModal(false);
      setEstadoParaAgregar(null);
    }
  };"""

new_insert = """    const { data: cols } = await supabase.from('columnas').select('orden').eq('nombre', nuevoProyectoData.estado).single();
    nuevoProyectoData.orden = cols ? cols.orden : 0;
    
    const { data, error } = await supabase.from('proyectos').insert([nuevoProyectoData]).select();
    if (error) {
      showError('Error creando el proyecto: ' + error.message);
    } else if (data) {
      const nuevoProyecto = data[0];
      logAudit(session, 'Creó proyecto', { proyecto_id: nuevoProyecto.id, titulo: nuevoProyecto.titulo });
      
      const newCols = columnas.map(col => {
        if (col.nombre === nuevoProyecto.estado) {
          return { ...col, proyectos: [...col.proyectos, nuevoProyecto] };
        }
        return col;
      });
      setColumnas(newCols);
      setMostrarAddModal(false);
      setEstadoParaAgregar(null);

      // Disparar generación de título en background
      generateTitleWithAI(nuevoProyectoData).then(async (aiTitle) => {
         const { error: updErr } = await supabase.from('proyectos').update({ titulo: aiTitle }).eq('id', nuevoProyecto.id);
         if (!updErr) {
           setColumnas(prevCols => prevCols.map(col => {
             if (col.nombre === nuevoProyecto.estado) {
               return {
                 ...col,
                 proyectos: col.proyectos.map(p => p.id === nuevoProyecto.id ? { ...p, titulo: aiTitle } : p)
               };
             }
             return col;
           }));
         }
      });
    }
  };"""

content = content.replace(old_insert, new_insert)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
