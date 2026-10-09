const fs = require('fs');
const file = './src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

// Hoist setupFirebasePush
const setupFirebasePushCode = `
  async function setupFirebasePush(currentSession) {
    try {
      const token = await requestFirebaseToken();
      if (token) {
        await supabase.from('fcm_tokens').upsert({ 
          token: token, 
          user_id: currentSession.user.id 
        });
      }
      setupOnMessageListener((payload) => {
        console.log('Mensaje FCM recibido en primer plano:', payload);
        setToastMessage({
          title: payload.notification?.title || payload.data?.title || "Notificación",
          body: payload.notification?.body || payload.data?.body || "Tienes un nuevo mensaje"
        });
        setTimeout(() => setToastMessage(null), 5000);
        
        if (Notification.permission === 'granted') {
           if ('serviceWorker' in navigator) {
             navigator.serviceWorker.ready.then((registration) => {
               registration.showNotification(payload.notification?.title || payload.data?.title || "Notificación", {
                 body: payload.notification?.body || payload.data?.body,
                 icon: '/vite.svg'
               });
             });
           } else {
             new Notification(payload.notification?.title || payload.data?.title || "Notificación", {
                body: payload.notification?.body || payload.data?.body,
                icon: '/vite.svg'
             });
           }
        }
      });
    } catch (error) {
      console.error('Error configurando Firebase Push:', error);
    }
  }
`;

// remove setupFirebasePush from bottom
code = code.replace(/async function setupFirebasePush\(currentSession\) \{[\s\S]*?\}\s*catch\s*\(error\)\s*\{\s*console\.error\('Error configurando Firebase Push:', error\);\s*\}\s*\}/, '');

// insert it above useEffect
code = code.replace(/useEffect\(\(\) => \{/, setupFirebasePushCode + '\n  useEffect(() => {');

// Fix role logic
const roleLogic = `const userRole = session?.user?.user_metadata?.rol || '';
  const roleLower = userRole.toLowerCase();
  
  const isExecutive = roleLower.includes('comercial') || roleLower.includes('operaciones');
  const isAdminRRHH = roleLower.includes('admin') || roleLower.includes('rrhh') || roleLower.includes('recurso');`;

code = code.replace(/const userRole = session\?\.user\?\.user_metadata\?\.rol \|\| '';\s*const roleLower = userRole\.toLowerCase\(\);\s*const isAdminRRHH = roleLower\.includes\('rrhh'\) \|\| roleLower\.includes\('recursos humanos'\) \|\| roleLower === 'administración';\s*const isExecutive = roleLower\.includes\('comercial'\) \|\| roleLower\.includes\('operaciones'\) \|\| \(roleLower\.includes\('admin'\) && !isAdminRRHH\);/g, roleLogic);

fs.writeFileSync(file, code);
