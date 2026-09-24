import React from 'react';

const textos = {
  'terminos-y-condiciones': {
    titulo: 'Términos y Condiciones de Uso',
    contenido: `
1. Aceptación de los Términos
Al acceder y utilizar el sistema de gestión interna (en adelante "la Aplicación"), los empleados y colaboradores aceptan estar sujetos a estos Términos y Condiciones. Si no está de acuerdo, no debe utilizar la Aplicación.

2. Uso de la Aplicación
La Aplicación es una herramienta de uso estrictamente interno y confidencial. Se prohíbe el uso de la Aplicación para fines ajenos a las labores profesionales dentro de la empresa.

3. Obligaciones del Usuario
El usuario se compromete a:
- Mantener la confidencialidad de sus credenciales de acceso.
- No compartir datos sensibles de clientes, proyectos o presupuestos fuera de la organización.
- Mantener actualizada la información de los proyectos que tenga a su cargo.
- Utilizar las comunicaciones (ej. WhatsApp y notificaciones) de forma profesional y con el único fin de avanzar en los proyectos.

4. Propiedad Intelectual
Todo el contenido, bases de datos, código fuente y estructura de la Aplicación son propiedad exclusiva de la empresa. Se prohíbe su reproducción o distribución no autorizada.

5. Modificaciones
La empresa se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados oportunamente.
    `
  },
  'aviso-legal': {
    titulo: 'Aviso Legal',
    contenido: `
1. Información General
El presente Aviso Legal regula el uso de la plataforma interna de gestión. Esta herramienta está diseñada exclusivamente para la administración operativa y financiera de proyectos.

2. Responsabilidad de la Empresa
La empresa proporciona la Aplicación "tal cual", sin garantías expresas o implícitas sobre la disponibilidad ininterrumpida del servicio. Se realizarán mantenimientos periódicos para garantizar el buen funcionamiento.

3. Uso de la Información
La información contenida en este sistema es confidencial y su divulgación está penalizada por los acuerdos de confidencialidad previamente firmados por los empleados y contratistas.

4. Legislación Aplicable
Este aviso legal se rige por la legislación aplicable en materia laboral y de protección de datos empresariales de nuestra jurisdicción.
    `
  },
  'politica-de-cookies': {
    titulo: 'Política de Cookies',
    contenido: `
1. ¿Qué son las Cookies?
Las cookies son pequeños archivos de texto que se almacenan en su navegador cuando utiliza nuestra Aplicación.

2. ¿Qué cookies utilizamos?
- Cookies Técnicas / Estrictamente Necesarias: Utilizamos cookies para mantener su sesión activa (autenticación) y garantizar que la aplicación funcione de manera segura y eficiente.
- Cookies de Preferencias: Guardamos configuraciones locales como el estado de ciertas interfaces.

3. Cookies de Terceros
No utilizamos cookies de seguimiento publicitario (marketing). Solo usamos servicios internos de almacenamiento para la funcionalidad básica del Kanban y la integración de notificaciones push.

4. Gestión de Cookies
Dado que las cookies utilizadas son estrictamente necesarias para el uso del CRM interno, su desactivación impedirá el inicio de sesión y uso correcto de la Aplicación.
    `
  },
  'politica-de-privacidad': {
    titulo: 'Política de Privacidad para Empleados',
    contenido: `
1. Recopilación de Datos
Al utilizar la Aplicación, el sistema registra:
- Nombres, correos electrónicos y roles de los empleados.
- Registros de actividad (auditoría), incluyendo cambios de estado, adición de comentarios, descargas y otras interacciones con los proyectos.
- Dispositivos vinculados para el envío de notificaciones push (FCM Tokens).

2. Finalidad del Tratamiento
La finalidad exclusiva de la recolección de datos es:
- Garantizar la trazabilidad y responsabilidad en el manejo de los proyectos.
- Facilitar la comunicación y notificaciones entre el equipo (Alertas, Recordatorios).
- Mantener la seguridad de la información corporativa.

3. Confidencialidad
Los datos de actividad son accesibles por la dirección operativa (Líder Comercial, COO) con fines de monitoreo y mejora del desempeño. No se compartirán con terceros ajenos a la organización.

4. Retención
Los registros de auditoría y los datos de la cuenta se conservarán mientras exista la relación laboral o contractual, y posteriormente según lo requiera la normativa legal.

5. Derechos del Usuario
Cualquier inquietud sobre el manejo de la información en el sistema puede ser canalizada a través de la dirección general o el departamento de Recursos Humanos.
    `
  }
};

export default function Legales({ pagina }) {
  const data = textos[pagina] || textos['aviso-legal'];

  return (
    <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#334155' }}>
      <button 
        onClick={() => window.location.href = '/'}
        style={{ marginBottom: '2rem', padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
      >
        ← Volver al Kanban
      </button>
      
      <h1 style={{ color: '#0f172a', fontSize: '2rem', marginBottom: '1.5rem' }}>{data.titulo}</h1>
      
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '1.05rem' }}>
        {data.contenido.trim()}
      </div>
    </div>
  );
}
