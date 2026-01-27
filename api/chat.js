export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

    if (!HF_API_KEY) {
      console.error('Missing HUGGINGFACE_API_KEY');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `You are LingoCode AI Tutor helping learn programming and English.

If user's English has mistakes, correct gently first, then answer their coding question with a code example.

User: ${message}

Response format:
📝 English: [corrections or "Great!"]
💻 Answer: [clear explanation with code]
📚 Words: [2-3 new terms]`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 400,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', errorText);
      return res.status(response.status).json({ 
        error: 'AI service error',
        details: errorText 
      });
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('HF returned error:', data.error);
      return res.status(500).json({ error: data.error });
    }

    const aiResponse = data[0]?.generated_text || 'Sorry, please try asking again!';

    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    });
  }
}