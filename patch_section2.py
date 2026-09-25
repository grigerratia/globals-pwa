import re

with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

old_section = """            <div className={styles.section}>
              <div className={styles.sectionContent}>
                <h3><CheckSquare className={styles.icon} size={20} /> Lista de Materiales y Tareas</h3>"""

new_section = """            <div className={styles.section} style={{ flexGrow: 1 }}>
              <div className={styles.sectionContent} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h3><CheckSquare className={styles.icon} size={20} /> Lista de Materiales y Tareas</h3>"""

content = content.replace(old_section, new_section)

old_checklist = """                <div className={styles.checklist} style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>"""
new_checklist = """                <div className={styles.checklist} style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>"""
content = content.replace(old_checklist, new_checklist)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
