import {icon} from './icons.js';
const role=new URLSearchParams(location.search).get('role');
if(role==='owner') await import('./app.js');
else if(role==='booker') await import('./booker.js');
else {
  document.querySelector('#app').innerHTML=`<header class="topbar"><a class="brand" href="./"><span class="brand-mark">c</span>Connect</a><button id="theme-choice" aria-label="화면 테마 전환">${icon('moon')}</button></header><main class="entry"><p class="eyebrow">GOOD PEOPLE, GREAT PLACES</p><h1>모임의 시작부터,<br>하루의 끝까지 연결.</h1><p class="entry-sub">함께할 공간을 찾고 있나요?<br>혹은, 손님을 맞이할 하루를 준비하고 있나요?</p><div class="role-cards"><a class="role-card booker-card" href="?role=booker"><span class="role-icon">${icon('calendar')}</span><span class="eyebrow">FOR YOUR GATHERING</span><h2>예약자로 시작하기 <span>↗</span></h2><p>모임에 맞는 매장을 찾고<br>가능한 시간에 간편하게 예약하세요.</p><strong>매장 둘러보기 →</strong><small>앱과 웹에서 가입 · 학생증 인증 · 예약</small></a><a class="role-card panel" href="?role=owner"><span class="role-icon">${icon('layout')}</span><span class="eyebrow">FOR YOUR BUSINESS</span><h2>점주로 시작하기 <span>↗</span></h2><p>들어온 예약과 매장 일정을<br>한눈에 확인하고 관리하세요.</p><strong>점주 로그인 →</strong><small>신규 가입과 매장 등록은 Connect 앱에서</small></a></div><p class="entry-foot">하나의 Connect 계정으로, 앱과 웹에서 이어서 이용하세요.</p></main>`;
  document.querySelector('#theme-choice').onclick=()=>window.connectTheme.toggle();
}
