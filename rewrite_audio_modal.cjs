const fs = require('fs');
let code = fs.readFileSync('src/components/Modals/AIAgentModal.jsx', 'utf-8');

// 1. Añadir el estado predefinido por encima de la IA
code = code.replace(
  "await onProjectCreated(parsed);",
  "if (estadoPredefinido && typeof estadoPredefinido === 'string') { parsed.estado = estadoPredefinido; }\n      await onProjectCreated(parsed);"
);

// 2. Importar el icono del microfono
code = code.replace(
  "import { X, Sparkles, Send } from 'lucide-react';",
  "import { X, Sparkles, Send, Mic } from 'lucide-react';"
);

// 3. Añadir el estado isListening y la función startListening
const regexReact = /import \{ useState \} from 'react';/;
code = code.replace(
  regexReact,
  "import { useState, useRef } from 'react';"
);

const stateRegex = /const \[loading, setLoading\] = useState\(false\);/;
const listeningLogic = "const [loading, setLoading] = useState(false);\n" +
"  const [isListening, setIsListening] = useState(false);\n" +
"  const recognitionRef = useRef(null);\n" +
"\n" +
"  const toggleListening = () => {\n" +
"    if (isListening) {\n" +
"      if (recognitionRef.current) recognitionRef.current.stop();\n" +
"      setIsListening(false);\n" +
"      return;\n" +
"    }\n" +
"\n" +
"    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;\n" +
"    if (!SpeechRecognition) {\n" +
"      alert('Tu navegador no soporta reconocimiento de voz por micrófono.');\n" +
"      return;\n" +
"    }\n" +
"\n" +
"    const recognition = new SpeechRecognition();\n" +
"    recognition.lang = 'es-ES';\n" +
"    recognition.continuous = true;\n" +
"    recognition.interimResults = true;\n" +
"\n" +
"    recognition.onresult = (event) => {\n" +
"      let finalTranscript = '';\n" +
"      for (let i = event.resultIndex; i < event.results.length; ++i) {\n" +
"        if (event.results[i].isFinal) {\n" +
"          finalTranscript += event.results[i][0].transcript + ' ';\n" +
"        }\n" +
"      }\n" +
"      if (finalTranscript) {\n" +
"        setPrompt(prev => prev + finalTranscript);\n" +
"      }\n" +
"    };\n" +
"\n" +
"    recognition.onerror = (e) => {\n" +
"      console.error('Error micrófono:', e);\n" +
"      setIsListening(false);\n" +
"    };\n" +
"\n" +
"    recognition.onend = () => {\n" +
"      setIsListening(false);\n" +
"    };\n" +
"\n" +
"    recognition.start();\n" +
"    recognitionRef.current = recognition;\n" +
"    setIsListening(true);\n" +
"  };\n";

code = code.replace(stateRegex, listeningLogic);

// 4. Añadir el botón del micrófono al UI
const btnRegex = /<button \n\s*type="submit" /;
const micBtn = "            <button\n" +
"              type=\"button\"\n" +
"              onClick={toggleListening}\n" +
"              style={{\n" +
"                background: isListening ? '#ef4444' : '#e2e8f0',\n" +
"                color: isListening ? 'white' : '#475569',\n" +
"                border: 'none',\n" +
"                padding: '0.65rem',\n" +
"                borderRadius: '8px',\n" +
"                cursor: 'pointer',\n" +
"                display: 'flex',\n" +
"                alignItems: 'center',\n" +
"                justifyContent: 'center',\n" +
"                transition: 'all 0.2s',\n" +
"                animation: isListening ? 'pulse 1.5s infinite' : 'none'\n" +
"              }}\n" +
"              title={isListening ? 'Detener grabación' : 'Dictar por voz'}\n" +
"            >\n" +
"              <Mic size={20} />\n" +
"            </button>\n" +
"            <button \n" +
"              type=\"submit\" ";

code = code.replace(btnRegex, micBtn);

// 5. Añadir keyframes inline (usando style)
const styleTagRegex = /return \(\n\s*<div className=\{styles\.overlay\} onClick=\{onClose\}>/;
const styleTag = "return (\n" +
"    <div className={styles.overlay} onClick={onClose}>\n" +
"      <style>{`\n" +
"        @keyframes pulse {\n" +
"          0% { transform: scale(1); opacity: 1; }\n" +
"          50% { transform: scale(1.1); opacity: 0.8; }\n" +
"          100% { transform: scale(1); opacity: 1; }\n" +
"        }\n" +
"      `}</style>";

code = code.replace(styleTagRegex, styleTag);

fs.writeFileSync('src/components/Modals/AIAgentModal.jsx', code);
