const fs = require('fs');
const file = './src/services/ai/dinamoService.js';
let code = fs.readFileSync(file, 'utf8');

const regex = /const nuevoProy = \{\s*titulo: args\.titulo,\s*cliente_nombre: args\.cliente_nombre \|\| '',\s*cliente_empresa: args\.cliente_empresa \|\| '',\s*cliente_telefono: args\.cliente_telefono \|\| '',\s*estado: args\.estado \|\| 'En Conversación',\s*encargados: encargadosPorDefecto,\s*notas: \`\[DINAMO - Proyecto Creado\]\\n\[DÍAS ESTIMADOS FASE ACTUAL: \$\{args\.dias_estimados\}\]\`,\s*fecha_creacion: new Date\(\)\.toISOString\(\)\s*\};/g;

const replaceWith = `const nuevoProy = {
        titulo: args.titulo,
        cliente_nombre: args.cliente_nombre || '',
        cliente_empresa: args.cliente_empresa || '',
        cliente_telefono: args.cliente_telefono || '',
        estado: args.estado || 'En Conversación',
        encargados: encargadosPorDefecto,
        notas: \`[DINAMO - Proyecto Creado]\\n[DÍAS ESTIMADOS FASE ACTUAL: \${args.dias_estimados}]\`,
        fecha_creacion: new Date().toISOString(),
        materiales: []
      };

      if (args.materiales && Array.isArray(args.materiales)) {
         nuevoProy.materiales = args.materiales.map((m, i) => ({
            id: \`mat-\${Date.now()}-\${i}\`,
            nombre: m.nombre || 'Material',
            cantidad: m.cantidad || 1,
            costo_unitario: m.costo_unitario || 0,
            comprado: false
         }));
      }`;

code = code.replace(regex, replaceWith);
fs.writeFileSync(file, code);
