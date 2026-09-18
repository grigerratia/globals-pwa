const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/AIAgentModal.jsx', 'utf-8');

const regex = /const recognition = new SpeechRecognition\(\);[\s\S]*?setIsListening\(true\);\n  \};/m;

const replacement = `const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    // Desactivamos continuous y interim para evitar duplicados en navegadores inconsistentes
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setPrompt(prev => prev + ' ' + finalTranscript.trim());
      }
    };

    recognition.onerror = (e) => {
      console.error('Error micrófono:', e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/Modals/AIAgentModal.jsx', code);
  console.log("Mic fixed");
} else {
  console.log("Regex not matched");
}
