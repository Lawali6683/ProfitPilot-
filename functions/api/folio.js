export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const prompt = body.prompt || "";
    const language = body.language || "EN";
    const history = body.history || [];

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API Key missing in Cloudflare Dashboard" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const langMap = {
      "EN": "English",
      "HA": "Hausa",
      "YO": "Yoruba",
      "IG": "Igbo"
    };
    const targetLang = langMap[language] || "English";

    const systemInstruction = `You are Care Live AI, an advanced conversational health assistant for 'Folio: Saving & Protecting Lives'. Act exactly like ChatGPT. Engage in a natural, friendly, and interactive chat. Do not start with generic appreciation phrases like 'Thank you for your question'. Answer questions naturally based on WHO and NPHCDA guidelines. You must speak, respond, and chat dynamically in the ${targetLang} language. Be concise and conversational.`;

    let apiContents = [];

    if (history && history.length > 0) {
      apiContents = history.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));
    }

    if (apiContents.length === 0 || apiContents[apiContents.length - 1].parts[0].text !== prompt) {
      apiContents.push({
        role: "user",
        parts: [{ text: prompt }]
      });
    }

    const apiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: apiContents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    const data = await geminiResponse.json();

    if (data.error) {
      throw new Error(data.error.message || "Gemini API Error");
    }

    const aiText = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ response: aiText }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
