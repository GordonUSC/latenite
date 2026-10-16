/* LATENITE full desk: the arena, live. Desktop only (loaded by the bootstrap in index.html).
   Original procedural arena, no logos, no likenesses. Same geometry as blender/arena.py,
   rebuilt live so the beams move: 24 moving heads on a square truss, haze, a floor crowd,
   phone lights. Driven by 'lx' events from the cue engine. */
(()=>{
  const T=window.THREE; if(!T) return;
  const stage=document.getElementById('stage');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv=document.createElement('canvas'); cv.className='gl'; cv.setAttribute('aria-hidden','true');
  stage.insertBefore(cv, stage.querySelector('.wash'));

  let R; try{ R=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'}); }catch(e){ cv.remove(); return; }
  R.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.35:1.75)); R.outputEncoding=T.sRGBEncoding; R.toneMapping=T.ACESFilmicToneMapping; R.toneMappingExposure=1.05;
  const S=new T.Scene(); const fogC=new T.Color(0x050506); S.fog=new T.FogExp2(fogC,0.022); S.background=fogC.clone();
  const cam=new T.PerspectiveCamera(58,1,0.1,400); cam.position.set(2.5,1.65,21.5);
  const look={yaw:0,pitch:0,ty:0,tp:0}; const base=new T.Vector3(0,7.2,0);

  /* materials */
  const M=(c,r,m,e,ei)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m||0,emissive:e||0,emissiveIntensity:ei||0});
  const dark=M(0x0b0b0d,.85), floorM=M(0x0c0c0e,.22,.4), steel=M(0x2a2a2e,.35,.8), crowdM=M(0x020203,.95);

  /* light that the haze shows: hemisphere for house, riser point light for the DJs */
  const hemi=new T.HemisphereLight(0xffe7c4,0x0b0906,0); S.add(hemi);
  const riserL=new T.PointLight(0xffffff,0,26,1.6); riserL.position.set(0,5,0); S.add(riserL);

  /* floor and bowl (stepped tiers) */
  const fl=new T.Mesh(new T.PlaneGeometry(160,160),floorM); fl.rotation.x=-Math.PI/2; S.add(fl);
  for(let i=0;i<9;i++){ const r=34+i*2.6, y=1.5+i*1.45;
    const w=new T.Mesh(new T.CylinderGeometry(r,r,1.45,96,1,true),dark); w.position.y=y; w.scale.z=.72; S.add(w);
    const t=new T.Mesh(new T.RingGeometry(r,r+2.6,96),dark); t.rotation.x=-Math.PI/2; t.position.y=y+.72; t.scale.y=.72; S.add(t); }
  const exitM=new T.MeshBasicMaterial({color:0xff2a10});
  for(let a=0;a<360;a+=30){ const t=(a+7)*Math.PI/180; const e=new T.Mesh(new T.BoxGeometry(.6,.35,.6),exitM); e.position.set(Math.cos(t)*39,8.5,Math.sin(t)*28.5); S.add(e); }
  /* bowl seats: a scatter of faint phone glows in the upper bowl */
  { const n=700, g=new T.BufferGeometry(), p=new Float32Array(n*3);
    for(let k=0;k<n;k++){ const i=Math.floor(Math.random()*9), r=35+i*2.6+Math.random()*2, a=Math.random()*Math.PI*2; p[k*3]=Math.cos(a)*r; p[k*3+1]=2.4+i*1.45; p[k*3+2]=Math.sin(a)*r*.72; }
    g.setAttribute('position',new T.BufferAttribute(p,3)); S.add(new T.Points(g,new T.PointsMaterial({color:0xcfe0ff,size:.09,transparent:true,opacity:.55,fog:true}))); }

  /* riser, DJ table, rail, an LED edge that takes the cue color */
  const riser=new T.Mesh(new T.BoxGeometry(7,2,7),dark); riser.position.y=1; S.add(riser);
  const table=new T.Mesh(new T.BoxGeometry(3.6,.9,1.2),steel); table.position.y=2.45; S.add(table);
  const ledM=new T.MeshBasicMaterial({color:0xffffff}); const led=new T.Mesh(new T.BoxGeometry(7.04,.12,7.04),ledM); led.position.y=1.94; S.add(led);
  const deckM=new T.MeshBasicMaterial({color:0x9fc7ff}); const deck=new T.Mesh(new T.BoxGeometry(3.2,.04,.8),deckM); deck.position.y=2.92; S.add(deck);
  [[0,3.6,7.4,.06],[0,-3.6,7.4,.06],[3.6,0,.06,7.4],[-3.6,0,.06,7.4]].forEach(([x,z,lx,lz])=>{ const r=new T.Mesh(new T.BoxGeometry(lx,.06,lz),steel); r.position.set(x,2.95,z); S.add(r); });
  /* truss: square ring, 16 m up, with cross bracing */
  [[0,9,18.6,.5],[0,-9,18.6,.5],[9,0,.5,18.6],[-9,0,.5,18.6]].forEach(([x,z,lx,lz])=>{ for(const dy of [0,.9]){ const b=new T.Mesh(new T.BoxGeometry(lx,.12,lz),steel); b.position.set(x,15.6+dy,z); S.add(b);} });

  /* crowd: instanced bodies, heads, raised arms, phone screens */
  const N=1100, body=new T.InstancedMesh(new T.CylinderGeometry(.2,.24,1,8),crowdM,N), head=new T.InstancedMesh(new T.SphereGeometry(.13,8,6),crowdM,N);
  const armsIdx=[], people=[]; const m4=new T.Matrix4(), q=new T.Quaternion(), v=new T.Vector3(), sc=new T.Vector3();
  for(let k=0;k<N;k++){ let x,z; do{ x=(Math.random()*2-1)*26; z=-19+Math.random()*45; }while(!((Math.abs(x)>4.6||Math.abs(z)>4.6)&&(x/27)**2+(z/20.5)**2<1&&Math.hypot(x-2.5,z-21.5)>1.8));
    const h=1.55+Math.random()*.35; people.push({x,z,h,ph:Math.random()*6.28});
    m4.compose(v.set(x,h*.39,z),q.identity(),sc.set(1,h*.78,1)); body.setMatrixAt(k,m4);
    m4.compose(v.set(x,h*.86,z),q.identity(),sc.set(1,1,1)); head.setMatrixAt(k,m4);
    if(Math.random()<.35) armsIdx.push(k); }
  S.add(body); S.add(head);
  const arms=new T.InstancedMesh(new T.CylinderGeometry(.045,.05,.72,6),crowdM,armsIdx.length); S.add(arms);
  const phoneM=new T.MeshBasicMaterial({color:0xe6efff}); const phones=new T.InstancedMesh(new T.PlaneGeometry(.08,.14),phoneM,armsIdx.length); S.add(phones);
  let phonesUp=Math.round(armsIdx.length*.12);
  function placeArms(t,bounce){ armsIdx.forEach((k,j)=>{ const p=people[k], s=(k%2?1:-1), b=bounce*Math.max(0,Math.sin(t*5.2+p.ph))*.07;
      q.setFromAxisAngle(v.set(0,0,1),.32*s+Math.sin(t*2.6+p.ph)*.12*bounce); m4.compose(v.set(p.x+.2*s,p.h*1.0+b,p.z),q,sc.set(1,1,1)); arms.setMatrixAt(j,m4);
      const up=j<phonesUp; m4.compose(v.set(p.x+.33*s,p.h*1.36+b,p.z+.02),q.identity(),sc.set(up?1:0,up?1:0,1)); phones.setMatrixAt(j,m4); });
    arms.instanceMatrix.needsUpdate=true; phones.instanceMatrix.needsUpdate=true; }

  /* moving heads: a fixture, a volumetric beam (additive cone), and a floor hit */
  const L=30; const beamGeo=new T.ConeGeometry(1.5,L,40,1,true); beamGeo.translate(0,-L/2,0);
  const beamVS=`varying float vT; varying vec3 vN; varying vec3 vV; void main(){ vT=clamp(-position.y/${L.toFixed(1)},0.,1.); vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
  const beamFS=`uniform vec3 uC; uniform float uI; varying float vT; varying vec3 vN; varying vec3 vV; void main(){ float edge=pow(abs(dot(vN,vV)),2.2); float fall=pow(1.-vT,1.6)*(.35+.65*smoothstep(0.,.05,vT)); vec3 c=pow(uC,vec3(1.8)); gl_FragColor=vec4(c*uI*edge*fall*.5,1.); }`;
  const spotTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'); const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.35,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128); return new T.CanvasTexture(c); })();
  const heads=[];
  for(let i=0;i<24;i++){ const side=Math.floor(i/6), f=(i%6)/5-.5;
    const pos=[[f*17,15.5,9],[f*17,15.5,-9],[9,15.5,f*17],[-9,15.5,f*17]][side];
    const fix=new T.Mesh(new T.BoxGeometry(.5,.55,.5),new T.MeshBasicMaterial({color:0x111111})); fix.position.set(...pos); S.add(fix);
    const mat=new T.ShaderMaterial({uniforms:{uC:{value:new T.Color(1,1,1)},uI:{value:0}},vertexShader:beamVS,fragmentShader:beamFS,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
    const beam=new T.Mesh(beamGeo,mat); beam.position.set(...pos); S.add(beam);
    const hit=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:spotTex,color:0xffffff,transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:0})); hit.rotation.x=-Math.PI/2; hit.position.y=.02; S.add(hit);
    heads.push({pos:new T.Vector3(...pos),fix,beam,mat,hit,dir:new T.Vector3(0,-1,0),goal:new T.Vector3(0,-1,0),ph:i*.61,side}); }

  /* post: bloom is what makes haze read as light */
  const comp=new T.EffectComposer(R); comp.addPass(new T.RenderPass(S,cam));
  const bloom=new T.UnrealBloomPass(new T.Vector2(512,512),.95,.55,.12); comp.addPass(bloom);

  /* state */
  const LOOKS={house:'house',red:'fan',orange:'down',purple:'cross',magenta:'fan',yellowgreen:'fan',green:'cross',white:'down',blue:'cross',amber:'fan',violet:'down',black:'black'};
  const HEX={house:'#d9cbb4',red:'#ff2a3a',orange:'#ff5a1a',purple:'#6a3cff',magenta:'#ff2fae',yellowgreen:'#c8f02a',green:'#16c25a',white:'#f4efe6',blue:'#2f6bff',amber:'#ffb000',violet:'#b48cff',black:'#000000'};
  const st={look:'house',col:new T.Color('#d9cbb4'),cur:new T.Color('#d9cbb4'),int:0,goalInt:0,house:1,goalHouse:1,flash:null,master:1,speed:.45,energy:0,hold:false};
  function aimFor(h,look,k){ const p=h.pos; let t;
    if(look==='fan') t=new T.Vector3(p.x*2.4,0,p.z*2.4+ (p.z>0?6:-2));
    else if(look==='cross') t=new T.Vector3(-p.x*1.8+Math.sin(k*1.7)*3,0,-p.z*1.8+Math.cos(k*2.3)*3);
    else if(look==='sky') t=new T.Vector3(p.x*.2,40,p.z*.2);
    else t=new T.Vector3(p.x*.4+Math.sin(k*3.1)*2,0,p.z*.4+Math.cos(k*1.3)*2);
    return t.sub(p).normalize(); }
  function setLook(look){ st.look=look; heads.forEach((h,k)=>h.goal.copy(aimFor(h, look==='house'||look==='black'?'down':look, k))); }
  function setRig(name,hex){ name=name||'house'; const look=LOOKS[name]||'fan'; setLook(look);
    st.col.set(hex||HEX[name]||'#ffffff'); st.goalInt= (look==='house'||look==='black')?0:1; st.goalHouse= look==='house'?1:0; }
  setRig('house');

  document.addEventListener('lx',e=>{ const d=e.detail||{};
    if(d.type==='cue'||d.type==='recall') setRig(d.rig|| (d.type==='recall'?'red':'house'), d.rig? HEX[d.rig] : d.col);
    if(d.type==='house') setRig('house');
    if(d.type==='hold'){ st.hold=true; setLook('sky'); st.goalInt=.0; }
    if(d.type==='release'){ st.hold=false; setLook(LOOKS[d.rig]&&LOOKS[d.rig]!=='house'&&LOOKS[d.rig]!=='black'?LOOKS[d.rig]:'fan'); st.goalInt=1; st.int=2.6; st.energy=Math.min(1.6,.6+(d.held||0)*.25); if(st.goalHouse) st.goalHouse=0; }
    if(d.type==='towels'){ setRig('green'); st.energy=Math.max(st.energy,.8); }
    if(d.type==='phone'){ phonesUp=Math.min(armsIdx.length,phonesUp+Math.ceil(armsIdx.length*.06)); }
    if(d.type==='flash'){ st.flash= d.on? new T.Color(d.col):null; if(d.on){ st.energy=Math.max(st.energy,.35);} }
    if(d.type==='master') st.master=d.v;
    if(d.type==='speed') st.speed=d.v;
  });

  /* drag to look around from where Gordon stood; a click is still a phone light */
  let drag=null; stage.addEventListener('pointerdown',e=>{ if(e.target.closest('a,button,input,select')) return; drag={x:e.clientX,y:e.clientY,yaw:look.ty,pitch:look.tp,moved:false}; });
  addEventListener('pointermove',e=>{ if(!drag) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>5) drag.moved=true;
    look.ty=Math.max(-1.05,Math.min(1.05,drag.yaw-dx*.0035)); look.tp=Math.max(-.25,Math.min(.55,drag.pitch+dy*.0028)); });
  addEventListener('pointerup',()=>{ if(drag&&drag.moved){ stage.dataset.dragged='1'; setTimeout(()=>delete stage.dataset.dragged,0); } drag=null; });
  stage.addEventListener('click',e=>{ if(stage.dataset.dragged){ e.stopImmediatePropagation(); } },true);

  function size(){ const r=stage.getBoundingClientRect(); const w=Math.max(2,r.width|0), h=Math.max(2,r.height|0); R.setSize(w,h,false); comp.setSize(w,h); cam.aspect=w/h; cam.fov=w<h?82:58; cam.updateProjectionMatrix(); }
  new ResizeObserver(size).observe(stage); size();

  let last=performance.now(), visible=true; new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(stage);
  const tmp=new T.Vector3(), up=new T.Vector3(0,-1,0), hitP=new T.Vector3();
  function frame(now){ requestAnimationFrame(frame); if(!visible||document.hidden) { last=now; return; }
    const dt=Math.min(.05,(now-last)/1000); last=now; const t=now/1000;
    /* ease state */
    st.int+=(st.goalInt-st.int)*Math.min(1,dt*(st.hold?14:3.2)); st.house+=(st.goalHouse-st.house)*Math.min(1,dt*1.6); st.energy*=Math.pow(.55,dt);
    const target=st.flash||st.col; st.cur.lerp(target,Math.min(1,dt*(st.flash?18:2.4)));
    const I=st.int*st.master*(st.flash?1.35:1);
    /* haze takes the light */
    tmp.set(st.cur.r,st.cur.g,st.cur.b); const hz=.045*I+.002;
    S.fog.color.setRGB(.012+st.cur.r*hz+st.house*.085, .012+st.cur.g*hz+st.house*.075, .014+st.cur.b*hz+st.house*.06); S.background.copy(S.fog.color);
    S.fog.density=.02+.006*Math.sin(t*.13); hemi.intensity=st.house*.9; R.toneMappingExposure=1.0+st.house*.25;
    ledM.color.copy(st.cur).multiplyScalar(.35+I*.9); riserL.color.copy(st.cur); riserL.intensity=(.6+I*2.2)*(1-st.house*.7);
    deckM.color.setRGB(.5+.3*Math.sin(t*3),.7,1).multiplyScalar(.6+.2*I);
    bloom.strength=.85+st.energy*.9; bloom.radius=.55;
    /* heads */
    const sp=(.15+st.speed*1.4)*(1+st.energy*1.8);
    heads.forEach((h,k)=>{ h.dir.lerp(h.goal,Math.min(1,dt*(st.hold?6:2.2))).normalize();
      const sw=st.look==='sky'? .04 : .2+st.energy*.25; tmp.copy(h.dir); tmp.x+=Math.sin(t*sp+h.ph)*sw; tmp.z+=Math.cos(t*sp*.83+h.ph*1.3)*sw*.8; tmp.normalize();
      h.beam.quaternion.setFromUnitVectors(up,tmp); h.mat.uniforms.uC.value.copy(st.cur); h.mat.uniforms.uI.value=I*(k%2&&st.energy>.6? .75+.25*Math.sin(t*9+k):1);
      h.fix.material.color.copy(st.cur).multiplyScalar(.2+I*.8);
      if(tmp.y<-.05){ const s=-h.pos.y/tmp.y; hitP.copy(h.pos).addScaledVector(tmp,s); const d=Math.min(s,L); const rad=1.5*d/L*2.2+.6; h.hit.position.set(hitP.x,.03,hitP.z); h.hit.scale.set(rad,rad,1); h.hit.material.color.copy(st.cur).multiplyScalar(.9); h.hit.material.opacity= s<L*1.15? Math.min(1,I*.55) : 0; } else h.hit.material.opacity=0; });
    /* crowd moves with the energy */
    placeArms(t,.35+Math.min(1,I)*.65+st.energy);
    /* camera: where Gordon stood, with a breath and the viewer's look */
    look.yaw+=(look.ty-look.yaw)*Math.min(1,dt*6); look.pitch+=(look.tp-look.pitch)*Math.min(1,dt*6);
    const br=reduce?0:Math.sin(t*.4)*.06;
    cam.position.set(2.5+br,1.65+Math.sin(t*.7)*.02,21.5);
    const dir=base.clone().sub(cam.position); const yawQ=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),look.yaw+br*.15); dir.applyQuaternion(yawQ); dir.y+=look.pitch*dir.length();
    cam.lookAt(cam.position.clone().add(dir));
    comp.render(); }
  requestAnimationFrame(frame);
  stage.classList.add('live3d');
  window.__desk={st,heads};
})();
