let audio=null,currentButton=null;const trackEl=document.getElementById('track'),line=document.getElementById('line'),pause=document.getElementById('pause'),time=document.getElementById('time');

// مشغل صوت موحّد على مستوى الموقع + جميع التبويبات/النوافذ في نفس الأصل.
const AUDIO_CHANNEL_NAME='rawai-islamia-global-audio-v2';
const AUDIO_TAB_ID=(()=>{try{return crypto.randomUUID()}catch(e){return String(Date.now())+'-'+Math.random()}})();
const AUDIO_CHANNEL=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(AUDIO_CHANNEL_NAME):null;
const AUDIO_STORAGE_KEY='rawai-islamia-active-audio-v2';

function stopNativeMedia(except=null){
  document.querySelectorAll('audio,video').forEach(m=>{
    if(m!==except&&!m.paused){
      m.pause();
    }
  });
}
function stopCustomAudio(){
  if(audio){
    try{audio.pause()}catch(e){}
    audio.currentTime=audio.currentTime||0;
  }
  if(currentButton)currentButton.textContent='▶';
}
function stopEverything(except=null){
  stopNativeMedia(except);
  if(audio&&audio!==except){
    try{audio.pause()}catch(e){}
    if(currentButton)currentButton.textContent='▶';
  }
}
function announcePlayback(key){
  const message={type:'play',sender:AUDIO_TAB_ID,key,time:Date.now()};
  try{AUDIO_CHANNEL?.postMessage(message)}catch(e){}
  try{localStorage.setItem(AUDIO_STORAGE_KEY,JSON.stringify(message))}catch(e){}
}
function handleRemotePlayback(message){
  if(!message||message.sender===AUDIO_TAB_ID||message.type!=='play')return;
  stopEverything();
}
AUDIO_CHANNEL?.addEventListener('message',e=>handleRemotePlayback(e.data));
window.addEventListener('storage',e=>{
  if(e.key!==AUDIO_STORAGE_KEY||!e.newValue)return;
  try{handleRemotePlayback(JSON.parse(e.newValue))}catch(err){}
});

function playButton(btn){
  const src=btn.dataset.audio;if(!src)return;
  // إذا كان نفس المقطع يعمل، فالضغط على الزر يوقفه/يشغله بدل أن يعيد تشغيله.
  if(audio&&audio.src===src){
    if(audio.paused){
      audio.play().catch(()=>{});
      btn.textContent='❚❚';
      announcePlayback(src);
    }else{
      audio.pause();
      btn.textContent='▶';
    }
    return;
  }
  stopEverything();
  announcePlayback(src);
  if(audio)audio.pause();
  audio=new Audio(src);
  audio.setAttribute('playsinline','');
  currentButton=btn;
  document.querySelectorAll('.play').forEach(b=>b.textContent='▶');
  btn.textContent='❚❚';
  if(trackEl)trackEl.textContent=btn.dataset.track||'تشغيل الآن';
  audio.addEventListener('play',()=>announcePlayback(src));
  audio.addEventListener('ended',()=>{
  btn.textContent='▶';
  if(line)line.style.width='0%';
  if(time)time.textContent='00:00';
  if(localStorage.getItem('rawai-repeat')==='true'){
    setTimeout(()=>{audio.currentTime=0;playButton(btn)},120);
    return;
  }
  if(localStorage.getItem('rawai-auto-play')==='true'){
    const buttons=[...document.querySelectorAll('.play[data-audio]')];
    const index=buttons.indexOf(btn);
    let next=index>=0?buttons[index+1]:null;
    if(localStorage.getItem('rawai-shuffle')==='true'&&buttons.length>1){
      const choices=buttons.filter(b=>b!==btn); next=choices[Math.floor(Math.random()*choices.length)];
    }
    if(next&&next.dataset.audio) setTimeout(()=>playButton(next),250);
  }
});
  audio.addEventListener('pause',()=>{if(btn)btn.textContent='▶'});
  audio.addEventListener('timeupdate',()=>{const pct=audio.duration?(audio.currentTime/audio.duration)*100:0;if(line)line.style.width=pct+'%';if(time)time.textContent=fmt(audio.currentTime)});
  audio.play().catch(()=>{btn.textContent='▶'});
}

// أي عنصر <audio>/<video> يبدأ التشغيل يوقف جميع العناصر الأخرى في الصفحة فورًا.
document.addEventListener('play',e=>{
  const media=e.target;
  if(!(media instanceof HTMLMediaElement))return;
  stopEverything(media);
  const key=media.currentSrc||media.src||'native-media';
  announcePlayback(key);
},true);

function fmt(s){s=Math.floor(s||0);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-audio]');if(b)playButton(b);});pause?.addEventListener('click',()=>{if(!audio)return;if(audio.paused){audio.play();pause.textContent='❚❚';currentButton&&(currentButton.textContent='❚❚')}else{audio.pause();pause.textContent='▶';currentButton&&(currentButton.textContent='▶')}});document.getElementById('theme')?.addEventListener('click',()=>document.body.classList.toggle('light'));document.querySelector('.icon-btn:not(#theme)')?.addEventListener('click',()=>document.querySelector('nav')?.classList.toggle('open'));

// البحث الخارجي الوحيد: يبحث في فهرس الأقسام فقط، ولا يغيّر البحث المحلي داخل أي قسم.
const GLOBAL_SEARCH_INDEX=[
 {section:'القرآن الكريم',title:'القرآن الكريم',desc:'سور القرآن الكريم والمصحف الكامل وقرآن كريم منوع',url:'section.html?name=القرآن الكريم'},
 {section:'الأدعية والأذكار',title:'الأدعية والأذكار',desc:'أدعية وأذكار مرتبة وواضحة',url:'section.html?name=الأدعية والأذكار'},
 {section:'الخطب والدروس',title:'الخطب والدروس',desc:'خطب ودروس إسلامية',url:'section.html?name=الخطب والدروس'},
 {section:'السنة النبوية',title:'السنة النبوية',desc:'الأحاديث النبوية وشروح صحيح البخاري وصحيح مسلم',url:'sunnah.html'},
 {section:'الفتاوى',title:'الفتاوى',desc:'فتاوى ومسائل إسلامية',url:'fatwa.html'},
 {section:'القصص',title:'القصص الصوتية',desc:'قصص الأنبياء والصحابة والصالحين والطغاة — صوت فقط',url:'stories.html'},
 {section:'السيرة النبوية',title:'السيرة النبوية',desc:'سيرة النبي محمد ﷺ وأحداث حياته وهديه',url:'sunnah.html'},
 {section:'التاريخ الإسلامي',title:'التاريخ الإسلامي',desc:'محطات وشخصيات وأحداث من التاريخ الإسلامي',url:'stories.html?category=history'},
 {section:'قصص للأطفال',title:'قصص للأطفال',desc:'قصص إسلامية مبسطة ومناسبة للأطفال',url:'stories.html?category=children'}
];
(function(){
 const input=document.getElementById('globalSearch'),box=document.getElementById('globalResults'); if(!input||!box)return;
 input.addEventListener('input',()=>{
  const q=input.value.trim().toLowerCase();
  if(!q){box.hidden=true;box.innerHTML='';return}
  const hits=GLOBAL_SEARCH_INDEX.filter(x=>(x.title+' '+x.desc+' '+x.section).toLowerCase().includes(q));
  box.innerHTML=hits.length?hits.map(x=>`<a class="global-result" href="${x.url}"><b>${x.title}</b><small>${x.section} — ${x.desc}</small></a>`).join(''):'<div class="global-result"><b>لا توجد نتائج</b><small>جرّب كلمة أخرى.</small></div>';
  box.hidden=false;
 });
})();


function isAutoPlayEnabled(){
  return localStorage.getItem('rawai-auto-play')==='true';
}
function setAutoPlayEnabled(enabled){
  localStorage.setItem('rawai-auto-play',enabled?'true':'false');
}
function isNotificationsEnabled(){
  try{
    return window.Android&&typeof Android.notificationsEnabled==='function'
      ? Android.notificationsEnabled() : false;
  }catch(e){return false}
}
function setNotificationsEnabled(enabled){
  try{
    if(window.Android&&typeof Android.setNotificationsEnabled==='function'){
      Android.setNotificationsEnabled(!!enabled);
      return true;
    }
  }catch(e){}
  return false;
}


/* ===== مزايا التطبيق الجديدة ===== */
const RAWAI_FAV_KEY='rawai-favorites';
function rawaiFavorites(){try{return JSON.parse(localStorage.getItem(RAWAI_FAV_KEY)||'[]')}catch(e){return[]}}
function saveRawaiFavorites(a){localStorage.setItem(RAWAI_FAV_KEY,JSON.stringify(a))}
function rawaiFavKey(x){return String(x.url||x.id||'').trim()}
function toggleFavorite(btn){const item={url:btn.dataset.audio,title:btn.dataset.title||btn.dataset.track||'مقطع صوتي',section:document.title||'روائع إسلامية',page:location.href};let a=rawaiFavorites(),k=rawaiFavKey(item);const i=a.findIndex(x=>rawaiFavKey(x)===k);if(i>=0){a.splice(i,1);btn.classList.remove('is-favorite');btn.textContent='♡'}else{a.unshift(item);btn.classList.add('is-favorite');btn.textContent='♥';localStorage.setItem('rawai-ach-fav-count',String(a.length))}saveRawaiFavorites(a);}
function injectAudioActions(){document.querySelectorAll('[data-audio]').forEach(el=>{if(el.dataset.rawaiEnhanced)return;el.dataset.rawaiEnhanced='1';if(el.tagName==='BUTTON'||el.classList.contains('play')){const wrap=el.parentElement;if(wrap&&!wrap.querySelector('.rawai-fav')){const b=document.createElement('button');b.className='rawai-fav';b.type='button';b.dataset.audio=el.dataset.audio;b.dataset.title=el.dataset.track||el.getAttribute('aria-label')||'مقطع صوتي';const fav=rawaiFavorites().some(x=>rawaiFavKey(x)===rawaiFavKey({url:el.dataset.audio}));b.textContent=fav?'♥':'♡';if(fav)b.classList.add('is-favorite');b.onclick=e=>{e.stopPropagation();toggleFavorite(b)};wrap.appendChild(b)}}});}
function updateGlobalPlayer(){let p=document.getElementById('rawaiGlobalPlayer');if(!p){p=document.createElement('div');p.id='rawaiGlobalPlayer';p.innerHTML='<div class="rawai-now"><span>🎧</span><div><small>يُشغّل الآن</small><b id="rawaiNowTitle">روائع إسلامية</b></div></div><div class="rawai-player-controls"><button id="rawaiPrev" title="السابق">↶</button><button id="rawaiPlay">▶</button><button id="rawaiNext" title="التالي">↷</button><button id="rawaiShuffle" title="عشوائي">🔀</button><button id="rawaiRepeat" title="تكرار">🔁</button></div>';document.body.appendChild(p);}
 const play=p.querySelector('#rawaiPlay'); if(play)play.onclick=()=>{if(!audio)return;if(audio.paused){audio.play().catch(()=>{});play.textContent='❚❚'}else{audio.pause();play.textContent='▶'}};
 p.querySelector('#rawaiShuffle')?.classList.toggle('active',localStorage.getItem('rawai-shuffle')==='true');p.querySelector('#rawaiRepeat')?.classList.toggle('active',localStorage.getItem('rawai-repeat')==='true');
 p.querySelector('#rawaiShuffle')?.addEventListener('click',()=>{const v=localStorage.getItem('rawai-shuffle')==='true';localStorage.setItem('rawai-shuffle',v?'false':'true');updateGlobalPlayer()});p.querySelector('#rawaiRepeat')?.addEventListener('click',()=>{const v=localStorage.getItem('rawai-repeat')==='true';localStorage.setItem('rawai-repeat',v?'false':'true');updateGlobalPlayer()});
 p.querySelector('#rawaiPrev')?.addEventListener('click',()=>rawaiMove(-1));p.querySelector('#rawaiNext')?.addEventListener('click',()=>rawaiMove(1));
}
function rawaiMove(dir){const buttons=[...document.querySelectorAll('.play[data-audio]')];if(!buttons.length)return;const i=currentButton?buttons.indexOf(currentButton):-1;let n=i+dir;if(localStorage.getItem('rawai-shuffle')==='true')n=Math.floor(Math.random()*buttons.length);if(n<0)n=buttons.length-1;if(n>=buttons.length)n=0;playButton(buttons[n])}
function updateRawaiPlayerTitle(title){const x=document.getElementById('rawaiNowTitle');if(x)x.textContent=title||'روائع إسلامية';const p=document.getElementById('rawaiGlobalPlayer');if(p)p.classList.add('visible')}
const _rawaiOriginalPlayButton=playButton;
playButton=function(btn){_rawaiOriginalPlayButton(btn);updateRawaiPlayerTitle(btn?.dataset?.track||btn?.dataset?.title||'تشغيل الآن');localStorage.setItem('rawai-last-audio',JSON.stringify({url:btn?.dataset?.audio||'',title:btn?.dataset?.track||'مقطع صوتي',time:0}));localStorage.setItem('rawai-ach-played',String(Number(localStorage.getItem('rawai-ach-played')||0)+1));};
function trackRawaiTime(){if(audio){try{const x=JSON.parse(localStorage.getItem('rawai-last-audio')||'{}');x.time=audio.currentTime;localStorage.setItem('rawai-last-audio',JSON.stringify(x))}catch(err){}}}
setInterval(trackRawaiTime,1000);
document.addEventListener('DOMContentLoaded',()=>{if(localStorage.getItem('rawai-dark')==='true')document.body.classList.add('dark');const theme=document.getElementById('theme');if(theme)theme.onclick=()=>{const on=!document.body.classList.contains('dark');document.body.classList.toggle('dark',on);localStorage.setItem('rawai-dark',on?'true':'false')};updateGlobalPlayer();injectAudioActions();const nav=document.querySelector('nav');if(nav&&!nav.querySelector('a[href="more.html"]')){const a=document.createElement('a');a.href='more.html';a.textContent='المزيد';nav.appendChild(a)}});


// قسم الأدوات: فتح وإغلاق جميع الأدوات من زر واحد.
document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.getElementById('toolsToggle');
  const panel=document.getElementById('homeTools');
  if(!toggle||!panel)return;
  toggle.addEventListener('click',()=>{
    const open=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded',open?'false':'true');
    panel.hidden=open;
  });
});
