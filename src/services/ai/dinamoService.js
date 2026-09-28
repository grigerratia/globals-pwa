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
              type: SchemaType.NUMBER,
              description: 'El ID numérico del proyecto en la base de datos.',
            },
            nuevo_estado: {
              type: SchemaType.STRING,
              description: 'El nuevo estado. Valores válidos: "En Conversación", "Levantamiento", "Presupuesto Enviado", "Aprobado", "Logística y compras", "Listo para instalación", "En instalación", "Entregado y cerrado", "En pausa/espera", "Cancelado", "Archivado".',
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
            id_proyecto: { type: SchemaType.NUMBER },
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
        name: 'eliminar_proyecto',
        description: 'Elimina un proyecto permanentemente de la base de datos. IMPORTANTE: DEBES pedir confirmación primero (Ej: "¿Estás seguro que deseas eliminar X?"). Solo llama esta función si el usuario ya dijo que Sí.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.NUMBER, description: 'ID del proyecto a eliminar' }
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
            titulo: { type: SchemaType.STRING },
            cliente_nombre: { type: SchemaType.STRING },
            cliente_telefono: { type: SchemaType.STRING },
            estado: { type: SchemaType.STRING, description: 'Por defecto usa Levantamiento si no se especifica' }
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

// Modelos disponibles
const modelosDisponibles = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite'
];
let currentModelIndex = 0;
let chatSession = null;

const createSession = (modelName) => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    tools: tools,
    systemInstruction: `Eres Dinamo, el asistente inteligente de voz de Global's. Eres directo, profesional y MUY BREVE. 
    REGLAS ESTRICTAS:
    1. Tus respuestas deben ser EXTREMADAMENTE CORTAS (máximo 1 o 2 oraciones pequeñas para ahorrar tokens y tiempo). Ve directo al grano.
    2. NO des explicaciones técnicas largas ni digas qué datos faltan en la base de datos (como la fecha de creación).
    3. Si buscas proyectos o hay múltiples resultados, numéralos MUY rápidamente. Ej: "Tengo dos: 1. Proyecto A, 2. Proyecto B. ¿Cuál deseas borrar?"
    4. Hablas por voz: NO uses Markdown (* o #).
    5. Si ejecutas una acción con éxito, responde con 2 a 4 palabras (Ej: "Listo, proyecto eliminado").`,
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
      let q = supabase.from('proyectos').select('id, titulo, cliente_nombre, estado, cliente_empresa, fecha_creacion').order('fecha_creacion', { ascending: false }).limit(5);
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

    if (name === 'eliminar_proyecto') {
      const { error } = await supabase.from('proyectos').delete().eq('id', args.id_proyecto);
      if (error) throw error;
      return { success: true, message: `Proyecto eliminado.` };
    }

    if (name === 'crear_proyecto') {
      const nuevoProy = {
        titulo: args.titulo,
        cliente_nombre: args.cliente_nombre || '',
        cliente_telefono: args.cliente_telefono || '',
        estado: args.estado || 'Levantamiento',
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
      
      return { success: true, result: { proyectos_activos: activos, ingresos_cerrados: cerrados } };
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
      
      // Bucle para manejar múltiples llamadas a herramientas (en paralelo o secuenciales)
      while (result.response.functionCalls() && result.response.functionCalls().length > 0) {
        const calls = result.response.functionCalls();
        const functionResponses = [];
        
        for (const call of calls) {
          try {
            const apiResponse = await executeTool(call);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: apiResponse
              }
            });
          } catch (toolErr) {
            console.error(`Error ejecutando herramienta ${call.name}:`, toolErr);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { success: false, error: toolErr.message || 'Error desconocido' }
              }
            });
          }
        }
        
        // Enviar todas las respuestas de las herramientas de vuelta al LLM
        result = await chatSession.sendMessage(functionResponses);
      }
      
      // Una vez resueltas todas las funciones, devolver el texto
      return result.response.text();
    } catch (error) {
      console.warn(`[Dinamo] Falló el modelo ${modelosDisponibles[i]}:`, error.message);
      // Si es el último modelo, lanzar el error
      if (i === modelosDisponibles.length - 1) {
        console.error("Todos los modelos de Dinamo fallaron.");
        return "Lo siento, todos mis sistemas de inteligencia están saturados en este momento. Intenta en un minuto.";
      }
    }
  }
};
