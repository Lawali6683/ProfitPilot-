export async function onRequest(context){

const {request,env}=context

const origin=request.headers.get("Origin")||"*"

const corsHeaders={
"Access-Control-Allow-Origin":origin,
"Access-Control-Allow-Methods":"POST, OPTIONS",
"Access-Control-Allow-Headers":"Content-Type",
"Access-Control-Max-Age":"86400"
}

if(request.method==="OPTIONS"){
return new Response(null,{status:204,headers:corsHeaders})
}

if(request.method!=="POST"){
return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:corsHeaders})
}

try{

const {payload,password,type}=await request.json()

if(password!=="@haruna66"){
return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:corsHeaders})
}

if(!env.GEMINI_API_KEY){
return new Response(JSON.stringify({error:"API key missing"}),{status:500,headers:corsHeaders})
}

let promptText=""

if(type==="index"){

promptText=`
You are PropitPilot AI business assistant.

User data
Capital: ${payload.cap}
Cost: ${payload.cost}
Sales: ${payload.sales}

Profit = Sales - Cost

Language rule
ha = Hausa
en = English
yo = Yoruba
ig = Igbo
auto = detect language

Selected language: ${payload.lang}

Give short business analysis

1 Profit result
2 Business condition
3 Possible risk
4 PropitPilot suggestion
`

}

if(type==="daily"){

promptText=`
You are PropitPilot AI business analysis system.

Business logs
Days: ${payload.days}

Logs:
${JSON.stringify(payload.logs)}

Language rule
ha Hausa
en English
yo Yoruba
ig Igbo
auto detect

Selected language: ${payload.lang}

Explain shortly

1 If business is profit or loss
2 Average performance
3 Main problem
4 PropitPilot advice
`

}

const apiURL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`

const geminiResponse=await fetch(apiURL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
contents:[{parts:[{text:promptText}]}]
})
})

const data=await geminiResponse.json()

if(data.error){
throw new Error(data.error.message||"Gemini error")
}

const aiText=data.candidates?.[0]?.content?.parts?.[0]?.text||"No AI response"

return new Response(JSON.stringify({text:aiText}),{
status:200,
headers:{
...corsHeaders,
"Content-Type":"application/json"
}
})

}catch(err){

return new Response(JSON.stringify({error:err.message}),{
status:500,
headers:corsHeaders
})

}

}
