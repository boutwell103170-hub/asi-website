'use strict';
// Deliberately process-local. Restart resets counters; a verified provider hard quota is mandatory.
class SingleInstanceLimiter {
 constructor({verifiedSingleInstance=false,providerHardQuotaVerified=false,dailyDeliveryLimit=75,now=Date.now}={}){
  this.shared=false;this.scope='single-instance-bounded';
  this.singleInstanceVerified=verifiedSingleInstance===true;this.providerHardQuotaVerified=providerHardQuotaVerified===true;
  if(!Number.isInteger(dailyDeliveryLimit)||dailyDeliveryLimit<1||dailyDeliveryLimit>75)throw Error('Invalid local delivery limit');
  this.dailyDeliveryLimit=dailyDeliveryLimit;this.now=now;this.clients=new Map();this.global=[];this.deliveryIds=new Map();
 }
 async consume({ipKey,kind,submissionId}){
  if(!this.singleInstanceVerified||!this.providerHardQuotaVerified)return false;
  const now=this.now(),day=86400000;
  if(kind==='delivery'){
   for(const [id,time]of this.deliveryIds)if(now-time>=day)this.deliveryIds.delete(id);
   if(this.deliveryIds.has(submissionId))return true;
   if(typeof submissionId!=='string'||this.deliveryIds.size>=this.dailyDeliveryLimit)return false;
   this.deliveryIds.set(submissionId,now);return true;
  }
  if(!['token','inquiry'].includes(kind)||typeof ipKey!=='string')return false;
  for(const [key,events]of this.clients)if(!events.length||now-events.at(-1)>=3600000)this.clients.delete(key);
  this.global=this.global.filter(t=>now-t<60000);
  const events=(this.clients.get(ipKey)||[]).filter(t=>now-t<3600000);
  if(this.global.length>=120||events.filter(t=>now-t<60000).length>=20||events.length>=60||(!this.clients.has(ipKey)&&this.clients.size>=10000))return false;
  events.push(now);this.clients.set(ipKey,events);this.global.push(now);return true;
 }
}
module.exports={SingleInstanceLimiter};
