with open('src/components/Modals/LevantamientoFormModal.jsx', 'r') as f:
    content = f.read()

import re

old_input = """<input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} min={new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0]} />"""
new_input = """<input type="date" name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange} min={new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0]} />"""

content = content.replace(old_input, new_input)

with open('src/components/Modals/LevantamientoFormModal.jsx', 'w') as f:
    f.write(content)
