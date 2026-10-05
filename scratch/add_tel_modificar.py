import re

with open('src/services/ai/dinamoService.js', 'r') as f:
    content = f.read()

old_str = """            cliente_empresa: { type: SchemaType.STRING },
            presupuesto_vendido: { type: SchemaType.NUMBER },"""
            
new_str = """            cliente_empresa: { type: SchemaType.STRING },
            cliente_telefono: { type: SchemaType.STRING },
            presupuesto_vendido: { type: SchemaType.NUMBER },"""

content = content.replace(old_str, new_str)

with open('src/services/ai/dinamoService.js', 'w') as f:
    f.write(content)
