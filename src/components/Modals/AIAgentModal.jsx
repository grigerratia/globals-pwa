import { useState, useRef } from 'react';
import { X, Sparkles, Send, Mic } from 'lucide-react';
import styles from './Modals.module.scss'; // Reusamos los estilos limpios de los otros modales

export default function AIAgentModal({ estadoPredefinido, onClose, onProjectCreated }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz por micrófono.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    // Desactivamos continuous y interim para evitar duplicados en navegadores inconsistentes
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setPrompt(prev => prev + ' ' + finalTranscript.trim());
      }
    };

    recognition.onerror = (e) => {
      console.error('Error micrófono:', e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };


  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setErrorMsg("Falta la clave VITE_GEMINI_API_KEY en el archivo .env.local");
        setLoading(false);
        return;
      }

      const systemInstruction = `
Eres un asistente de clasificación de proyectos Kanban. 
Extrae los siguientes datos del texto del usuario y devuélvelos SOLO en un objeto JSON válido (sin markdown, sin explicaciones):
{
  "titulo": "Resumen muy corto de la solicitud (Ej: Letrero luminoso, Impresión lonas)",
  "cliente_nombre": "Nombre del cliente si lo menciona",
  "cliente_empresa": "Nombre de la empresa si la menciona",
  "cliente_telefono": "El número de teléfono (solo números y + si aplica), si no hay deja cadena vacía",
  "notas": "Descripción detallada del pedido completo tal cual lo pide el cliente",
  "estado": "Selecciona SOLO UNA de estas opciones que más se ajuste (por defecto ${estadoPredefinido || 'Levantamiento'}): Levantamiento, Presupuesto enviado, Logística y compras, En fabricación, Listo para instalación, En instalación, Entregado y cerrado, En pausa/espera",
  "presupuesto_vendido": "Si menciona el precio de venta acordado, pon el número, sino 0",
  "costo_materiales": "Si menciona costos de materiales, pon el número, sino 0",
  "costo_operativo": "Si menciona costos operativos, pon el número, sino 0",
  "fecha_entrega": "Si menciona una fecha de entrega, intenta ponerla en formato YYYY-MM-DD, sino omite",
}`;

      
      const modelosATestar = [
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-flash-lite-latest'
      ];
      
      let parsed = null;
      let success = false;
      let lastError = null;

      for (const modelName of modelosATestar) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { response_mime_type: "application/json" }
            })
          });

          const data = await res.json();
          
          if (data.error) {
            throw new Error(data.error.message);
          }

          const responseText = data.candidates[0].content.parts[0].text;
          parsed = JSON.parse(responseText);
          success = true;
          break; // Salimos del for loop si tuvo éxito
        } catch (err) {
          console.warn(`Falló el modelo ${modelName}:`, err.message);
          lastError = err;
        }
      }

            if (!success || !parsed) {
        throw new Error(lastError?.message || "Todos los modelos de Gemini fallaron o están saturados.");
      }


      // Sanitizar datos vacíos y extraer solo las columnas válidas que Supabase espera
      const validFields = [
        'titulo', 'cliente_nombre', 'cliente_empresa', 'cliente_telefono',
        'notas', 'estado', 'presupuesto_vendido', 'costo_materiales',
        'costo_operativo', 'fecha_entrega'
      ];
      
      const finalData = {};
      for (const key of validFields) {
        if (parsed[key] !== undefined) {
          finalData[key] = parsed[key];
        }
      }

      if (finalData.fecha_entrega === "" || finalData.fecha_entrega === "null" || !finalData.fecha_entrega) {
        finalData.fecha_entrega = null;
      }
      
      const parseNumber = (val) => {
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
      };

      finalData.presupuesto_vendido = parseNumber(finalData.presupuesto_vendido);
      finalData.costo_materiales = parseNumber(finalData.costo_materiales);
      finalData.costo_operativo = parseNumber(finalData.costo_operativo);

      if (estadoPredefinido && typeof estadoPredefinido === 'string') { finalData.estado = estadoPredefinido; }
      await onProjectCreated(finalData);

      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Hubo un error analizando el mensaje. Revisa la consola.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className={styles.title} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles color="#8b5cf6" /> Asistente de Proyectos IA
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>

        <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Pega aquí el mensaje del cliente o los detalles del nuevo trabajo. 
          La IA analizará el texto, extraerá el título, cliente, teléfono y lo clasificará en la lista correcta.
        </p>

        {errorMsg && (
          <div className={styles.errorBanner} style={{ marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Hola Globals, necesito un presupuesto para un letrero luminoso en mi local. Mi nombre es Carlos y mi número es 555-1234."
            style={{ 
              width: '100%', 
              height: '150px', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              fontFamily: 'inherit',
              resize: 'none',
              fontSize: '0.95rem',
              color: '#334155'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancelar
            </button>
                        <button
              type="button"
              onClick={toggleListening}
              style={{
                background: isListening ? '#ef4444' : '#e2e8f0',
                color: isListening ? 'white' : '#475569',
                border: 'none',
                padding: '0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
              }}
              title={isListening ? 'Detener grabación' : 'Dictar por voz'}
            >
              <Mic size={20} />
            </button>
            <button 
              type="submit" 
              disabled={loading || !prompt.trim()}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: loading || !prompt.trim() ? 0.7 : 1
              }}
            >
              {loading ? 'Analizando...' : <><Send size={16} /> Procesar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

