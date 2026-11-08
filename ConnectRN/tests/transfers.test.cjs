const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
function load(file, dependencies = {}) {
 const sandbox={exports:{},require:n=>dependencies[n]};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
 return sandbox.exports;
}
function service(preview=false){
 const calls=[];const api=load('services/transfers.ts',{'./backend':{rpc:async(...a)=>{calls.push(a);return []}},'../lib/developmentPreview':{developmentPreview:{active:preview},previewRestriction:'preview'}});
 return {api,calls};
}
test('board sends exact filters and complete cursor, and home uses three rows',async()=>{
 const {api,calls}=service();await api.listTransfers({},3);assert.equal(calls[0][1].p_limit,3);
 await api.listTransfers({date:'2026-12-01',minute:1500,people:25,region:'신촌'},20,{id:'cursor',created_at:'time'});
 const args=calls[1][1];assert.equal(args.p_people,25);assert.equal(args.p_minute,1500);assert.equal(args.p_before_id,'cursor');assert.equal(args.p_before_time,'time');
});
test('preview board provides filtered examples and never writes or reads server data',async()=>{
 const {api,calls}=service(true);assert.equal((await api.listTransfers({},3)).length,3);
 assert.equal((await api.listTransfers({people:25}))[0].people,25);assert.equal((await api.listTransfers({people:26})).length,0);
 assert.equal((await api.myTransfers()).length,0);
 for(const action of [()=>api.createTransfer('id','terms',true),()=>api.withdrawTransfer('id'),()=>api.claimTransfer('id','request')]) await assert.rejects(action,/preview/);
 assert.equal(calls.length,0);
});
test('claim retries preserve caller request id and explicit agreement',async()=>{
 const {api,calls}=service();await api.claimTransfer('listing','request');await api.claimTransfer('listing','request');
 assert.equal(calls[0][0],'claim_transfer');assert.equal(calls[1][1].p_request_id,'request');assert.equal(calls[1][1].p_accept_terms,true);
});
test('expiry changes only active listings at exact start boundary',()=>{
 const {transferStatus}=load('models/transfers.ts');const start=Date.parse('2026-12-01T18:00:00+09:00');
 const t={starts_at:'2026-12-01T18:00:00+09:00',status:'active'};
 assert.equal(transferStatus(t,start-1),'active');assert.equal(transferStatus(t,start),'expired');assert.equal(transferStatus({...t,status:'completed'},start+1),'completed');
});
test('chat read and write carry conversation epoch explicitly',async()=>{
 const calls=[];const query={select(){return this},eq(k,v){calls.push([k,v]);return this},order(){return this},limit(){return Promise.resolve({data:[],error:null})}};
 const api=load('services/chat.ts',{'../lib/supabase':{supabase:{from:()=>query}},'./backend':{rpc:async(...a)=>calls.push(a)},'../lib/developmentPreview':{developmentPreview:{active:false}}});
 await api.fetchChat('reservation',undefined,1);await api.sendMessage('reservation','hello','request',1);
 assert.ok(calls.some(c=>c[0]==='chat_epoch'&&c[1]===1));assert.equal(calls.at(-1)[0],'send_chat_message_epoch');assert.equal(calls.at(-1)[1].p_epoch,1);
});
test('memo accepts optional plain text and exactly 50 Unicode characters',()=>{
 const {transferMemoError:validate}=load('utils/transferMemo.ts');
 for(const value of ['', '좋은 모임 되세요!', '예약 2층 #3번 *좌석*', '가'.repeat(50), '𠮷'.repeat(50)]) assert.equal(validate(value),null);
 assert.match(validate('가'.repeat(51)),/50자/);assert.match(validate('𠮷'.repeat(51)),/50자/);
});
test('memo rejects pasted emoji, flags, sequences and line breaks',()=>{
 const {transferMemoError:validate}=load('utils/transferMemo.ts');
 for(const value of ['안녕🙂','🇰🇷','👨‍👩‍👧','1️⃣','👍🏽','❤️','☺','🫩','©','\uFE0F']) assert.match(validate(value),/이모지/);
 assert.match(validate('좋은\n모임'),/줄바꿈/);
});
test('create transfer validates memo before sending and preserves it on retry',async()=>{
 const calls=[];const api=load('services/transfers.ts',{
  './backend':{rpc:async(...a)=>{calls.push(a);return 'id'}},
  '../lib/developmentPreview':{developmentPreview:{active:false}},
  '../utils/transferMemo':load('utils/transferMemo.ts'),
 });
 await assert.rejects(()=>api.createTransfer('r','terms',true,'🙂'),/이모지/);
 await assert.rejects(()=>api.createTransfer('r','terms',true,'a'.repeat(51)),/50자/);
 assert.equal(calls.length,0);
 for(let i=0;i<2;i++) await api.createTransfer('r','terms',true,'좋은 모임 되세요');
 assert.equal(calls[0][1].p_memo,'좋은 모임 되세요');assert.deepEqual(calls[0],calls[1]);
});
