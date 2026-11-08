const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const id='11111111-1111-4111-8111-111111111111';
function fixture({ row={kind:'chat_message',reservation_id:'reservation'}, account='user', preview=false }={}) {
 const calls=[];const query={select(){return this},eq(k,v){calls.push(['filter',k,v]);return this},async maybeSingle(){return {data:row}}};
 const dependencies={
 '../lib/supabase':{supabase:{from:()=>query,auth:{getSession:async()=>({data:{session:{user:{id:account}}}})}}},
 './backend':{rpc:async(...args)=>{calls.push(['rpc',...args])}},
 '../lib/developmentPreview':{developmentPreview:{active:preview}},
 '../navigation/navigationRef':{navigationRef:{isReady:()=>true,navigate:(...args)=>calls.push(['navigate',...args])}},
 };
 const sandbox={exports:{},require:n=>dependencies[n]};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/services/notifications.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
 return {open:()=>sandbox.exports.openNotification(id,'user'),calls};
}
test('notification navigation uses RLS-owned server row, not push payload route',async()=>{
 const f=fixture();assert.equal(await f.open(),true);
 assert.equal(f.calls.find(c=>c[0]==='filter'&&c[1]==='user_id')[2],'user');
 assert.equal(f.calls.at(-1)[1],'NotificationChat');assert.equal(f.calls.at(-1)[2].reservationId,'reservation');
});
test('missing notification, changed account and preview never navigate or mark read',async()=>{
 for(const config of [{row:null},{account:'other'},{preview:true}]){
  const f=fixture(config);assert.equal(await f.open(),false);assert.equal(f.calls.some(c=>c[0]==='navigate'||c[0]==='rpc'),false);
 }
});

test('transfer notification opens durable history rather than inaccessible old reservation', async () => {
 const f=fixture({row:{kind:'reservation_transferred',reservation_id:'reservation',transfer_id:'transfer'}});
 await f.open();assert.equal(f.calls.at(-1)[1],'TransferRecord');assert.equal(f.calls.at(-1)[2].transferId,'transfer');
});
test('chat notification pins original conversation epoch', async () => {
 for(const epoch of [0,1]){
  const f=fixture({row:{kind:'chat_message',reservation_id:'reservation',chat_epoch:epoch}});
  await f.open();assert.equal(f.calls.at(-1)[2].chatEpoch,epoch);
 }
});
