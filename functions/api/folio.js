export async function onRequest(context) {
const { request, env } = context;

if (request.method !== 'POST') {
return new Response(JSON.stringify({ error: 'Method not allowed' }), {
status: 405,
headers: { 'Content-Type': 'application/json' }
});
}

try {
const body = await request.json();
const prompt = body.prompt || '';
const language = body.language || 'EN';

if (!prompt) {
return new Response(JSON.stringify({ error: 'Prompt is required' }), {
status: 400,
headers: { 'Content-Type': 'application/json' }
});
}

const langMap = {
'EN': 'English',
'HA': 'Hausa',
'YO': 'Yoruba',
'IG': 'Igbo'
};

const targetLang = langMap[language] || 'English';

const fullPrompt = 'You are Care lives AI, a helpful health assistant for Folio: Saving & Protecting Lives, a Nigerian child vaccination tracking platform. ' +
'Answer the following question about vaccines, child health, immunization, or related topics. ' +
'Provide accurate, factual information based on WHO and Nigeria NPHCDA guidelines. ' +
'Be warm, encouraging, and educational. Respond in ' + targetLang + ' language. ' +
'Keep your answer concise but complete (2-4 paragraphs). ' +
'User question: ' + prompt;

const GEMINI_API_KEY = env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
return new Response(JSON.stringify({ error: 'API key not configured' }), {
status: 500,
headers: { 'Content-Type': 'application/json' }
});
}

const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY, {
method: 'POST',
headers: {'Content-Type': 'application/json'},
body: JSON.stringify({
contents: [{
parts: [{
text: fullPrompt
}]
}],
generationConfig: {
temperature: 0.7,
maxOutputTokens: 500
}
})
});

const geminiData = await geminiRes.json();
var responseText = 'I apologize, I could not generate a response at this time. Please try again.';

if (geminiData.candidates && geminiData.candidates.length > 0 &&
geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
responseText = geminiData.candidates[0].content.parts.map(function(p) { return p.text; }).join('');
}

return new Response(JSON.stringify({ response: responseText }), {
status: 200,
headers: { 'Content-Type': 'application/json' }
});

} catch (err) {
return new Response(JSON.stringify({
error: 'Internal server error',
response: 'Thank you for your question! Vaccines are one of the most important tools we have to protect our children. For specific questions, please visit your nearest primary health center where trained health workers can provide personalized guidance. Remember: a vaccinated child is a protected child!'
}), {
status: 200,
headers: { 'Content-Type': 'application/json' }
});
}
}