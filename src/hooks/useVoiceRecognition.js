import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceRecognition(onVoiceEnd) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const onVoiceEndRef = useRef(onVoiceEnd);
  const abortRef = useRef(false);

  useEffect(() => {
    onVoiceEndRef.current = onVoiceEnd;
  }, [onVoiceEnd]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    audioChunksRef.current = [];
    abortRef.current = false;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Detener las pistas de audio para apagar la lucecita del micro
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) return;

        if (abortRef.current) {
          return;
        }

        setTranscript('Procesando audio (Whisper)...');

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'es'); // Fuerza a español

        try {
          const response = await fetch('/api/whisper', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Error ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          const finalTranscript = data.text;
          setTranscript(finalTranscript);
          
          if (finalTranscript.trim() && onVoiceEndRef.current) {
            onVoiceEndRef.current(finalTranscript);
          }
        } catch (err) {
          setError(`Error transcribiendo: ${err.message}`);
          // setTranscript('');
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      setError(`No se pudo acceder al micrófono: ${err.message}`);
    }
  }, []);

  const stopListening = useCallback((abort = false) => {
    abortRef.current = abort;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return { isListening, transcript, error, startListening, stopListening, setTranscript };
}
