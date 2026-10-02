export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Ahora usamos la llave de Gemini
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: "Falta VITE_GEMINI_API_KEY" } }), { status: 401 });
  }

  try {
    const { input } = await req.json();
    
    const reqBody = {
      contents: [{
        parts: [{ text: input }]
      }]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqBody)
    });
    
    if (!response.ok) {
       const err = await response.json().catch(() => ({}));
       return new Response(JSON.stringify({ error: err }), { status: response.status });
    }
    
    const data = await response.json();
    
    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData || !inlineData.data) {
       return new Response(JSON.stringify({ error: { message: "Gemini no devolvió audio" } }), { status: 500 });
    }
    
    // Decodificar Base64 a binario (compatible con Edge)
    const binaryData = Uint8Array.from(atob(inlineData.data), c => c.charCodeAt(0));
    
    return new Response(binaryData, {
      status: 200,
      headers: {
        'Content-Type': inlineData.mimeType || 'audio/wav',
        'Content-Length': binaryData.length.toString()
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 });
  }
}
