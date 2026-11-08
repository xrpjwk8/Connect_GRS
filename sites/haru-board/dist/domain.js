export const statusNames={pending:'승인 대기',confirmed:'예약 확정',rejected:'거절',cancelled:'취소',completed:'이용 완료'};
export function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());}
export function addDays(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function monthRange(month){const first=month+'-01';const d=new Date(first+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);return {first,next:d.toISOString().slice(0,10)};}
export function moveMonth(month,n){const d=new Date(month+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7);}
export function monthCells(month){const {first}=monthRange(month);const start=addDays(first,-new Date(first+'T12:00:00Z').getUTCDay());return Array.from({length:42},(_,i)=>addDays(start,i));}
export function minuteLabel(n){return `${n>=1440?'다음 날 ':''}${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
export function isoAt(day,minute){return new Date(new Date(day+'T00:00:00+09:00').getTime()+minute*60000).toISOString();}
export function summary(rows){const confirmed=rows.filter(r=>r.status==='confirmed');return {confirmed:confirmed.length,people:confirmed.reduce((n,r)=>n+r.people,0),pending:rows.filter(r=>r.status==='pending').length};}
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function sampleData(){const day=today(),month=day.slice(0,7),store={id:'demo-store',name:'연남의 밤',capacity:48,opening_minute:1020,closing_minute:1470,allow_shared:true,approved:true};
const make=(id,date,start,name,people,status,manual=false)=>({id,store_id:store.id,service_date:date,start_minute:start,slot_count:3,starts_at:isoAt(date,start),ends_at:isoAt(date,start+90),booker_name:name,booker_affiliation:manual?'':'연세대학교',people,status,is_manual:manual,event_purpose:'모임',request_message:manual?'':'일행이 함께 앉을 수 있으면 좋겠습니다.'});
const rows=[make('d1',day,1050,'박지현',4,'confirmed',true),make('d2',day,1110,'경영학과 학생회',20,'pending'),make('d3',day,1140,'밴드 동아리',12,'pending'),make('d4',day,1200,'디자인 스터디',8,'confirmed')];
for(let i=1;i<=28;i++)if(i%3===0){const date=`${month}-${String(i).padStart(2,'0')}`;if(date!==day)rows.push(make('m'+i,date,1110,i%2?'동아리 모임':'저녁 예약',i%2?12:6,'confirmed'));}
rows.push(make('full-demo',addDays(day,1),1200,'단체 대관',48,'confirmed'));
for(const r of rows){if(!r.is_manual){r.booker_affiliation=r.booker_name;r.booker_name=({d2:'김민준',d3:'이서연',d4:'최유진','full-demo':'정도윤'})[r.id]||'이준호';}}
return {store,rows,events:[{id:'e1',store_id:store.id,service_date:day,start_minute:960,end_minute:990,title:'식자재 입고',memo:'납품 수량 확인'}],blocks:[]};}

export function weekDays(day){const weekday=new Date(day+'T12:00:00Z').getUTCDay();const monday=addDays(day,-((weekday+6)%7));return Array.from({length:7},(_,i)=>addDays(monday,i));}
export function slotCapacity(store,rows,blocks,day,minute,now=Date.now()){
  const start=Date.parse(isoAt(day,minute)),end=start+30*60000;
  const reservations=rows.filter(r=>r.status==='confirmed'&&Date.parse(r.starts_at)<end&&Date.parse(r.ends_at)>start);
  const used=reservations.reduce((sum,r)=>sum+r.people,0);
  const blocked=blocks.some(b=>{const t=Date.parse(b.starts_at||isoAt(b.service_date,b.start_minute));return t<end&&t+30*60000>start;});
  const past=start<=now,exclusive=!store.allow_shared&&used>0;
  const remaining=past||blocked||exclusive?0:Math.max(0,store.capacity-used);
  const reason=past?'지난 시간':blocked?'점주 차단':exclusive?'한 팀 단독 예약':remaining===0?'만석':used?'일부 예약':'예약 없음';
  return {level:remaining===0?'full':used?'partial':'empty',remaining,used,reason,reservations,past,blocked};
}
