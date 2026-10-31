export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const keys = [
    process.env.VITE_GEMINI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY_3
  ].filter(Boolean);
  
  if (keys.length === 0) {
    return new Response(JSON.stringify({ error: { message: "Falta VITE_GEMINI_API_KEY" } }), { status: 401 });
  }

  try {
    const { input } = await req.json();
    
    const reqBody = {
      contents: [{
        parts: [{ text: input }]
      }],
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

    let lastError = null;
    for (const apiKey of keys) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reqBody)
        });
        
        if (!response.ok) {
           lastError = await response.json().catch(() => ({}));
           continue;
        }
        
        const data = await response.json();
        const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inlineData || !inlineData.data) {
           continue;
        }
        
        const binaryData = Uint8Array.from(atob(inlineData.data), c => c.charCodeAt(0));
        
        return new Response(binaryData, {
          status: 200,
          headers: {
            'Content-Type': inlineData.mimeType || 'audio/wav',
            'Content-Length': binaryData.length.toString()
          }
        });
      } catch (err) {
        lastError = err;
      }
    }
    
    return new Response(JSON.stringify({ error: lastError || { message: "No se pudo generar audio" } }), { status: 500 });

  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 });
  }
}
