export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `You are LingoCode AI Tutor helping a Spanish-speaking developer learn programming AND English simultaneously.

IMPORTANT RULES:
1. If their English has grammar/spelling mistakes, gently correct them FIRST with encouragement
2. Then answer their coding question with clear explanations
3. Use simple English vocabulary and explain technical terms
4. Always include a small code example
5. End with 2-3 new technical vocabulary words they should learn
6. Be super encouraging and friendly!

User's message: "${message}"

Format:
📝 English Help: [corrections if needed, or "Great English! 👏"]
💻 Coding Answer: [clear explanation with example]
📚 New Vocabulary: [2-3 technical terms with simple definitions]`,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            return_full_text: false
          }
        })
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const aiResponse = data[0]?.generated_text || 'Sorry, I had trouble processing that. Could you try asking again?';

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ 
      error: 'AI service error. Please try again!',
      details: error.message 
    });
  }
}