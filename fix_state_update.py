import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

content = content.replace("fetchComentarios();\n      setEditingCommentId(null);", "setComentarios(prev => prev.map(c => c.id === cId ? { ...c, texto: finalTexto } : c));\n      setEditingCommentId(null);")
content = content.replace("if (!error) fetchComentarios();", "if (!error) setComentarios(prev => prev.map(c => c.id === cId ? { ...c, texto: finalTexto } : c));")

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
