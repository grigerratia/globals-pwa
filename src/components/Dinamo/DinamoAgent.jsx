import { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import styles from './DinamoAgent.module.scss';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { sendDinamoMessage } from '../../services/ai/dinamoService';

function b64ToUint8Array(b64) {
  const binaryString = window.atob(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToWavBlob(pcmBytes, sampleRate = 24000) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const dataLen = pcmBytes.length;
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, 36 + dataLen, true);
  view.setUint32(8, 0x57415645, false); // 'WAVE'
  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, dataLen, true);

  const combined = new Uint8Array(44 + dataLen);
  combined.set(new Uint8Array(header), 0);
  combined.set(pcmBytes, 44);
  return new Blob([combined], { type: 'audio/wav' });
}

function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\[WIDGET:[^\]]+\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^[\s*•-]+\s*/gm, '')
    .replace(/[*_#~>]/g, '')
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkText(text, maxChars = 220) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    if (!currentChunk) {
      currentChunk = trimmed;
    } else if ((currentChunk + ' ' + trimmed).length <= maxChars) {
      currentChunk += ' ' + trimmed;
    } else {
      chunks.push(currentChunk);
      currentChunk = trimmed;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks.length > 0 ? chunks : [text];
}

export default function DinamoAgent({ onClose }) {
  const [processing, setProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const workingTtsRef = useRef(null);
  const currentFetchIdRef = useRef(0);

  const fallbackBrowserSpeak = (textToSpeak, fetchId) => {
    if (fetchId !== currentFetchIdRef.current || isMuted || !textToSpeak.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
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
  };

  const playNext = (fetchId) => {
    if (fetchId !== currentFetchIdRef.current) return;

    if (audioQueueRef.current.length > 0) {
      const audio = audioQueueRef.current.shift();
      audioRef.current = audio;
      isPlayingRef.current = true;
      setIsSpeaking(true);

      audio.onended = () => {
        if (audio._blobUrl) URL.revokeObjectURL(audio._blobUrl);
        isPlayingRef.current = false;
        playNext(fetchId);
      };
      audio.onerror = (e) => {
        console.warn('[Dinamo TTS] Error reproduciendo audio:', e);
        if (audio._blobUrl) URL.revokeObjectURL(audio._blobUrl);
        isPlayingRef.current = false;
        playNext(fetchId);
      };
      audio.play().catch(e => {
        console.warn('[Dinamo TTS] Error audio.play():', e);
        if (audio._blobUrl) URL.revokeObjectURL(audio._blobUrl);
        isPlayingRef.current = false;
        playNext(fetchId);
      });
    } else {
      isPlayingRef.current = false;
      setIsSpeaking(false);
    }
  };

  const fetchGoogleAudio = async (textChunk, fetchId) => {
    const googleKeys = [
      import.meta.env.VITE_GEMINI_API_KEY,
      import.meta.env.VITE_GEMINI_API_KEY_2,
      import.meta.env.VITE_GEMINI_API_KEY_3
    ].filter(Boolean);

    if (googleKeys.length === 0) return null;

    // Priorizamos la key que ya sabemos que funciona
    const sortedKeys = [...googleKeys];
    if (workingTtsRef.current?.key) {
      const idx = sortedKeys.indexOf(workingTtsRef.current.key);
      if (idx > -1) {
        sortedKeys.splice(idx, 1);
        sortedKeys.unshift(workingTtsRef.current.key);
      }
    }

    const ttsModel = 'gemini-3.8-flash-lite-tts';
    const reqBody = {
      contents: [{ parts: [{ text: textChunk }] }],
      generationConfig: {
        temperature: 0.1,
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Puck'
            }
          }
        }
      }
    };

    for (const key of sortedKeys) {
      if (fetchId !== currentFetchIdRef.current) return null;
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
          }
        );

        if (response.ok) {
          const data = await response.json();
          const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

          if (inlineData && inlineData.data) {
            workingTtsRef.current = { key, model: ttsModel };
            const bytes = b64ToUint8Array(inlineData.data);
            let audioBlob;
            if (inlineData.mimeType?.includes('pcm') || inlineData.mimeType?.includes('L16')) {
              audioBlob = pcmToWavBlob(bytes, 24000);
            } else {
              audioBlob = new Blob([bytes], { type: inlineData.mimeType || 'audio/wav' });
            }
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.playbackRate = 1.0;
            audio.preservesPitch = true;
            audio._blobUrl = audioUrl;
            return audio;
          }
        } else {
          // Si da 429 o error, rotamos a la siguiente key de inmediato
          if (workingTtsRef.current?.key === key) {
            workingTtsRef.current = null;
          }
        }
      } catch (err) {
        console.warn(`[Dinamo TTS] Error con key:`, err.message);
        if (workingTtsRef.current?.key === key) {
          workingTtsRef.current = null;
        }
      }
    }

    return null;
  };

  async function speak(text) {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current._blobUrl) URL.revokeObjectURL(audioRef.current._blobUrl);
      audioRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    currentFetchIdRef.current += 1;
    const fetchId = currentFetchIdRef.current;

    if (isMuted) return;

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    setIsSpeaking(true);

    const chunks = chunkText(cleanText, 350);
    let fallbackText = '';

    for (let i = 0; i < chunks.length; i++) {
      if (fetchId !== currentFetchIdRef.current) break;

      const audio = await fetchGoogleAudio(chunks[i], fetchId);

      if (fetchId !== currentFetchIdRef.current) {
        if (audio && audio._blobUrl) URL.revokeObjectURL(audio._blobUrl);
        break;
      }

      if (audio) {
        audioQueueRef.current.push(audio);
        if (!isPlayingRef.current) {
          playNext(fetchId);
        }
      } else {
        fallbackText = chunks.slice(i).join(' ');
        break;
      }
    }

    if (fallbackText && fetchId === currentFetchIdRef.current) {
      console.warn('[Dinamo TTS] Google AI no disponible, usando fallback del navegador.');
      const scheduleFallback = () => {
        if (fetchId !== currentFetchIdRef.current) return;
        if (isPlayingRef.current || audioQueueRef.current.length > 0) {
          setTimeout(scheduleFallback, 250);
        } else {
          fallbackBrowserSpeak(fallbackText, fetchId);
        }
      };
      scheduleFallback();
    }
  }


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

  useEffect(() => {
    startListening();
    return () => {
      stopListening(true);
      window.speechSynthesis.cancel();
      currentFetchIdRef.current += 1;
      audioQueueRef.current = [];
      isPlayingRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current._blobUrl) URL.revokeObjectURL(audioRef.current._blobUrl);
        audioRef.current = null;
      }
      setIsSpeaking(false);
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
      currentFetchIdRef.current += 1;
      audioQueueRef.current = [];
      isPlayingRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current._blobUrl) URL.revokeObjectURL(audioRef.current._blobUrl);
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
