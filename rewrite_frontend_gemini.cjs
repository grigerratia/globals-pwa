const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/AIAgentModal.jsx', 'utf-8');

const regex = /const res = await fetch\(`https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.8-flash:generateContent\?key=\$\{apiKey\}`[\s\S]*?await onProjectCreated\(parsed\);\n\s*onClose\(\);/m;

const newLogic = `
      const modelosATestar = [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-flash-lite-latest'
      ];
      
      let parsed = null;
      let success = false;
      let lastError = null;

      for (const modelName of modelosATestar) {
        try {
          const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${modelName}:generateContent?key=\${apiKey}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { response_mime_type: "application/json" }
            })
          });

          const data = await res.json();
          
          if (data.error) {
            throw new Error(data.error.message);
          }

          const responseText = data.candidates[0].content.parts[0].text;
          parsed = JSON.parse(responseText);
          success = true;
          break; // Salimos del for loop si tuvo éxito
        } catch (err) {
          console.warn(\`Falló el modelo \${modelName}:\`, err.message);
          lastError = err;
        }
      }

      if (!success || !parsed) {
        throw new Error(lastError?.message || "Todos los modelos de Gemini fallaron o están saturados.");
      }

      // Pass parsed data to the Kanban handler
      await onProjectCreated(parsed);
      onClose();`;

code = code.replace(regex, newLogic);
fs.writeFileSync('src/components/Modals/AIAgentModal.jsx', code);
