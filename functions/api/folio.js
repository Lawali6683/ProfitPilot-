export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const body = await request.json();
    const prompt = body.prompt || '';
    const language = body.language || 'EN';
    const history = body.history || [];

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const langMap = {
      'EN': 'English',
      'HA': 'Hausa',
      'YO': 'Yoruba',
      'IG': 'Igbo'
    };

    const targetLang = langMap[language] || 'English';

    var conversationContext = '';
    if (history && history.length > 0) {
      var recentHistory = history.slice(-10);
      for (var h = 0; h < recentHistory.length; h++) {
        var entry = recentHistory[h];
        if (entry.role === 'user') {
          conversationContext += 'User: ' + entry.content + '\n';
        } else {
          conversationContext += 'Assistant: ' + entry.content + '\n';
        }
      }
    }

    const systemPrompt = 'You are Care Live AI, a helpful health assistant for Folio: Saving & Protecting Lives, a Nigerian child vaccination tracking platform. ' +
      'You MUST respond in ' + targetLang + ' language. This is the most important instruction. ' +
      'You speak, write, and think only in ' + targetLang + '. ' +
      'Do not use any other language. ' +
      'Provide accurate, factual information based on WHO and Nigeria NPHCDA guidelines. ' +
      'Be warm, encouraging, educational, and thorough. ' +
      'Answer the question directly and precisely. Give a complete detailed answer. ' +
      'If the user asks "what is immunization" or similar, explain it clearly step by step. ' +
      'If the user asks a specific question, answer exactly what they asked. ' +
      'Do not give generic unrelated advice. Stay on topic. ' +
      'Aim for the answer to be detailed but natural, like a real conversation with ChatGPT. ' +
      'Do not repeat the same fallback message. Always answer the specific question asked.';

    var fullPrompt = systemPrompt + '\n\n';
    if (conversationContext) {
      fullPrompt += 'Previous conversation:\n' + conversationContext + '\n\n';
    }
    fullPrompt += 'User question in ' + targetLang + ': ' + prompt + '\n\n' +
      'Respond in ' + targetLang + ' language only. Do not switch to English. ' +
      'Answer the question directly. Give a thorough, helpful answer with practical health advice.';

    const GEMINI_API_KEY = env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
          topP: 0.95
        }
      })
    });

    const geminiData = await geminiRes.json();
    var responseText = '';

    if (geminiData.candidates && geminiData.candidates.length > 0 &&
      geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
      responseText = geminiData.candidates[0].content.parts.map(function(p) { return p.text; }).join('');
    } else {
      var errorMsg = geminiData.error ? geminiData.error.message : 'Unknown error';
      responseText = 'Sorry, I encountered an error processing your request. Please try again. Error: ' + errorMsg;
    }

    return new Response(JSON.stringify({ response: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (err) {
    var fallbackMsg = '';

    try {
      const fbPrompt = 'In ' + (targetLang || 'English') + ' language, answer this question briefly: ' + prompt;
      const fbRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + env.GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fbPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      });
      const fbData = await fbRes.json();
      if (fbData.candidates && fbData.candidates.length > 0 &&
        fbData.candidates[0].content && fbData.candidates[0].content.parts) {
        fallbackMsg = fbData.candidates[0].content.parts.map(function(p) { return p.text; }).join('');
      }
    } catch (fbErr) {
      fallbackMsg = '';
    }

    if (!fallbackMsg) {
      if (language === 'HA') {
        fallbackMsg = 'Rigakafi wata hanya ce ta kare lafiyar yara daga cututtuka masu yaduwa. Ana ba da alluran rigakafi ga yara tun daga lokacin haihuwa don hana cututtuka kamar shan inna, tarin fuka, da ciwon huhu. Tuntuɓi asibiti don ƙarin bayani.';
      } else if (language === 'YO') {
        fallbackMsg = 'Ajesara jẹ ọna lati daabobo awọn ọmọde lọwọ awọn arun ti o le tan kaakiri. A n fun awọn ọmọde ni abo ajesara lati igba ibi wọn lati ṣe idiwọ awọn arun bii polio, iko, ati arun ẹdọfóró. Kan si ile-iwosan fun alaye diẹ sii.';
      } else if (language === 'IG') {
        fallbackMsg = 'Ịgba ọgwụ mgbochi bụ ụzọ is chebe ụmụaka pụọ na ọrịa na-efe efe. A na-enye ụmụaka ọgwụ mgbochi site n'oge a mụrụ ha iji gbochie ọrịa ndị dị ka polio, ụkwara nta, na oyi. Gakwuru ụlọ ọgwụ maka nkọwa ndị ọzọ.';
      } else {
        fallbackMsg = 'Immunization is a way to protect children from infectious diseases. Children receive vaccines starting at birth to prevent diseases like polio, tuberculosis, and pneumonia. Contact a health center for more information.';
      }
    }

    return new Response(JSON.stringify({
      error: 'Internal server error: ' + err.message,
      response: fallbackMsg
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
