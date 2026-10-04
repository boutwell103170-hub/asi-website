'use strict';
const http=require('node:http');
const {createHandler}=require('./quote-server.cjs');
const {createResendTransport,validEmail}=require('./resend-transport.cjs');
const {SingleInstanceLimiter}=require('./single-instance-limiter.cjs');
function configuration(env={}){
 if(env.ASI_NO_SEND_STAGING!==undefined && !['true','false'].includes(env.ASI_NO_SEND_STAGING))throw Error('Invalid no-send staging mode');
 if(env.ASI_NO_SEND_STAGING==='true'){
  if(env.ASI_ENABLE_DELIVERY!=='false')throw Error('No-send staging requires delivery explicitly disabled');
  return {enabled:false,staging:true};
 }
 if(env.ASI_ENABLE_DELIVERY!=='true')return {enabled:false};
 const requiredFlags=['ASI_RELEASE_APPROVED','ASI_PROVIDER_APPROVED','ASI_SINGLE_INSTANCE_VERIFIED','ASI_PROVIDER_HARD_QUOTA_VERIFIED','ASI_INGRESS_POLICY_VERIFIED'];
 for(const key of requiredFlags)if(env[key]!=='true')throw Error('Required deployment approval/verification missing: '+key);
 if(env.ASI_INSTANCE_COUNT!=='1')throw Error('Exactly one API instance is required for the bounded rate policy');
 if(!validEmail(env.ASI_NOTIFICATION_EMAIL)||!validEmail(env.ASI_VERIFIED_SENDER))throw Error('Valid fixed server sender and recipient are required');
 let origin;try{origin=new URL(env.ASI_PUBLIC_ORIGIN);}catch{throw Error('Exact HTTPS origin required');}
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash||origin.origin!==env.ASI_PUBLIC_ORIGIN)throw Error('Exact HTTPS origin required');
 if(!/^[A-Za-z0-9_-]{43,}$/.test(env.ASI_TOKEN_SIGNING_SECRET||''))throw Error('A securely generated base64url signing secret of at least 32 random bytes is required');
 if(!/^re_[A-Za-z0-9_-]{10,}$/.test(env.RESEND_API_KEY||''))throw Error('Resend credential is missing or invalid');
 const daily=Number(env.ASI_DAILY_DELIVERY_LIMIT||75);if(!Number.isInteger(daily)||daily<1||daily>75)throw Error('Daily delivery limit must be between 1 and 75');
 return {enabled:true,origin:origin.origin,recipient:env.ASI_NOTIFICATION_EMAIL,sender:env.ASI_VERIFIED_SENDER,tokenSecret:env.ASI_TOKEN_SIGNING_SECRET,apiKey:env.RESEND_API_KEY,daily};
}
function createRuntime(env={},dependencies={}){
 const c=configuration(env);let handler;
 if(!c.enabled)handler=createHandler();
 else{
  const transport=createResendTransport({enabled:true,apiKey:c.apiKey,sender:c.sender,recipient:c.recipient,fetchImpl:dependencies.fetchImpl});
  const limiter=new SingleInstanceLimiter({verifiedSingleInstance:true,providerHardQuotaVerified:true,dailyDeliveryLimit:c.daily});
  handler=createHandler({mode:'production',strategy:'provider-bounded',recipient:c.recipient,origin:c.origin,tokenSecret:c.tokenSecret,transport,limiter,log:dependencies.log||(()=>{})});
 }
 const intake=handler;
 handler=(req,res)=>{
  if(req.url==='/api/live'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({status:'alive',deliveryEnabled:c.enabled,deliveryVerified:false}));return;}
  if(req.url==='/api/health'&&req.method==='GET'){res.writeHead(c.enabled?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({status:c.enabled?'configured':'disabled',deliveryVerified:false}));return;}
  return intake(req,res);
 };
 return {enabled:c.enabled,host:c.enabled||c.staging?'0.0.0.0':'127.0.0.1',handler};
}
module.exports={configuration,createRuntime};
if(require.main===module){
 try{const runtime=createRuntime(process.env),port=Number(process.env.PORT||8081);if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');
 const server=http.createServer(runtime.handler);server.headersTimeout=10000;server.requestTimeout=15000;server.keepAliveTimeout=5000;
 server.listen(port,runtime.host,()=>console.log(runtime.enabled?'Intake runtime started; email submission acceptance is not inbox delivery.':'Intake runtime disabled; requests fail closed.'));
 }catch{console.error('Intake startup blocked: required configuration or deployment verification is incomplete.');process.exitCode=1;}
}
