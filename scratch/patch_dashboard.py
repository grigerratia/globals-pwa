import re

with open('src/components/ExecutiveDashboard/ExecutiveDashboard.jsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import GlobalSearch from '../GlobalSearch/GlobalSearch';",
    "import GlobalSearch from '../GlobalSearch/GlobalSearch';\nimport TopHeader from '../TopHeader/TopHeader';"
)

header_pattern = re.compile(r'<header className=\{styles\.header\}>\s*<div className=\{styles\.headerTop\}>.*?</div>', re.DOTALL)
replacement = """<TopHeader session={session} currentView="ejecutivo" />
      <header className={styles.header} style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>"""

content = header_pattern.sub(replacement, content)

with open('src/components/ExecutiveDashboard/ExecutiveDashboard.jsx', 'w') as f:
    f.write(content)
