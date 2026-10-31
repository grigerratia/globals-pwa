import { useState, useEffect, useRef, useCallback } from 'react';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result ? reader.result.split(',')[1] : '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function transcribeWithGeminiFallback(audioBlob) {
  const keys = [
    import.meta.env.VITE_GEMINI_API_KEY,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3
  ].filter(Boolean);

  if (keys.length === 0) return null;

  try {
    const base64Data = await blobToBase64(audioBlob);
    if (!base64Data) return null;
    const mimeType = audioBlob.type || 'audio/webm';

    for (const key of keys) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: 'Transcribe el audio a texto exacto en español, sin comentarios.' }
              ]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) return text.trim();
        }
      } catch (e) {
        console.warn('[Dinamo] Error en Gemini transcribe key:', e.message);
      }
    }
  } catch (err) {
    console.warn('[Dinamo] Fallback Gemini transcribe error:', err);
  }
  return null;
}

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

        setTranscript('Transcribiendo audio...');

        let finalTranscript = '';

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('language', 'es'); // Fuerza a español

        try {
          const response = await fetch('/api/whisper', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            if (data.text) {
              finalTranscript = data.text;
            }
          }
        } catch (err) {
          console.warn('[Whisper API] Falló llamada a /api/whisper:', err.message);
        }

        // Si Whisper no devolvió texto (cuota o error), fallback automático a Gemini Transcribe
        if (!finalTranscript) {
          finalTranscript = await transcribeWithGeminiFallback(audioBlob);
        }

        if (finalTranscript && finalTranscript.trim()) {
          const trimmed = finalTranscript.trim();
          setTranscript(trimmed);
          if (onVoiceEndRef.current) {
            onVoiceEndRef.current(trimmed);
          }
        } else {
          setError('No se pudo transcribir el audio.');
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
