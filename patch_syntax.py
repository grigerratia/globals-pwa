import re

with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

# Fix the dangling catch block
content = content.replace("""    }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setAiResponse(`Ocurrió un error: ${error.message}`);
    } finally {""", """    } finally {""")

with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)
