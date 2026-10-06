import { useState, useEffect, useRef } from 'react';
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

  
  
  async function speak(text) {
    window.speechSynthesis.cancel();
    if (audioRef.current) audioRef.current.pause();
    if (isMuted) return;
    
    // Limpiar Markdown y Emojis para que la voz no los lea ("asterisco asterisco")
    const cleanText = text
      .replace(/[*_#]/g, '')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .replace(/\[WIDGET:[^\]]+\]/g, '')
      .trim();

    if (!cleanText) return;

    try {
      setIsSpeaking(true);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const reqBody = {
        contents: [{
          parts: [{ text: `(Voz de hombre adulto profesional, tono seguro y amable): ${cleanText}` }]
        }]
      };
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody)
      });
        
      if (response.ok) {
        const data = await response.json();
        const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        
        if (inlineData && inlineData.data) {
          const url = `data:${inlineData.mimeType || 'audio/mp3'};base64,${inlineData.data}`;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            setIsSpeaking(false);
          };
          audio.onerror = () => setIsSpeaking(false);
          audio.play();
          return;
        } else {
          console.error("Error Gemini TTS: No audio data returned", data);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error("Error Gemini TTS:", errData);
      }
    } catch (err) {
      console.error("Error con API de Voz, usando voz del navegador", err);
    }

    // Fallback a la voz del navegador
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    // Voces masculinas conocidas (español)
    const maleVoiceNames = [
      'Microsoft Raul', // Windows es-MX
      'Microsoft Pablo', // Windows es-ES
      'Google español de Estados Unidos', // Chrome es-US (often male)
      'Diego', // Mac es-AR
      'Jorge', // Mac es-ES
      'Juan', // Mac es-MX
      'Carlos' // Mac es-CO
    ];
    
    for (const name of maleVoiceNames) {
      selectedVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes(name));
      if (selectedVoice) break;
    }
    
    // Si no hay ninguna conocida, buscar cualquiera que diga male o masculine
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('es') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('masculine')));
    }

    // Si aún no hay, evitar voces femeninas conocidas
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('es') && !v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('mujer') && !v.name.includes('Sabina') && !v.name.includes('Helena') && !v.name.includes('Laura') && !v.name.includes('Mónica') && !v.name.includes('Paulina') && !v.name.includes('Victoria') && !v.name.includes('Google español'));
    }

    // Fallback final: cualquiera en español
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('es'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'es-ES';
    }

    // Ajustes para que suene menos robótico
    utterance.pitch = 1.05; 
    utterance.rate = 1.05;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleProcessCommand = async (text) => {
    setProcessing(true);
    setAiResponse('');
    
    try {
      const responseText = await sendDinamoMessage(text);
      setAiResponse(responseText);
      speak(responseText);
    } catch (err) {
      console.error(err);
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
      stopListening(true);
      window.speechSynthesis.cancel();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [startListening, stopListening]);


  // Asegurar que las voces carguen (en algunos navegadores es asíncrono)
  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  const handleManualSubmit = (e) => {
    if (e.key === 'Enter' && transcript.trim()) {
      stopListening(true);
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
                if (isListening) stopListening(true); // Si escribe, apagar micrófono
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

          {aiResponse && (() => {
            const hasConfirm = aiResponse.includes('[WIDGET:CONFIRM_CHECKBOXES]');
            const hasDias = aiResponse.includes('[WIDGET:INPUT_DIAS]');
            const hasMotivo = aiResponse.includes('[WIDGET:INPUT_MOTIVO]');
            const cleanResponse = aiResponse.replace(/\[WIDGET:[^\]]+\]/g, '').trim();

            return (
              <div className={styles.response}>
                <div className={styles.avatarIndicatorGroup}>
                  <button 
                    onClick={toggleMute} 
                    className={styles.muteButton} 
                    title={isMuted ? "Activar voz" : "Silenciar voz"}
                  >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  {!isMuted && isSpeaking && (
                    <div className={styles.soundWaves}>
                      <span></span><span></span><span></span>
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div className={styles.markdownResponse}>
                    <ReactMarkdown>{cleanResponse}</ReactMarkdown>
                  </div>
                  
                  {(hasConfirm || hasDias || hasMotivo) && (
                    <div className={styles.widgetContainer}>
                      {hasConfirm && (
                        <div className={styles.widgetButtons}>
                          <button onClick={() => handleProcessCommand("Sí, confirmo y apruebo las casillas/hoja. Procede con el movimiento.")} className={styles.btnWidgetConfirm}>Sí, confirmar</button>
                          <button onClick={() => handleProcessCommand("No, cancela la acción.")} className={styles.btnWidgetCancel}>No, cancelar</button>
                        </div>
                      )}
                      {hasDias && (
                        <div className={styles.widgetInputForm}>
                          <input type="number" id="widget-dias" placeholder="Ingresa los días..." min="1" onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) handleProcessCommand(`Tomará aproximadamente ${e.target.value} días.`);
                          }}/>
                          <button onClick={() => {
                            const val = document.getElementById('widget-dias').value;
                            if(val) handleProcessCommand(`Tomará aproximadamente ${val} días.`);
                          }}>Enviar Días</button>
                        </div>
                      )}
                      {hasMotivo && (
                        <div className={styles.widgetInputForm}>
                          <input type="text" id="widget-motivo" placeholder="Escribe el motivo..." onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value) handleProcessCommand(`El motivo es: ${e.target.value}`);
                          }}/>
                          <button onClick={() => {
                            const val = document.getElementById('widget-motivo').value;
                            if(val) handleProcessCommand(`El motivo es: ${val}`);
                          }}>Enviar Motivo</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
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
