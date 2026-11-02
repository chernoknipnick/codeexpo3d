(() => {
  'use strict';
  const $=id=>document.getElementById(id), exhibits=window.EXHIBITS, panel=$('panel');
  let state={name:'Исследователь',done:[]};
  try{const saved=JSON.parse(localStorage.getItem('codeexpo-v1')||'null');if(saved)state={name:String(saved.name||state.name).slice(0,20),done:exhibits.filter(e=>saved.done?.includes(e.id)).map(e=>e.id)};}catch(e){}
  const save=()=>{try{localStorage.setItem('codeexpo-v1',JSON.stringify(state));}catch(e){}};
  $('nickname').value=state.name==='Исследователь'?'':state.name;
  let started=false,keys={},near=null,player=null,scene=null,renderer=null,camera=null,yaw=.55,distance=23;
  const obstacles=[],clickables=[],clock={last:performance.now()},touch={up:false,down:false,left:false,right:false};
  let toastTimer;
  function toast(message){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',3500);}
  function updateProgress(){
    $('points').textContent=state.done.length*100;$('progress').textContent=`${state.done.length} / 6 стендов`;
    $('stamps').replaceChildren();exhibits.forEach(e=>{const s=document.createElement('span');s.textContent=e.id==='python'?'PY':e.id.toUpperCase();s.title=e.name+(state.done.includes(e.id)?' — пройден':' — ещё впереди');s.className=state.done.includes(e.id)?'done':'';$('stamps').appendChild(s);});
    $('mission-text').textContent=state.done.length===6?'Все шесть заданий пройдены! Выбери направление, которое хочется изучать дальше.':state.done.length?`${state.name}, отлично! Осталось исследовать ${6-state.done.length} стендов.`:'Найди любой стенд и реши первое задание.';
  }
  function show(html){keys={};near=null;$('nearby').hidden=true;$('panel-content').innerHTML=html;if(!panel.open)panel.showModal();}
  function close(){panel.close();keys={};}
  $('close-panel').onclick=close;
  panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  panel.addEventListener('close',()=>{keys={};});
  function openExhibit(e){
    const complete=state.done.includes(e.id);
    show(`<div class="exhibit-tag" style="--accent:${e.color}">${e.tag}</div><h2>${e.name}</h2><p>${e.description}</p>${complete?'<p class="completion">✓ Стенд пройден · +100 XP уже получены. Можно повторить задание.</p>':''}<h3>${e.question}</h3><pre id="example-code"></pre><div class="answers">${e.options.map((o,i)=>`<button data-answer="${i}">${i+1}. ${o}</button>`).join('')}</div><div class="feedback" id="feedback" role="status" aria-live="polite"></div><div class="exhibit-links">${e.link?`<a href="${e.link}" target="_blank" rel="noopener">${e.linkLabel} ↗</a>`:e.takeaway}<br><button id="next-stand" style="margin-top:16px">Следующий стенд →</button></div>`);
    $('example-code').textContent=e.code;
    $('panel-content').querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{
      const correct=Number(button.dataset.answer)===e.answer;
      button.classList.add(correct?'right':'wrong');
      $('feedback').textContent=correct?'Верно! '+e.explain:'Пока не так. Посмотри на условие и попробуй ещё раз.';
      if(correct){
        $('panel-content').querySelectorAll('[data-answer]').forEach(b=>b.disabled=true);
        if(!state.done.includes(e.id)){state.done.push(e.id);save();updateProgress();toast(state.done.length===6?'Все стенды пройдены · 600 XP!':e.name+' · +100 XP');if(e.mesh)e.mesh.userData.badge.material.color.set('#a2f3c7');}
      }
    });
    $('next-stand').onclick=()=>{const next=exhibits.find(x=>!state.done.includes(x.id)&&x.id!==e.id)||exhibits[(exhibits.indexOf(e)+1)%exhibits.length];goTo(next);};
  }
  async function goTo(e){
    close();if(!player){openExhibit(e);return;}
    $('fade').classList.add('on');await new Promise(r=>setTimeout(r,180));player.position.set(e.x,0,e.z+3.2);player.rotation.y=Math.PI;keys={};$('fade').classList.remove('on');toast('Ты у стенда '+e.name+'. Нажми E.');
  }
  function map(){show(`<div class="eyebrow">НАВИГАТОР ВЫСТАВКИ</div><h2>Куда отправимся?</h2><p>Выбери направление. Можно свободно ходить по павильону или быстро переместиться к стенду.</p><div class="map-list">${exhibits.map(e=>`<button data-destination="${e.id}" class="${state.done.includes(e.id)?'completed':''}" style="--accent:${e.color}"><small>${e.tag}</small><strong>${e.name} ${state.done.includes(e.id)?'✓':''}</strong><small>${state.done.includes(e.id)?'Пройден · повторить':'Задание · +100 XP'}</small></button>`).join('')}</div>`);$('panel-content').querySelectorAll('[data-destination]').forEach(b=>b.onclick=()=>goTo(exhibits.find(e=>e.id===b.dataset.destination)));}
  function help(){show('<div class="eyebrow">ОСВОЙСЯ В ПАВИЛЬОНЕ</div><h2>Играть просто</h2><div class="help-grid"><div><b>W A S D / стрелки</b>Передвигай персонажа</div><div><b>E / кнопка снизу</b>Открой ближайший стенд</div><div><b>Перетаскивание мышью</b>Поверни камеру</div><div><b>Колёсико</b>Приблизь или отдались</div><div><b>M · Стенды</b>Быстро переместись к заданию</div><div><b>Esc</b>Закрой открытое окно</div></div><p>На телефоне пользуйся стрелками снизу слева. Можно нажать прямо на 3D-стенд, чтобы открыть его задание.</p><p>Задания — учебные примеры с проверкой ответа. Здесь не выполняется произвольный код. Прогресс сохраняется только в этом браузере.</p>');}
  $('map-button').onclick=map;$('route-button').onclick=map;$('help-button').onclick=help;
  $('interact').onclick=()=>near&&openExhibit(near);
  $('start').onclick=()=>{state.name=$('nickname').value.trim().slice(0,20)||'Исследователь';save();started=true;$('welcome').hidden=true;$('mission').hidden=false;$('bottom-help').hidden=false;$('mobile-controls').hidden=!matchMedia('(pointer:coarse)').matches;updateProgress();toast('Добро пожаловать, '+state.name+'!');};
  $('nickname').addEventListener('keydown',e=>{if(e.key==='Enter')$('start').click();});
  document.addEventListener('keydown',e=>{
    if(!started||['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
    if(panel.open)return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
    if(e.repeat)return;
    if(e.code==='KeyE'){if(near)openExhibit(near);return;}
    if(e.code==='KeyM'){map();return;}if(e.code==='KeyH'){help();return;}
    keys[e.code]=true;
  });
  document.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{keys={};Object.keys(touch).forEach(k=>touch[k]=false);});
  document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();touch[b.dataset.move]=true;b.setPointerCapture(e.pointerId);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>touch[b.dataset.move]=false);});
  updateProgress();

  function buildScene(){
    const T=THREE,canvas=$('world');renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    scene=new T.Scene();scene.background=new T.Color('#162736');scene.fog=new T.Fog('#162736',48,100);camera=new T.PerspectiveCamera(44,innerWidth/innerHeight,.1,150);
    scene.add(new T.HemisphereLight('#d5f0ff','#3c5060',1.8));const sun=new T.DirectionalLight('#fff0da',2.3);sun.position.set(-8,24,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-23;sun.shadow.camera.right=23;sun.shadow.camera.top=23;sun.shadow.camera.bottom=-23;sun.shadow.bias=-.0007;scene.add(sun);
    const mat=(color,metalness=0)=>new T.MeshStandardMaterial({color,roughness:.65,metalness});
    function box(w,h,d,color,x,y,z,parent=scene){const m=new T.Mesh(new T.BoxGeometry(w,h,d),typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
    function label(text,color,w=4,h=1){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#112631';ctx.fillRect(0,0,1024,256);ctx.fillStyle=color;ctx.font='bold 110px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,130);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));}
    box(37,.6,39,'#283e4e',0,-.35,0);box(34,.08,36,'#bed1ce',0,0,0);
    const grid=new T.GridHelper(34,34,'#a8c3c1','#adc5c2');grid.position.y=.05;scene.add(grid);
    // Open roof and low perimeter walls keep the stands visible.
    box(36,1.2,.35,'#263d4f',0,.6,-18.5);box(.35,1.2,37,'#263d4f',-17.5,.6,0);box(.35,1.2,37,'#263d4f',17.5,.6,0);
    for(const x of [-16,16])for(const z of [-16,0,16]){box(.6,7,.6,'#263e4d',x,3.5,z);box(.75,.15,.75,'#a2f3c7',x,5.5,z);}
    for(const x of [-16,16])box(.3,.3,33,'#3a5364',x,7,0);box(32,.3,.3,'#3a5364',0,7,-16);
    box(8,.09,3,'#2b4d53',0,.08,15);const entry=label('ENTER THE WORLD OF CODE','#a2f3c7',7.2,1.8);entry.rotation.x=-Math.PI/2;entry.position.set(0,.14,15);scene.add(entry);
    // Central sculpture is an orientation point, not an obstacle-filled room.
    const base=new T.Mesh(new T.CylinderGeometry(2.1,2.5,.4,48),mat('#1c3443'));base.position.y=.2;base.receiveShadow=true;scene.add(base);obstacles.push({x:0,z:0,w:4.7,d:4.7});
    const core=new T.Group();core.position.y=2.6;scene.add(core);const cube=new T.Mesh(new T.BoxGeometry(1.6,1.6,1.6),new T.MeshStandardMaterial({color:'#a2f3c7',emissive:'#41795c',emissiveIntensity:.45,metalness:.4,roughness:.25}));core.add(cube);const cage=new T.Mesh(new T.BoxGeometry(2.7,2.7,2.7),new T.MeshBasicMaterial({color:'#89b9ca',wireframe:true}));core.add(cage);scene.userData.core=core;
    const title=label('CODE EXPO','#e9fff3',5.3,1.25);title.position.set(0,5,0);scene.add(title);scene.userData.title=title;
    exhibits.forEach((e,i)=>{
      const g=new T.Group();g.position.set(e.x,0,e.z);g.userData.exhibit=e;scene.add(g);e.mesh=g;
      box(5.6,.18,4.3,'#263f4c',0,.12,0,g);box(5.4,.06,.14,e.color,0,.24,2.05,g);
      box(5.2,3.9,.25,'#142c3d',0,2,-1.65,g);box(.12,4,.32,e.color,-2.5,2,-1.5,g);box(.12,4,.32,e.color,2.5,2,-1.5,g);
      const screen=label(e.name,e.color,4.55,1.13);screen.position.set(0,3.05,-1.48);g.add(screen);clickables.push(screen);
      const symbol=label(e.icon,e.color,2.4,1);symbol.position.set(0,1.95,-1.45);g.add(symbol);clickables.push(symbol);
      box(3.7,1.05,1.2,'#d5e2db',0,.75,.5,g);box(3.9,.12,1.4,'#18313e',0,1.34,.5,g);
      const monitor=box(1.1,.7,.1,'#284c5d',0,1.88,.18,g);box(.13,.35,.13,'#264252',0,1.5,.2,g);box(.8,.04,.3,'#3d6672',0,1.42,.65,g);
      const monitorText=label('TRY IT',e.color,.92,.3);monitorText.position.set(0,1.9,.245);g.add(monitorText);clickables.push(monitor,monitorText);
      const badge=new T.Mesh(new T.SphereGeometry(.17,12,12),new T.MeshBasicMaterial({color:state.done.includes(e.id)?'#a2f3c7':'#4e6373'}));badge.position.set(2.1,3.95,-1.45);g.add(badge);g.userData.badge=badge;
      obstacles.push({x:e.x,z:e.z+.5,w:4.5,d:2},{x:e.x,z:e.z-1.65,w:5.5,d:.8});
      // A little sample object gives each booth a distinct silhouette.
      const object=new T.Group();object.position.set(-1.3,1.65,.5);g.add(object);
      if(e.id==='sql'){for(let j=0;j<3;j++){const disk=new T.Mesh(new T.CylinderGeometry(.3,.3,.18,24),mat(e.color));disk.position.y=j*.22;object.add(disk);}}
      else if(e.id==='git'){for(let j=0;j<3;j++){const node=new T.Mesh(new T.SphereGeometry(.13,12,12),mat(e.color));node.position.set(j*.22,j*.22,0);object.add(node);}}
      else{const c=box(.5,.5,.5,e.color,0,.1,0,object);c.rotation.y=Math.PI/4;}
    });
    // A deliberately blocky avatar, familiar to children from building games.
    player=new T.Group();player.position.set(0,0,16);scene.add(player);const shirt=mat('#77b8c6'),skin=mat('#e7bc91'),pants=mat('#263d53');
    box(.72,.85,.43,shirt,0,1.18,0,player);box(.52,.52,.5,skin,0,1.9,0,player);box(.56,.15,.54,'#29343b',0,2.2,0,player);
    const left=new T.Group(),right=new T.Group();left.position.set(-.21,.8,0);right.position.set(.21,.8,0);player.add(left,right);box(.29,.7,.33,pants,0,-.35,0,left);box(.29,.7,.33,pants,0,-.35,0,right);box(.3,.14,.47,'#172433',0,-.68,.07,left);box(.3,.14,.47,'#172433',0,-.68,.07,right);
    box(.24,.75,.3,skin,-.52,1.15,0,player);box(.24,.75,.3,skin,.52,1.15,0,player);player.userData.legs=[left,right];
    const ray=new T.Raycaster(),pointer=new T.Vector2();let drag=null;
    canvas.addEventListener('pointerdown',e=>{if(!started||panel.open)return;drag={x:e.clientX,y:e.clientY,lastX:e.clientX,moved:false};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.moved=true;if(drag.moved)yaw-=(e.clientX-drag.lastX)*.006;drag.lastX=e.clientX;});
    canvas.addEventListener('pointerup',e=>{if(!drag)return;const click=!drag.moved;drag=null;if(!click)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(clickables,false);if(hits.length){let o=hits[0].object;while(o&&!o.userData.exhibit)o=o.parent;if(o)openExhibit(o.userData.exhibit);}});
    canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('wheel',e=>{if(!started||panel.open)return;e.preventDefault();distance=T.MathUtils.clamp(distance+e.deltaY*.015,12,36);},{passive:false});
    window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
    camera.position.set(24,23,33);camera.lookAt(0,0,0);
  }
  function blocked(x,z){return Math.abs(x)>16.7||z>17.7||z< -17.7||obstacles.some(b=>Math.abs(x-b.x)<b.w/2+.36&&Math.abs(z-b.z)<b.d/2+.36);}
  function animate(now){
    requestAnimationFrame(animate);if(!renderer)return;
    const dt=Math.min((now-clock.last)/1000,.05);clock.last=now;
    if(started&&player&&!panel.open){
      const f=(keys.KeyW||keys.ArrowUp||touch.up?1:0)-(keys.KeyS||keys.ArrowDown||touch.down?1:0),r=(keys.KeyD||keys.ArrowRight||touch.right?1:0)-(keys.KeyA||keys.ArrowLeft||touch.left?1:0);
      let dx=-Math.sin(yaw)*f+Math.cos(yaw)*r,dz=-Math.cos(yaw)*f-Math.sin(yaw)*r;const len=Math.hypot(dx,dz);
      if(len){dx/=len;dz/=len;const speed=keys.ShiftLeft?7:4.5;if(!blocked(player.position.x+dx*speed*dt,player.position.z))player.position.x+=dx*speed*dt;if(!blocked(player.position.x,player.position.z+dz*speed*dt))player.position.z+=dz*speed*dt;player.rotation.y=Math.atan2(dx,dz);player.userData.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(now*.012+i*Math.PI)*.5);}else player.userData.legs.forEach(l=>l.rotation.x=0);
      const target=new THREE.Vector3(player.position.x,1.1,player.position.z);const desired=new THREE.Vector3(target.x+Math.sin(yaw)*distance,18+(distance-23)*.32,target.z+Math.cos(yaw)*distance);camera.position.lerp(desired,1-Math.exp(-dt*6));camera.lookAt(target);
      let closest=null,best=4.8;for(const e of exhibits){const d=Math.hypot(player.position.x-e.x,player.position.z-(e.z+1.7));if(d<best){closest=e;best=d;}}
      near=closest;$('nearby').hidden=!near;if(near){$('nearby-title').textContent=near.name;$('nearby-kind').textContent=state.done.includes(near.id)?'ПРОЙДЕН · МОЖНО ПОВТОРИТЬ':'ЗАДАНИЕ · +100 XP';}
    }
    scene.userData.core.rotation.y=now*.0003;scene.userData.core.rotation.z=Math.sin(now*.0004)*.1;scene.userData.title.quaternion.copy(camera.quaternion);renderer.render(scene,camera);
  }
  try{buildScene();requestAnimationFrame(animate);}catch(e){$('scene-error').hidden=false;$('scene-error').textContent='3D недоступен в этом браузере. Можно пройти задания через кнопку «Стенды».';console.warn('3D initialization failed:',e.message);}
})();
