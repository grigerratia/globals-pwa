import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, Sparkles, Volume2 } from 'lucide-react';
import styles from './DinamoAgent.module.scss';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { sendDinamoMessage } from '../../services/ai/dinamoService';

export default function DinamoAgent({ onClose }) {
  const { isListening, transcript, error, startListening, stopListening, setTranscript } = useVoiceRecognition();
  const [processing, setProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const autoProcessed = useRef(false);

  // Escuchar tan pronto como se abre el modal
  useEffect(() => {
    startListening();
    return () => {
      stopListening();
      window.speechSynthesis.cancel(); // Parar de hablar al cerrar
    };
  }, [startListening, stopListening]);

  // Procesar cuando el microfono se apaga y hay transcript
  useEffect(() => {
    if (!isListening && transcript && !autoProcessed.current) {
      handleProcessCommand(transcript);
    }
  }, [isListening, transcript]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.1; // Un poco más rápido
    window.speechSynthesis.speak(utterance);
  };

  const handleProcessCommand = async (text) => {
    autoProcessed.current = true;
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

  const handleManualSubmit = (e) => {
    if (e.key === 'Enter' && transcript.trim()) {
      stopListening();
      handleProcessCommand(transcript);
    }
  };

  const resetAndListenAgain = () => {
    setAiResponse('');
    setTranscript('');
    autoProcessed.current = false;
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
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={handleManualSubmit}
              placeholder="Habla o escribe tu orden..."
              disabled={processing || isListening}
            />
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
