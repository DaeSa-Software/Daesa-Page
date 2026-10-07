import * as THREE from './assets/vendor/three.module.js';

const story = document.querySelector('.desk-story');
const host = document.getElementById('desk-scene');
const chapters = [...document.querySelectorAll('[data-chapter]')];
const motionButton = document.getElementById('desk-motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let frozen = reduced.matches;
let progress = reduced.matches ? 1 : 0, target = 0, visible = true, dirty = true, last = 0, chapter = -1;
const clamp = THREE.MathUtils.clamp;
const ease = value => value * value * (3 - 2 * value);

function setChapter(index) {
  if (chapter === index) return;
  chapter = index;
  chapters.forEach((item, i) => { item.classList.toggle('is-current', i === index); item.inert = i !== index; });
  document.querySelectorAll('.desk-progress i').forEach((item, i) => item.classList.toggle('is-current', i <= index));
  document.getElementById('desk-status-text').textContent = ['IDEAS SOBRE LA MESA', 'CADA PIEZA EN SU LUGAR', 'UNA OPERACIÓN CONECTADA'][index];
}
function syncMotion() {
  motionButton.textContent = frozen ? 'Activar movimiento' : 'Pausar movimiento';
  motionButton.setAttribute('aria-pressed', String(frozen));
  dirty = true;
}
motionButton.addEventListener('click', () => { frozen = !frozen; syncMotion(); });
reduced.addEventListener('change', event => { frozen = event.matches; if (frozen) progress = 1; syncMotion(); });
syncMotion();
function scrollProgress() {
  const rect = story.getBoundingClientRect();
  target = clamp(-rect.top / Math.max(1, story.offsetHeight - innerHeight), 0, 1);
  dirty = true;
  if (frozen) setChapter(target < .32 ? 0 : target < .72 ? 1 : 2);
}
addEventListener('scroll', scrollProgress, { passive: true });
new IntersectionObserver(entries => { visible = entries[0].isIntersecting; dirty = true; }).observe(story);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
} catch {
  story.classList.add('desk-unavailable');
}
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  host.appendChild(renderer.domElement);
  story.classList.add('desk-ready');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 80);
  scene.add(new THREE.HemisphereLight(0xf3f7ff, 0x6c8790, 2.4));
  const sun = new THREE.DirectionalLight(0xffffff, 4);
  sun.position.set(-3, 12, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera, { left:-10, right:10, top:10, bottom:-10, near:.5, far:40 });
  sun.shadow.bias = -.001; sun.shadow.normalBias=.03; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xa7bcff, 1.7); fill.position.set(8,6,-4);scene.add(fill);
  const desk = new THREE.Group(); scene.add(desk);
  const objects = [];
  const mats = {};
  function mat(color, roughness=.4, metalness=.18) {
    const key=`${color}-${roughness}-${metalness}`;
    return mats[key] ||= new THREE.MeshStandardMaterial({color,roughness,metalness});
  }
  function box(parent,w,h,d,color,x=0,y=0,z=0) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent,radius,height,color,x,y,z) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,48),mat(color));
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  // A crisp, contemporary workspace: tabletop, legs, mat, monitor, keyboard and lamp.
  box(desk,11,.32,7,0xbac7de,0,-.2,0);
  const tabletop=box(desk,10.96,.035,6.96,0xe7edf7,0,-.025,0);
  tabletop.material=new THREE.MeshPhysicalMaterial({color:0xe7edf7,metalness:.25,roughness:.2,clearcoat:1,clearcoatRoughness:.15});
  [[-4.6,-2.6],[4.6,-2.6],[-4.6,2.6],[4.6,2.6]].forEach(([x,z])=>box(desk,.18,2.9,.18,0x536582,x,-1.8,z));
  box(desk,4.4,.035,2.55,0x34476c,.65,.015,-.7);
  const monitor=new THREE.Group();desk.add(monitor);monitor.position.set(.7,0,-2);
  box(monitor,1.35,.09,.8,0x18243d,0,.12,0);
  box(monitor,.18,1.1,.18,0x51617d,0,.6,0);
  box(monitor,3.25,2.05,.16,0x18243d,0,1.83,0);
  const dashboardCanvas=document.createElement('canvas'); dashboardCanvas.width=768;dashboardCanvas.height=480;
  const ctx=dashboardCanvas.getContext('2d');
  ctx.fillStyle='#edf3ff';ctx.fillRect(0,0,768,480);
  ctx.fillStyle='#142647';ctx.font='bold 26px sans-serif';ctx.fillText('DAESA / TODO CONECTADO',42,58);
  ctx.fillStyle='#607396';ctx.font='16px sans-serif';ctx.fillText('Una visión clara de tu operación',42,88);
  ['VENTAS','INVENTARIO','CLIENTES'].forEach((label,i)=>{
    ctx.fillStyle=['#b4c7ff','#c6b7ff','#abe8f1'][i];ctx.fillRect(42+i*238,117,214,92);
    ctx.fillStyle='#23395c';ctx.font='bold 14px sans-serif';ctx.fillText(label,58+i*238,147);
    ctx.fillStyle='#fff';ctx.fillRect(58+i*238,165,130,10);
  });
  ctx.fillStyle='#fff';ctx.fillRect(42,236,448,198);
  [58,92,70,122,105,148,132].forEach((h,i)=>{ctx.fillStyle=i%2?'#5278ff':'#9771f5';ctx.fillRect(62+i*57,409-h,35,h);});
  ctx.fillStyle='#d2deff';ctx.fillRect(518,236,208,198);ctx.fillStyle='#23395c';ctx.font='bold 15px sans-serif';ctx.fillText('PROYECTOS',538,269);
  for(let i=0;i<4;i++){ctx.fillStyle='#5d88ff';ctx.fillRect(538,292+i*30,14,14);ctx.fillStyle='#fff';ctx.fillRect(562,294+i*30,135,10);}
  const dashboardTexture=new THREE.CanvasTexture(dashboardCanvas);dashboardTexture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(3.02,1.88),new THREE.MeshBasicMaterial({map:dashboardTexture}));screen.position.set(0,1.83,.086);monitor.add(screen);
  const keyboard=new THREE.Group();desk.add(keyboard);keyboard.position.set(.65,.1,-.5);
  box(keyboard,2.2,.1,.75,0xd8e2f5);
  for(let row=0;row<4;row++)for(let col=0;col<12;col++)box(keyboard,.145,.045,.12,0xfafcff,-.96+col*.174,.07,-.26+row*.17);
  box(keyboard,.8,.045,.1,0x95acda,0,.073,.27);
  const mouse=cylinder(desk,.23,.09,0xe7edf9,2.25,.12,-.5);mouse.scale.z=1.4;
  const lamp=new THREE.Group();desk.add(lamp);lamp.position.set(-3.5,0,-2.1);
  cylinder(lamp,.5,.1,0x596985,0,.07,0);
  box(lamp,.07,1.75,.07,0x596985,0,.9,0);
  const lampArm=box(lamp,.07,1.1,.07,0x596985,.35,1.95,0);lampArm.rotation.z=-.75;
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.6,.52,48,1,true),new THREE.MeshStandardMaterial({color:0x6686e6,side:THREE.DoubleSide}));shade.position.set(.7,2.38,0);lamp.add(shade);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.12,16,16),new THREE.MeshBasicMaterial({color:0xc6e6ff}));bulb.position.set(.7,2.22,0);lamp.add(bulb);
  const cup=cylinder(desk,.29,.55,0xe8efff,3.9,.31,-1.5);
  cylinder(desk,.24,.015,0x5d3f29,3.9,.595,-1.5);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.2,.055,8,20),mat(0xe8efff));handle.position.set(4.21,.32,-1.5);desk.add(handle);
  const plant=new THREE.Group();desk.add(plant);plant.position.set(4.4,0,-2.7);
  cylinder(plant,.32,.5,0x7a85d5,0,.28,0);cylinder(plant,.28,.02,0x344153,0,.54,0);
  for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.2,12,12),mat(i%2?0x237e85:0x46b8af));leaf.scale.set(.55,2,.8);leaf.position.set(Math.cos(i*2.4)*.22,.86+Math.sin(i)*.12,Math.sin(i*2.4)*.2);leaf.rotation.z=Math.cos(i)*.6;plant.add(leaf);}
  // Piles become labelled, aligned cards. Their transforms are reversible with scroll.
  const labels=['VENTAS','FINANZAS','CLIENTES','INVENTARIO','PROVEEDORES','PROYECTOS'];
  const colors=['#9dbbff','#bba6ff','#93d8ef','#b2c8fa','#9eacf8','#b7baff'];
  function paperTexture(label,color,index) {
    const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;const c=canvas.getContext('2d');
    c.fillStyle=color;c.fillRect(0,0,384,512);c.fillStyle='#1b3157';c.font='bold 25px sans-serif';c.fillText(label,28,65);
    c.font='14px sans-serif';c.fillStyle='#3d5884';c.fillText('DAESA / '+String(index+1).padStart(2,'0'),28,96);
    for(let i=0;i<6;i++){c.fillStyle=i===0?'#ffffff':'#ffffff88';c.fillRect(28,140+i*40,280-(i%3)*45,12);}
    c.fillStyle='#3964f5';c.fillRect(28,425,26,26);c.fillStyle='#fff';c.font='bold 22px sans-serif';c.fillText('✓',31,446);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  for(let i=0;i<18;i++) {
    const paper=new THREE.Group();desk.add(paper);
    box(paper,1.08,.028,1.48,0xfafcff);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.07,1.47),new THREE.MeshBasicMaterial({map:paperTexture(labels[i%6],colors[i%6],i%6)}));
    face.rotation.x=-Math.PI/2;face.position.y=.016;paper.add(face);
    const a=i*2.39996;
    const start=new THREE.Vector3(Math.cos(a)*(1.3+i%4*.85),.08+i*.013,.9+Math.sin(a)*(1.25+i%3*.45));
    const end=new THREE.Vector3(-3.25+(i%6)*1.25,.07+Math.floor(i/6)*.035,1.85);
    const final=new THREE.Vector3(-3.25+(i%6)*1.25,.07+Math.floor(i/6)*.035,1.85);
    paper.position.copy(start);paper.rotation.y=Math.sin(i*3.7)*2;
    objects.push({mesh:paper,start,end,final,angle:paper.rotation.y,delay:(i%6)*.035});
  }
  const pencil=new THREE.Group();desk.add(pencil);
  const pencilBody=box(pencil,.06,.06,1.5,0x4768f5);const tip=new THREE.Mesh(new THREE.ConeGeometry(.045,.16,8),mat(0x293a58));tip.rotation.x=Math.PI/2;tip.position.z=.82;pencil.add(tip);
  objects.push({mesh:pencil,start:new THREE.Vector3(-.8,.12,1.1),end:new THREE.Vector3(3.55,.1,.7),final:new THREE.Vector3(3.55,.1,.7),angle:1.4,delay:.05});
  // Six digital modules float above the organised desk in the final act.
  const modules=new THREE.Group();desk.add(modules);
  for(let i=0;i<6;i++) {
    const card=new THREE.Group();modules.add(card);
    box(card,1.15,.82,.09,new THREE.Color(colors[i]).getHex());
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.76),new THREE.MeshBasicMaterial({map:paperTexture(labels[i],colors[i],i)}));face.position.z=.051;card.add(face);
    card.position.set(-2.7+(i%3)*1.75,2.8+Math.floor(i/3)*1.12,-.65);
  }
  const links=new THREE.Group();modules.add(links);
  for(let i=0;i<5;i++) {
    const start=modules.children[i].position;const end=modules.children[i+1].position;
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,end]),new THREE.LineBasicMaterial({color:0x5579ef,transparent:true,opacity:.45}));links.add(line);
  }
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mat(0xe9eff8));floor.rotation.x=-Math.PI/2;floor.position.y=-3.3;floor.receiveShadow=true;scene.add(floor);
  let aspect=1;
  function resize() {
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h);aspect=w/h;camera.aspect=aspect;camera.updateProjectionMatrix();scrollProgress();dirty=true;
  }
  new ResizeObserver(resize).observe(host);
  const fromCamera=new THREE.Vector3(8,10,13);
  const toCamera=new THREE.Vector3(3.8,8.7,13.5);
  const endCamera=new THREE.Vector3(1.8,10,16);
  const look=new THREE.Vector3();
  function frame(now) {
    requestAnimationFrame(frame);
    if(!visible || document.hidden)return;
    if(now-last<32)return;
    const dt=Math.min((now-last)/1000 || .033,.08);last=now;
    const destination=frozen?progress:target;
    const delta=destination-progress;
    if(!dirty && Math.abs(delta)<.0001)return;
    progress=frozen?progress:progress+delta*(1-Math.exp(-dt*8));
    const order=ease(clamp((progress-.12)/.55,0,1));
    const connect=ease(clamp((progress-.69)/.25,0,1));
    objects.forEach(item=>{
      const t=ease(clamp((order-item.delay)/(1-item.delay),0,1));
      item.mesh.position.lerpVectors(item.start,item.end,t);
      item.mesh.position.y+=Math.sin(t*Math.PI)*.85;
      item.mesh.rotation.y=item.angle*(1-t);
    });
    keyboard.rotation.y=.32*(1-order);monitor.rotation.y=-.16*(1-order);
    modules.visible=connect>.01;modules.scale.setScalar(Math.max(.001,connect));
    modules.position.y=(1-connect)*-.8;
    screen.material.color.setScalar(.65+order*.35);
    if(progress<.65)camera.position.lerpVectors(fromCamera,toCamera,ease(progress/.65));
    else camera.position.lerpVectors(toCamera,endCamera,ease((progress-.65)/.35));
    const mobile=aspect<.9;
    if(mobile){camera.position.set(5-progress*2,15+connect*2,24);look.set(0,.5,0);}
    else {look.set(-3.5,connect*.75,0);}
    camera.lookAt(look);
    renderer.render(scene,camera);
    if(!frozen)setChapter(progress<.32?0:progress<.72?1:2);
    story.style.setProperty('--story-progress',String(progress));
    dirty=false;
  }
  renderer.domElement.addEventListener('webglcontextlost',()=>{story.classList.remove('desk-ready');story.classList.add('desk-unavailable');visible=false;});
  resize();scrollProgress();setChapter(0);requestAnimationFrame(frame);
} else {
  setChapter(0);
  addEventListener('scroll',()=>setChapter(target<.32?0:target<.72?1:2),{passive:true});
}
