const fs = require('fs');
const file = './src/components/Dinamo/DinamoAgent.jsx';
let content = fs.readFileSync(file, 'utf8');

const newSpeak = `  async function speak(text) {
    window.speechSynthesis.cancel();
    if (audioRef.current) audioRef.current.pause();
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    currentFetchIdRef.current += 1;
    const fetchId = currentFetchIdRef.current;
    
    if (isMuted) return;
    
    // Limpiar Markdown y Emojis
    const cleanText = text
      .replace(/[*_#]/g, '')
      .replace(/([\\u2700-\\u27BF]|[\\uE000-\\uF8FF]|\\uD83C[\\uDC00-\\uDFFF]|\\uD83D[\\uDC00-\\uDFFF]|[\\u2011-\\u26FF]|\\uD83E[\\uDD10-\\uDDFF])/g, '')
      .replace(/\\[WIDGET:[^\\]]+\\]/g, '')
      .trim();

    if (!cleanText) return;

    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    const maleVoiceNames = [
      'Microsoft Raul', 'Microsoft Pablo', 'Google español de Estados Unidos', 
      'Diego', 'Jorge', 'Juan', 'Carlos'
    ];
    
    for (const name of maleVoiceNames) {
      selectedVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes(name));
      if (selectedVoice) break;
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('es') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('masculine')));
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('es') && !v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('mujer') && !v.name.includes('Sabina') && !v.name.includes('Helena') && !v.name.includes('Laura') && !v.name.includes('Mónica') && !v.name.includes('Paulina') && !v.name.includes('Victoria') && !v.name.includes('Google español'));
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('es'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'es-ES';
    }

    utterance.pitch = 1.0; 
    utterance.rate = 1.05;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      if (fetchId === currentFetchIdRef.current) setIsSpeaking(false);
    };
    utterance.onerror = () => {
      if (fetchId === currentFetchIdRef.current) setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }`;

content = content.replace(/async function speak\(text\)\s*\{[\s\S]*?checkQueueAndPlay\(\);\s*\}/, newSpeak);
fs.writeFileSync(file, content);
