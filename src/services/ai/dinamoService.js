import { validateProjectMove } from '../../utils/kanbanRules';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { supabase } from '../../supabase';

// Inicializar SDK
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Definir las herramientas (Function Calling)
const tools = [
  {
    functionDeclarations: [
      {
        name: 'buscar_proyectos',
        description: 'Busca proyectos en la base de datos por título, cliente o empresa. Úsalo cuando el usuario pregunte por un proyecto, cliente, o quiera saber el estado actual.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: 'El término de búsqueda (ej. "Coca Cola", "letrero", "Carlos"). Si el usuario dice "todos", deja esto vacío o usa "".',
            },
            estado: {
              type: SchemaType.STRING,
              description: 'Opcional. Filtra por estado específico (ej. "En pausa/espera", "Entregado y cerrado").',
            }
          },
          required: ['query'],
        },
      },
      {
        name: 'actualizar_estado_proyecto',
        description: 'Cambia la fase de un proyecto Kanban. Si la validación bloquea el movimiento por falta de presupuesto_aprobado, materiales_comprados, o levantamiento_fecha, debes preguntarle al usuario si desea confirmarlo/omitirlo, y luego llamar esta herramienta nuevamente pasando "confirmar_casillas: true". Si la fase requiere días estimados, pídeselos y envíalos. Si requiere motivo, envíalo.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID UUID del proyecto' },
            nuevo_estado: { type: SchemaType.STRING, description: 'Ej: "Logística y compras"' },
            motivo: { type: SchemaType.STRING, description: 'Obligatorio si se Pausa, Cancela o Retrocede.' },
            dias_estimados: { type: SchemaType.NUMBER, description: 'Días que tomará. Obligatorio al avanzar.' },
            confirmar_casillas: { type: SchemaType.BOOLEAN, description: 'Poner en true si el usuario te confirmó verbalmente que marcaras el presupuesto/materiales como listos, o si confirmó omitir el levantamiento.' }
          },
          required: ['id_proyecto', 'nuevo_estado'],
        },
      },
      {
        name: 'modificar_proyecto',
        description: 'Modifica campos de un proyecto. IMPORTANTE: Si el usuario te pide agregar un teléfono, usa el parámetro cliente_telefono explícitamente, NUNCA lo metas en las notas a menos que lo pida.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID UUID del proyecto' },
            titulo: { type: SchemaType.STRING },
            cliente_nombre: { type: SchemaType.STRING },
            cliente_empresa: { type: SchemaType.STRING },
            cliente_telefono: { type: SchemaType.STRING },
            presupuesto_vendido: { type: SchemaType.NUMBER },
            fecha_entrega: { type: SchemaType.STRING },
            notas: { type: SchemaType.STRING }
          },
          required: ['id_proyecto'],
        },
      },

      {
        name: 'crear_proyecto',
        description: 'Crea un nuevo proyecto en el sistema. Pregunta los datos que te falten. Si lo creas en una fase adelantada (ej. Logística), no se exigirán casillas previas porque asume que nace allí.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            titulo: { type: SchemaType.STRING },
            cliente_nombre: { type: SchemaType.STRING },
            cliente_empresa: { type: SchemaType.STRING },
            cliente_telefono: { type: SchemaType.STRING },
            estado: { type: SchemaType.STRING, description: 'Columna inicial. Si el usuario no te dice y tu contexto dice una, usa la del contexto. Sino, usa "En Conversación".' },
            dias_estimados: { type: SchemaType.NUMBER, description: 'Días que tomará en esa fase inicial. Obligatorio preguntar si no lo dice.' }
          },
          required: ['titulo'],
        },
      },
      {
        name: 'asignar_encargado',
        description: 'Asigna o agrega un usuario específico como encargado de un proyecto. Úsalo cuando el usuario te pide "asigna a [Nombre] al proyecto [X]".',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID UUID del proyecto' },
            nombre_usuario: { type: SchemaType.STRING, description: 'Nombre del usuario a asignar (ej. Idalys, Griger, etc.)' }
          },
          required: ['id_proyecto', 'nombre_usuario'],
        },
      },
      {
        name: 'agregar_comentario_proyecto',
        description: 'Agrega un comentario al chat o muro del proyecto. Úsalo cuando el usuario te pida explícitamente "comenta en el proyecto", "déjale un mensaje", o "escribe en el chat". NO lo uses para actualizar notas.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID UUID del proyecto' },
            texto_comentario: { type: SchemaType.STRING, description: 'El mensaje que Dinamo dejará en el chat del proyecto' }
          },
          required: ['id_proyecto', 'texto_comentario'],
        },
      },
      {
        name: 'obtener_kpis',
        description: 'Devuelve métricas financieras o estadísticas globales. Úsalo si el usuario pregunta "cuánto hemos vendido", "cuántos proyectos activos hay", etc.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            tipo: {
              type: SchemaType.STRING,
              description: 'Puede ser "financieros" (ingresos) u "operativos" (cantidad de proyectos).',
            }
          },
          required: ['tipo'],
        },
      }
    ],
  },
];

// Modelos disponibles (Listado actualizado para 2026 según tu entorno)
const modelosDisponibles = [
  'gemini-3.5-flash-lite',  // Principal (El más rápido)
  'gemini-3.5-flash',       // Respaldo 1
  'gemini-3.8-flash'        // Respaldo 2 (El más pesado)
];
let currentModelIndex = 0;
let chatSession = null;

const createSession = (modelName) => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    tools: tools,
    systemInstruction: `Eres Dinamo, el asistente inteligente de voz de Global's. Eres directo, profesional y MUY BREVE. 
    REGLAS ESTRICTAS:
    1. Tus respuestas deben ser CORTAS y DIRECTAS, pero AMIGABLES. Ve directo al grano sin perder la cordialidad.
    2. NO des explicaciones técnicas largas ni detalles de bases de datos.
    3. Si buscas proyectos o hay múltiples resultados, organízalos visualmente con viñetas.
    4. Usa FORMATO MARKDOWN (negritas, listas, saltos de línea) y uno o dos EMOJIS (✨, 🚀, ✅, 📌) para que la respuesta en pantalla se vea muy organizada y bonita.
    5. REGLA CRÍTICA DE ARCHIVADO Y CANCELACIÓN (ELIMINACIÓN): NUNCA pases un proyecto a "Archivado" o "Cancelado" (eliminado) indiscriminadamente. Si el usuario te pide eliminar, destruir, borrar o archivar un proyecto, NO ejecutes la herramienta de inmediato. En su lugar, explícale que necesitas un motivo y confirmación para proceder, y agrega exactamente la etiqueta [WIDGET:INPUT_MOTIVO]. Cuando el usuario te responda con el motivo, usa la herramienta 'actualizar_estado_proyecto' pasándolo al estado correspondiente ("Cancelado" o "Archivado") usando el motivo proporcionado. NUNCA inventes motivos.
    6. GLOSARIO Y CONTEXTO DEL NEGOCIO:
       - "Estancado": Un proyecto estancado es uno que está en la columna "Pausa", o si el usuario te pregunta dónde hay proyectos estancados, usa la herramienta 'obtener_kpis' para ver el desglose por columna y decirle dónde se acumulan más proyectos activos (ej. "Tenemos muchos estancados en Levantamiento").
       - Las columnas válidas son: "En Conversación", "Levantamiento", "Presupuesto enviado", "Aprobado - Esperando Anticipo", "Anticipo - En Producción", "Listo para instalar/entregar", "Entregado y cerrado", "Pausa", "Cancelado", "Archivado".
       - Nunca inventes datos que no tienes. Si no tienes una herramienta para modificar un formulario específico (como la Hoja de Levantamiento), dile amablemente que no tienes acceso a esa función todavía.
    7. PARA ASIGNAR USUARIOS: Si te piden que alguien (ej. Idalys, Griger) sea encargado de un proyecto, USA ÚNICAMENTE la herramienta 'asignar_encargado'. NUNCA lo escribas en el campo notas de 'modificar_proyecto'.
    8. WIDGETS INTERACTIVOS: Cuando CUALQUIER herramienta te devuelva un error bloqueando la acción por falta de información o confirmación, DEBES explicarle la situación al usuario y agregar una de estas etiquetas al final de tu mensaje para mostrarle botones en pantalla:
       - Si el error te pide confirmar si el presupuesto está aprobado, materiales comprados, u omitir el levantamiento: escribe exactamente [WIDGET:CONFIRM_CHECKBOXES]
       - Si el error te pide días estimados: escribe exactamente [WIDGET:INPUT_DIAS]
       - Si el error te pide un motivo (pausa, archivo, cancelación): escribe exactamente [WIDGET:INPUT_MOTIVO]`,
  });
  return model.startChat({});
};

export const startDinamoSession = () => {
  chatSession = createSession(modelosDisponibles[currentModelIndex]);
  return chatSession;
};

// Implementación real de las herramientas en Supabase
const executeTool = async (call) => {
  const { name, args } = call;
  console.log(`[Dinamo Tool Exec] ${name}`, args);
  
  try {
    if (name === 'buscar_proyectos') {
      let q = supabase.from('proyectos').select('id, titulo, cliente_nombre, estado, cliente_empresa, fecha_creacion').order('fecha_creacion', { ascending: false }).limit(20);
      if (args.query && args.query.trim() !== '') {
        const safeQuery = args.query.replace(/"/g, ''); // Remover comillas dobles para evitar inyecciones/errores
        q = q.or(`titulo.ilike."%${safeQuery}%",cliente_nombre.ilike."%${safeQuery}%",cliente_empresa.ilike."%${safeQuery}%"`);
      }
      if (args.estado) {
        q = q.eq('estado', args.estado);
      }
      const { data, error } = await q;
      if (error) throw error;
      return { success: true, result: data };
    }

    if (name === 'actualizar_estado_proyecto') {
      const { id_proyecto, nuevo_estado, motivo, dias_estimados, confirmar_casillas } = args;
      
      const { data: currentP } = await supabase.from('proyectos').select('*').eq('id', id_proyecto).single();
      const { data: colsData } = await supabase.from('columnas').select('nombre').order('orden', { ascending: true });
      const estadosList = colsData ? colsData.map(c => c.nombre) : [];
      
      const session = await supabase.auth.getSession().then(({ data }) => data.session);
      
      const validation = validateProjectMove(currentP, nuevo_estado, estadosList, session);
      
      if (!validation.isValid && !confirmar_casillas) {
         throw new Error(`BLOQUEADO POR REGLA DE NEGOCIO: ${validation.error}. PREGÚNTALE AL USUARIO SI CONFIRMA Y, SI DICE QUE SÍ, LLAMA ESTA HERRAMIENTA OTRA VEZ CON confirmar_casillas: true`);
      }
      if (validation.requiresDias && !dias_estimados) {
         throw new Error("FALTAN DÍAS ESTIMADOS: Esta fase requiere que especifiques 'dias_estimados'. Pregúntale al usuario cuántos días aproximados tomará.");
      }
      if (validation.requiresMotive && !motivo) {
         throw new Error(`FALTA MOTIVO: Esta acción exige un motivo de ${validation.requiresMotive}. Pregúntale al usuario el motivo y mándalo.`);
      }
      
      const updateData = { estado: nuevo_estado, fecha_ultima_actualizacion: new Date().toISOString() };
      
      // Auto-check casillas if confirmed
      if (!validation.isValid && confirmar_casillas) {
         if (validation.rule === 'PRESUPUESTO') updateData.presupuesto_aprobado = true;
         if (validation.rule === 'MATERIALES') updateData.materiales_comprados = true;
         if (validation.rule === 'LEVANTAMIENTO') updateData.omitir_levantamiento = true;
      }
      
      let notaAnadida = `[DINAMO - ${nuevo_estado}]`;
      if (motivo) notaAnadida += ` Motivo: ${motivo}`;
      if (dias_estimados) notaAnadida += `\n[DÍAS ESTIMADOS FASE ACTUAL: ${dias_estimados}]`;
      
      if (motivo || dias_estimados) {
        let currentNotas = currentP?.notas || '';
        if (dias_estimados) currentNotas = currentNotas.replace(/\[DÍAS ESTIMADOS FASE ACTUAL: \d+\]\n?/g, '').trim();
        updateData.notas = currentNotas ? currentNotas + '\n\n' + notaAnadida : notaAnadida;
        if (nuevo_estado === 'Cancelado' || nuevo_estado === 'Archivado' || nuevo_estado.includes('pausa')) {
           updateData.motivo_cancelacion = motivo;
        }
      }
      
      const { error } = await supabase.from('proyectos').update(updateData).eq('id', id_proyecto);
      if (error) throw error;
      return { success: true, message: `Proyecto ${id_proyecto} movido a ${nuevo_estado}` };
    }

    if (name === 'modificar_proyecto') {
      const { id_proyecto, ...campos } = args;
      const { error } = await supabase.from('proyectos').update(campos).eq('id', id_proyecto);
      if (error) throw error;
      return { success: true, message: `Proyecto ${id_proyecto} actualizado exitosamente.` };
    }



    if (name === 'crear_proyecto') {
      const { data: _allEmps } = await supabase.rpc('get_empleados');
    const superusers = (_allEmps || []).filter(e => ['Líder Comercial', 'Líder de Operaciones'].includes(e.rol));
      
      if (!superusers || !superusers.some(su => su.rol === 'Líder Comercial')) {
         throw new Error("ERROR AL CREAR PROYECTO: El sistema no permite crear proyectos si no existe un usuario con rol 'Líder Comercial'. Por favor avisa al administrador.");
      }
      
      const encargadosPorDefecto = superusers.map(su => ({ id: su.id, nombre: su.nombre, rol: su.rol }));
        
      const { data: colsData } = await supabase.from('columnas').select('nombre').order('orden', { ascending: true });
      const estadosList = colsData ? colsData.map(c => c.nombre) : [];
      
      if (!args.dias_estimados) {
         throw new Error("FALTAN DÍAS ESTIMADOS: Al crear un proyecto, debes preguntarle al usuario cuántos días aproximados tomará en su fase inicial.");
      }

      const nuevoProy = {
        titulo: args.titulo,
        cliente_nombre: args.cliente_nombre || '',
        cliente_empresa: args.cliente_empresa || '',
        cliente_telefono: args.cliente_telefono || '',
        estado: args.estado || 'En Conversación',
        encargados: encargadosPorDefecto,
        notas: `[DINAMO - Proyecto Creado]\n[DÍAS ESTIMADOS FASE ACTUAL: ${args.dias_estimados}]`,
        fecha_creacion: new Date().toISOString()
      };
      
      // Lógica de casillas automáticas basada en la columna destino
      const targetIdx = estadosList.indexOf(nuevoProy.estado);
      const levantamientoIdx = estadosList.indexOf('Levantamiento');
      const presupIdx = estadosList.indexOf('Presupuesto enviado');
      const logisIdx = estadosList.indexOf('Logística y compras');

      if (targetIdx > levantamientoIdx && levantamientoIdx !== -1) nuevoProy.omitir_levantamiento = true;
      if (targetIdx > presupIdx && presupIdx !== -1) nuevoProy.presupuesto_aprobado = true;
      if (targetIdx > logisIdx && logisIdx !== -1) nuevoProy.materiales_comprados = true;
      
      const { data, error } = await supabase.from('proyectos').insert(nuevoProy).select('id');
      if (error) throw error;
      return { success: true, message: `Proyecto creado exitosamente con ID ${data[0].id}.` };
    }

    if (name === 'asignar_encargado') {
      const { data: pData, error: pError } = await supabase.from('proyectos').select('encargados').eq('id', args.id_proyecto).single();
      if (pError) throw pError;
      
      // Intentar buscar el usuario usando la función RPC (empleados) primero, luego tabla usuarios
      let targetUser = null;
      
      const { data: empleadosData, error: empError } = await supabase.rpc('get_empleados');
      if (!empError && empleadosData) {
        targetUser = empleadosData.find(e => e.nombre && e.nombre.toLowerCase().includes(args.nombre_usuario.toLowerCase()));
      }

      if (!targetUser) {
        const { data: _searchEmps } = await supabase.rpc('get_empleados');
        const uData = (_searchEmps || []).filter(e => e.nombre?.toLowerCase().includes(args.nombre_usuario?.toLowerCase())).slice(0, 1);
        if (uData && uData.length > 0) targetUser = uData[0];
      }

      if (!targetUser) {
        return { success: false, error: `No se encontró un usuario/empleado con el nombre ${args.nombre_usuario}.` };
      }
      
      const newEncargado = { id: targetUser.id, nombre: targetUser.nombre, rol: targetUser.rol || 'Asignado' };
      let encargados = pData.encargados || [];
      if (!encargados.find(e => e.id === newEncargado.id || e.user_id === newEncargado.id)) {
        encargados.push(newEncargado);
        const { error: updError } = await supabase.from('proyectos').update({ encargados }).eq('id', args.id_proyecto);
        if (updError) throw updError;
        return { success: true, message: `Usuario ${targetUser.nombre} asignado correctamente al proyecto.` };
      } else {
        return { success: true, message: `El usuario ${targetUser.nombre} ya estaba asignado a este proyecto.` };
      }
    }

    if (name === 'agregar_comentario_proyecto') {
      const { error } = await supabase.from('comentarios').insert([{
        proyecto_id: args.id_proyecto,
        texto: args.texto_comentario,
        autor_email: 'Dinamo AI ✨'
      }]);
      if (error) throw error;
      return { success: true, message: 'Comentario agregado exitosamente en el chat del proyecto.' };
    }

    if (name === 'obtener_kpis') {
      const { data, error } = await supabase.from('proyectos').select('estado, presupuesto_vendido');
      if (error) throw error;
      
      const activos = data.filter(p => !['Entregado y cerrado', 'Cancelado', 'Archivado'].includes(p.estado)).length;
      const cerrados = data.filter(p => p.estado === 'Entregado y cerrado').reduce((acc, p) => acc + (p.presupuesto_vendido || 0), 0);
      
      const desglosePorEstado = data.reduce((acc, p) => {
        const estado = p.estado || 'Sin estado';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {});

      return { 
        success: true, 
        result: { 
          proyectos_activos: activos, 
          ingresos_cerrados: cerrados,
          desglose_por_estado: desglosePorEstado
        } 
      };
    }

  } catch (err) {
    console.error(`[Dinamo Tool Error]`, err);
    return { success: false, error: err.message };
  }
};

export const sendDinamoMessage = async (textMessage) => {
  let herramientasCompletadasTexto = "";

  for (let i = currentModelIndex; i < modelosDisponibles.length; i++) {
    try {
      let currentPrompt = textMessage;
      
      if (!chatSession || currentModelIndex !== i) {
        currentModelIndex = i;
        chatSession = createSession(modelosDisponibles[i]);
        
        // Memoria de Transacción: Si nos caímos y pasamos a este modelo, 
        // le informamos todo lo que ya hicimos para que NO lo repita.
        if (herramientasCompletadasTexto !== "") {
          currentPrompt = `${textMessage}

[MEMORIA DE TRANSACCIÓN: Debido a un fallo de conexión, estoy retomando esta tarea. YA HE EJECUTADO con éxito las siguientes herramientas. NO las repitas bajo ninguna circunstancia. Solo haz las que falten o respóndele al usuario con los resultados]:
${herramientasCompletadasTexto}`;
        }
      }
      
      let result = await chatSession.sendMessage(currentPrompt);
      
      let loopCount = 0;
      const MAX_LOOPS = 20; // Permitir que Dinamo continúe verificando y ejecutando tareas largas sin cortarlo.
      
      while (result.response.functionCalls() && result.response.functionCalls().length > 0) {
        loopCount++;
        if (loopCount > MAX_LOOPS) {
          console.warn("[Dinamo] Cortafuegos activado: demasiadas llamadas recursivas.");
          result = await chatSession.sendMessage("Has excedido el límite de pasos operativos permitidos en esta transacción. Detente de inmediato, NO LLAMES a más herramientas, y hazle un resumen amable al usuario de lo que sí lograste procesar exitosamente.");
          break; // Salimos del bucle para devolver la respuesta del modelo
        }
        
        const calls = result.response.functionCalls();
        let toolResponsesText = "Resultados del sistema (Herramientas ejecutadas):\\n";
        
        for (const call of calls) {
          try {
            const apiResponse = await executeTool(call);
            const apiResponseStr = JSON.stringify(apiResponse);
            toolResponsesText += `- Herramienta '${call.name}': ${apiResponseStr}\n`;
            
            // Guardamos en la memoria por si el LLM se cae al procesar estos resultados
            herramientasCompletadasTexto += `- TAREA COMPLETADA: '${call.name}' (Argumentos: ${JSON.stringify(call.args)}). Resultado exitoso.\n`;
          } catch (toolErr) {
            console.error(`Error ejecutando herramienta ${call.name}:`, toolErr);
            toolResponsesText += `- Herramienta '${call.name}': ERROR: ${toolErr.message || 'Desconocido'}\n`;
          }
        }
        
        await new Promise(r => setTimeout(r, 600));
        
        // Si aquí se rompe por 429, el catch lo atrapará y el próximo modelo sabrá lo que se hizo.
        currentPrompt = toolResponsesText; 
        result = await chatSession.sendMessage(toolResponsesText);
      }
      
      return result.response.text();
    } catch (error) {
      console.warn(`[Dinamo] Falló el modelo ${modelosDisponibles[i]}:`, error.message);
      
      if (i === modelosDisponibles.length - 1) {
        if (error.message.includes('429')) {
          return "Atención: Has agotado tu cuota de peticiones gratuitas en TODOS mis motores (Lite, 3.5 y 3.8). Debemos esperar a que Google recargue los servidores.";
        }
        console.error("Todos los modelos de Dinamo fallaron.");
        return "Lo siento, mis sistemas están muy saturados. La tarea que me pediste era muy pesada. Inténtalo en un momento.";
      }
      
      // Si llegamos aquí, el for loop incrementará 'i' y la Memoria de Transacción
      // inyectará 'herramientasCompletadasTexto' en el nuevo session.
    }
  }
};
