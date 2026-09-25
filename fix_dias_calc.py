with open('src/components/Modals/ProjectDetailModal.jsx', 'r') as f:
    content = f.read()

old_calc = """    );
  }

  return ("""

new_calc = """    );
  }

  let diasEstimadosNota = null;
  if (proyecto && proyecto.notas) {
    const match = proyecto.notas.match(/\\[DÍAS ESTIMADOS FASE ACTUAL: (\\d+)\\]/);
    if (match) {
      const diasTotales = parseInt(match[1], 10);
      const hoy = new Date();
      const ultima = new Date(proyecto.fecha_ultima_actualizacion || proyecto.fecha_creacion);
      const diff = Math.floor((hoy - ultima) / 86400000);
      let restantes = diasTotales - diff;
      diasEstimadosNota = restantes >= 0 ? restantes : 0;
    }
  }

  return ("""

content = content.replace(old_calc, new_calc)

with open('src/components/Modals/ProjectDetailModal.jsx', 'w') as f:
    f.write(content)
