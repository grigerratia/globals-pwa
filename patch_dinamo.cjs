const fs = require('fs');
const file = './src/services/ai/dinamoService.js';
let code = fs.readFileSync(file, 'utf8');

const regexParams = /estado: \{ type: SchemaType\.STRING, description: 'Columna inicial\. Por defecto "En Conversación"\.' \},\s*dias_estimados: \{ type: SchemaType\.NUMBER, description: 'Obligatorio preguntar\.' \}/;

const replaceParams = `estado: { type: SchemaType.STRING, description: 'Columna inicial. Por defecto "En Conversación".' },
            dias_estimados: { type: SchemaType.NUMBER, description: 'Obligatorio preguntar.' },
            materiales: { 
              type: SchemaType.ARRAY, 
              items: {
                 type: SchemaType.OBJECT,
                 properties: {
                    nombre: { type: SchemaType.STRING },
                    cantidad: { type: SchemaType.NUMBER },
                    costo_unitario: { type: SchemaType.NUMBER }
                 }
              },
              description: 'Lista opcional de materiales iniciales' 
            }`;

code = code.replace(regexParams, replaceParams);

const regexExec = /const pData = \{\s*titulo: args\.titulo[^}]*\s*notas: \`Días estimados fase actual: \$\{args\.dias_estimados \|\| 7\}\`\s*\};/;
const replaceExec = `const pData = {
        titulo: args.titulo || 'Nuevo Proyecto AI',
        cliente_nombre: args.cliente_nombre || 'N/A',
        cliente_empresa: args.cliente_empresa || 'N/A',
        cliente_telefono: args.cliente_telefono || 'N/A',
        estado: args.estado || (estadosList.length > 0 ? estadosList[0] : 'En Conversación'),
        encargados: args.encargados || encargadosPorDefecto,
        notas: \`Días estimados fase actual: \${args.dias_estimados || 7}\`,
        materiales: []
      };

      if (args.materiales && Array.isArray(args.materiales)) {
         pData.materiales = args.materiales.map((m, i) => ({
            id: \`mat-\${Date.now()}-\${i}\`,
            nombre: m.nombre || 'Material',
            cantidad: m.cantidad || 1,
            costo_unitario: m.costo_unitario || 0,
            comprado: false
         }));
      }`;

code = code.replace(regexExec, replaceExec);

fs.writeFileSync(file, code);
