import fs from 'fs';

let apiKey = '';
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
  if (match) apiKey = match[1].trim();
} catch (e) {}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${apiKey}`;

const reqBody = {
  contents: [{
    parts: [{ text: "Hola, probando la voz de Dinamo." }]
  }]
};

async function test() {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });
  
  if (!res.ok) {
    console.error("Error:", res.status, res.statusText);
    console.log(await res.text());
    return;
  }
  
  const data = await res.json();
  console.log("Success. Keys in response:", Object.keys(data));
  if (data.candidates && data.candidates[0]) {
    const parts = data.candidates[0].content.parts;
    console.log("Parts:", parts.map(p => Object.keys(p)));
  } else {
    console.log("Full data:", JSON.stringify(data, null, 2));
  }
}

test();
