import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceRecognition(onVoiceEnd) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);
  const transcriptRef = useRef(''); // Mantiene el valor actualizado para el onend
  const onVoiceEndRef = useRef(onVoiceEnd);

  // Mantener la referencia fresca sin causar re-renders
  useEffect(() => {
    onVoiceEndRef.current = onVoiceEnd;
  }, [onVoiceEnd]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'es-ES'; // Castellano
      } else {
        setError('El reconocimiento de voz no es compatible con este navegador.');
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    setIsListening(true);
    manualStopRef.current = false;
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Speech recognition already started", e);
    }
    
    recognitionRef.current.onresult = (event) => {
      const current = event.resultIndex;
      const t = event.results[current][0].transcript;
      setTranscript(t);
    };

    recognitionRef.current.onerror = (event) => {
      // Ignorar el error "no-speech" para que no bloquee la UI de forma molesta
      if (event.error !== 'no-speech') {
        setError(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      // Si el micro se apagó solo (no manualmente) y hay texto, enviar
      if (!manualStopRef.current && transcriptRef.current.trim() && onVoiceEndRef.current) {
        onVoiceEndRef.current(transcriptRef.current);
      }
    };
  }, []); // Sin dependencias para que nunca cambie

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      manualStopRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignorar
      }
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, error, startListening, stopListening, setTranscript };
}
