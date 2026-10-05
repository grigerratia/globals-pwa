with open('src/components/ExecutiveDashboard/ExecutiveDashboard.jsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import GlobalSearch from '../GlobalSearch/GlobalSearch';",
    "import GlobalSearch from '../GlobalSearch/GlobalSearch';\nimport TopHeader from '../TopHeader/TopHeader';"
)

old_header = """      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.greeting}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>Hola, {session?.user?.user_metadata?.nombre?.split(' ')[0] || 'Líder'}</h1>
              <span className={styles.badge} style={{ marginLeft: 0, marginTop: '4px' }}>
                {userRole || 'Usuario'}
              </span>
            </div>
            <p>Resumen Ejecutivo</p>
          </div>
          <div className={styles.actions}>
            {isLiderComercial && (
              <button 
                className={styles.btnFinance} 
                onClick={() => window.location.href = '/dashboard'} 
                title="Ver Dashboard Financiero"
              >
                <BarChart2 size={20} />
                <span className={styles.hideMobile}>Finanzas</span>
              </button>
            )}
            <button className={styles.btnKanban} onClick={goToKanban} title="Ver Tablero Completo">
              <Kanban size={20} />
              <span className={styles.hideMobile}>Tablero</span>
            </button>
          </div>
        </div>
        
        <div className={styles.searchSection}>
          <GlobalSearch onResultClick={(id) => setProyectoDetalleId(id)} />
        </div>
      </header>"""

new_header = """      <TopHeader session={session} currentView="ejecutivo" />
      <header className={styles.header} style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className={styles.greeting}>
          <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>Resumen Ejecutivo</p>
        </div>
        <div className={styles.searchSection}>
          <GlobalSearch onResultClick={(id) => setProyectoDetalleId(id)} />
        </div>
      </header>"""

content = content.replace(old_header, new_header)

with open('src/components/ExecutiveDashboard/ExecutiveDashboard.jsx', 'w') as f:
    f.write(content)
