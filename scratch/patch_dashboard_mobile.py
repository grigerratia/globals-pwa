import re

with open('src/components/Dashboard/Dashboard.module.scss', 'r') as f:
    content = f.read()

content = content.replace(
"""  .aiCard {
    padding: 1.25rem;
  }""",
"""  .aiCard {
    padding: 0.75rem;
    border-radius: 12px;
  }
  .aiBody {
    padding: 0.5rem;
  }""")

content = content.replace(
"""  .aiBody {
  background: rgba(255, 255, 255, 0.1);""",
"""  .aiBody {
  background: transparent;"""
)

with open('src/components/Dashboard/Dashboard.module.scss', 'w') as f:
    f.write(content)
