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
  stopEverything();
  announcePlayback(src);
  if(audio&&audio.src===src){
    if(audio.paused){audio.play().catch(()=>{});btn.textContent='❚❚'}
    else{audio.pause();btn.textContent='▶'}
    return;
  }
  if(audio)audio.pause();
  audio=new Audio(src);
  audio.setAttribute('playsinline','');
  currentButton=btn;
  document.querySelectorAll('.play').forEach(b=>b.textContent='▶');
  btn.textContent='❚❚';
  if(trackEl)trackEl.textContent=btn.dataset.track||'تشغيل الآن';
  audio.addEventListener('play',()=>announcePlayback(src));
  audio.addEventListener('ended',()=>{btn.textContent='▶';if(line)line.style.width='0%';if(time)time.textContent='00:00'});
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
