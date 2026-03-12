import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {

  const { request, env } = context;

  const allowedOrigins = [
    "https://propitpilot.pages.dev",
    "http://localhost:8080"
  ];

  const origin = request.headers.get("Origin");

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {

    const { payload, password, type } = await request.json();

    if (password !== "@haruna66") {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    let prompt;

    if (type === "index") {

      prompt = `
Analyze business data:

Capital: ₦${payload.cap}
Cost: ₦${payload.cost}
Sales: ₦${payload.sales}

Language: ${payload.lang}

Give short professional business advice.
`;

    } else {

      prompt = `
Business logs for ${payload.days} days:

${JSON.stringify(payload.logs)}

Analyze performance in English.
Say clearly if the business is making profit or loss.
`;

    }

    const result = await model.generateContent(prompt);

    const response = await result.response;

    return new Response(
      JSON.stringify({ text: response.text() }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {

    return new Response(
      JSON.stringify({ error: "AI Service Error" }),
      {
        status: 500,
        headers: corsHeaders
      }
    );

  }

}
