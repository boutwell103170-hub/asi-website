'use strict';
// Details-only intake core. No default transport, persistence, or outbound network.
const http = require('node:http');
const {createHash, createHmac, timingSafeEqual, randomUUID} = require('node:crypto');
const CONSENT_VERSION = 'asi-project-inquiry-v1';
const MAX_BODY = 65536;
const enums = {
 service: ['Plan Review','Construction Inspections','Private Provider Services','Permit Assistance','Fire & Life Safety','Consulting / Code Administration','Home Inspection','Not Sure'],
 projectType: ['','Residential','Commercial','Multifamily','Hospitality','Institutional / Government','Industrial','Existing Building / Renovation','Other'],
 permitStatus: ['','Not yet submitted','Submitted / under review','Permit issued','Construction underway','Not sure / not applicable'],
 timing: ['','As soon as practical','Within 1–2 weeks','Within 30 days','Planning / future project','Not sure'],
 source: ['','Referral','Existing client','Web search','Contractor / builder','Local government / agency','Other']
};
const lengths = {service:80,name:120,company:160,email:254,phone:40,location:240,projectType:80,squareFootage:80,permitStatus:80,scope:8000,timing:80,source:80};
class Problem extends Error { constructor(status,code,message) { super(message); this.status=status;this.code=code; } }
const bad = (code='INVALID_REQUEST',message='Please check the inquiry details.') => new Problem(422,code,message);
function parseMultipart(buffer, contentType) {
 const match=/^multipart\/form-data;\s*boundary=(?:"([A-Za-z0-9'()+_,.\/:=?-]{1,70})"|([A-Za-z0-9'()+_,.\/:=?-]{1,70}))$/i.exec(contentType || '');
 if (!match) throw new Problem(400,'INVALID_MULTIPART','Expected a multipart project inquiry.');
 const boundary=match[1]||match[2], text=buffer.toString('utf8');
 if (!Buffer.from(text,'utf8').equals(buffer)) throw new Problem(400,'INVALID_ENCODING','Expected UTF-8 inquiry details.');
 const begin='--'+boundary+'\r\n',end='\r\n--'+boundary+'--'+(text.endsWith('\r\n')?'\r\n':'');
 if (!text.startsWith(begin) || !text.endsWith(end)) throw new Problem(400,'INVALID_MULTIPART','Malformed multipart inquiry.');
 const parts=text.slice(begin.length,-end.length).split('\r\n--'+boundary+'\r\n');
 let payload;
 for (const part of parts) {
  const split=part.indexOf('\r\n\r\n');
  if(split<0 || split>2048)throw new Problem(400,'INVALID_MULTIPART','Malformed multipart headers.');
  const headers=part.slice(0,split).split('\r\n'),body=part.slice(split+4);let disposition;
  for (const header of headers) {
   if(/^content-disposition:/i.test(header)) {if(disposition)throw bad();disposition=header;}

  }
  if (/filename\*?\s*=/i.test(disposition||'') || /name="files"/i.test(disposition||'')) throw bad('FILES_DEFERRED','Documents cannot be uploaded with this inquiry. ASI will arrange document transfer afterward.');
  if(headers.some(header=>!/^content-disposition:/i.test(header)&&!/^content-type: application\/json(?:; charset=utf-8)?$/i.test(header)))throw bad('INVALID_PART','Unsupported multipart header.');
  if (!/^content-disposition: form-data;\s*name="payload"$/i.test(disposition||'') || payload!==undefined)throw bad('INVALID_PART','Send one project-details payload only.');
  try {payload=JSON.parse(body);}catch{throw new Problem(400,'INVALID_JSON','Malformed inquiry details.');}
 }
 if(payload===undefined)throw bad();
 return payload;
}
function validate(payload) {
 if(!payload || typeof payload!=='object' || Array.isArray(payload))throw bad();
 const allowed=new Set([...Object.keys(lengths),'submissionId','consent','consentVersion','website','token']);
 if(Object.keys(payload).some(k=>!allowed.has(k)))throw bad('UNKNOWN_FIELD');
 if(typeof payload.submissionId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.submissionId))throw bad('INVALID_ID');
 if(payload.consent!==true || payload.consentVersion!==CONSENT_VERSION)throw bad('CONSENT_REQUIRED','Please confirm the project-inquiry consent.');
 if(typeof payload.website!=='string' || payload.website!=='')throw bad('INVALID_REQUEST');
 if(typeof payload.token!=='string' || payload.token.length>1024)throw bad('TOKEN_REQUIRED','Refresh the inquiry authorization and try again.');
 const normalized={};
 for(const [key,max] of Object.entries(lengths)){
  if(typeof payload[key]!=='string' || payload[key].length>max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(payload[key]))throw bad('INVALID_FIELD');
  normalized[key]=payload[key].trim();
  if(key!=='scope' && /[\r\n]/.test(normalized[key]))throw bad('INVALID_FIELD');
 }
 for(const key of ['service','name','email','location','scope'])if(!normalized[key])throw bad('REQUIRED_FIELD');
 normalized.email=normalized.email.toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email))throw bad('INVALID_EMAIL');
 for(const [key,values] of Object.entries(enums))if(!values.includes(normalized[key]))throw bad('INVALID_SELECTION');
 normalized.consent=true;normalized.consentVersion=CONSENT_VERSION;
 return {fields:normalized,submissionId:payload.submissionId,token:payload.token,hash:createHash('sha256').update(JSON.stringify(normalized)).digest('hex')};
}
const TOKEN_LIFETIME = 30 * 60 * 1000;
const RENDER_VERSION = 'asi-quote-v1';
function issueToken(secret, binding, now=Date.now()) {
 const value=Buffer.from(JSON.stringify({v:1,submissionId:binding.submissionId,payloadHash:binding.hash,issuedAt:now,expiresAt:now+TOKEN_LIFETIME,renderVersion:RENDER_VERSION})).toString('base64url');
 return value+'.'+createHmac('sha256',secret).update(value).digest('base64url');
}
function verifyToken(token,secret,binding,now=Date.now()) {
 try {
  const [value,signature,...rest]=token.split('.');if(rest.length || !value || !signature)return false;
  const expected=createHmac('sha256',secret).update(value).digest(),supplied=Buffer.from(signature,'base64url');
  if(expected.length!==supplied.length || !timingSafeEqual(expected,supplied))return false;
  const data=JSON.parse(Buffer.from(value,'base64url').toString());
  return data.v===1 && data.renderVersion===RENDER_VERSION && data.submissionId===binding.submissionId && data.payloadHash===binding.hash && Number.isFinite(data.issuedAt) && data.issuedAt<=now && data.expiresAt===data.issuedAt+TOKEN_LIFETIME && data.expiresAt>now;
 }catch{return false;}
}
function readBody(req,limit=MAX_BODY) {
 return new Promise((resolve,reject)=>{
  const declared=req.headers['content-length'];
  if(declared!==undefined && (!/^\d+$/.test(declared) || Number(declared)>limit)){req.resume();reject(new Problem(413,'BODY_TOO_LARGE','Inquiry details are too large.'));return;}
  let size=0,chunks=[],settled=false;
  const timer=setTimeout(()=>finish(new Problem(408,'BODY_TIMEOUT','The inquiry upload timed out.')),10000);
  function finish(error){if(settled)return;settled=true;clearTimeout(timer);chunks=[];reject(error);req.resume();}
  req.on('data',chunk=>{if(settled)return;size+=chunk.length;if(size>limit){finish(new Problem(413,'BODY_TOO_LARGE','Inquiry details are too large.'));return;}chunks.push(chunk);});
  req.on('end',()=>{if(settled)return;settled=true;clearTimeout(timer);resolve(Buffer.concat(chunks));});
  req.on('aborted',()=>finish(new Problem(400,'INTERRUPTED','Inquiry upload interrupted.')));
  req.on('error',()=>finish(new Problem(400,'INTERRUPTED','Inquiry upload interrupted.')));
 });
}
function createHandler(options={}) {
 const {mode='production',strategy='provider-bounded',recipient,store,limiter,transport,tokenSecret,origin,log=()=>{},timeoutMs=8000,dependencyTimeoutMs=2000}=options;
 const bounded=new Map();
 async function dependency(operation) {
  let timer;
  try { return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('DEPENDENCY_TIMEOUT')),dependencyTimeoutMs);})]); }
  finally {clearTimeout(timer);}
 }
 let active=0;
 const ready=()=> typeof recipient==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) && ['test','production'].includes(mode) && ['durable','provider-bounded'].includes(strategy) && limiter?.consume && transport?.submit && typeof tokenSecret==='string' && tokenSecret.length>=32 && typeof origin==='string' && /^https:\/\//.test(origin) && (strategy==='durable' ? store?.reserve && store?.confirm && store?.uncertain && (mode==='test'||store.durable===true) : transport.idempotencyWindowMs>=86400000 && transport.renderVersion===RENDER_VERSION) && (mode==='test' || ((limiter.shared===true || (limiter.scope==='single-instance-bounded' && limiter.singleInstanceVerified===true && limiter.providerHardQuotaVerified===true)) && transport.authorized===true));
 return async function handle(req,res){
  const requestId=randomUUID();let counted=false;
  function send(status,data){if(res.destroyed || res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
  try{
   if(!['/api/quote','/api/quote/token'].includes(req.url))throw new Problem(404,'NOT_FOUND','Not found.');
   if(req.method!=='POST')throw new Problem(405,'METHOD_NOT_ALLOWED','Method not allowed.');
   if(!ready())throw new Problem(503,'NOT_CONFIGURED','Project submissions are not available yet.');
   if(req.headers.origin!==origin)throw new Problem(403,'ORIGIN_REJECTED','Use the ASI inquiry page to submit.');
   if(active>=4)throw new Problem(429,'BUSY','Please try again later.');
   active++;counted=true;
   // Ignore untrusted forwarded headers. Production must verify ingress semantics.
   const ipKey=createHmac('sha256',tokenSecret).update(req.socket.remoteAddress||'unknown').digest('hex');
   if(await dependency(()=>limiter.consume({ipKey,kind:req.url==='/api/quote/token'?'token':'inquiry'}))!==true)throw new Problem(429,'RATE_LIMIT','Please try again later.');
   const value=validate(parseMultipart(await readBody(req),req.headers['content-type']));
   if(req.url==='/api/quote/token'){send(200,{token:issueToken(tokenSecret,value),expiresIn:1800});return;}
   if(!verifyToken(value.token,tokenSecret,value))throw new Problem(403,'TOKEN_EXPIRED','The submission authorization expired or does not match these details. If delivery was attempted, contact ASI with the same reference before submitting again.');
   // reserve must be atomic across all replicas; pending/uncertain keys never resend.
   let reserved;
   if(strategy==='durable')reserved=await dependency(()=>store.reserve(value.submissionId,value.hash));
   else {
    for(const [key,entry] of bounded)if(entry.expires<Date.now())bounded.delete(key);
    const existing=bounded.get(value.submissionId);
    if(existing)reserved={...existing,status:existing.status==='reserved'?'pending':existing.status};
    else {if(bounded.size>=10000)throw new Problem(429,'BUSY','Please try again later.');reserved={hash:value.hash,status:'reserved',expires:Date.now()+TOKEN_LIFETIME};bounded.set(value.submissionId,reserved);}
   }
   if(reserved.hash!==value.hash)throw new Problem(409,'IDEMPOTENCY_CONFLICT','This submission reference belongs to different details. Review the inquiry before starting a new submission.');
   if(reserved.status==='confirmed'){send(200,{ok:true,receiptId:reserved.receiptId,deliveryStage:'submitted_for_email_delivery'});return;}
   if(reserved.status!=='reserved')throw new Problem(409,'DELIVERY_UNCONFIRMED','This inquiry is processing or its delivery is uncertain. Keep the same reference and check with ASI before trying a new inquiry.');
   let quota;
   try { quota=await dependency(()=>limiter.consume({ipKey,kind:'delivery',submissionId:value.submissionId})); }
   catch(error) {
    if(strategy==='provider-bounded')bounded.delete(value.submissionId);
    else {try{await dependency(()=>store.uncertain(value.submissionId,value.hash));}catch{}}
    throw error;
   }
   if(quota!==true){if(strategy==='provider-bounded')bounded.delete(value.submissionId);else await dependency(()=>store.uncertain(value.submissionId,value.hash));throw new Problem(429,'DELIVERY_QUOTA','Email submission capacity is temporarily unavailable. Keep the same inquiry reference.');}
   const controller=new AbortController();let timer;
   try{
    const response=await Promise.race([transport.submit({recipient,fields:value.fields,idempotencyKey:'asi-quote/'+value.submissionId,renderVersion:RENDER_VERSION,signal:controller.signal}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('TRANSPORT_TIMEOUT'));},timeoutMs);})]);
    if(response?.accepted!==true || typeof response.providerMessageId!=='string' || !response.providerMessageId.trim())throw new Error('UNCONFIRMED');
    const receiptId=value.submissionId;
    if(strategy==='durable')await dependency(()=>store.confirm(value.submissionId,value.hash,{receiptId,providerMessageId:response.providerMessageId}));
    else bounded.set(value.submissionId,{hash:value.hash,status:'confirmed',receiptId,expires:Date.now()+TOKEN_LIFETIME});
    send(200,{ok:true,receiptId,deliveryStage:'submitted_for_email_delivery'});
   }catch{
    if(strategy==='durable'){try{await dependency(()=>store.uncertain(value.submissionId,value.hash));}catch{}}
    else bounded.delete(value.submissionId); // Retry uses same provider key/body, only while signed token remains valid.
    throw new Problem(503,'DELIVERY_UNCONFIRMED','Email submission was not confirmed. Keep your draft and check with ASI before starting another inquiry.');
   }finally{clearTimeout(timer);}
  }catch(error){
   const status=error instanceof Problem?error.status:503,code=error instanceof Problem?error.code:'DEPENDENCY_UNAVAILABLE';
   try{log({requestId,status,code});}catch{}
   send(status,{ok:false,code,message:error instanceof Problem?error.message:'Project submissions are temporarily unavailable.'});
  }finally{if(counted)active--;}
 };
}
// Explicit test fixtures only. Never passed automatically to the production handler.
class MemoryTestStore {
 constructor(){this.durable=false;this.records=new Map();}
 async reserve(id,hash){const existing=this.records.get(id);if(existing)return {...existing,status:existing.status==='reserved'?'pending':existing.status};const record={hash,status:'reserved'};this.records.set(id,record);return {...record};}
 async confirm(id,hash,data){const r=this.records.get(id);if(!r||r.hash!==hash)throw Error('CONFLICT');this.records.set(id,{hash,status:'confirmed',...data});}
 async uncertain(id,hash){const r=this.records.get(id);if(r?.hash===hash&&r.status!=='confirmed')r.status='uncertain';}
}
class MemoryTestLimiter {
 constructor(limit=100){this.shared=false;this.limit=limit;this.count=0;}
 async consume(){return ++this.count<=this.limit;}
}
module.exports={createHandler,parseMultipart,validate,issueToken,verifyToken,MemoryTestStore,MemoryTestLimiter,MAX_BODY,CONSENT_VERSION,TOKEN_LIFETIME,RENDER_VERSION};
if(require.main===module){const server=http.createServer(createHandler());server.headersTimeout=10000;server.requestTimeout=15000;server.listen(Number(process.env.PORT)||8081,'127.0.0.1',()=>console.log('Unconfigured local intake server; submissions fail closed.'));}
