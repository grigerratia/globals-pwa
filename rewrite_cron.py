import re

with open('/home/grigerdev/projects/globals-backend/index.js', 'r') as f:
    content = f.read()

content = re.sub(
    r'if \(diffDays === 1\) \{[\s\S]*?\} else if \(diffDays < 0\) \{[\s\S]*?\}',
    '''if (diffDays === 1) {
        msj = `⚠️ *RECORDATORIO DE ENTREGA*\\nPrepara todo para mañana. El proyecto "${pry.titulo}" está agendado para entregarse el ${fechaEntrega.toLocaleDateString()}.\\nFase actual: ${pry.estado}`;
        necesitaAlerta = true;
      } else if (diffDays === 0) {
        msj = `🚨 *ENTREGA FINAL HOY*\\n¡El día llegó! El proyecto "${pry.titulo}" debe entregarse hoy sin falta.\\nFase actual: ${pry.estado}`;
        necesitaAlerta = true;
      } else if (diffDays < 0) {
        msj = `💥 *PROYECTO RETRASADO*\\nEl proyecto "${pry.titulo}" tiene la fecha de entrega vencida (${fechaEntrega.toLocaleDateString()}). Por favor, actualiza su estado o comunícate con el cliente.\\nFase actual: ${pry.estado}`;
        necesitaAlerta = true;
      }''',
    content
)

content = re.sub(
    r'if \(diffLevantamiento === 1\) \{[\s\S]*?else if \(diffLevantamiento === 0\) \{[\s\S]*?\}',
    '''if (diffLevantamiento === 1) {
        msj += (msj ? '\\n\\n' : '') + `⚠️ *RECORDATORIO LEVANTAMIENTO*\\nMañana (${fechaLevantamiento.toLocaleDateString()}) es el levantamiento del proyecto "${pry.titulo}".`;
        necesitaAlerta = true;
      } else if (diffLevantamiento === 0) {
        msj += (msj ? '\\n\\n' : '') + `🚨 *LEVANTAMIENTO HOY*\\nHoy es el levantamiento programado para el proyecto "${pry.titulo}".`;
        necesitaAlerta = true;
      }''',
    content
)

content = re.sub(
    r'alertas\.push\(\{[\s\S]*?proyecto: pry\.titulo,[\s\S]*?mensaje: msj,[\s\S]*?encargados: pry\.encargados \|\| \[\][\s\S]*?\}\);',
    '''
    let tituloPush = "⚠️ Alerta de Proyecto";
    if (msj.includes("MAÑANA") || msj.includes("mañana") || msj.includes("RECORDATORIO")) tituloPush = "⏰ Recordatorio de Proyecto";
    else if (msj.includes("HOY") || msj.includes("hoy")) tituloPush = "🚨 Proyecto Vence HOY";
    else if (msj.includes("RETRASADO")) tituloPush = "💥 Proyecto Retrasado";
    else if (msj.includes("estancado") || msj.includes("ESTANCADO")) tituloPush = "⏳ Proyecto Estancado";
    
    alertas.push({
        proyecto: pry.titulo,
        mensaje: msj,
        tituloPush: tituloPush,
        encargados: pry.encargados || []
      });''',
    content
)

content = re.sub(
    r'await enviarPushNotificacion\("⚠️ Alerta de Proyecto", alerta\.mensaje, pushUserIds\);',
    r'await enviarPushNotificacion(alerta.tituloPush || "⚠️ Alerta de Proyecto", alerta.mensaje, pushUserIds);',
    content
)

with open('/home/grigerdev/projects/globals-backend/index.js', 'w') as f:
    f.write(content)
