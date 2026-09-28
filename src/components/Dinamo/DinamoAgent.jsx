import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, Sparkles, Volume2 } from 'lucide-react';
import styles from './DinamoAgent.module.scss';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { sendDinamoMessage } from '../../services/ai/dinamoService';

export default function DinamoAgent({ onClose }) {
  const [processing, setProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const handleProcessCommand = async (text) => {
    setProcessing(true);
    setAiResponse('');
    
    try {
      const responseText = await sendDinamoMessage(text);
      setAiResponse(responseText);
      speak(responseText);
    } catch (err) {
      const errMsg = 'Error de conexión con Dinamo.';
      setAiResponse(errMsg);
      speak(errMsg);
    }
    
    setProcessing(false);
  };

  const { isListening, transcript, error, startListening, stopListening, setTranscript } = useVoiceRecognition((finalText) => {
    handleProcessCommand(finalText);
  });

  // Escuchar tan pronto como se abre el modal
  useEffect(() => {
    startListening();
    return () => {
      stopListening();
      window.speechSynthesis.cancel(); // Parar de hablar al cerrar
    };
  }, [startListening, stopListening]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    
    // Intentar buscar una voz masculina
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => 
      v.lang.startsWith('es') && 
      (v.name.includes('Pablo') || v.name.includes('Jorge') || v.name.includes('Diego') || v.name.toLowerCase().includes('masculine') || v.name.toLowerCase().includes('male'))
    );
    
    if (maleVoice) {
      utterance.voice = maleVoice;
    } else {
      // Fallback a cualquier voz en español si no hay masculinas específicas
      const esVoice = voices.find(v => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;
    }
    
    utterance.rate = 1.1; // Un poco más rápido
    window.speechSynthesis.speak(utterance);
  };

  // Asegurar que las voces carguen (en algunos navegadores es asíncrono)
  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  const handleManualSubmit = (e) => {
    if (e.key === 'Enter' && transcript.trim()) {
      stopListening();
      const textToSend = transcript;
      setTranscript('');
      handleProcessCommand(textToSend);
    }
  };

  const resetAndListenAgain = () => {
    setAiResponse('');
    setTranscript('');
    startListening();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.btnClose} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.header}>
          <div className={styles.avatar}>
            <Sparkles size={28} color="#fff" />
          </div>
          <h3>Dinamo IA</h3>
          <p>{isListening ? 'Escuchando...' : processing ? 'Procesando comando...' : 'Asistente en espera'}</p>
        </div>

        <div className={styles.chatArea}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputBox}>
            <input 
              type="text" 
              value={transcript}
              onChange={(e) => {
                if (isListening) stopListening(); // Si escribe, apagar micrófono
                setTranscript(e.target.value);
              }}
              onKeyDown={handleManualSubmit}
              placeholder="Habla o escribe tu orden..."
              disabled={processing}
            />
            <button 
              className={styles.btnSendText}
              disabled={processing || !transcript.trim()}
              onClick={() => {
                stopListening();
                const textToSend = transcript;
                setTranscript('');
                handleProcessCommand(textToSend);
              }}
            >
              <Sparkles size={18} />
            </button>
          </div>

          {processing && (
            <div className={styles.processing}>
              <Loader2 className={styles.spin} size={24} /> Consultando base de datos...
            </div>
          )}

          {aiResponse && (
            <div className={styles.response}>
              <Volume2 size={16} /> <span>{aiResponse}</span>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          {!isListening && !processing && (
            <button className={styles.btnListen} onClick={resetAndListenAgain}>
              <Mic size={24} /> Hablar de nuevo
            </button>
          )}
          {isListening && (
            <div className={styles.listeningAnimation}>
              <div className={styles.wave}></div>
              <div className={styles.wave}></div>
              <div className={styles.wave}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
