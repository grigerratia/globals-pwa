const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/AIAgentModal.jsx', 'utf-8');

const replacement = `      if (!success || !parsed) {
        throw new Error(lastError?.message || "Todos los modelos de Gemini fallaron o están saturados.");
      }

      // Sanitizar datos vacíos que rompen Supabase
      if (parsed.fecha_entrega === "" || parsed.fecha_entrega === "null") {
        parsed.fecha_entrega = null;
      }
      if (parsed.presupuesto_vendido === "" || isNaN(parsed.presupuesto_vendido)) {
        parsed.presupuesto_vendido = 0;
      }
      if (parsed.costo_materiales === "" || isNaN(parsed.costo_materiales)) {
        parsed.costo_materiales = 0;
      }
      if (parsed.costo_operativo === "" || isNaN(parsed.costo_operativo)) {
        parsed.costo_operativo = 0;
      }

      if (estadoPredefinido && typeof estadoPredefinido === 'string') { parsed.estado = estadoPredefinido; }
      await onProjectCreated(parsed);`;

code = code.replace(
  /if \(!success \|\| !parsed\) \{[\s\S]*?await onProjectCreated\(parsed\);/m,
  replacement
);

fs.writeFileSync('src/components/Modals/AIAgentModal.jsx', code);
