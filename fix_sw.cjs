const fs = require('fs');
let code = fs.readFileSync('public/firebase-messaging-sw.js', 'utf-8');
code = code.replace(/Global\\\\\'s PWA/g, 'Globals PWA');
code = code.replace(/Global\\\'s PWA/g, 'Globals PWA');
code = code.replace(/Global's PWA/g, 'Globals PWA');
fs.writeFileSync('public/firebase-messaging-sw.js', code);
