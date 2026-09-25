with open('src/components/Modals/ProjectDetailModal.module.scss', 'r') as f:
    content = f.read()

import re

old_overlay = """.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem 0.5rem;
  overflow-y: auto;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.25s ease-out;
}"""

new_overlay = """.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.25s ease-out;
}"""

old_modal = """.modal {
  background: linear-gradient(to right bottom, #3b82f6, #8b5cf6);
  width: 95%;
  max-width: 900px;
  margin: 0 auto;
  box-sizing: border-box;
  border-radius: 16px;
  padding: 2.5rem;
  color: #fff;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}"""

new_modal = """.modal {
  background: linear-gradient(to right bottom, #3b82f6, #8b5cf6);
  width: 100%;
  max-width: 900px;
  max-height: 95vh;
  overflow-y: auto;
  box-sizing: border-box;
  border-radius: 16px;
  padding: 2.5rem;
  color: #fff;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}"""

content = content.replace(old_overlay, new_overlay)
content = content.replace(old_modal, new_modal)

with open('src/components/Modals/ProjectDetailModal.module.scss', 'w') as f:
    f.write(content)
