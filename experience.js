import * as THREE from './assets/vendor/three.module.js';

const preference = matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
let stage = 0;
const scenes = [];
const stageNames = ['01 / ENTENDER', '02 / CONSTRUIR', '03 / EVOLUCIONAR'];
const captions = ['Conectamos las piezas de tu idea.', 'Convertimos la visión en una solución funcional.', 'Una base sólida. Nuevas posibilidades para crecer.'];
const buttons = [...document.querySelectorAll('[data-stage]')];
buttons.forEach(button => button.addEventListener('click', () => {
  stage = Number(button.dataset.stage);
  buttons.forEach(item => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#stage-name').textContent = stageNames[stage];
  document.querySelector('#stage-caption').textContent = captions[stage];
  scenes.forEach(item => item.draw(performance.now(), true));
}));
const toggle = document.querySelector('#motion-toggle');
function syncToggle() {
  toggle.textContent = paused ? 'Activar animación' : 'Pausar animación';
  toggle.setAttribute('aria-pressed', String(paused));
}
toggle.addEventListener('click', () => { paused = !paused; syncToggle(); });
preference.addEventListener('change', event => { paused = event.matches; syncToggle(); });
syncToggle();

function createScene(id, isProcess) {
  const container = document.getElementById(id);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { container.parentElement.classList.add('scene-unavailable'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  container.parentElement.classList.add('scene-loaded');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 80);
  camera.position.set(0, 0, 12);
  const assembly = new THREE.Group();
  scene.add(assembly);
  scene.add(new THREE.AmbientLight(0xb6c9ff, 2.1));
  const key = new THREE.DirectionalLight(0xc8ffef, 4); key.position.set(3, 5, 7); scene.add(key);
  const edge = new THREE.DirectionalLight(0x8055ff, 5); edge.position.set(-4, -1, 2); scene.add(edge);
  const geometry = new THREE.BoxGeometry(.7, .7, .7);
  const materials = [0x83f4ce, 0x8d8bff, 0x5578eb].map(color => new THREE.MeshStandardMaterial({ color, metalness: .38, roughness: .27 }));
  const cubes = [];
  for (let i = 0; i < 27; i++) {
    const mesh = new THREE.Mesh(geometry, materials[i % 3]);
    const compact = new THREE.Vector3((i % 3 - 1) * .84, (Math.floor(i / 3) % 3 - 1) * .84, (Math.floor(i / 9) - 1) * .84);
    const angle = i * 2.39996;
    const scatter = new THREE.Vector3(Math.cos(angle) * (1.7 + (i % 4) * .35), Math.sin(angle) * (1.7 + (i % 3) * .4), Math.sin(i * 3) * 1.8);
    mesh.position.copy(isProcess ? scatter : compact);
    assembly.add(mesh); cubes.push({ mesh, compact, scatter });
  }
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(3.2, .012, 6, 100), new THREE.MeshBasicMaterial({ color: 0x6ee8c5, transparent: true, opacity: .35 }));
  orbit.rotation.x = 1.1; assembly.add(orbit);
  const orbit2 = orbit.clone(); orbit2.rotation.set(.4, 1.4, .7); assembly.add(orbit2);
  const positions = new Float32Array(180 * 3);
  for (let i = 0; i < positions.length; i++) positions[i] = Math.sin(i * 127.1) * 8;
  const dustGeometry = new THREE.BufferGeometry(); dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xa2c5ee, size: .022, transparent: true, opacity: .5 })); scene.add(dust);
  let visible = true, pointerX = 0, pointerY = 0, last = 0;
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }); intersection.observe(container);
  container.parentElement.addEventListener('pointermove', event => {
    const rect = container.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  });
  container.parentElement.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height); camera.aspect = width / height;
    assembly.scale.setScalar(isProcess && width < 500 ? .78 : 1);
    camera.updateProjectionMatrix();
    draw(performance.now(), true);
  }
  function draw(now, force = false) {
    if ((!visible || document.hidden || paused) && !force) return;
    if (!force && now - last < 32) return;
    const delta = Math.min((now - last) / 1000 || .032, .08); last = now;
    const time = paused ? 0 : now * .00022;
    const selected = isProcess ? stage : 1;
    cubes.forEach(({ mesh, compact, scatter }, i) => {
      const target = selected === 0 ? scatter.clone() : compact.clone();
      if (selected === 2) target.multiplyScalar(1.6 + (paused ? 0 : Math.sin(time * 2 + i * .15) * .09));
      mesh.position.lerp(target, paused && force ? 1 : 1 - Math.exp(-delta * 5));
      if (selected === 0) mesh.rotation.set(time * .4 + i * .1, time * .7 + i * .08, i * .04);
      else if (paused && force) mesh.rotation.set(0, 0, 0);
      else { mesh.rotation.x *= .92; mesh.rotation.y *= .92; mesh.rotation.z *= .92; }
    });
    assembly.rotation.set(.35 + pointerY * .15, -.5 + time * .25 + pointerX * .22, .08);
    orbit.rotation.z = time * .3; orbit2.rotation.y = 1.4 - time * .2;
    renderer.render(scene, camera);
  }
  const observer = new ResizeObserver(resize); observer.observe(container);
  const entry = { draw }; scenes.push(entry); resize();
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); container.parentElement.classList.remove('scene-loaded');
    container.parentElement.classList.add('scene-unavailable'); visible = false;
  });
}
createScene('hero-scene', false);
createScene('process-scene', true);
function frame(now) { scenes.forEach(scene => scene.draw(now)); requestAnimationFrame(frame); }
requestAnimationFrame(frame);

// Product scenes share the page's pause control and render only while visible.
function createProductScene(id, business) {
  const host = document.getElementById(id);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 40);
  camera.position.set(0, 4.5, 8.8); camera.lookAt(0, .2, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(3, 6, 5); scene.add(light);
  const rim = new THREE.DirectionalLight(business ? 0x91f2ce : 0xa894ff, 3); rim.position.set(-4, 2, -2); scene.add(rim);
  const group = new THREE.Group(); scene.add(group);
  const material = color => new THREE.MeshStandardMaterial({ color, metalness: .3, roughness: .3 });
  const addBox = (x,y,z,w,h,d,color) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material(color));
    mesh.position.set(x,y,z); group.add(mesh); return mesh;
  };
  addBox(0,-.65,0,5,.16,3.1,business ? 0x183c40 : 0x30294f);
  const movers = [];
  if (!business) {
    [.7,1.25,.95,1.8,1.45,2.15].forEach((height,i) => {
      const bar = addBox(-1.9+i*.76,-.5+height/2,0,.5,height,.55,i%2 ? 0x9064ff : 0xb5a2ff);
      movers.push({mesh:bar, base:bar.position.y});
    });
    const points = [new THREE.Vector3(-2.15,.15,.7),new THREE.Vector3(-1.35,.5,.7),new THREE.Vector3(-.6,.35,.7),new THREE.Vector3(.2,.9,.7),new THREE.Vector3(1,.75,.7),new THREE.Vector3(2,1.35,.7)];
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.035,6,false),material(0x91f2ce)));
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.14,40),material(0xf5ce7b));
    coin.rotation.x=Math.PI/2; coin.position.set(1.65,2.6,-.5); group.add(coin);
    movers.push({mesh:coin,base:2.6});
  } else {
    addBox(0,.1,0,1.05,1.1,1.05,0x91f2ce);
    const nodes = [[-1.8,-.8],[-1.8,.9],[1.8,-.8],[1.8,.9],[0,-1.2]];
    nodes.forEach(([x,z],i)=>{
      const node=addBox(x,.05,z,.7,.75,.7,[0x79cbd7,0x9e9bff,0xf6b785,0x91f2ce,0xa1b6ef][i]);
      movers.push({mesh:node,base:.05});
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.25,0),new THREE.Vector3(x,-.25,z)]),new THREE.LineBasicMaterial({color:0x91f2ce})); group.add(line);
      const cap=addBox(x,.48,z,.42,.07,.42,0xe5fff5); node.add(cap); group.remove(cap); cap.position.set(0,.42,0);
    });
  }
  let visible=false,last=0,px=0;
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting; if(visible) draw(performance.now(),true);}).observe(host);
  host.addEventListener('pointermove',event=>{const rect=host.getBoundingClientRect();px=(event.clientX-rect.left)/rect.width-.5;});
  host.addEventListener('pointerleave',()=>{px=0;});
  function draw(now,force=false) {
    if ((!visible || document.hidden || paused) && !force) return;
    if(!force && now-last<40) return; last=now;
    const t=paused ? 0 : now*.001;
    group.rotation.y=-.22+Math.sin(t*.35)*.12+px*.18;
    movers.forEach(({mesh,base},i)=>{mesh.position.y=base+Math.sin(t*1.2+i)*.045;});
    renderer.render(scene,camera);
  }
  new ResizeObserver(()=>{
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=camera.aspect<1.4?11:8.8;camera.updateProjectionMatrix();draw(performance.now(),true);
  }).observe(host);
  renderer.domElement.addEventListener('webglcontextlost',()=>{host.classList.remove('product-scene-loaded');visible=false;});
  host.classList.add('product-scene-loaded'); scenes.push({draw});
}
createProductScene('one-product-scene',false);
createProductScene('business-product-scene',true);
