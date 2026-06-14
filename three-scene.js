// Three.js 3D Hero Scene for DreamyCrochet05

let scene, camera, renderer;
let giftBox, boxLid, boxBottom, ribbonGroup, bowGroup;
let orbitingFlowers = [];
let particles;
let isOpened = false;
let raycaster, mouse;
let canvas;

function initThreeScene() {
  canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 10);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.7); // warm light
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xffd7aa, 1.5, 8); // glowing warm light inside box
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  // Core Gift Box Group
  giftBox = new THREE.Group();
  scene.add(giftBox);

  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff8ee, // Cream
    roughness: 0.4,
    metalness: 0.1
  });
  
  const lidMaterial = new THREE.MeshStandardMaterial({
    color: 0xfadadd, // Pastel Pink
    roughness: 0.4,
    metalness: 0.1
  });

  const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: 0xb58a6a, // Warm Brown
    roughness: 0.3,
    metalness: 0.3
  });

  const bowMaterial = new THREE.MeshStandardMaterial({
    color: 0xb58a6a,
    roughness: 0.3,
    metalness: 0.3
  });

  // 1. Box Bottom
  const bottomGeo = new THREE.BoxGeometry(2.4, 2, 2.4);
  boxBottom = new THREE.Mesh(bottomGeo, boxMaterial);
  boxBottom.position.y = -0.3;
  boxBottom.castShadow = true;
  boxBottom.receiveShadow = true;
  giftBox.add(boxBottom);

  // 2. Box Lid
  const lidGeo = new THREE.BoxGeometry(2.52, 0.5, 2.52);
  boxLid = new THREE.Mesh(lidGeo, lidMaterial);
  boxLid.position.y = 0.8;
  boxLid.castShadow = true;
  boxLid.receiveShadow = true;
  giftBox.add(boxLid);

  // 3. Ribbons around box
  ribbonGroup = new THREE.Group();
  const ribbonNS = new THREE.BoxGeometry(0.3, 2.02, 2.44); // north-south ribbon
  const ribbonEW = new THREE.BoxGeometry(2.44, 2.02, 0.3); // east-west ribbon
  const meshNS = new THREE.Mesh(ribbonNS, ribbonMaterial);
  const meshEW = new THREE.Mesh(ribbonEW, ribbonMaterial);
  meshNS.position.y = -0.3;
  meshEW.position.y = -0.3;
  meshNS.castShadow = true;
  meshEW.castShadow = true;
  ribbonGroup.add(meshNS, meshEW);
  
  // Ribbons on lid
  const lidRibbonNS = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.52, 2.56), ribbonMaterial);
  const lidRibbonEW = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.52, 0.32), ribbonMaterial);
  lidRibbonNS.position.y = 0.8;
  lidRibbonEW.position.y = 0.8;
  lidRibbonNS.castShadow = true;
  lidRibbonEW.castShadow = true;
  ribbonGroup.add(lidRibbonNS, lidRibbonEW);
  giftBox.add(ribbonGroup);

  // 4. Bow on top
  bowGroup = new THREE.Group();
  bowGroup.position.set(0, 1.1, 0);

  // Bow Center Knot
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bowMaterial);
  bowGroup.add(knot);

  // Bow Loops
  const loopGeo = new THREE.TorusGeometry(0.3, 0.1, 12, 24);
  const loopLeft = new THREE.Mesh(loopGeo, bowMaterial);
  loopLeft.rotation.y = Math.PI / 2;
  loopLeft.rotation.z = Math.PI / 6;
  loopLeft.position.set(-0.35, 0.1, 0);
  
  const loopRight = loopLeft.clone();
  loopRight.rotation.z = -Math.PI / 6;
  loopRight.position.x = 0.35;

  // Bow Tails
  const tailGeo = new THREE.ConeGeometry(0.08, 0.6, 8);
  const tailLeft = new THREE.Mesh(tailGeo, bowMaterial);
  tailLeft.position.set(-0.2, -0.3, 0.1);
  tailLeft.rotation.z = Math.PI / 4;
  tailLeft.rotation.x = Math.PI / 6;

  const tailRight = tailLeft.clone();
  tailRight.position.x = 0.2;
  tailRight.rotation.z = -Math.PI / 4;

  bowGroup.add(loopLeft, loopRight, tailLeft, tailRight);
  giftBox.add(bowGroup);

  // Scale down slightly for a cozy, centered look
  giftBox.scale.set(1.2, 1.2, 1.2);
  giftBox.position.y = -0.5;

  // 5. Orbiting Flowers
  createOrbitingFlowers();

  // 6. Particle system
  createParticles();

  // Mouse Interaction setup
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onWindowResize);
  canvas.addEventListener('click', onClickBox);

  // Start animation loop
  animate();
}

function createOrbitingFlowers() {
  const flowerTypes = ['tulip', 'rose', 'sunflower'];
  const colors = [0xffd1d5, 0xffede3, 0xffeb3b]; // pink, cream, sunflower yellow
  
  for (let i = 0; i < 6; i++) {
    const type = flowerTypes[i % flowerTypes.length];
    const color = colors[i % colors.length];
    const flower = createProceduralFlower(type, color);
    
    // Scale flowers
    flower.scale.set(0.4, 0.4, 0.4);
    
    // Initial Orbit coordinates
    const angle = (i / 6) * Math.PI * 2;
    const radius = 3.5;
    flower.position.x = Math.cos(angle) * radius;
    flower.position.z = Math.sin(angle) * radius;
    flower.position.y = (Math.random() - 0.5) * 1.5;
    
    // Custom properties for animation
    flower.userData = {
      angle: angle,
      radius: radius,
      speed: 0.005 + Math.random() * 0.003,
      bobSpeed: 0.02 + Math.random() * 0.02,
      bobHeight: 0.3 + Math.random() * 0.2,
      baseY: flower.position.y,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    };

    scene.add(flower);
    orbitingFlowers.push(flower);
  }
}

// Build procedural 3D flowers
function createProceduralFlower(type, colorHex) {
  const group = new THREE.Group();

  // Stem (Green tube)
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x81c784, roughness: 0.7 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), stemMat);
  stem.position.y = -0.75;
  group.add(stem);

  // Leaves
  const leafGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
  const leaf1 = new THREE.Mesh(leafGeo, stemMat);
  leaf1.position.set(0.1, -0.6, 0);
  leaf1.rotation.z = -Math.PI / 4;
  const leaf2 = leaf1.clone();
  leaf2.position.set(-0.1, -0.8, 0);
  leaf2.rotation.z = Math.PI / 4;
  group.add(leaf1, leaf2);

  // Flower Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.1;

  if (type === 'tulip') {
    // Tulip Petals (cup-like shape using overlapping spheres or ellipsoids)
    const petalMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const petalGeo = new THREE.SphereGeometry(0.3, 16, 16);
    petalGeo.scale(0.8, 1.4, 0.8);
    
    for (let i = 0; i < 4; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const angle = (i / 4) * Math.PI * 2;
      petal.position.x = Math.cos(angle) * 0.1;
      petal.position.z = Math.sin(angle) * 0.1;
      petal.rotation.y = angle;
      petal.rotation.x = 0.2; // slight outwards tilt
      headGroup.add(petal);
    }
  } else if (type === 'rose') {
    // Rose (layered concentric rings of petals)
    const petalMat = new THREE.MeshStandardMaterial({ color: 0xe08d9c, roughness: 0.6 });
    
    // Outer petals
    for (let i = 0; i < 5; i++) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), petalMat);
      const angle = (i / 5) * Math.PI * 2;
      petal.position.x = Math.cos(angle) * 0.2;
      petal.position.z = Math.sin(angle) * 0.2;
      petal.scale.set(1.2, 1, 0.5);
      petal.rotation.y = angle + Math.PI/2;
      headGroup.add(petal);
    }
    // Inner bud
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), petalMat);
    bud.scale.set(1, 1.3, 1);
    headGroup.add(bud);
  } else {
    // Sunflower (brown disk center + yellow outer cones)
    const centerMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const centerDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16), centerMat);
    centerDisk.rotation.x = Math.PI / 2;
    headGroup.add(centerDisk);

    const petalMat = new THREE.MeshStandardMaterial({ color: 0xffca28, roughness: 0.4 });
    const petalGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
    petalGeo.rotateX(Math.PI / 2);
    
    for (let i = 0; i < 16; i++) {
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const angle = (i / 16) * Math.PI * 2;
      petal.position.x = Math.cos(angle) * 0.35;
      petal.position.y = Math.sin(angle) * 0.35;
      petal.rotation.z = angle + Math.PI / 2;
      headGroup.add(petal);
    }
    headGroup.rotation.x = Math.PI / 6; // slightly face camera
  }

  group.add(headGroup);
  return group;
}

function createParticles() {
  const particleCount = 120;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 15; // X
    positions[i + 1] = Math.random() * 8 - 2;   // Y
    positions[i + 2] = (Math.random() - 0.5) * 15; // Z
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Circular glow particles
  const material = new THREE.PointsMaterial({
    color: 0xfff9e3,
    size: 0.12,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClickBox() {
  if (isOpened) return;

  // Set up raycaster
  raycaster.setFromCamera(mouse, camera);
  
  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(giftBox.children, true);

  if (intersects.length > 0) {
    openBox();
  }
}

// API trigger to open the box from outside Three.js
function triggerBoxOpen() {
  openBox();
}

function openBox() {
  if (isOpened) return;
  isOpened = true;

  // Custom callback to app.js
  if (window.onGiftBoxOpenStart) {
    window.onGiftBoxOpenStart();
  }

  // GSAP animation for Lid flying off
  gsap.to(boxLid.position, {
    y: 3.5,
    x: -0.5,
    duration: 1.5,
    ease: "power2.out"
  });
  
  gsap.to(boxLid.rotation, {
    z: Math.PI / 3,
    x: -Math.PI / 4,
    duration: 1.5,
    ease: "power2.out"
  });

  // Ribbons separating
  gsap.to(ribbonGroup.scale, {
    x: 0,
    z: 0,
    y: 0,
    duration: 0.8,
    ease: "power2.in"
  });

  // Bow separating
  gsap.to(bowGroup.position, {
    y: 4,
    x: 0.5,
    duration: 1.5,
    ease: "power2.out"
  });

  // Zoom camera in slightly
  gsap.to(camera.position, {
    z: 7,
    y: 2,
    duration: 2,
    ease: "power2.out"
  });

  // Emerge multiple new flowers from inside the box
  setTimeout(() => {
    const freshFlowers = [];
    const types = ['tulip', 'rose', 'sunflower'];
    const colors = [0xffd1d5, 0xffede3, 0xffeb3b];

    for (let k = 0; k < 12; k++) {
      const type = types[k % 3];
      const color = colors[k % 3];
      const fl = createProceduralFlower(type, color);
      fl.scale.set(0, 0, 0);
      fl.position.set(0, 0, 0);
      scene.add(fl);
      freshFlowers.push(fl);

      // Shoot upward
      gsap.to(fl.position, {
        x: (Math.random() - 0.5) * 5,
        y: Math.random() * 5 + 3,
        z: Math.random() * 4 - 2,
        duration: 2.5 + Math.random() * 1.5,
        ease: "power1.out",
        delay: k * 0.1
      });

      // Scale up
      gsap.to(fl.scale, {
        x: 0.6,
        y: 0.6,
        z: 0.6,
        duration: 1.5,
        ease: "back.out(1.7)",
        delay: k * 0.1
      });

      // Slowly rotate
      gsap.to(fl.rotation, {
        y: Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1),
        x: (Math.random() - 0.5) * 0.5,
        duration: 3 + Math.random() * 2,
        delay: k * 0.1
      });
    }

    // Explode floating particles inside box
    const pos = particles.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      if (Math.abs(pos[i]) < 1 && Math.abs(pos[i+2]) < 1) {
        gsap.to(pos, {
          [i]: pos[i] + (Math.random() - 0.5) * 10,
          [i+1]: pos[i+1] + Math.random() * 8 + 3,
          [i+2]: pos[i+2] + (Math.random() - 0.5) * 10,
          duration: 3,
          ease: "power2.out"
        });
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
    
    // Complete transition to landing page after animations settle
    setTimeout(() => {
      if (window.onGiftBoxOpenComplete) {
        window.onGiftBoxOpenComplete();
      }
      // Smoothly fade canvas out
      gsap.to(canvas, {
        opacity: 0,
        duration: 1.5,
        onComplete: () => {
          canvas.style.display = 'none';
        }
      });
    }, 2500);

  }, 400);
}

function animate(timestamp) {
  requestAnimationFrame(animate);

  const time = timestamp * 0.001 || 0;

  // Gentle floating tilt of the box based on mouse
  if (!isOpened) {
    giftBox.rotation.y = time * 0.15 + mouse.x * 0.3;
    giftBox.rotation.x = mouse.y * 0.2;
    giftBox.rotation.z = Math.sin(time) * 0.03;
  }

  // Animate orbiting flowers
  orbitingFlowers.forEach(flower => {
    const ud = flower.userData;
    
    if (!isOpened) {
      // Rotate angles
      ud.angle += ud.speed;
      flower.position.x = Math.cos(ud.angle) * ud.radius;
      flower.position.z = Math.sin(ud.angle) * ud.radius;
      // Bob up and down
      flower.position.y = ud.baseY + Math.sin(time * ud.bobSpeed * 10) * ud.bobHeight;
      // Spin flower
      flower.rotation.y += ud.rotationSpeed;
    } else {
      // If box is open, orbiting flowers spin away upwards
      flower.position.y += 0.05;
      flower.position.x += Math.cos(ud.angle) * 0.02;
      flower.position.z += Math.sin(ud.angle) * 0.02;
      flower.rotation.y += 0.05;
    }
  });

  // Slow particle movement
  if (particles) {
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += 0.005; // slowly drift upwards
      positions[i] += Math.sin(time + i) * 0.002; // side wobble
      
      // Reset if too high
      if (positions[i + 1] > 8) {
        positions[i + 1] = -2;
        positions[i] = (Math.random() - 0.5) * 15;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Expose open controls
window.triggerBoxOpen = triggerBoxOpen;
window.initThreeScene = initThreeScene;
