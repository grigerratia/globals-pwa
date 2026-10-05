import re

with open('src/hooks/useVoiceRecognition.js', 'r') as f:
    content = f.read()

# Add abortRef
content = content.replace("const onVoiceEndRef = useRef(onVoiceEnd);", "const onVoiceEndRef = useRef(onVoiceEnd);\n  const abortRef = useRef(false);")

# Reset abortRef on startListening
content = content.replace("audioChunksRef.current = [];", "audioChunksRef.current = [];\n    abortRef.current = false;")

# Check abortRef onstop
onstop_check = """
        if (audioChunksRef.current.length === 0) return;

        if (abortRef.current) {
          setTranscript('');
          return;
        }

        setTranscript('Procesando audio (Whisper)...');"""
content = content.replace("""
        if (audioChunksRef.current.length === 0) return;

        setTranscript('Procesando audio (Whisper)...');""", onstop_check)

# Update stopListening
stop_listening_old = """  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);"""

stop_listening_new = """  const stopListening = useCallback((abort = false) => {
    abortRef.current = abort;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);"""

content = content.replace(stop_listening_old, stop_listening_new)

with open('src/hooks/useVoiceRecognition.js', 'w') as f:
    f.write(content)
