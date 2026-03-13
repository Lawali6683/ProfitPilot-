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
return new Response(JSON.stringify({error:"Unauthorized access"}),{status:401,headers:corsHeaders})
}

if(!env.GEMINI_API_KEY){
return new Response(JSON.stringify({error:"API Key missing in Cloudflare Dashboard"}),{status:500,headers:corsHeaders})
}

let promptText=""

if(type==="daily"){

const logs=payload.logs||[]
const lang=payload.lang||"auto"

let totalCost=0
let totalSales=0

logs.forEach(l=>{
totalCost+=Number(l.cost)
totalSales+=Number(l.sale)
})

const profit=totalSales-totalCost

promptText=`You are ProfitPilot AI business analyst.

Business log days: ${payload.days}

Logs:
${JSON.stringify(logs)}

Total Cost: ${totalCost}
Total Sales: ${totalSales}
Profit: ${profit}

Language: ${lang}

Explain if the business is making profit or loss.
Give short advice to improve the business.
Keep explanation simple.`

}

const apiURL=`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`

const geminiResponse=await fetch(apiURL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
contents:[
{
parts:[
{text:promptText}
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

return new Response(JSON.stringify({text:aiText}),{
status:200,
headers:{
...corsHeaders,
"Content-Type":"application/json"
}
})

}catch(err){

return new Response(JSON.stringify({error:err.message}),{status:500,headers:corsHeaders})

}

}
