import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

# The section that contains "Lista de Materiales y Costos"
old_section = """            <div className={styles.section}>
              <div className={styles.sectionContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckSquare size={18} /> Lista de Materiales y Costos
                  </h3>
                </div>"""

new_section = """            <div className={styles.section} style={{ flexGrow: 1 }}>
              <div className={styles.sectionContent} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckSquare size={18} /> Lista de Materiales y Costos
                  </h3>
                </div>"""

content = content.replace(old_section, new_section)

old_checklist = """                <div className={styles.checklist} style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>"""
new_checklist = """                <div className={styles.checklist} style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>"""
content = content.replace(old_checklist, new_checklist)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
