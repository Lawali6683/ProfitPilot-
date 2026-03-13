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
return new Response(
JSON.stringify({error:"Method not allowed"}),
{status:405,headers:corsHeaders}
)
}

try{

const {payload,password,type}=await request.json()

if(password!=="@haruna66"){
return new Response(
JSON.stringify({error:"Unauthorized access"}),
{status:401,headers:corsHeaders}
)
}

if(!env.GEMINI_API_KEY){
return new Response(
JSON.stringify({error:"API Key missing in Cloudflare Dashboard"}),
{status:500,headers:corsHeaders}
)
}

let promptText=""

if(type==="index"){

const cap=Number(payload.cap)
const cost=Number(payload.cost)
const sales=Number(payload.sales)

const profit=sales-cost

let status=""

if(profit>0){
status="profit"
}else if(profit<0){
status="loss"
}else{
status="break even"
}

promptText=`You are ProfitPilot AI business assistant. Analyze this small business data.

Capital: ₦${cap}
Cost: ₦${cost}
Sales: ₦${sales}
Profit: ₦${profit}

Language: ${payload.lang}

Explain clearly if the business is making profit or loss.
Give short practical business advice to help the user grow the business.
Keep answer short and easy for small traders.`

}else{

promptText=`Analyze this business log data and determine if the business is making profit or loss.

Logs: ${JSON.stringify(payload.logs)}

Explain clearly.`

}

const apiURL=`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`

const geminiResponse=await fetch(apiURL,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
contents:[
{
parts:[
{
text:promptText
}
]
}
]
})
})

const data=await geminiResponse.json()

if(data.error){
throw new Error(data.error.message||"Gemini API Error")
}

const aiText=data.candidates[0].content.parts[0].text

return new Response(
JSON.stringify({text:aiText}),
{
status:200,
headers:{
...corsHeaders,
"Content-Type":"application/json"
}
}
)

}catch(err){

return new Response(
JSON.stringify({error:err.message}),
{
status:500,
headers:corsHeaders
}
)

}

}
