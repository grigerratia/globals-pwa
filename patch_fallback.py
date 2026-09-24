import re

with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

new_logic = """
    const fallbackModels = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3-flash-preview"];
    let success = false;
    let lastError = null;

    for (const modelName of fallbackModels) {
      try {
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptText);
        setAiResponse(`(Generado con: ${modelName})\\n\\n` + result.response.text());
        success = true;
        break; // Exit loop on success
      } catch (err) {
        console.warn(`Error con ${modelName}:`, err);
        lastError = err;
      }
    }

    if (!success) {
      console.error('Error generating AI response with all models:', lastError);
      setAiResponse(`Ocurrió un error (incluso tras probar modelos de respaldo): ${lastError?.message}`);
    }
"""

old_logic_pattern = r'const genAI = new GoogleGenerativeAI\(import\.meta\.env\.VITE_GEMINI_API_KEY\);.*?setAiResponse\(result\.response\.text\(\)\);'
content = re.sub(old_logic_pattern, new_logic.strip(), content, flags=re.DOTALL)

with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)
