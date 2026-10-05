import re

with open('src/components/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

# Replace the inner div of aiResponse
old_div = "<div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>"
new_div = "<div className={styles.aiResultWrapper}>"

content = content.replace(old_div, new_div)

with open('src/components/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)

