import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

export async function onRequest(context) {
  const { request, env } = context;
  
  const origin = request.headers.get("Origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
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
    const { payload, password, type } = await request.json();

    if (password !== "@haruna66") {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API Key missing in Cloudflare Dashboard" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt;
    if (type === "index") {
      prompt = `
        Analyze business data:
        Capital: ₦${payload.cap}
        Cost: ₦${payload.cost}
        Sales: ₦${payload.sales}
        Language: ${payload.lang}
        Give short professional business advice in the language requested.
      `;
    } else {
      prompt = `
        Business logs for ${payload.days} days:
        ${JSON.stringify(payload.logs)}
        Analyze performance in English.
        Say clearly if the business is making profit or loss based on the logs provided.
      `;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return new Response(
      JSON.stringify({ text: response.text() }),
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
