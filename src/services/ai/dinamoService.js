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
        description: 'Cambia la fase o estado de un proyecto en el tablero Kanban. ADVERTENCIA: Debes estar seguro del ID del proyecto antes de usar esto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: {
              type: SchemaType.STRING,
              description: 'El ID UUID del proyecto en la base de datos.',
            },
            nuevo_estado: {
              type: SchemaType.STRING,
              description: 'El nuevo estado. Valores exactos: "En Conversación", "Levantamiento", "En Diseño", "Presupuesto enviado", "Aprobado", "Logística y compras", "En fabricación", "Listo para instalación", "En instalación", "Entregado y cerrado", "En pausa/espera", "Cancelado", "Archivado". RESPETA LAS MAYÚSCULAS.',
            },
            motivo: {
              type: SchemaType.STRING,
              description: 'Si se mueve a Pausa/Espera, Cancelado o se Retrocede de fase, es obligatorio dar un motivo detallado.',
            }
          },
          required: ['id_proyecto', 'nuevo_estado'],
        },
      },
      {
        name: 'modificar_proyecto',
        description: 'Modifica cualquier otro campo de un proyecto (título, cliente, fecha de entrega, presupuesto, etc). IMPORTANTE: Confirma con el usuario antes de hacer cambios destructivos.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID UUID del proyecto' },
            titulo: { type: SchemaType.STRING },
            cliente_nombre: { type: SchemaType.STRING },
            cliente_empresa: { type: SchemaType.STRING },
            presupuesto_vendido: { type: SchemaType.NUMBER },
            fecha_entrega: { type: SchemaType.STRING },
            notas: { type: SchemaType.STRING }
          },
          required: ['id_proyecto'],
        },
      },

      {
        name: 'crear_proyecto',
        description: 'Crea un nuevo proyecto en el sistema.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            titulo: { type: SchemaType.STRING, description: 'El nombre o título corto del proyecto' },
            cliente_nombre: { type: SchemaType.STRING, description: 'El nombre de la persona de contacto (ej. Osbaldo, Juan Pérez)' },
            cliente_empresa: { type: SchemaType.STRING, description: 'El nombre de la empresa o marca del cliente (ej. Coca Cola, Polar)' },
            cliente_telefono: { type: SchemaType.STRING },
            estado: { type: SchemaType.STRING, description: 'Por defecto usa "En Conversación" si no se especifica' }
          },
          required: ['titulo'],
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
  'gemini-3.8-flash',       // Principal (Cuota nueva)
  'gemini-3.5-flash-lite',  // Respaldo 1
  'gemini-3.5-flash'        // Respaldo 2 (Agotado por hoy en pruebas intensivas)
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
    5. REGLA CRÍTICA: NUNCA ELIMINES NADA. Si el usuario te pide eliminar, destruir o borrar un proyecto, DEBES usar la herramienta 'actualizar_estado_proyecto' para pasarlo al estado "Cancelado" con el motivo "Eliminado por el usuario". NUNCA uses la herramienta de eliminar.
    6. GLOSARIO Y CONTEXTO DEL NEGOCIO:
       - "Estancado": Un proyecto estancado es uno que está en la columna "Pausa", o si el usuario te pregunta dónde hay proyectos estancados, usa la herramienta 'obtener_kpis' para ver el desglose por columna y decirle dónde se acumulan más proyectos activos (ej. "Tenemos muchos estancados en Levantamiento").
       - Las columnas válidas son: "En Conversación", "Levantamiento", "Presupuesto enviado", "Aprobado - Esperando Anticipo", "Anticipo - En Producción", "Listo para instalar/entregar", "Entregado y cerrado", "Pausa", "Cancelado", "Archivado".
       - Nunca inventes datos que no tienes. Si no tienes una herramienta para modificar un formulario específico (como la Hoja de Levantamiento), dile amablemente que no tienes acceso a esa función todavía.`,
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
      const { id_proyecto, nuevo_estado, motivo } = args;
      const updateData = { estado: nuevo_estado, fecha_ultima_actualizacion: new Date().toISOString() };
      
      // Si requiere motivo (Cancelado, Pausa, Retroceso), lo añadimos a notas
      if (motivo) {
        const { data: currentP } = await supabase.from('proyectos').select('notas').eq('id', id_proyecto).single();
        const notaAnadida = `[DINAMO - ${nuevo_estado}] Motivo: ${motivo}`;
        updateData.notas = currentP?.notas ? currentP.notas + '\n\n' + notaAnadida : notaAnadida;
        if (nuevo_estado === 'Cancelado') updateData.motivo_cancelacion = motivo;
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
      const { data: superusers } = await supabase.from('usuarios').select('id, nombre, rol').in('rol', ['Líder Comercial', 'Líder de Operaciones']);
      const encargadosPorDefecto = superusers && superusers.length > 0 
        ? superusers.map(su => ({ id: su.id, nombre: su.nombre, rol: su.rol }))
        : [];
        
      const nuevoProy = {
        titulo: args.titulo,
        cliente_nombre: args.cliente_nombre || '',
        cliente_empresa: args.cliente_empresa || '',
        cliente_telefono: args.cliente_telefono || '',
        estado: args.estado || 'En Conversación',
        encargados: encargadosPorDefecto,
        fecha_creacion: new Date().toISOString()
      };
      const { data, error } = await supabase.from('proyectos').insert(nuevoProy).select('id');
      if (error) throw error;
      return { success: true, message: `Proyecto creado exitosamente con ID ${data[0].id}.` };
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
  for (let i = currentModelIndex; i < modelosDisponibles.length; i++) {
    try {
      if (!chatSession || currentModelIndex !== i) {
        currentModelIndex = i;
        chatSession = createSession(modelosDisponibles[i]);
      }
      
      let result = await chatSession.sendMessage(textMessage);
      
      let loopCount = 0;
      const MAX_LOOPS = 4; // Cortafuegos: máximo 4 iteraciones de herramientas para evitar loops infinitos
      
      // Bucle para manejar múltiples llamadas a herramientas (en paralelo o secuenciales)
      while (result.response.functionCalls() && result.response.functionCalls().length > 0) {
        loopCount++;
        if (loopCount > MAX_LOOPS) {
          console.warn("[Dinamo] Cortafuegos activado: demasiadas llamadas recursivas.");
          return "Me detuve por seguridad porque la tarea requería demasiados pasos automáticos. Por favor, verifica qué cambios se hicieron e indícame si sigo.";
        }
        
        const calls = result.response.functionCalls();
        let toolResponsesText = "Resultados del sistema (Herramientas ejecutadas):\n";
        
        for (const call of calls) {
          try {
            const apiResponse = await executeTool(call);
            toolResponsesText += `- Herramienta '${call.name}': ${JSON.stringify(apiResponse)}\n`;
          } catch (toolErr) {
            console.error(`Error ejecutando herramienta ${call.name}:`, toolErr);
            toolResponsesText += `- Herramienta '${call.name}': ERROR: ${toolErr.message || 'Desconocido'}\n`;
          }
        }
        
        // Pausa breve para evitar error 429 por límite de tasa de la API de Gemini
        await new Promise(r => setTimeout(r, 600));
        
        // Enviar todas las respuestas como texto del USUARIO.
        // Esto evita el error "400 Role 'function' is not supported" en los modelos 3.8 y lite.
        result = await chatSession.sendMessage(toolResponsesText);
      }
      
      // Una vez resueltas todas las funciones, devolver el texto
      return result.response.text();
    } catch (error) {
      console.warn(`[Dinamo] Falló el modelo ${modelosDisponibles[i]}:`, error.message);
      
      // Si es el último modelo de la lista y falló
      if (i === modelosDisponibles.length - 1) {
        if (error.message.includes('429')) {
          return "Atención: Has agotado tu cuota de peticiones gratuitas en TODOS mis motores (3.8, 3.5 y Lite). Debemos esperar a que Google recargue los servidores.";
        }
        console.error("Todos los modelos de Dinamo fallaron.");
        return "Lo siento, mis sistemas están muy saturados. La tarea que me pediste era muy pesada. Inténtalo en un momento.";
      }
      
      // Si falla (por 429 o cualquier otra cosa) y no es el último, 
      // el bucle pasa silenciosamente al siguiente modelo.
    }
  }
};
