const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

const target = `  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-600">Cargando...</div>
      </div>
    );
  }`;

const replacement = `  const handleEnablePush = () => {
    if (session) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setupFirebasePush(session);
        } else {
          alert('Permiso denegado por el navegador.');
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-600">Cargando...</div>
      </div>
    );
  }`;

const uiTarget = `return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 relative">`;
    
const uiReplacement = `return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 relative">
      {session && Notification.permission !== 'granted' && (
        <div className="bg-blue-600 text-white text-center py-2 px-4 shadow-md flex justify-center items-center gap-4 relative z-50">
          <span>🔔 Habilita las notificaciones para recibir avisos de proyectos.</span>
          <button onClick={handleEnablePush} className="bg-white text-blue-600 font-bold py-1 px-3 rounded text-sm hover:bg-gray-100 transition">
            Activar Push
          </button>
        </div>
      )}`;

if (code.includes(target) && code.includes(uiTarget)) {
  code = code.replace(target, replacement);
  code = code.replace(uiTarget, uiReplacement);
  fs.writeFileSync('src/App.jsx', code);
  console.log("Added push enable button");
} else {
  console.log("Could not find targets in App.jsx");
}
