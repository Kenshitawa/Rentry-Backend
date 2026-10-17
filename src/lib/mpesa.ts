export async function requestMpesaPayment(input:{orderId:string;phone:string;amount:number}) {
  const key=process.env.MPESA_CONSUMER_KEY,secret=process.env.MPESA_CONSUMER_SECRET,shortcode=process.env.MPESA_SHORTCODE,passkey=process.env.MPESA_PASSKEY;
  const base=process.env.MPESA_ENVIRONMENT==="production"?"https://api.safaricom.co.ke":"https://sandbox.safaricom.co.ke";
  if(!key||!secret||!shortcode||!passkey)throw new Error("M-Pesa is not configured. Add the Daraja credentials to .env.local.");
  const callback=process.env.MPESA_CALLBACK_URL;if(!callback||!callback.startsWith("https://"))throw new Error("Set MPESA_CALLBACK_URL to your public HTTPS callback URL.");
  const credentials=Buffer.from(`${key}:${secret}`).toString("base64");
  const auth=await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`,{headers:{Authorization:`Basic ${credentials}`},cache:"no-store"});
  const authData=await auth.json();if(!auth.ok||!authData.access_token)throw new Error("Could not authenticate with M-Pesa.");
  const timestamp=mpesaTimestamp();
  const password=Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const response=await fetch(`${base}/mpesa/stkpush/v1/processrequest`,{method:"POST",headers:{Authorization:`Bearer ${authData.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({BusinessShortCode:shortcode,Password:password,Timestamp:timestamp,TransactionType:process.env.MPESA_TRANSACTION_TYPE||"CustomerPayBillOnline",Amount:Math.max(1,Math.round(input.amount)),PartyA:input.phone,PartyB:shortcode,PhoneNumber:input.phone,CallBackURL:callback,AccountReference:input.orderId.slice(0,12),TransactionDesc:"Rentry shop order"})});
  const data=await response.json();if(!response.ok||data.ResponseCode!=="0")throw new Error(data.errorMessage||data.ResponseDescription||"M-Pesa could not start the payment.");return {checkoutRequestId:String(data.CheckoutRequestID),merchantRequestId:String(data.MerchantRequestID),customerMessage:String(data.CustomerMessage||"Check your phone and enter your M-Pesa PIN.")};
}
export async function verifyMpesaPayment(input:{checkoutRequestId:string;amount:number}) {
  const key=process.env.MPESA_CONSUMER_KEY,secret=process.env.MPESA_CONSUMER_SECRET,shortcode=process.env.MPESA_SHORTCODE,passkey=process.env.MPESA_PASSKEY;
  const base=process.env.MPESA_ENVIRONMENT==="production"?"https://api.safaricom.co.ke":"https://sandbox.safaricom.co.ke";
  if(!key||!secret||!shortcode||!passkey)throw new Error("M-Pesa is not configured.");
  const auth=await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`,{headers:{Authorization:`Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`},cache:"no-store"});const authData=await auth.json();if(!auth.ok||!authData.access_token)throw new Error("Could not authenticate with M-Pesa.");
  const timestamp=mpesaTimestamp();const password=Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const response=await fetch(`${base}/mpesa/stkpushquery/v1/query`,{method:"POST",headers:{Authorization:`Bearer ${authData.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({BusinessShortCode:shortcode,Password:password,Timestamp:timestamp,CheckoutRequestID:input.checkoutRequestId})});const result=await response.json();if(!response.ok)throw new Error("M-Pesa payment verification failed.");return result;
}
function mpesaTimestamp(){const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date());const pick=(name:string)=>parts.find(p=>p.type===name)?.value??"00";return `${pick("year")}${pick("month")}${pick("day")}${pick("hour")}${pick("minute")}${pick("second")}`;}
