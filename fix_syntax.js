const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard/Dashboard.jsx', 'utf8');

code = code.replace(`    if (!success) {
      console.error('Error generating AI response with all models:', lastError);
      setAiResponse(\`Ocurrió un error (incluso tras probar modelos de respaldo): \${lastError?.message}\`);
    } finally {`, `    if (!success) {
      console.error('Error generating AI response with all models:', lastError);
      setAiResponse(\`Ocurrió un error (incluso tras probar modelos de respaldo): \${lastError?.message}\`);
    }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiResponse(\`Ocurrió un error: \${error.message}\`);
    } finally {`);

fs.writeFileSync('src/components/Dashboard/Dashboard.jsx', code);
