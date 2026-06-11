// --- 1. BOOT SEQUENCE (AUTO-STARTS ON LOAD) ---
window.onload = () => {
    document.getElementById('falling-zero').classList.add('drop-anim');
    
    setTimeout(() => {
        document.getElementById('explosion-line').style.animation = 'expandLine 1.2s ease-out forwards';
        
        setTimeout(() => {
            document.getElementById('boot-screen').style.opacity = '0';
            setTimeout(() => document.getElementById('boot-screen').style.display = 'none', 600);
            
            document.getElementById('ui-overlay').style.opacity = '1';
            document.getElementById('sidebar-menu').style.opacity = '1';
            document.getElementById('page-terminal').classList.add('active');
            
            controls.enabled = true; 
        }, 800);
    }, 800); 
};

// --- 2. 3D SCENE SETUP ---
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020611); 
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const defaultRadius = 90;
const defaultHeight = 15;
const defaultMapTarget = new THREE.Vector3(0, 0, 0); 

function getCameraAngleForPage(index) {
    return (Math.PI / 2) - (index * (Math.PI / 3)); 
}

const initialAngle = getCameraAngleForPage(0);
camera.position.set(Math.sin(initialAngle) * defaultRadius, defaultHeight, Math.cos(initialAngle) * defaultRadius);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const renderScene = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2; bloomPass.strength = 0.6; bloomPass.radius = 0.1;    
const composer = new THREE.EffectComposer(renderer); composer.addPass(renderScene); composer.addPass(bloomPass);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05;
controls.enableRotate = true;  
controls.enableZoom = true;    
controls.enablePan = false;    
controls.maxPolarAngle = Math.PI / 2 - 0.02; controls.minDistance = 5; controls.maxDistance = 150; 
controls.target.copy(defaultMapTarget);
controls.enabled = false; 

// --- 3. BUILD THE MOTHERBOARD CITY ---
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const cpuGlow = new THREE.PointLight(0x00e5ff, 4, 100); cpuGlow.position.set(0, 5, 0); scene.add(cpuGlow);
const globalLight = new THREE.DirectionalLight(0x0055ff, 1.5); globalLight.position.set(-50, 60, 40); scene.add(globalLight);

const floor = new THREE.Mesh(new THREE.BoxGeometry(200, 1, 200), new THREE.MeshStandardMaterial({ color: 0x01030a, roughness: 0.8, metalness: 0.3 }));
floor.position.y = -0.5; scene.add(floor);
const gridHelper = new THREE.GridHelper(200, 200, 0x0033aa, 0x01030a); gridHelper.position.y = 0.01; scene.add(gridHelper);

const cityGroup = new THREE.Group(); scene.add(cityGroup);
const dataPackets = []; 

const traceMat = new THREE.MeshStandardMaterial({ color: 0x0055ff, emissive: 0x0033aa, roughness: 0.1 }); 
const capMatDark = new THREE.MeshStandardMaterial({ color: 0x050815, metalness: 0.9, roughness: 0.1 });
const capMatSilver = new THREE.MeshStandardMaterial({ color: 0x445577, metalness: 0.9, roughness: 0.2 });
const chipMat = new THREE.MeshStandardMaterial({ color: 0x03060f, metalness: 0.8, roughness: 0.3 });
const heatMat = new THREE.MeshStandardMaterial({ color: 0x0a1122, metalness: 0.7, roughness: 0.5 });
const pulseMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, transparent: true, opacity: 1 }); 
const projectNodeMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x0055ff, metalness: 0.8, roughness: 0.2 });

const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
const interactableNodes = []; 

const beacons = [];
const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });

function spawnBeacon(x, z) {
    const beaconGeo = new THREE.CylinderGeometry(0.8, 0.8, 80, 8);
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(x, 40, z); 
    cityGroup.add(beacon);
    beacons.push(beacon);
}

const portfolioProjects = [
    { title: "BUSYBONES SHOP", desc: "A live, premium e-commerce platform and digital storefront for streetwear clothing.", stack: "WEB // E-COMMERCE // FULL-STACK", link: "https://busybones.co.zw" },
    { title: "GLUCOCARE APP", desc: "A dedicated health-tech application for diabetes management, featuring smart pill reminders and personalized dietary advice.", stack: "MOBILE APP // HEALTH-TECH // UI/UX", link: "#" },
    { title: "CAMPUSHUB", desc: "An exclusive university campus network designed to facilitate student deals, trading, and localized services in Zimbabwe.", stack: "MOBILE // ED-TECH // SCALABLE NETWORK", link: "#" },
    { title: "OMNI-MATRIX 3D", desc: "This exact 3D cinematic developer portfolio and interactive WebGL environment.", stack: "THREE.JS // GSAP // VANILLA JS", link: "#" },
    { title: "PROJECT_STEALTH", desc: "Next-generation digital experience currently under architectural development.", stack: "CLASSIFIED // IN_PROGRESS", link: "#" },
];
let projectIndex = 0;

function createOrthogonalHighway(startX, startZ, endX, endZ) {
    const width = 0.25; const height = 0.1; const midZ = startZ + (endZ - startZ) / 2; 
    const seg1 = new THREE.Mesh(new THREE.BoxGeometry(width, height, Math.abs(midZ - startZ) + width), traceMat);
    seg1.position.set(startX, height/2, startZ + (midZ - startZ)/2); cityGroup.add(seg1);
    const seg2 = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(endX - startX) + width, height, width), traceMat);
    seg2.position.set(startX + (endX - startX)/2, height/2, midZ); cityGroup.add(seg2);
    const seg3 = new THREE.Mesh(new THREE.BoxGeometry(width, height, Math.abs(endZ - midZ) + width), traceMat);
    seg3.position.set(endX, height/2, midZ + (endZ - midZ)/2); cityGroup.add(seg3);
    const pulseLine = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 2.5), pulseMat);
    cityGroup.add(pulseLine);
    dataPackets.push({ mesh: pulseLine, startX: startX, startZ: startZ, endX: endX, endZ: endZ, midZ: midZ, progress: Math.random(), speed: 0.0015 + Math.random() * 0.003 });
}

function buildCapacitorCluster(x, z, count, isProjectNode, currentProjectData) {
    for(let i = 0; i < count; i++) {
        const height = isProjectNode ? 10 : 3 + Math.random() * 5; 
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, height, 16), isProjectNode ? projectNodeMat : (Math.random() > 0.6 ? capMatSilver : capMatDark));
        cap.position.set(x + (Math.random() - 0.5) * 4, height/2, z + (Math.random() - 0.5) * 4);
        if (isProjectNode && i === 0) { cap.userData = currentProjectData; interactableNodes.push(cap); spawnBeacon(cap.position.x, cap.position.z); }
        cityGroup.add(cap);
    }
    createOrthogonalHighway(0, 0, x, z);
}

function buildMicrochip(x, z, w, l, isProjectNode, currentProjectData) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, isProjectNode ? 2 : 0.8, l), isProjectNode ? projectNodeMat : chipMat);
    base.position.set(x, isProjectNode ? 1 : 0.4, z);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.5, l * 0.5), new THREE.MeshBasicMaterial({ color: 0x0055ff, transparent: true, opacity: 0.4 }));
    plate.rotation.x = -Math.PI / 2; plate.position.set(x, isProjectNode ? 2.01 : 0.81, z);
    if (isProjectNode) { base.userData = currentProjectData; interactableNodes.push(base); spawnBeacon(x, z); }
    cityGroup.add(base); cityGroup.add(plate);
    createOrthogonalHighway(0, 0, x, z);
}

function buildHeatSink(x, z, isProjectNode, currentProjectData) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, isProjectNode ? 2 : 1, 6), isProjectNode ? projectNodeMat : heatMat);
    base.position.set(x, isProjectNode ? 1 : 0.5, z);
    for(let i = -2; i <= 2; i += 1) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 5.5), isProjectNode ? projectNodeMat : heatMat);
        fin.position.set(x + i, 3, z); cityGroup.add(fin);
    }
    if (isProjectNode) { base.userData = currentProjectData; interactableNodes.push(base); spawnBeacon(x, z); }
    cityGroup.add(base);
    createOrthogonalHighway(0, 0, x, z);
}

function buildRAMCluster(x, z, isProjectNode, currentProjectData) {
    for(let i = -3; i <= 3; i += 2) {
        const ram = new THREE.Mesh(new THREE.BoxGeometry(1, isProjectNode ? 10 : 6, 8), isProjectNode ? projectNodeMat : chipMat);
        ram.position.set(x + i, isProjectNode ? 5 : 3, z);
        const ramGlow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 8.1), traceMat);
        ramGlow.position.set(x + i, isProjectNode ? 10.1 : 6.1, z);
        if (isProjectNode && i === 0) { ram.userData = currentProjectData; interactableNodes.push(ram); spawnBeacon(ram.position.x, ram.position.z); }
        cityGroup.add(ram); cityGroup.add(ramGlow);
    }
    createOrthogonalHighway(0, 0, x, z);
}

const cpuBase = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 14), new THREE.MeshStandardMaterial({ color: 0x050a1a, metalness: 0.9, roughness: 0.1 }));
cpuBase.position.y = 0.6; cityGroup.add(cpuBase);
const cpuCore = new THREE.Mesh(new THREE.BoxGeometry(10, 1.5, 10), new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x0055ff, transparent: true, opacity: 0.95 }));
cpuCore.position.y = 0.75; cityGroup.add(cpuCore);

const occupiedZones = [];
function isSpaceFree(x, z, r) {
    if (Math.abs(x) < 20 && Math.abs(z) < 20) return false; 
    for (let zI of occupiedZones) if (Math.hypot(zI.x - x, zI.z - z) < (zI.radius + r)) return false; 
    return true;
}

let attempts = 0;
while (occupiedZones.length < 100 && attempts < 3000) {
    attempts++; let posX = (Math.random() - 0.5) * 160; let posZ = (Math.random() - 0.5) * 160;
    if (isSpaceFree(posX, posZ, 6)) {
        occupiedZones.push({x: posX, z: posZ, radius: 6});
        let isProjectNode = false; let currentProjectData = null;
        if (projectIndex < 5 && Math.random() > 0.8) {
            isProjectNode = true; currentProjectData = portfolioProjects[projectIndex]; projectIndex++;
        }
        const rand = Math.random();
        if (rand < 0.50) { buildCapacitorCluster(posX, posZ, Math.floor(Math.random() * 4) + 2, isProjectNode, currentProjectData); } 
        else if (rand < 0.70) { buildMicrochip(posX, posZ, 4 + Math.random() * 6, 4 + Math.random() * 6, isProjectNode, currentProjectData); } 
        else if (rand < 0.85) { buildHeatSink(posX, posZ, isProjectNode, currentProjectData); } 
        else { buildRAMCluster(posX, posZ, isProjectNode, currentProjectData); }
    }
}

function createBinaryTexture(text) {
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d'); ctx.font = 'bold 24px Courier New'; ctx.fillStyle = '#0055ff'; ctx.textAlign = 'center'; ctx.fillText(text, 16, 24);
    return new THREE.CanvasTexture(canvas);
}
const rainGroup = new THREE.Group(); const rainDrops = [];
const tex0 = createBinaryTexture('0'); const tex1 = createBinaryTexture('1');
for(let i = 0; i < 150; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: Math.random() > 0.5 ? tex1 : tex0, transparent: true, opacity: 0.6 }));
    sprite.position.set((Math.random() - 0.5) * 160, Math.random() * 60, (Math.random() - 0.5) * 160);
    rainDrops.push({ mesh: sprite, speed: 0.05 + Math.random() * 0.15 }); rainGroup.add(sprite);
}
scene.add(rainGroup);


// --- 4. 3D PAGE NAVIGATION LOGIC (TRUE SPHERICAL MATH) ---
let isRotating = false; 
let isFlying = false; 
let currentPageIndex = 0;

// 🚀 THE STARK MANIFESTO ADDED
const pages = [
    { title: "ABOUT", text: "I am Bowen. I specialize in high-stakes architecture and scaling systems that actually move the needle. Let's see if your vision can handle the upgrade." },
    { title: "SKILLS", text: "Full-Stack Development // WebGL // E-Commerce // Mobile Apps" },
    { title: "EXPERIENCE", text: "Engineered live e-commerce platforms, health-tech mobile apps, and localized campus networks." },
    { title: "PROJECTS", text: "Click the glowing data nodes on the map to access the architecture for GlucoCare, BusyBones, and CampusHub." },
    { title: "VISION", text: "Building digital solutions that solve real-world problems in health, retail, and education." },
    { title: "CONTACT", text: "Initiate Handshake.\nEmail: bowen@example.com\nGitHub: github.com/bowen" }
];

let activeAnchorAngle = initialAngle + Math.PI - 0.35; 
const target3DPos = new THREE.Vector3(); 
const pageTerminal = document.getElementById('page-terminal');

function updatePageTextPosition() {
    if (isFlying || activeHologramTarget || !controls.enabled) return; 
    const radius = 90; 
    
    target3DPos.x = Math.sin(activeAnchorAngle) * radius; 
    target3DPos.z = Math.cos(activeAnchorAngle) * radius; 
    target3DPos.y = 20; 
    
    const pos = target3DPos.clone(); 
    pos.project(camera); 
    
    if (pos.z > 1) { pageTerminal.style.display = 'none'; return; } 
    else { pageTerminal.style.display = 'block'; }
    
    const x = (pos.x * 0.5 + 0.5) * window.innerWidth; 
    const y = (pos.y * -0.5 + 0.5) * window.innerHeight;
    pageTerminal.style.left = `${x}px`; 
    pageTerminal.style.top = `${y}px`; 
    pageTerminal.style.transform = `translate(-50%, -50%)`; 
}

document.querySelectorAll('.menu-item').forEach((item) => {
    item.addEventListener('click', (e) => {
        const index = parseInt(item.getAttribute('data-index'));
        if (isRotating || isFlying || index === currentPageIndex || !controls.enabled) return; 
        
        controls.enabled = false;
        isRotating = true;
        currentPageIndex = index;

        document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        pageTerminal.classList.remove('active'); 
        
        setTimeout(() => {
            document.getElementById('page-title').innerText = pages[currentPageIndex].title;
            document.getElementById('page-text').innerHTML = pages[currentPageIndex].text.replace(/\n/g, '<br>');
            pageTerminal.classList.add('active'); 
        }, 1500); 

        const currentSpherical = new THREE.Spherical().setFromVector3(camera.position);
        let targetTheta = getCameraAngleForPage(index);
        
        let diff = targetTheta - currentSpherical.theta;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        targetTheta = currentSpherical.theta + diff;

        activeAnchorAngle = targetTheta + Math.PI - 0.35;
        
        gsap.to(controls.target, { 
            x: defaultMapTarget.x, y: defaultMapTarget.y, z: defaultMapTarget.z, 
            duration: 3.5, ease: "sine.inOut" 
        });

        gsap.to(currentSpherical, {
            theta: targetTheta, 
            phi: currentSpherical.phi, 
            radius: defaultRadius, 
            duration: 3.5, 
            ease: "sine.inOut", 
            onUpdate: () => { 
                camera.position.setFromSpherical(currentSpherical); 
                camera.lookAt(controls.target); 
            },
            onComplete: () => { 
                controls.enabled = true; 
                isRotating = false; 
            }
        });
    });
});

// --- 5. RAYCASTER FLIGHT LOGIC (DEEP DIVING INTO CHIPS) ---
let activeHologramTarget = null;
const hologramUI = document.getElementById('hologram-ui');

window.addEventListener('pointermove', (e) => {
    if(isFlying || isRotating || !controls.enabled) return; 
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactableNodes);
    
    if (intersects.length > 0) { document.body.style.cursor = 'pointer'; } 
    else { document.body.style.cursor = 'default'; }
});

window.addEventListener('click', (e) => {
    if(isRotating || isFlying || !controls.enabled || e.target.closest('#sidebar-menu') || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactableNodes);
    if (intersects.length > 0) { executeFlight(intersects[0].object); }
});

// 🚀 FIX: The "Satellite View" Flight Offset
function executeFlight(targetMesh) {
    controls.enabled = false; 
    isFlying = true; 
    activeHologramTarget = null; hologramUI.classList.remove('active'); document.getElementById('page-terminal').classList.remove('active'); 

    const targetPos = targetMesh.position;
    
    // 🚀 We pushed the camera offset all the way to (90, 60, 90) for that massive, sweeping satellite scale!
    const camOffset = new THREE.Vector3(90, 60, 90);
    const finalCamPos = targetPos.clone().add(camOffset);

    document.getElementById('sidebar-menu').style.opacity = '0';
    document.getElementById('sidebar-menu').style.pointerEvents = 'none';

    gsap.to(controls.target, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 3.0, ease: "power2.inOut" });

    gsap.to(camera.position, { 
        x: finalCamPos.x, y: finalCamPos.y, z: finalCamPos.z, 
        duration: 3.0, ease: "power2.inOut",
        onUpdate: () => camera.lookAt(controls.target),
        onComplete: () => {
            controls.enabled = true; 
            isFlying = false; 
            
            document.getElementById('holo-title').innerText = targetMesh.userData.title;
            document.getElementById('holo-desc').innerText = targetMesh.userData.desc;
            document.getElementById('holo-stack').innerText = targetMesh.userData.stack;
            document.getElementById('holo-link').href = targetMesh.userData.link; 
            
            activeHologramTarget = targetMesh;
            document.getElementById('return-btn').style.display = 'inline-block';
        }
    });
}

// Returning to Orbit
document.getElementById('return-btn').addEventListener('click', () => {
    if (isFlying) return; 
    controls.enabled = false; 
    isFlying = true; 
    activeHologramTarget = null; hologramUI.classList.remove('active');
    document.getElementById('return-btn').style.display = 'none';

    const startSpherical = new THREE.Spherical().setFromVector3(camera.position);
    let targetTheta = getCameraAngleForPage(currentPageIndex);
    
    let diff = targetTheta - startSpherical.theta;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    targetTheta = startSpherical.theta + diff;

    gsap.to(controls.target, { x: defaultMapTarget.x, y: defaultMapTarget.y, z: defaultMapTarget.z, duration: 3.0, ease: "power2.inOut" });

    const targetPhi = Math.acos(defaultHeight / defaultRadius); 

    gsap.to(startSpherical, { 
        theta: targetTheta, 
        phi: targetPhi, 
        radius: defaultRadius, 
        duration: 3.0, ease: "power2.inOut",
        onUpdate: () => {
            camera.position.setFromSpherical(startSpherical);
            camera.lookAt(controls.target);
        },
        onComplete: () => { 
            controls.enabled = true; 
            isFlying = false; 
            document.getElementById('page-terminal').classList.add('active');
            document.getElementById('sidebar-menu').style.opacity = '1';
            document.getElementById('sidebar-menu').style.pointerEvents = 'auto';
        }
    });
});

function updateHologramPosition() {
    if (!activeHologramTarget) return;
    const pos = activeHologramTarget.position.clone(); pos.y += 6; pos.project(camera); 
    if (pos.z > 1) { hologramUI.style.display = 'none'; return; } else { hologramUI.style.display = 'block'; }
    
    const x = (pos.x * 0.5 + 0.5) * window.innerWidth; const y = (pos.y * -0.5 + 0.5) * window.innerHeight;
    hologramUI.style.left = `${x}px`; hologramUI.style.top = `${y}px`; hologramUI.style.transform = `translate(-50%, -100%)`; hologramUI.classList.add('active');
}

// --- 6. GLOBAL RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    if (!isRotating && !isFlying && controls.enabled) controls.update(); 
    
    updatePageTextPosition(); 
    updateHologramPosition(); 
    
    const time = Date.now() * 0.002;
    beacons.forEach(b => { b.material.opacity = 0.2 + Math.sin(time) * 0.15; });

    dataPackets.forEach(p => {
        p.progress += p.speed; if (p.progress > 1) p.progress = 0; 
        if (p.progress < 0.33) {
            const localProgress = p.progress / 0.33; p.mesh.rotation.y = 0; p.mesh.position.set(p.startX, 0.15, p.startZ + (p.midZ - p.startZ) * localProgress);
        } else if (p.progress < 0.66) {
            const localProgress = (p.progress - 0.33) / 0.33; p.mesh.rotation.y = Math.PI / 2; p.mesh.position.set(p.startX + (p.endX - p.startX) * localProgress, 0.15, p.midZ);
        } else {
            const localProgress = (p.progress - 0.66) / 0.34; p.mesh.rotation.y = 0; p.mesh.position.set(p.endX, 0.15, p.midZ + (p.endZ - p.midZ) * localProgress);
        }
    });

    rainDrops.forEach(drop => { drop.mesh.position.y -= drop.speed; if (drop.mesh.position.y < 0) drop.mesh.position.y = 60; });
    composer.render();
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
});