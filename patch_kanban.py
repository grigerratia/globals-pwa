import re

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

# Import the modal
if "import CanceladosModal" not in content:
    content = content.replace("import ProjectDetailModal from '../Modals/ProjectDetailModal';", "import ProjectDetailModal from '../Modals/ProjectDetailModal';\nimport CanceladosModal from '../Modals/CanceladosModal';")

# Add state for the modal
if "showCancelados" not in content:
    content = re.sub(r'const \[showArchived, setShowArchived\] = useState\(false\);', r'const [showArchived, setShowArchived] = useState(false);\n  const [showCancelados, setShowCancelados] = useState(false);', content)

# Add button next to "Ver Archivados"
old_button = """        <button 
          className={`${styles.btnArchive} ${showArchived ? styles.active : ''}`}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive size={18} />
          <span className={styles.hideOnMobile}>
            {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
          </span>
        </button>"""

new_buttons = """        <button 
          className={`${styles.btnArchive} ${showArchived ? styles.active : ''}`}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive size={18} />
          <span className={styles.hideOnMobile}>
            {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
          </span>
        </button>
        <button 
          className={styles.btnArchive}
          style={{ background: '#ef4444', color: 'white', borderColor: '#b91c1c' }}
          onClick={() => setShowCancelados(true)}
        >
          <Trash2 size={18} />
          <span className={styles.hideOnMobile}>
            Cancelados
          </span>
        </button>"""

content = content.replace(old_button, new_buttons)

# Add the modal component rendering at the end
if "<CanceladosModal" not in content:
    content = content.replace("      {selectedProjectId && (", "      {showCancelados && (\n        <CanceladosModal \n          session={session}\n          onClose={() => setShowCancelados(false)}\n        />\n      )}\n\n      {selectedProjectId && (")

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
