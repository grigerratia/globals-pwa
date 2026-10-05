import re

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

# Add import TopHeader
content = content.replace(
    "import BellNotifications from './BellNotifications';",
    "import BellNotifications from './BellNotifications';\nimport TopHeader from '../TopHeader/TopHeader';"
)

# Replace the <header className={styles.topHeader}> ... </header> block
# We can use regex to replace it
header_pattern = re.compile(r'<header className=\{styles\.topHeader\}>.*?</header>', re.DOTALL)
content = header_pattern.sub('<TopHeader session={session} currentView="tablero" />', content)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
