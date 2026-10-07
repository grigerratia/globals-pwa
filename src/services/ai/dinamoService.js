import { validateProjectMove } from '../../utils/kanbanRules';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { supabase } from '../../supabase';

// Inicializar SDK
const googleKeys = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3
].filter(Boolean);

let currentGoogleKeyIndex = 0;

// --- EJE 3: SISTEMA DE REFERENCIAS CORTAS (Short-ID Mapping) ---
let projectToShortMap = {};
let shortToProjectMap = {};
let nextShortId = 1;

function getShortId(uuid) {
  if (projectToShortMap[uuid]) return projectToShortMap[uuid];
  const shortId = `P${nextShortId++}`;
  projectToShortMap[uuid] = shortId;
  shortToProjectMap[shortId] = uuid;
  return shortId;
}

function resolveShortId(shortId) {
  return shortToProjectMap[shortId] || shortId;
}

// --- EJE 1: VENTANA DE MEMORIA CONTROLADA ---
let chatHistory = [];
const MAX_HISTORY_TURNS = 6;

function truncateHistory(history, maxTurns) {
  return history.slice(-(maxTurns * 2));
}

const groqApiKey = import.meta.env.VITE_OPENAI_API_KEY;
const cohereApiKey = import.meta.env.VITE_COHERE_API_KEY;


const SYSTEM_PROMPT = `Eres Dinamo, asistente IA de Kanban Global's. Eres profesional, directo y MUY BREVE.
REGLAS:
1. Respuestas CORTAS, DIRECTAS, AMIGABLES. Cero tecnicismos. Usa viñetas y emojis para organizar.
2. MAPPING DE IDs: Recibirás IDs cortos (ej. P1, P2) al buscar proyectos. Úsalos internamente para las herramientas. IMPORTANTE: NUNCA muestres ni le menciones estos códigos (P1, P2...) al usuario en tu respuesta de texto.
3. ARCHIVADO/CANCELACIÓN: NUNCA pases un proyecto a "Archivado" o "Cancelado" de inmediato. Pide un motivo, agrega la etiqueta [WIDGET:INPUT_MOTIVO]. Cuando respondan, usa 'actualizar_estado_proyecto' con el motivo.
4. COLUMNAS: "En Conversación", "Levantamiento", "Presupuesto enviado", "Aprobado - Esperando Anticipo", "Anticipo - En Producción", "Listo para instalar/entregar", "Entregado y cerrado", "Pausa", "Cancelado", "Archivado".
5. ASIGNAR: Usa 'asignar_encargado'. NUNCA lo escribas en las notas.
6. WIDGETS INTERACTIVOS (Usa cuando las herramientas te den error pidiendo esto):
   - Confirmar presupuesto/materiales/levantamiento: [WIDGET:CONFIRM_CHECKBOXES]
   - Faltan días estimados: [WIDGET:INPUT_DIAS]
   - Falta motivo: [WIDGET:INPUT_MOTIVO]`;

const tools = [
  {
    functionDeclarations: [
      {
        name: 'buscar_proyectos',
        description: 'Busca proyectos por título, cliente o estado. Retorna IDs cortos.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: 'Término de búsqueda (ej. "Coca Cola"). Vacío para todos.' },
            estado: { type: SchemaType.STRING, description: 'Opcional. Filtra por columna específica.' }
          },
          required: ['query'],
        },
      },
      {
        name: 'actualizar_estado_proyecto',
        description: 'Cambia la fase de un proyecto Kanban usando su ID corto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID corto del proyecto (ej. P1)' },
            nuevo_estado: { type: SchemaType.STRING, description: 'Ej: "Logística y compras"' },
            motivo: { type: SchemaType.STRING, description: 'Obligatorio si se Pausa, Cancela o Retrocede.' },
            dias_estimados: { type: SchemaType.NUMBER, description: 'Días que tomará. Obligatorio al avanzar.' },
            confirmar_casillas: { type: SchemaType.BOOLEAN, description: 'True si el usuario confirmó por voz/widget.' }
          },
          required: ['id_proyecto', 'nuevo_estado'],
        },
      },
      {
        name: 'modificar_proyecto',
        description: 'Modifica campos de un proyecto usando su ID corto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID corto (ej. P1)' },
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
        description: 'Crea un nuevo proyecto en el sistema.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            titulo: { type: SchemaType.STRING },
            cliente_nombre: { type: SchemaType.STRING },
            cliente_empresa: { type: SchemaType.STRING },
            cliente_telefono: { type: SchemaType.STRING },
            estado: { type: SchemaType.STRING, description: 'Columna inicial. Por defecto "En Conversación".' },
            dias_estimados: { type: SchemaType.NUMBER, description: 'Obligatorio preguntar.' }
          },
          required: ['titulo'],
        },
      },
      {
        name: 'asignar_encargado',
        description: 'Asigna a un usuario usando su nombre y el ID corto del proyecto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID corto del proyecto' },
            nombre_usuario: { type: SchemaType.STRING, description: 'Nombre del usuario a asignar' }
          },
          required: ['id_proyecto', 'nombre_usuario'],
        },
      },
      {
        name: 'agregar_comentario_proyecto',
        description: 'Agrega un comentario al chat del proyecto usando su ID corto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id_proyecto: { type: SchemaType.STRING, description: 'ID corto del proyecto' },
            texto_comentario: { type: SchemaType.STRING, description: 'Mensaje que se dejará en el proyecto' }
          },
          required: ['id_proyecto', 'texto_comentario'],
        },
      },
      {
        name: 'obtener_kpis',
        description: 'Devuelve estadísticas globales de proyectos activos y cerrados.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            tipo: { type: SchemaType.STRING, description: 'Ej. "financieros" u "operativos".' }
          },
          required: ['tipo'],
        },
      }
    ],
  },
];

// Convertidor de herramientas a formato OpenAI (Groq)
const groqTools = tools[0].functionDeclarations.map(decl => ({
  type: 'function',
  function: {
    name: decl.name,
    description: decl.description,
    parameters: {
      type: 'object',
      properties: Object.keys(decl.parameters?.properties || {}).reduce((acc, key) => {
        let pType = decl.parameters.properties[key].type.toLowerCase();
        if (pType.includes('string')) pType = 'string';
        else if (pType.includes('boolean')) pType = 'boolean';
        else if (pType.includes('number')) pType = 'number';
        else pType = 'string';

        acc[key] = {
          type: pType,
          description: decl.parameters.properties[key].description
        };
        return acc;
      }, {}),
      required: decl.parameters?.required || []
    }
  }
}));

const modelosDisponibles = [
  { id: 'gemini-3.5-flash-lite', provider: 'google' },
  { id: 'gemini-3.1-flash-lite', provider: 'google' },
  { id: 'gemini-3.8-flash', provider: 'google' },
  { id: 'gemini-3.5-flash', provider: 'google' },
  { id: 'gemini-3-flash-preview', provider: 'google' },
  { id: 'gemini-3.1-pro-preview', provider: 'google' },
  { id: 'llama-3.1-8b-instant', provider: 'groq' },
  { id: 'llama-3.1-70b-versatile', provider: 'groq' },
  { id: 'command-r', provider: 'cohere' },
  { id: 'command-r-plus', provider: 'cohere' }
];
let currentModelIndex = 0;

// Implementación real de las herramientas en Supabase
const executeTool = async (call) => {
  const { name } = call;
  const args = { ...call.args };
  
  // Resolver Short IDs en argumentos antes de procesar
  if (args.id_proyecto) {
    args.id_proyecto = resolveShortId(args.id_proyecto);
  }

  console.log(`[Dinamo Tool Exec] ${name}`, args);
  
  try {
    if (name === 'buscar_proyectos') {
      let q = supabase.from('proyectos').select('id, titulo, cliente_nombre, estado, cliente_empresa, fecha_creacion').order('fecha_creacion', { ascending: false, nullsFirst: false }).limit(20);
      if (args.query && args.query.trim() !== '') {
        const safeQuery = args.query.replace(/"/g, '');
        q = q.or(`titulo.ilike."%${safeQuery}%",cliente_nombre.ilike."%${safeQuery}%",cliente_empresa.ilike."%${safeQuery}%"`);
      }
      if (args.estado) q = q.eq('estado', args.estado);
      
      const { data, error } = await q;
      if (error) throw error;
      
      // EJE 4: COMPRESIÓN DE DATOS (Data Pruning y uso de Short-ID)
      const compressedData = data.map(p => {
        const obj = { id: getShortId(p.id), titulo: p.titulo, estado: p.estado };
        if (p.cliente_nombre) obj.cliente = p.cliente_nombre;
        if (p.cliente_empresa) obj.empresa = p.cliente_empresa;
        return obj;
      });
      return { success: true, result: compressedData };
    }

    if (name === 'actualizar_estado_proyecto') {
      const { id_proyecto, nuevo_estado, motivo, dias_estimados, confirmar_casillas } = args;
      
      const { data: currentP } = await supabase.from('proyectos').select('*').eq('id', id_proyecto).single();
      const { data: colsData } = await supabase.from('columnas').select('nombre').order('orden', { ascending: true });
      const estadosList = colsData ? colsData.map(c => c.nombre) : [];
      
      const session = await supabase.auth.getSession().then(({ data }) => data.session);
      const validation = validateProjectMove(currentP, nuevo_estado, estadosList, session);
      
      if (!validation.isValid && !confirmar_casillas) {
         throw new Error(`BLOQUEADO: ${validation.error}. PREGUNTA AL USUARIO SI CONFIRMA Y LLAMA DE NUEVO CON confirmar_casillas: true`);
      }
      if (validation.requiresDias && !dias_estimados) {
         throw new Error("FALTAN DÍAS ESTIMADOS: Pregúntale al usuario los días.");
      }
      if (validation.requiresMotive && !motivo) {
         throw new Error(`FALTA MOTIVO: Pregúntale al usuario el motivo.`);
      }
      
      const updateData = { estado: nuevo_estado, fecha_ultima_actualizacion: new Date().toISOString() };
      
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
      return { success: true, message: `Movido a ${nuevo_estado}` };
    }

    if (name === 'modificar_proyecto') {
      const { id_proyecto, ...campos } = args;
      const { error } = await supabase.from('proyectos').update(campos).eq('id', id_proyecto);
      if (error) throw error;
      return { success: true };
    }

    if (name === 'crear_proyecto') {
      const { data: _allEmps } = await supabase.rpc('get_empleados');
      const superusers = (_allEmps || []).filter(e => ['Líder Comercial', 'Líder de Operaciones'].includes(e.rol));
      
      if (!superusers || !superusers.some(su => su.rol === 'Líder Comercial')) {
         throw new Error("ERROR: No hay 'Líder Comercial' para asignar.");
      }
      
      const encargadosPorDefecto = superusers.map(su => ({ id: su.id, nombre: su.nombre, rol: su.rol }));
      const { data: colsData } = await supabase.from('columnas').select('nombre').order('orden', { ascending: true });
      const estadosList = colsData ? colsData.map(c => c.nombre) : [];
      
      if (!args.dias_estimados) {
         throw new Error("FALTAN DÍAS ESTIMADOS: Obligatorio preguntar.");
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
      
      const targetIdx = estadosList.indexOf(nuevoProy.estado);
      const levantamientoIdx = estadosList.indexOf('Levantamiento');
      const presupIdx = estadosList.indexOf('Presupuesto enviado');
      const logisIdx = estadosList.indexOf('Logística y compras');

      if (targetIdx > levantamientoIdx && levantamientoIdx !== -1) nuevoProy.omitir_levantamiento = true;
      if (targetIdx > presupIdx && presupIdx !== -1) nuevoProy.presupuesto_aprobado = true;
      if (targetIdx > logisIdx && logisIdx !== -1) nuevoProy.materiales_comprados = true;
      
      const { data, error } = await supabase.from('proyectos').insert(nuevoProy).select('id');
      if (error) throw error;
      return { success: true, short_id: getShortId(data[0].id) };
    }

    if (name === 'asignar_encargado') {
      const { data: pData, error: pError } = await supabase.from('proyectos').select('encargados').eq('id', args.id_proyecto).single();
      if (pError) throw pError;
      
      let targetUser = null;
      const { data: empleadosData, error: empError } = await supabase.rpc('get_empleados');
      if (!empError && empleadosData) {
        targetUser = empleadosData.find(e => e.nombre && e.nombre.toLowerCase().includes(args.nombre_usuario.toLowerCase()));
      }

      if (!targetUser) {
        return { success: false, error: `No se encontró usuario ${args.nombre_usuario}.` };
      }
      
      const newEncargado = { id: targetUser.id, nombre: targetUser.nombre, rol: targetUser.rol || 'Asignado' };
      let encargados = pData.encargados || [];
      if (!encargados.find(e => e.id === newEncargado.id || e.user_id === newEncargado.id)) {
        encargados.push(newEncargado);
        const { error: updErr } = await supabase.from('proyectos').update({ encargados }).eq('id', args.id_proyecto); if (updErr) throw updErr;
        return { success: true };
      }
      return { success: true, message: 'Ya estaba asignado.' };
    }

    if (name === 'agregar_comentario_proyecto') {
      const { error: comErr } = await supabase.from('comentarios').insert([{
        proyecto_id: args.id_proyecto,
        texto: args.texto_comentario,
        autor_email: 'Dinamo AI ✨'
      }]); if (comErr) throw comErr;
      return { success: true };
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

      return { success: true, result: { activos, cerrados, desglose: desglosePorEstado } };
    }

  } catch (err) {
    console.error(`[Dinamo Tool Error]`, err);
    return { success: false, error: err.message };
  }
};

export const sendDinamoMessage = async (textMessage) => {
  let keysTried = 1;
  for (let i = currentModelIndex; i < modelosDisponibles.length; i++) {
    const currentModel = modelosDisponibles[i];
    try {
      let finalTextResponse = "";

      if (currentModel.provider === 'google') {
        const genAI = new GoogleGenerativeAI(googleKeys[currentGoogleKeyIndex]);
        const model = genAI.getGenerativeModel({
          model: currentModel.id,
          tools: tools,
          systemInstruction: SYSTEM_PROMPT
        });

        let localHistory = chatHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
        localHistory.push({ role: 'user', parts: [{ text: textMessage }] });
        
        let recentHistory = localHistory.slice(-(MAX_HISTORY_TURNS * 2));
        let result = await model.generateContent({ contents: recentHistory });
        
        let loopCount = 0;
        const MAX_LOOPS = 20;
        
        while (result.response.functionCalls() && result.response.functionCalls().length > 0) {
          loopCount++;
          localHistory.push(result.response.candidates[0].content);
          
          if (loopCount > MAX_LOOPS) {
            console.warn("[Dinamo] Cortafuegos activado.");
            localHistory.push({ role: 'user', parts: [{ text: "Demasiadas recursiones. Detente y resume." }] });
            recentHistory = localHistory.slice(-(MAX_HISTORY_TURNS * 2));
            result = await model.generateContent({ contents: recentHistory });
            break;
          }
          
          const calls = result.response.functionCalls();
          const functionResponses = [];
          
          for (const call of calls) {
            try {
              const apiResponse = await executeTool(call);
              functionResponses.push({
                functionResponse: { name: call.name, response: apiResponse }
              });
            } catch (toolErr) {
              functionResponses.push({
                functionResponse: { name: call.name, response: { success: false, error: toolErr.message } }
              });
            }
          }
          
          await new Promise(r => setTimeout(r, 600));
          localHistory.push({ role: 'user', parts: functionResponses });
          recentHistory = localHistory.slice(-(MAX_HISTORY_TURNS * 2));
          result = await model.generateContent({ contents: recentHistory });
        }
        
        finalTextResponse = result.response.text();

      } else if (currentModel.provider === 'groq') {
        let localHistory = chatHistory.map(msg => ({
          role: msg.role,
          content: msg.text
        }));
        
        // Agregar el system prompt al inicio para Groq
        localHistory.unshift({ role: 'system', content: SYSTEM_PROMPT });
        localHistory.push({ role: 'user', content: textMessage });
        
        let recentHistory = localHistory;
        
        let loopCount = 0;
        const MAX_LOOPS = 20;
        
        let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: currentModel.id,
            messages: recentHistory,
            tools: groqTools,
            tool_choice: 'auto'
          })
        });
        
        if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error?.message || response.statusText);
        }
        
        let result = await response.json();
        let message = result.choices[0].message;
        
        while (message.tool_calls && message.tool_calls.length > 0) {
          loopCount++;
          recentHistory.push(message); // Agregamos la respuesta del asistente con las tool_calls
          
          if (loopCount > MAX_LOOPS) {
             console.warn("[Dinamo] Cortafuegos activado en Groq.");
             recentHistory.push({ role: 'user', content: "Demasiadas recursiones. Detente y resume." });
             break;
          }
          
          for (const call of message.tool_calls) {
            try {
              const args = JSON.parse(call.function.arguments || '{}');
              const apiResponse = await executeTool({ name: call.function.name, args });
              recentHistory.push({
                role: 'tool',
                tool_call_id: call.id,
                name: call.function.name,
                content: JSON.stringify(apiResponse)
              });
            } catch (toolErr) {
              recentHistory.push({
                role: 'tool',
                tool_call_id: call.id,
                name: call.function.name,
                content: JSON.stringify({ success: false, error: toolErr.message })
              });
            }
          }
          
          await new Promise(r => setTimeout(r, 600));
          
          response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: currentModel.id,
              messages: recentHistory,
              tools: groqTools,
              tool_choice: 'auto'
            })
          });
          
          if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error?.message || response.statusText);
          }
          result = await response.json();
          message = result.choices[0].message;
        }
        
        finalTextResponse = message.content;
      } else if (currentModel.provider === 'cohere') {
        let localHistory = chatHistory.map(msg => ({
          role: msg.role === 'user' ? 'USER' : 'CHATBOT',
          message: msg.text
        }));
        
        let loopCount = 0;
        const MAX_LOOPS = 20;
        let currentMessage = textMessage;
        let toolResults = undefined;
        let isFinal = false;
        
        while (!isFinal) {
          loopCount++;
          if (loopCount > MAX_LOOPS) {
             console.warn("[Dinamo] Cortafuegos activado en Cohere.");
             currentMessage = "Demasiadas recursiones. Detente y resume.";
             toolResults = undefined;
          }
          
          let requestBody = {
            model: currentModel.id,
            message: currentMessage,
            preamble: SYSTEM_PROMPT,
            chat_history: localHistory,
            tools: cohereTools
          };
          
          if (toolResults) {
            requestBody.tool_results = toolResults;
            requestBody.message = ""; // Message must be empty when submitting tool_results
          }
          
          let response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cohereApiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.message || response.statusText);
          }
          
          let result = await response.json();
          
          if (result.tool_calls && result.tool_calls.length > 0) {
            toolResults = [];
            for (const call of result.tool_calls) {
              try {
                const apiResponse = await executeTool({ name: call.name, args: call.parameters });
                toolResults.push({
                  call: call,
                  outputs: [apiResponse]
                });
              } catch (toolErr) {
                toolResults.push({
                  call: call,
                  outputs: [{ success: false, error: toolErr.message }]
                });
              }
            }
            await new Promise(r => setTimeout(r, 600));
          } else {
            finalTextResponse = result.text;
            isFinal = true;
          }
        }
      }

      // Si todo fue exitoso, actualizamos la historia global simplificada (solo texto)
      chatHistory.push({ role: 'user', text: textMessage });
      chatHistory.push({ role: 'assistant', text: finalTextResponse });
      chatHistory = truncateHistory(chatHistory, MAX_HISTORY_TURNS);
      
      return finalTextResponse;
      
    } catch (error) {
      console.warn(`[Dinamo] Falló el modelo ${currentModel.id}:`, error.message);
      
      const isQuotaError = error.message.includes('429') || error.message.includes('503') || error.message.includes('insufficient_quota');

      if (currentModel.provider === 'google' && isQuotaError) {
        if (keysTried < googleKeys.length) {
          console.warn(`[Dinamo] Rotando a la siguiente API Key de Google... (${keysTried}/${googleKeys.length})`);
          currentGoogleKeyIndex = (currentGoogleKeyIndex + 1) % googleKeys.length;
          keysTried++;
          i--; // Reintentar el mismo modelo con la nueva llave
          continue;
        }
      }

      // Si llegamos aquí, agotamos las llaves de este modelo o fue un error diferente
      keysTried = 1;

      if (i === modelosDisponibles.length - 1) {
        if (isQuotaError) {
          return "Atención: Cuota agotada o servidores saturados en TODOS los modelos y llaves. Debemos esperar un momento para reintentar.";
        }
        return "Lo siento, mis sistemas están saturados en este momento. Intenta de nuevo más tarde.";
      }
      currentModelIndex = i + 1; // Intentar con el siguiente en el futuro
    }
  }
};