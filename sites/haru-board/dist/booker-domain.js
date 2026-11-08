import {isoAt} from './domain.js';
export function availableStart(slots,start,count,people,day,now=Date.now()) {
  if(!Number.isInteger(start)||!Number.isInteger(count)||count<1||count>6||!Number.isInteger(people)||people<1||new Date(isoAt(day,start)).getTime()<=now)return false;
  return Array.from({length:count},(_,i)=>start+i*30).every(min=>slots.some(s=>s.start_minute===min&&!s.blocked&&s.remaining_seats>=people));
}
export function studentCardFormat(buffer) {
  if(!buffer.byteLength||buffer.byteLength>10*1024*1024)throw Error('파일 크기는 0바이트 초과, 10MB 이하여야 합니다.');
  const bytes=new Uint8Array(buffer),starts=s=>s.every((v,i)=>bytes[i]===v);
  if(starts([255,216,255]))return {extension:'jpg',contentType:'image/jpeg'};
  if(starts([137,80,78,71,13,10,26,10]))return {extension:'png',contentType:'image/png'};
  if(starts([37,80,68,70,45]))return {extension:'pdf',contentType:'application/pdf'};
  throw Error('JPG, PNG 또는 PDF 파일만 제출할 수 있습니다.');
}
export function requestIdentity(previous,payload,uuid=()=>crypto.randomUUID()) {
  const signature=JSON.stringify(payload);
  return previous?.signature===signature?previous:{signature,id:uuid()};
}
