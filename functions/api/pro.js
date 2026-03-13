// Mun sauya wannan layin don Cloudflare ya gane shi ba tare da Build error ba
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

export async function onRequest(context) {
  const { request, env } = context;
  
  // Mun bude kofa don localhost da Production su yi aiki ba tare da CORS error ba
  const origin = request.headers.get("Origin") || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };

  // 1. Amisawa OPTIONS request (Preflight)
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Tabbatar POST request ne kawai
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const { payload, password, type } = await request.json();

    // 3. Duba Password
    if (password !== "@haruna66") {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 4. Duba idan akwai API Key a Dashboard
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
    // Mun sauya wannan don ya gaya maka takamaiman abin da ya faru (misali invalid API key)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
