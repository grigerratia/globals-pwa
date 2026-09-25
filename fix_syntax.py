with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    content = f.read()

# I need to wrap the whole "Archivados" button in the Leader condition
# Currently it is:
#         <button 
#           className={`${styles.btnArchive} ${showArchived ? styles.active : ''}`}
#           onClick={() => setShowArchived(!showArchived)}
#         >
#           <Archive size={18} />
#           <span className={styles.hideOnMobile}>
#             {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
#           </span>
#         </button>
#         )}

# Wait, let's just do a regex substitution

import re

old_chunk = r"""        <button \n          className=\{`\$\{styles\.btnArchive\} \$\{showArchived \? styles\.active : ''\}`\}\n          onClick=\{\(\) => setShowArchived\(!showArchived\)\}\n        >\n          <Archive size=\{18\} />\n          <span className=\{styles\.hideOnMobile\}>\n            \{showArchived \? 'Ocultar Archivados' : 'Ver Archivados'\}\n          </span>\n        </button>\n        \)\}"""

new_chunk = """        {session?.user?.user_metadata?.rol === 'Líder Comercial' && (
        <button 
          className={`${styles.btnArchive} ${showArchived ? styles.active : ''}`}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive size={18} />
          <span className={styles.hideOnMobile}>
            {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
          </span>
        </button>
        )}"""

content = re.sub(old_chunk, new_chunk, content)
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(content)
