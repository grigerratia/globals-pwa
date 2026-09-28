import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
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
            empresa: { type: SchemaType.STRING },
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

// Instanciar el modelo con instrucciones de sistema
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  tools: tools,
  systemInstruction: `Eres Dinamo, el asistente inteligente de voz de Global's. 
  Eres directo, profesional, pero amigable. 
  REGLAS ESTRICTAS:
  1. Si un usuario te pide mover o cancelar un proyecto, y no tienes el ID exacto, DEBES buscarlo primero con buscar_proyectos.
  2. Si hay múltiples proyectos con nombres similares, NO adivines. Responde preguntando a cuál se refiere.
  3. Hablas de forma rápida y concisa, ya que te comunicas por voz. No uses Markdown (* o #) en tus respuestas verbales.
  4. Si ejecutas una acción con éxito, dí "Listo, ya moví el proyecto", o algo similar y natural.`,
});

let chatSession = null;

export const startDinamoSession = () => {
  chatSession = model.startChat({});
  return chatSession;
};

// Implementación real de las herramientas en Supabase
const executeTool = async (call) => {
  const { name, args } = call;
  console.log(`[Dinamo Tool Exec] ${name}`, args);
  
  try {
    if (name === 'buscar_proyectos') {
      let q = supabase.from('proyectos').select('id, titulo, cliente_nombre, estado, empresa').order('fecha_creacion', { ascending: false }).limit(5);
      if (args.query && args.query.trim() !== '') {
        q = q.or(`titulo.ilike.%${args.query}%,cliente_nombre.ilike.%${args.query}%,empresa.ilike.%${args.query}%`);
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
  if (!chatSession) startDinamoSession();
  
  try {
    const result = await chatSession.sendMessage(textMessage);
    const call = result.response.functionCalls()?.[0];
    
    if (call) {
      // 1. El LLM quiere ejecutar una función
      const apiResponse = await executeTool(call);
      
      // 2. Le devolvemos el resultado de la función al LLM
      const followUpResult = await chatSession.sendMessage([{
        functionResponse: {
          name: call.name,
          response: apiResponse
        }
      }]);
      
      return followUpResult.response.text();
    }
    
    // Si no hubo llamada a función, es una respuesta normal
    return result.response.text();
  } catch (error) {
    console.error("Error en sendDinamoMessage:", error);
    return "Lo siento, tuve un problema interno de conexión.";
  }
};
