import {readFileSync,writeFileSync} from 'node:fs';
let env='';try{env=readFileSync(new URL('../../../ConnectRN/.env.local',import.meta.url),'utf8');}catch{}
const value=name=>env.split('\n').find(l=>l.startsWith(name+'='))?.slice(name.length+1).trim().replace(/^['"]|['"]$/g,'');
const url=process.env.SUPABASE_URL||value('EXPO_PUBLIC_SUPABASE_URL'),key=process.env.SUPABASE_PUBLISHABLE_KEY||value('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
if(!url?.startsWith('https://')||!key?.startsWith('sb_publishable_'))throw Error('공개 Supabase 설정을 확인하세요.');
writeFileSync(new URL('../dist/config.js',import.meta.url),`window.CONNECT_CONFIG=${JSON.stringify({url,key})};\n`);
console.log('Public client configuration generated.');
