const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../site/js/quote-adapter.js'),'utf8');
function context(config,fetchImpl){let calls=0;const cache=new Map();const window={localStorage:{getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v),removeItem:k=>cache.delete(k)},crypto:{randomUUID:()=>require('node:crypto').randomUUID()},ASI_CONFIG:config,location:{href:'https://preview.example/quote.html',origin:'https://preview.example'}};vm.runInNewContext(source,{window,URL,FormData,AbortController,setTimeout,clearTimeout,fetch:async(...args)=>{if(args[0].endsWith('/token'))return {ok:true,json:async()=>({token:'synthetic-token',expiresIn:1800})};calls++;return fetchImpl(...args)}});return {submit:window.ASI_QUOTE_SUBMIT,calls:()=>calls};}
test('sandbox never sends or claims receipt',async()=>{const c=context({quoteMode:'sandbox'},()=>{throw Error('network forbidden')});const r=await c.submit({},[]);assert.equal(r.ok,false);assert.equal(r.mode,'sandbox');assert.equal(c.calls(),0)});
test('missing/unknown modes and endpoint fail closed',async()=>{for(const config of [{},{quoteMode:'production'},{quoteMode:'unexpected',quoteEndpoint:'/api/quote'}]){const c=context(config);await assert.rejects(c.submit({},[]));assert.equal(c.calls(),0)}});
test('cross-origin and non-HTTPS endpoints cannot transmit',async()=>{for(const endpoint of ['https://third-party.example/api','http://preview.example/api']){const c=context({quoteMode:'production',quoteEndpoint:endpoint});await assert.rejects(c.submit({},[]));assert.equal(c.calls(),0)}});
test('HTTP errors, non-JSON, negative and missing confirmation reject',async()=>{for(const response of [{ok:false},{ok:true,json:async()=>{throw Error('HTML response')}},{ok:true,json:async()=>({ok:false,receiptId:'123'})},{ok:true,json:async()=>({ok:true})},{ok:true,json:async()=>({ok:true,receiptId:' '})}]){const c=context({quoteMode:'production',quoteEndpoint:'/api/quote'},async()=>response);await assert.rejects(c.submit({},[]))}});
test('network failure rejects',async()=>{const c=context({quoteMode:'production',quoteEndpoint:'/api/quote'},()=>{throw Error('offline')});await assert.rejects(c.submit({},[]))});
test('confirmed receipt sends multipart and cannot override trusted mode/message',async()=>{let request;const c=context({quoteMode:'production',quoteEndpoint:'/api/quote'},async(url,options)=>{request={url,options};return {ok:true,json:async()=>({ok:true,deliveryStage:'submitted_for_email_delivery',receiptId:JSON.parse(options.body.get('payload')).submissionId,mode:'sandbox',message:'untrusted'})}});const r=await c.submit({name:'Synthetic Test'},[]);assert.equal(r.ok,true);assert.equal(r.mode,'production');assert.equal(r.receiptId,JSON.parse(request.options.body.get('payload')).submissionId);assert.notEqual(r.message,'untrusted');assert.equal(request.url,'https://preview.example/api/quote');assert.equal(request.options.redirect,'error');assert.equal(request.options.method,'POST');assert.equal(JSON.parse(request.options.body.get('payload')).name,'Synthetic Test')});
test('timeout aborts a stalled request',async()=>{
 const window={localStorage:{getItem:()=>null,setItem(){},removeItem(){}},crypto:{randomUUID:()=>require('node:crypto').randomUUID()},ASI_CONFIG:{quoteMode:'production',quoteEndpoint:'/api/quote'},location:{href:'https://preview.example/quote.html',origin:'https://preview.example'}};
 let timeoutCallback,cleared=false;
 vm.runInNewContext(source,{window,URL,FormData,AbortController,setTimeout:fn=>{timeoutCallback=fn;return 1},clearTimeout:()=>{cleared=true},fetch:async(url,opts)=>new Promise((resolve,reject)=>{if(opts.signal.aborted)reject(Error('aborted'));else opts.signal.addEventListener('abort',()=>reject(Error('aborted')))})});
 const promise=window.ASI_QUOTE_SUBMIT({},[]);timeoutCallback();await assert.rejects(promise,/aborted/);assert.equal(cleared,true);
});
const html=fs.readFileSync(require('node:path').join(__dirname,'../site/quote.html'),'utf8');
const handler=html.match(/document\.getElementById\('submitBtn'\)\.addEventListener\('click', async \(\)=>\{([\s\S]*?)\n\}\);/)[1];
function ui(result,storageThrows=false){
 const el={};for(const id of ['submitBtn','consent','consentError','website','files','formContent','success','shell','modeNotice'])el[id]={disabled:false,textContent:'Test Intake',checked:true,value:'',files:[],style:{},classList:{add(){el.success.shown=true}},focus(){}};
 const heading={},paragraph={};let removals=0,calls=0,alerts=0;
 const context={ids:[],state:{service:'Plan Review'},stateKey:'test',save(){},validateStep(){return true},showStep(){},document:{getElementById:id=>el[id],querySelector:s=>s==='#success h2'?heading:paragraph},localStorage:{removeItem(){removals++;if(storageThrows)throw Error('denied')}},window:{ASI_QUOTE_SUBMIT:async()=>{calls++;return typeof result==='function'?result():result},scrollTo(){}},alert(){alerts++},Error};
 const run=vm.runInNewContext('(async()=>{'+handler+'})',context);
 return {run,el,heading,paragraph,removals:()=>removals,calls:()=>calls,alerts:()=>alerts};
}
test('sandbox UI retains draft and never displays delivered success',async()=>{const u=ui({ok:false,mode:'sandbox',message:'Nothing sent'});await u.run();assert.equal(u.removals(),0);assert.equal(u.el.success.shown,undefined);assert.equal(u.el.modeNotice.textContent,'Nothing sent');assert.equal(u.el.submitBtn.disabled,false)});
test('negative result cannot clear draft or show success',async()=>{const u=ui({ok:false,mode:'production'});await u.run();assert.equal(u.removals(),0);assert.equal(u.el.success.shown,undefined);assert.equal(u.alerts(),1)});
test('confirmed acceptance survives denied storage removal',async()=>{const u=ui({ok:true,mode:'production',receiptId:'mock-1',message:'Received'},true);await u.run();assert.equal(u.el.success.shown,true);assert.equal(u.heading.textContent,'Submitted for email delivery.');assert.equal(u.alerts(),0)});
test('repeated clicks during pending send create only one request',async()=>{let resolve;const u=ui(()=>new Promise(r=>{resolve=r}));const pending=u.run();await u.run();assert.equal(u.calls(),1);resolve({ok:false,mode:'sandbox',message:'Nothing sent'});await pending;assert.equal(u.el.submitBtn.disabled,false)});
test('details-only client rejects files before any network',async()=>{const c=context({quoteMode:'sandbox'},()=>{throw Error('forbidden')});await assert.rejects(c.submit({},[{name:'test.pdf'}]),/deferred/);assert.equal(c.calls(),0)});
test('client retains token and exact ID after uncertain response; changed fields cannot silently start again',async()=>{let calls=0;const bodies=[];const c=context({quoteMode:'production',quoteEndpoint:'/api/quote'},async(url,opts)=>{calls++;bodies.push(JSON.parse(opts.body.get('payload')));if(calls===1)throw Error('response lost');return {ok:true,json:async()=>({ok:true,deliveryStage:'submitted_for_email_delivery',receiptId:bodies.at(-1).submissionId})}});await assert.rejects(c.submit({scope:'original'},[]));await assert.rejects(c.submit({scope:'changed'},[]),/uncertain outcome/);assert.equal(calls,1);const result=await c.submit({scope:'original'},[]);assert.equal(result.ok,true);assert.deepEqual(bodies[0],bodies[1])});
test('uncertain UI displays only a safe structured submission reference',async()=>{const id='12345678-1234-4234-8234-123456789abc';const u=ui(()=>{const e=Error('private server text');e.submissionId=id;throw e});await u.run();assert(u.el.modeNotice.textContent.includes(id));assert(!u.el.modeNotice.textContent.includes('private server text'));const unsafe=ui(()=>{const e=Error('bad');e.submissionId='<img src=x>';throw e});await unsafe.run();assert(!unsafe.el.modeNotice.textContent.includes('<img'))});

test('client rejects a mismatched receipt identity',async()=>{const c=context({quoteMode:'production',quoteEndpoint:'/api/quote'},async()=>({ok:true,json:async()=>({ok:true,deliveryStage:'submitted_for_email_delivery',receiptId:'wrong-id'})}));await assert.rejects(c.submit({},[]),/did not confirm/)});

function stagedAdapter(respond){
 const requests=[],cache=new Map();
 const window={localStorage:{getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v),removeItem:k=>cache.delete(k)},crypto:{randomUUID:()=>require('node:crypto').randomUUID()},ASI_CONFIG:{quoteMode:'production',quoteEndpoint:'/api/quote'},location:{href:'https://preview.example/quote.html',origin:'https://preview.example'}};
 vm.runInNewContext(source,{window,URL,FormData,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{requests.push({url,payload:JSON.parse(options.body.get('payload'))});return respond(url,options)}});
 return {submit:window.ASI_QUOTE_SUBMIT,requests,cache};
}
test('generic HTML 503 during authorization never attempts delivery or locks changed details',async()=>{
 const c=stagedAdapter(()=>new Response('<html>Service unavailable</html>',{status:503,headers:{'content-type':'text/html'}}));
 for(const scope of ['original','changed'])await assert.rejects(c.submit({scope},[]),e=>{assert.equal(e.deliveryAttempted,false);assert.equal(e.submissionId,undefined);assert(!e.message.includes('<html>'));return true});
 assert.equal(c.requests.length,2);assert(c.requests.every(r=>r.url.endsWith('/token')));assert.equal(JSON.parse(c.cache.get('asiQuoteAttemptV1')).attempted,false);
});
test('HTML 200, invalid JSON and network failure during authorization do not claim a delivery attempt',async()=>{
 for(const respond of [()=>new Response('<html>proxy page</html>'),()=>new Response('{'),()=>{throw Error('offline')}]){
  const c=stagedAdapter(respond);await assert.rejects(c.submit({},[]),e=>e.deliveryAttempted===false&&e.submissionId===undefined);assert.equal(c.requests.length,1);
 }
});
test('generic HTML 503 after quote POST retains uncertainty, identity and token without refreshing',async()=>{
 const c=stagedAdapter(url=>url.endsWith('/token')?new Response(JSON.stringify({token:'synthetic-token',expiresIn:1800})):new Response('<html>Service unavailable</html>',{status:503}));
 let id;await assert.rejects(c.submit({scope:'same'},[]),e=>{assert.equal(e.deliveryAttempted,true);id=e.submissionId;return true});
 await assert.rejects(c.submit({scope:'changed'},[]),/uncertain outcome/);
 await assert.rejects(c.submit({scope:'same'},[]),e=>e.deliveryAttempted===true&&e.submissionId===id);
 assert.equal(c.requests.filter(r=>r.url.endsWith('/token')).length,1);assert.deepEqual(c.requests[1].payload,c.requests[2].payload);assert(c.cache.has('asiQuoteAttemptV1'));
});
test('authorization failure UI retains details and allows retry without a false duplicate warning',async()=>{
 const u=ui(()=>{const e=Error('<html>private proxy text</html>');e.deliveryAttempted=false;throw e});await u.run();
 assert.equal(u.removals(),0);assert.equal(u.el.success.shown,undefined);assert.equal(u.el.submitBtn.disabled,false);assert.equal(u.alerts(),1);
 assert.match(u.el.modeNotice.textContent,/No inquiry was submitted for email delivery/);assert.match(u.el.modeNotice.textContent,/Check your details before trying again/);assert(!u.el.modeNotice.textContent.includes('Check with ASI'));assert(!u.el.modeNotice.textContent.includes('proxy text'));
});
test('unknown failures remain conservative and cannot imply that nothing was sent',async()=>{
 const u=ui(()=>{throw Error('unknown')});await u.run();assert.match(u.el.modeNotice.textContent,/Delivery was not confirmed/);assert(!u.el.modeNotice.textContent.includes('No inquiry was submitted'));
});

test('422 authorization rejection keeps correction guidance neutral and never attempts delivery',async()=>{
 const c=stagedAdapter(()=>new Response(JSON.stringify({ok:false,code:'INVALID_FIELD',message:'untrusted server detail'}),{status:422,headers:{'content-type':'application/json'}}));
 const u=ui(()=>c.submit({scope:'x'.repeat(8001)},[]));await u.run();
 assert.equal(c.requests.length,1);assert(c.requests[0].url.endsWith('/token'));
 assert.equal(JSON.parse(c.cache.get('asiQuoteAttemptV1')).attempted,false);
 assert.equal(u.removals(),0);assert.equal(u.el.success.shown,undefined);assert.equal(u.el.submitBtn.disabled,false);
 const message=u.el.modeNotice.textContent;
 assert.match(message,/No inquiry was submitted for email delivery/);assert.match(message,/Check your details before trying again/);
 assert(!/temporarily|try again later|untrusted server detail|Check with ASI/.test(message));
});
