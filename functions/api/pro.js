import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequest(context) {
  const { request } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://propitpilot.pages.dev",
    "http://localhost:8080",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { payload, password, type } = await request.json();

    if (password !== "@haruna66") {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401, headers: corsHeaders });
    }

    const genAI = new GoogleGenerativeAI("AIzaSyDo7WaZSHytqJcNwE9XvLxfjoAPVJrxkGc");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = (type === "index") 
      ? `Analyze business data: Capital ₦${payload.cap}, Cost ₦${payload.cost}, Sales ₦${payload.sales}. Language: ${payload.lang}. Provide short professional advice.`
      : `Business logs for ${payload.days} days: ${JSON.stringify(payload.logs)}. Analyze performance in English. Profit or loss?`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return new Response(JSON.stringify({ text: response.text() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "AI Service Error" }), { status: 500, headers: corsHeaders });
  }
}
