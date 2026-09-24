with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

content = content.replace("""    if (!success) {
      console.error('Error generating AI response with all models:', lastError);
      setAiResponse(`Ocurrió un error (incluso tras probar modelos de respaldo): ${lastError?.message}`);
    } finally {""", """    if (!success) {
      console.error('Error generating AI response with all models:', lastError);
      setAiResponse(`Ocurrió un error (incluso tras probar modelos de respaldo): ${lastError?.message}`);
    }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiResponse(`Ocurrió un error: ${error.message}`);
    } finally {""")

with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)
