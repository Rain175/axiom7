export default async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) {
return res.status(200).end();
}

try {
const { messages } = req.body;

```
if (!messages) {
  return res.status(400).json({ error: 'Missing messages' });
}

// Get API key from environment - try both variations
const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log('API Key Status:', GROQ_API_KEY ? 'Found' : 'Not found');
console.log('Environment variables available:', Object.keys(process.env).filter(k => k.includes('GROQ')));

if (!GROQ_API_KEY) {
  return res.status(500).json({ 
    error: 'API key not configured',
    debug: 'GROQ_API_KEY environment variable is missing'
  });
}

const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    max_tokens: 150,
    temperature: 0.85
  })
});

if (!response.ok) {
  const errorData = await response.text();
  console.error('Groq API Error:', response.status, errorData);
  return res.status(response.status).json({ error: 'Groq API error', details: errorData });
}

const data = await response.json();
res.status(200).json(data);
```

} catch (error) {
console.error(‘Error:’, error);
res.status(500).json({ error: error.message });
}
}
