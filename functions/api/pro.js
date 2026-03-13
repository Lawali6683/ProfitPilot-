export async function callAI(data, type) {
    try {
        const response = await fetch("https://propitpilot.page.dev/api/pro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: data, password: "@haruna66", type: type })
        });
        const result = await response.json();
        return result.text || result.error;
    } catch (err) {
        return "Connection Error";
    }
}

export function showNotify(msg, color = "bg-blue-600") {
    let container = document.getElementById('notification-container') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'notification-container', className: "fixed top-5 right-5 z-50" }));
    const toast = document.createElement('div');
    toast.className = `${color} text-white px-6 py-4 rounded-xl shadow-2xl mb-3 transition-all duration-500 transform translate-x-10 opacity-0`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-x-10', 'opacity-0'), 100);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

export async function onRequest(context) {
    const { request, env } = context;
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const { payload, password, type } = await request.json();
        if (password !== "@haruna66") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

        let promptText = "";
        const lang = payload.lang || "English";

        if (type === "index") {
            const profit = payload.sales - payload.cost;
            promptText = `System: ProfitPilot AI Consultant. Data: Capital ₦${payload.cap}, Cost ₦${payload.cost}, Sales ₦${payload.sales}. Profit/Loss: ₦${profit}. Language: ${lang}. Give short professional advice in ${lang}.`;
        } else if (type === "daily") {
            promptText = `System: ProfitPilot AI Auditor. Analyzing logs for ${payload.days} days: ${JSON.stringify(payload.logs)}. Language: ${lang}. Provide a detailed performance summary and business growth advice in ${lang}.`;
        }

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const resData = await geminiRes.json();
        return new Response(JSON.stringify({ text: resData.candidates[0].content.parts[0].text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
}
