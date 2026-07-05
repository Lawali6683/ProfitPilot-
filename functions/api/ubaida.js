const env = {
    GEMINI_API_KEY: "YOUR_GEMINI_API_KEY_HERE" 
};

async function askCareSyncAI(promptText, language = "English") {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    
    const structuredContext = `
      You are an expert Disease Control and Public Health AI Specialist operating inside Nigeria.
      Analyze these observed disease or epidemic symptoms carefully: "${promptText}".
      Provide a highly precise, technical, and urgent medical brief.
      The output must be formatted explicitly into exactly 3 structural distinct blocks as required below.
      You must respond cleanly in the chosen language: ${language}.
      
      Block 1: DISEASE PROFILE & TRANSMISSION DYNAMICS
      State the suspected disease name or clinical condition profile. Detail the nature of its transmission and state clearly whether it is a highly contagious/infectious threat or has rapid spreading potential based on concrete reasons and vector dynamics.
      
      Block 2: IMMEDIATE CONTAINMENT & EMERGENCY ACTION STEPS
      Provide the immediate life-saving medical countermeasures, quick treatments/first-aid steps to administer, and exact public health containment steps to execute to stop further tracking or expansion of the infection vector.
      
      Block 3: FIELD FORCE SAFETY VECTORS & PPE REQUIREMENTS
      Provide the precise protective gear, personal protective equipment (PPE), and clinical safety tools that epidemiologists, rapid response teams, and medical workers combating this specific outbreak must wear right now.
    `;

    const contents = [
        {
            parts: [
                { text: structuredContext }
            ]
        }
    ];

    try {
        const geminiResponse = await fetch(apiURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents })
        });

        if (!geminiResponse.ok) {
            throw new Error("API Connection Error");
        }

        const data = await geminiResponse.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error(error);
        return language === "Hausa" 
            ? "Muna da matsala wajen haduwa da API ko babu intanet. Kayan aikin zai nuna muku bayanan karya domin kada tsarin ya tsaya." 
            : "Network or configuration error. The system will deploy optimized mock emergency protocols to prevent failure.";
    }
}
