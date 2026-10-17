/* FLASH CAP (phone and desk): a new color flash may start at most once every 334 ms, under 3 flashes a second
   (WCAG 2.3.1), however fast someone taps. Releases always pass. Registered before desk.js, so it gates the arena too. */
window.__flashOK=(()=>{ let last=-1e9; return ()=>{ const n=performance.now(); if(n-last<334) return false; last=n; return true; }; })();
document.addEventListener('lx',e=>{ const d=e.detail||{}; if(d.type==='flash'&&d.on){ window.__flashBlocked=!window.__flashOK(); if(window.__flashBlocked) e.stopImmediatePropagation(); } });
/* PERSONAL LINKS (phone and desk): #brennan, #foster, #sv and so on. The room greets them in their color with their name. */
(()=>{
  const hk=decodeURIComponent(location.hash.slice(1)).toLowerCase().replace(/[^a-z]/g,''); if(!hk) return;
  const alias={dave:'vermillion',sablevalley:'sable valley',sv:'sable valley'}; const want=(alias[hk]||hk);
  const b=[...document.querySelectorAll('.band')].find(x=>x.textContent.trim().toLowerCase()===want); if(!b) return;
  setTimeout(()=>{ b.click(); if(want==='sable valley') for(let k=0;k<3;k++) setTimeout(()=>document.dispatchEvent(new CustomEvent('lx',{detail:{type:'phone'}})),400*k); }, 1800);
})();
/* PHONE ROOM: on a phone the page becomes the room. Live arena (same desk.js), a thumb bar with GO and DROP,
   nine color pads you hold to flash, flick the room to change cues, and a friend's name lights the room. */
(()=>{
  const H=document.documentElement, qs=new URLSearchParams(location.search).get('desk');
  if(H.classList.contains('full')||qs==='1') return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LX=d=>document.dispatchEvent(new CustomEvent('lx',{detail:d}));
  const stage=document.getElementById('stage');
  H.classList.add('ph');

  /* thumb bar: pads on top, the four keys under the thumb */
  const bar=document.createElement('div'); bar.className='thumb'; bar.setAttribute('aria-label','Light controls');
  const pads=document.createElement('div'); pads.className='pads'; pads.setAttribute('aria-label','Hold a color to flash it');
  const FL=[['#ff2a3a','red'],['#ff5a1a','orange'],['#ffb000','amber'],['#c8f02a','yellow green'],['#16c25a','green'],['#2f6bff','blue'],['#6a3cff','purple'],['#ff2fae','magenta'],['#f4efe6','white']];
  const glowNow=()=>getComputedStyle(document.querySelector('.cue[aria-current]')||document.body).getPropertyValue('--c')||'';
  const flash=(b,on)=>{ b.classList.toggle('down',on); LX({type:'flash',on,col:b.dataset.c}); if(!H.classList.contains('live')&&(!on||!window.__flashBlocked)) H.style.setProperty('--glow', on? b.dataset.c : glowNow()); };
  FL.forEach(([c,n])=>{ const b=document.createElement('button'); b.type='button'; b.className='pad'; b.style.setProperty('--f',c); b.dataset.c=c; b.setAttribute('aria-label','Flash '+n);
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);flash(b,true); if(!window.__flashBlocked&&window.__sfx) window.__sfx('zap',.4);});
    b.addEventListener('pointerup',()=>flash(b,false)); b.addEventListener('pointercancel',()=>flash(b,false));
    b.addEventListener('contextmenu',e=>e.preventDefault()); pads.append(b); });
  bar.append(pads);
  const btns=document.querySelector('.desk .btns'); if(btns) bar.append(btns);
  document.body.append(bar);

  /* flick the room: a quick sideways swipe is BACK or GO; a slow drag looks around */
  let f=null;
  stage.addEventListener('pointerdown',e=>{ if(e.target.closest('a,button,input,select')) return; f={x:e.clientX,y:e.clientY,t:performance.now()}; });
  addEventListener('pointerup',e=>{ if(!f) return; const dx=e.clientX-f.x, dy=e.clientY-f.y, dt=performance.now()-f.t; f=null;
    if(dt<320 && Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.5){ const k=document.getElementById(dx<0?'go':'back'); if(k) k.click(); swipeHint(dx<0?'GO':'BACK'); } });
  function swipeHint(t){ const s=document.createElement('div'); s.className='flick'; s.textContent=t; stage.append(s); setTimeout(()=>s.remove(),reduce?300:700); }

  /* a friend's name lights the room in their color */
  document.querySelectorAll('.band').forEach(b=>b.addEventListener('click',()=>{
    const col=getComputedStyle(b).getPropertyValue('--b').trim()||'#fff', name=b.textContent.trim();
    stage.scrollIntoView({behavior:reduce?'auto':'smooth'});
    setTimeout(()=>{ const s=document.createElement('div'); s.className='splash'; s.style.setProperty('--s',col); s.textContent=name; stage.append(s);
      LX({type:'flash',on:true,col}); if(!H.classList.contains('live')) H.style.setProperty('--glow',col);
      setTimeout(()=>{ LX({type:'flash',on:false,col}); if(!H.classList.contains('live')) H.style.setProperty('--glow',glowNow()); },650);
      setTimeout(()=>s.remove(),reduce?900:2200); }, reduce?0:420);
  }));

  /* the live arena, same as the desk: WebGL and motion allowed, else the rendered stills stay */
  let gl=false; try{ const c=document.createElement('canvas'); gl=!!(c.getContext('webgl2')||c.getContext('webgl')); }catch(e){}
  if(reduce||!gl) return;
  H.classList.add('live');
  const cueEls=[...document.querySelectorAll('.cue')];
  const s1=document.createElement('script'); s1.src='vendor/three-desk.js'; s1.onload=()=>{ const s2=document.createElement('script'); s2.src='desk.js'; s2.onload=()=>{ const c=document.querySelector('.cue[aria-current]'); const i=cueEls.indexOf(c); if(c) LX({type:'cue',rig:c.dataset.rig||'house',col:c.dataset.c,i}); }; document.body.append(s2); };
  s1.onerror=()=>H.classList.remove('live'); document.body.append(s1);
})();
