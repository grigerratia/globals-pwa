import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import styles from './DinamoAgent.module.scss';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { sendDinamoMessage } from '../../services/ai/dinamoService';

export default function DinamoAgent({ onClose }) {
  const [processing, setProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

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
      window.speechSynthesis.cancel();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [startListening, stopListening]);

  async function speak(text) {
    window.speechSynthesis.cancel();
    if (audioRef.current) audioRef.current.pause();
    if (isMuted) return;
    
    // Limpiar Markdown y Emojis para que la voz no los lea ("asterisco asterisco")
    const cleanText = text
      .replace(/[*_#]/g, '')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .trim();

    if (!cleanText) return;

    try {
      setIsSpeaking(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanText,
          voice: 'echo',
        })
      });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(url);
          };
          audio.onerror = () => setIsSpeaking(false);
          audio.play();
          return;
        }
      } catch (err) {
        console.error("Error con OpenAI TTS, usando voz del navegador", err);
      }

    // Fallback a la voz del navegador
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    
    // Intentar buscar una voz masculina
    const voices = window.speechSynthesis.getVoices();
    
    // Buscar primero una voz de alta calidad (Google WaveNet) que suele venir en Chrome
    const premiumVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Google español'));
    
    // Si no, buscar una voz masculina
    const maleVoice = voices.find(v => 
      v.lang.startsWith('es') && 
      (v.name.includes('Pablo') || v.name.includes('Jorge') || v.name.includes('Diego') || v.name.toLowerCase().includes('masculine') || v.name.toLowerCase().includes('male'))
    );
    
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    } else if (maleVoice) {
      utterance.voice = maleVoice;
    } else {
      // Fallback a cualquier voz en español si no hay masculinas específicas
      const esVoice = voices.find(v => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;
    }

    // Ajustes para que suene menos robótico
    utterance.pitch = 1.05; 
    utterance.rate = 1.05;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
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

  const toggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
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
              className={`${styles.btnSendText} ${isListening ? styles.btnSendListening : ''}`}
              disabled={processing || (!isListening && !transcript.trim())}
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  const textToSend = transcript;
                  setTranscript('');
                  handleProcessCommand(textToSend);
                }
              }}
            >
              {isListening ? <Loader2 size={18} className={styles.spin} /> : <Sparkles size={18} />}
            </button>
          </div>

          {processing && (
            <div className={styles.processing}>
              <Loader2 className={styles.spin} size={24} /> Consultando base de datos...
            </div>
          )}

          {aiResponse && (
            <div className={styles.response}>
              <button 
                onClick={toggleMute} 
                className={styles.muteButton} 
                title={isMuted ? "Activar voz" : "Silenciar voz"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              
              <div className={styles.markdownResponse}>
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
              
              {!isMuted && isSpeaking && (
                <div className={styles.soundWaves}>
                  <span></span><span></span><span></span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.controls}>
          {!isListening && !processing && (
            <button className={styles.btnListen} onClick={resetAndListenAgain}>
              <Mic size={24} /> Hablar
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
