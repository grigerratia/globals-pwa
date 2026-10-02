const fs = require('fs');
const file = 'src/components/Dinamo/DinamoAgent.jsx';
let content = fs.readFileSync(file, 'utf8');

// The current order has useVoiceRecognition at top, then speak, then handleProcessCommand.
// Let's just put handleProcessCommand and speak before useVoiceRecognition.
// First, extract them.

const useVoiceMatch = content.match(/const \{ isListening[\s\S]*?\}\);\n/);
if (useVoiceMatch) {
  content = content.replace(useVoiceMatch[0], '');
  
  // Find where useEffect starts
  const effectIndex = content.indexOf('// Escuchar tan pronto como se abre el modal');
  content = content.slice(0, effectIndex) + useVoiceMatch[0] + '\n  ' + content.slice(effectIndex);
}

fs.writeFileSync(file, content);
