const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function fixture({ granted = true, account = 'user', preview = false, platform = 'ios' } = {}) {
  const calls=[]; let saved; let permission=granted;
  const Notifications={ IosAuthorizationStatus:{ PROVISIONAL:3 }, AndroidImportance:{ HIGH:4 },
    getPermissionsAsync:async()=>({ granted:permission,canAskAgain:true }),
    requestPermissionsAsync:async()=>{calls.push('permission');permission=true;return {granted:true};},
    getExpoPushTokenAsync:async()=>{calls.push('token');return {data:'ExpoPushToken[validToken12345]'};},
    setNotificationChannelAsync:async()=>{calls.push('channel');},
  };
  const requireMock=name=>{
    if(name==='@react-native-async-storage/async-storage') return {__esModule:true,default:{getItem:async()=>saved,setItem:async(k,v)=>{saved=v;}}};
    if(name==='expo-constants') return {__esModule:true,default:{easConfig:{projectId:'project'}}};
    if(name==='expo-crypto') return {randomUUID:()=> 'installation'};
    if(name==='react-native') return {Platform:{OS:platform}};
    if(name==='expo-notifications') return Notifications;
    if(name==='../lib/supabase') return {supabase:{auth:{getSession:async()=>({data:{session:{user:{id:account}}}})}}};
    if(name==='../lib/developmentPreview') return {developmentPreview:{active:preview}};
    if(name==='./backend') return {rpc:async(name,args)=>{calls.push([name,args]);}};
    throw Error(name);
  };
  const source=fs.readFileSync(path.join(__dirname,'../src/services/pushNotifications.ts'),'utf8');
  const sandbox={exports:{},require:requireMock};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
  return {...sandbox.exports,calls};
}
test('registration followed immediately by logout unregisters after registration',async()=>{
 const f=fixture();await Promise.all([f.registerPush('user'),f.unregisterPush()]);
 assert.deepEqual(f.calls.filter(Array.isArray).map(x=>x[0]),['register_push_device','unregister_push_device']);
});
test('denied permission revokes this installation without requesting again silently',async()=>{
 const f=fixture({granted:false});await f.registerPush('user');
 assert.deepEqual(f.calls.filter(Array.isArray).map(x=>x[0]),['unregister_push_device']);assert.equal(f.calls.includes('permission'),false);
});
test('explicit enable requests permission, registers token, and Android channel',async()=>{
 const f=fixture({granted:false,platform:'android'});await f.registerPush('user',true);
 assert.equal(f.calls[0],'channel');assert.equal(f.calls[1],'permission');assert.equal(f.calls.at(-1)[0],'register_push_device');
});
test('preview/web/account switching cannot register a stale user token',async()=>{
 for(const config of [{preview:true},{platform:'web'},{account:'other'}]){
  const f=fixture(config);await f.registerPush('user');assert.equal(f.calls.filter(Array.isArray).length,0);
 }
});
