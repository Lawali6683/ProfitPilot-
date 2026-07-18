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
      'Give complete detailed answers with examples, explanations, and practical advice. ' +
      'Aim for 3-6 paragraphs of rich content so the user learns deeply. ' +
      'Do not be too short. Do not use English unless the user asks in English.';

    var fullPrompt = systemPrompt + '\n\n';
    if (conversationContext) {
      fullPrompt += 'Previous conversation:\n' + conversationContext + '\n\n';
    }
    fullPrompt += 'User question in ' + targetLang + ': ' + prompt + '\n\n' +
      'Respond in ' + targetLang + ' language only. Do not switch to English. ' +
      'Give a thorough, helpful, and warm answer with practical health advice.';

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
          temperature: 0.4,
          maxOutputTokens: 1500,
          topP: 0.95
        }
      })
    });

    const geminiData = await geminiRes.json();
    var responseText = 'Na gode da tambayar ku. A kula da lafiyar yara, mahimman abubuwa sun hada da: rigakafi, tsafta, abinci mai gina jiki, da kuma kula da lafiyar yara akai-akai. Domin samun cikakken bayani, ziyarci asibitin da yake kusa da ku.';

    if (geminiData.candidates && geminiData.candidates.length > 0 &&
      geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
      responseText = geminiData.candidates[0].content.parts.map(function(p) { return p.text; }).join('');
    }

    return new Response(JSON.stringify({ response: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Internal server error: ' + err.message,
      response: 'Na gode da tambayar ku. A kula da lafiyar yara, mahimman abubuwa sun hada da: rigakafi, tsafta, abinci mai gina jiki, da kuma kula da lafiyar yara akai-akai. Domin samun cikakken bayani, ziyarci asibitin da yake kusa da ku.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
