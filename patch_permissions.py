import re

# 1. ProjectDetailModal.jsx
with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# Archivar
archivar_old = """            {proyecto.estado !== 'Archivado' && ("""
archivar_new = """            {proyecto.estado !== 'Archivado' && userRole === 'Líder Comercial' && ("""
content = content.replace(archivar_old, archivar_new)

# Cancelar
cancelar_old = """            {['Líder Comercial', 'Administrador', 'Administración', 'CEO'].includes(userRole) && ("""
cancelar_new = """            {userRole === 'Líder Comercial' && ("""
content = content.replace(cancelar_old, cancelar_new)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)


# 2. KanbanBoard.jsx
with open('src/components/KanbanBoard/KanbanBoard.jsx', 'r') as f:
    kb = f.read()

# Only Lider Comercial can see Cancelados button
cancelados_btn_old = """        <button 
          className={styles.btnArchive}
          style={{ background: '#ef4444', color: 'white', borderColor: '#b91c1c' }}
          onClick={() => setShowCancelados(true)}
        >"""
cancelados_btn_new = """        {session?.user?.user_metadata?.rol === 'Líder Comercial' && (
        <button 
          className={styles.btnArchive}
          style={{ background: '#ef4444', color: 'white', borderColor: '#b91c1c' }}
          onClick={() => setShowCancelados(true)}
        >"""
kb = kb.replace(cancelados_btn_old, cancelados_btn_new)

# Close the if for Cancelados
cancelados_span_old = """          <span className={styles.hideOnMobile}>
            Cancelados
          </span>
        </button>"""
cancelados_span_new = """          <span className={styles.hideOnMobile}>
            Cancelados
          </span>
        </button>
        )}"""
kb = kb.replace(cancelados_span_old, cancelados_span_new)

# Also check Archivar button
archivos_btn_old = """        <button 
          className={styles.btnArchive}
          onClick={() => setShowArchived(!showArchived)}
          title={showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
        >"""
archivos_btn_new = """        {session?.user?.user_metadata?.rol === 'Líder Comercial' && (
        <button 
          className={styles.btnArchive}
          onClick={() => setShowArchived(!showArchived)}
          title={showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
        >"""
kb = kb.replace(archivos_btn_old, archivos_btn_new)

archivos_span_old = """          <span className={styles.hideOnMobile}>
            {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
          </span>
        </button>"""
archivos_span_new = """          <span className={styles.hideOnMobile}>
            {showArchived ? 'Ocultar Archivados' : 'Ver Archivados'}
          </span>
        </button>
        )}"""
kb = kb.replace(archivos_span_old, archivos_span_new)

with open('src/components/KanbanBoard/KanbanBoard.jsx', 'w') as f:
    f.write(kb)

