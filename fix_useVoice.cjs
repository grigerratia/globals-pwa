const fs = require('fs');
const file = 'src/hooks/useVoiceRecognition.js';
let content = fs.readFileSync(file, 'utf8');

// restore startListening
content = content.replace(/\/\/ setTranscript\(''\);\n    audioChunksRef.current = \[\];/, `setTranscript('');\n    audioChunksRef.current = [];`);

// ensure abortRef block is correct
content = content.replace(/if \(abortRef\.current\) \{\n          \/\/ setTranscript\(''\);\n          return;\n        \}/, `if (abortRef.current) {\n          return;\n        }`);

fs.writeFileSync(file, content);
console.log("Fixed useVoiceRecognition");
