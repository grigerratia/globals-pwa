export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  try {
    // Para evitar problemas de reconstrucción de FormData en el servidor,
    // pasamos el body y el Content-Type original (con el boundary) directo a OpenAI.
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': req.headers.get('content-type'),
      },
      body: req.body,
      duplex: 'half' // Requerido en fetch de Node/Edge para streams
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message } }), { status: 500 });
  }
}
