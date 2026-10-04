'use strict';
const VERSION='asi-quote-v1';
const OPERATOR='American Standard Construction & Safety Consulting LLC';
const EMAIL=/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validEmail(value){return typeof value==='string'&&value.length<=254&&EMAIL.test(value);}
function failure(code='PROVIDER_UNCONFIRMED'){const error=new Error('Email submission was not confirmed.');error.code=code;return error;}
function renderEmail({sender,recipient,fields,idempotencyKey,renderVersion}){
 if(renderVersion!==VERSION||!validEmail(sender)||!validEmail(recipient)||!validEmail(fields?.email)||!/^asi-quote\/[0-9a-f-]{36}$/i.test(idempotencyKey))throw failure('INVALID_TRANSPORT_INPUT');
 const reference=idempotencyKey.slice('asi-quote/'.length);if(!UUID.test(reference))throw failure('INVALID_TRANSPORT_INPUT');
 const labels={service:'Service',name:'Name',company:'Company',email:'Email',phone:'Phone',location:'Project location',projectType:'Project type',squareFootage:'Approximate square footage',permitStatus:'Permit status',scope:'Project scope',timing:'Desired timing',source:'Referral source'};
 const lines=['ASI project inquiry','Website operator: '+OPERATOR,'Reference: '+reference,''];
 for(const [key,label] of Object.entries(labels)){if(typeof fields[key]!=='string'||fields[key].length>8000)throw failure('INVALID_TRANSPORT_INPUT');lines.push(label+': '+(fields[key]||'Not provided'));}
 if(fields.consent!==true||fields.consentVersion!=='asi-project-inquiry-v1')throw failure('INVALID_TRANSPORT_INPUT');
 lines.push('','Consent: project inquiry contact authorized ('+fields.consentVersion+').','Documents: deferred; arrange transfer separately.');
 // Plain text only; no user-controlled HTML, From, subject, CC/BCC, routing, or timestamps.
 return {from:sender,to:[recipient],reply_to:fields.email,subject:'ASI project inquiry | '+reference,text:lines.join('\n')};
}
async function readSmallJson(response){
 const declared=Number(response.headers.get('content-length'));
 if(Number.isFinite(declared)&&declared>4096)throw failure();
 if(!response.body)throw failure();
 const reader=response.body.getReader();let size=0,parts=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw failure();}parts.push(Buffer.from(value));}}
 finally{reader.releaseLock();}
 try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw failure();}
}
function createResendTransport({enabled=false,apiKey,sender,recipient,fetchImpl=globalThis.fetch,timeoutMs=6500}={}){
 const configured=enabled===true&&typeof apiKey==='string'&&/^re_[A-Za-z0-9_-]{10,}$/.test(apiKey)&&validEmail(sender)&&validEmail(recipient)&&typeof fetchImpl==='function';
 return {authorized:configured,idempotencyWindowMs:86400000,renderVersion:VERSION,
  async submit(input){
   if(!configured||input.recipient!==recipient)throw failure('TRANSPORT_DISABLED');
   const body=JSON.stringify(renderEmail({...input,sender,recipient}));
   const controller=new AbortController();let timer,responseRef;
   const abort=()=>controller.abort();
   if(input.signal?.aborted)throw failure();
   input.signal?.addEventListener('abort',abort,{once:true});
   try{
    const work=(async()=>{
     const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':input.idempotencyKey},body,signal:controller.signal});
     responseRef=response;
     // Never read/return provider error bodies: they can contain contact data.
     if(response.status!==200){try{await response.body?.cancel();}catch{}throw failure(response.status===429?'PROVIDER_QUOTA':'PROVIDER_UNCONFIRMED');}
     const data=await readSmallJson(response);if(typeof data.id!=='string'||!UUID.test(data.id))throw failure();
     return {accepted:true,providerMessageId:data.id};
    })();
    return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(failure('PROVIDER_TIMEOUT'));},timeoutMs);})]);
   }catch(error){controller.abort();try{if(responseRef?.body&&!responseRef.body.locked)responseRef.body.cancel().catch(()=>{});}catch{}throw failure(error?.code==='PROVIDER_QUOTA'?'PROVIDER_QUOTA':error?.code==='PROVIDER_TIMEOUT'?'PROVIDER_TIMEOUT':'PROVIDER_UNCONFIRMED');}
   finally{clearTimeout(timer);input.signal?.removeEventListener('abort',abort);}
  }
 };
}
module.exports={createResendTransport,renderEmail,validEmail,VERSION,OPERATOR};
