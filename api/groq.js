import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { messages, userId } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const userMessage = messages[messages.length - 1];
    const userText = userMessage?.content || '';

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
      return res.status(response.status).json({ error: 'Groq API error' });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';

    // Save to database
    try {
      const sessionId = userId || 'anonymous';
      const timestamp = new Date().toISOString();

      await sql`
        INSERT INTO conversations (session_id, role, message, timestamp)
        VALUES (${sessionId}, 'user', ${userText}, ${timestamp})
      `;

      await sql`
        INSERT INTO conversations (session_id, role, message, timestamp)
        VALUES (${sessionId}, 'assistant', ${aiResponse}, ${timestamp})
      `;
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
