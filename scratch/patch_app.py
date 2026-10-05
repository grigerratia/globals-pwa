import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Replace window.location.pathname === '/kanban' with window.location.pathname === '/kanban' || window.location.pathname === '/tablero'
content = content.replace("window.location.pathname === '/kanban'", "window.location.pathname === '/kanban' || window.location.pathname === '/tablero'")

with open('src/App.jsx', 'w') as f:
    f.write(content)
