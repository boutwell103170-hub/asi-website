const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {Readable}=require('node:stream');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {createRuntime,configuration}=require('../backend/runtime.cjs');
const staging={ASI_NO_SEND_STAGING:'true',ASI_ENABLE_DELIVERY:'false'};
async function request(runtime,url,method='GET',body=''){
 const req=Readable.from([Buffer.from(body)]);
 Object.assign(req,{url,method,headers:{origin:'https://preview.example','content-type':'multipart/form-data; boundary=X'},socket:{remoteAddress:'192.0.2.1'}});
 let status,headers,data;
 await runtime.handler(req,{writeHead(s,h){status=s;headers=h},end(s){this.writableEnded=true;data=JSON.parse(s)}});
 return {status,headers,data};
}
test('staging is explicit; conflicting delivery and malformed mode fail startup',()=>{
 assert.equal(createRuntime({}).host,'127.0.0.1');
 assert.equal(createRuntime({ASI_NO_SEND_STAGING:'false'}).host,'127.0.0.1');
 assert.equal(createRuntime(staging).host,'0.0.0.0');
 for(const value of [undefined,'true','TRUE','False','',true,'1'])assert.throws(()=>configuration({...staging,ASI_ENABLE_DELIVERY:value}));
 for(const value of ['TRUE','False','',true,'1','staging'])assert.throws(()=>configuration({ASI_NO_SEND_STAGING:value}));
});
test('no-send staging never reads credentials, even with all approval flags present',async()=>{
 let calls=0;
 const env={...staging,ASI_RELEASE_APPROVED:'true',ASI_PROVIDER_APPROVED:'true',ASI_SINGLE_INSTANCE_VERIFIED:'true',ASI_PROVIDER_HARD_QUOTA_VERIFIED:'true',ASI_INGRESS_POLICY_VERIFIED:'true',ASI_INSTANCE_COUNT:'1'};
 for(const key of ['RESEND_API_KEY','ASI_TOKEN_SIGNING_SECRET','ASI_NOTIFICATION_EMAIL','ASI_VERIFIED_SENDER'])Object.defineProperty(env,key,{get(){throw Error('No-send must not read '+key)}});
 const runtime=createRuntime(env,{fetchImpl:async()=>{calls++;throw Error('Provider calls forbidden')}});
 assert.equal(runtime.enabled,false);
 for(const url of ['/api/quote','/api/quote/token'])for(const body of ['', 'malformed', '--X\r\nContent-Disposition: form-data; name="payload"\r\n\r\n{}\r\n--X--\r\n']){
  const result=await request(runtime,url,'POST',body);
  assert.equal(result.status,503);assert.equal(result.data.code,'NOT_CONFIGURED');assert.equal(result.data.ok,false);assert.equal(result.data.token,undefined);assert.equal(result.data.receiptId,undefined);
 }
 assert.equal(calls,0);
});
test('liveness is separate from unchanged readiness in disabled and staging modes',async()=>{
 for(const env of [{},staging]){
  const runtime=createRuntime(env);
  const live=await request(runtime,'/api/live');assert.equal(live.status,200);assert.deepEqual(live.data,{status:'alive',deliveryEnabled:false,deliveryVerified:false});assert.equal(live.headers['Cache-Control'],'no-store');
  const ready=await request(runtime,'/api/health');assert.equal(ready.status,503);assert.deepEqual(ready.data,{status:'disabled',deliveryVerified:false});
  for(const [url,method] of [['/live','GET'],['/api/live','POST'],['/api/live?send=true','GET'],['/api/health','POST'],['/quote','POST']])assert.equal((await request(runtime,url,method)).status,404);
 }
});
test('real CLI staging serves health and rejects intake without inherited application env',async(t)=>{
 const probe=http.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
 // Allow only OS runtime variables; no ambient application credentials or NODE_OPTIONS.
 const env={...staging,PORT:String(port)};for(const key of ['SystemRoot','WINDIR','PATH','TEMP','TMP'])if(process.env[key])env[key]=process.env[key];
 const child=spawn(process.execPath,[require.resolve('../backend/runtime.cjs')],{env,stdio:['ignore','pipe','pipe'],windowsHide:true});
 const exited=once(child,'exit');t.after(async()=>{if(child.exitCode===null)child.kill();await exited});
 await Promise.race([once(child.stdout,'data'),exited.then(()=>{throw Error('CLI exited before listening')})]);
 async function get(path,method='GET'){return new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port,path,method},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,data:JSON.parse(body)}))});req.on('error',reject);req.end()})}
 assert.equal((await get('/api/live')).status,200);assert.equal((await get('/api/health')).status,503);
 for(const path of ['/api/quote','/api/quote/token'])assert.equal((await get(path,'POST')).data.code,'NOT_CONFIGURED');
});
test('unapplied staging spec keeps port, liveness and full API prefix aligned',()=>{
 const fs=require('node:fs'),path=require('node:path');const spec=fs.readFileSync(path.join(__dirname,'../deployment/api-proposal.yaml'),'utf8');
 assert.match(spec,/http_port: 8081/);assert.match(spec,/key: PORT\s+value: "8081"/);assert.match(spec,/http_path: \/api\/live/);
 assert.match(spec,/key: ASI_NO_SEND_STAGING\s+value: "true"\s+scope: RUN_TIME/);assert.match(spec,/key: ASI_ENABLE_DELIVERY\s+value: "false"/);
 assert.match(spec,/prefix: \/api\s+component:\s+name: asi-quote-api\s+preserve_path_prefix: true/);assert.match(spec,/deploy_on_push: false/);
});
test('staging cannot bypass production gates or coexist with fully configured delivery',async()=>{
 const production={ASI_NO_SEND_STAGING:'false',ASI_ENABLE_DELIVERY:'true',ASI_RELEASE_APPROVED:'true',ASI_PROVIDER_APPROVED:'true',ASI_SINGLE_INSTANCE_VERIFIED:'true',ASI_PROVIDER_HARD_QUOTA_VERIFIED:'true',ASI_INGRESS_POLICY_VERIFIED:'true',ASI_INSTANCE_COUNT:'1',ASI_NOTIFICATION_EMAIL:'intake@example.invalid',ASI_VERIFIED_SENDER:'sender@example.invalid',ASI_PUBLIC_ORIGIN:'https://preview.example',ASI_TOKEN_SIGNING_SECRET:'synthetic_test_only_signing_secret_43_characters',RESEND_API_KEY:'re_synthetic_test_only'};
 assert.throws(()=>createRuntime({...production,ASI_NO_SEND_STAGING:'true'}));
 for(const key of ['ASI_RELEASE_APPROVED','ASI_PROVIDER_APPROVED','ASI_SINGLE_INSTANCE_VERIFIED','ASI_PROVIDER_HARD_QUOTA_VERIFIED','ASI_INGRESS_POLICY_VERIFIED'])assert.throws(()=>createRuntime({...production,[key]:'false'}));
 let calls=0;const runtime=createRuntime(production,{fetchImpl:async()=>{calls++;throw Error('Provider request forbidden')}});
 assert.equal(runtime.host,'0.0.0.0');assert.equal(runtime.enabled,true);
 assert.deepEqual((await request(runtime,'/api/live')).data,{status:'alive',deliveryEnabled:true,deliveryVerified:false});
 assert.deepEqual((await request(runtime,'/api/health')).data,{status:'configured',deliveryVerified:false});assert.equal(calls,0);
});
