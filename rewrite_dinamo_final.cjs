const fs = require('fs');
const file = 'src/components/Dinamo/DinamoAgent.jsx';
let content = fs.readFileSync(file, 'utf8');

// Extract useVoiceRecognition block and useEffect
const extractRegex = /  const \{ isListening[\s\S]*?\}, \[startListening, stopListening\]\);\n\n/m;
const match = content.match(extractRegex);

if (match) {
  content = content.replace(match[0], '');
  // Insert it after handleProcessCommand
  const handleEndIndex = content.indexOf('setProcessing(false);\n  };\n') + 'setProcessing(false);\n  };\n'.length;
  content = content.slice(0, handleEndIndex) + '\n' + match[0] + content.slice(handleEndIndex);
}
fs.writeFileSync(file, content);
