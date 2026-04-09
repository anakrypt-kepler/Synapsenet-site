import * as THREE from 'three';

const canvas = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);

let scrollProgress = 0;
let currentScroll = 0;
let targetScroll = 0;

const wireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.08 });
const wireMatBright = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.15 });
const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });

const cubes = [];
const cubeCount = 50;
for (let i = 0; i < cubeCount; i++) {
  const size = Math.random() * 1.5 + 0.3;
  const geo = new THREE.BoxGeometry(size, size, size);
  const mat = i < 8 ? wireMatBright.clone() : wireMat.clone();
  mat.opacity = Math.random() * 0.12 + 0.03;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    (Math.random() - 0.5) * 60,
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 40 - 10
  );
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  mesh.userData = {
    rotSpeed: (Math.random() - 0.5) * 0.008,
    rotSpeedY: (Math.random() - 0.5) * 0.006,
    floatSpeed: Math.random() * 0.0005 + 0.0002,
    floatOffset: Math.random() * Math.PI * 2,
    baseY: mesh.position.y
  };
  scene.add(mesh);
  cubes.push(mesh);
}

const spheres = [];
const sphereCount = 15;
for (let i = 0; i < sphereCount; i++) {
  const radius = Math.random() * 2 + 1;
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  const mat = wireMat.clone();
  mat.opacity = Math.random() * 0.08 + 0.03;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 30 - 15
  );
  mesh.userData = {
    rotSpeed: (Math.random() - 0.5) * 0.003,
    baseY: mesh.position.y
  };
  scene.add(mesh);
  spheres.push(mesh);
}

const octahedrons = [];
for (let i = 0; i < 12; i++) {
  const geo = new THREE.OctahedronGeometry(Math.random() * 1.5 + 0.8, 0);
  const mat = wireMat.clone();
  mat.opacity = Math.random() * 0.1 + 0.04;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 25 - 12
  );
  mesh.userData = {
    rotSpeed: (Math.random() - 0.5) * 0.005,
  };
  scene.add(mesh);
  octahedrons.push(mesh);
}

const particleCount = 900;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const particleSpeeds = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 80;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
  particleSpeeds[i] = Math.random() * 0.02 + 0.005;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.5,
  transparent: true,
  opacity: 0.25,
  sizeAttenuation: true
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

const rainLines = [];
const rainCount = 60;
for (let i = 0; i < rainCount; i++) {
  const lineGeo = new THREE.BufferGeometry();
  const y = (Math.random() - 0.5) * 200;
  const x = (Math.random() - 0.5) * 70;
  const z = (Math.random() - 0.5) * 30 - 20;
  const length = Math.random() * 8 + 2;
  const pts = new Float32Array([x, y, z, x, y - length, z]);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: Math.random() * 0.1 + 0.02
  });
  const line = new THREE.Line(lineGeo, lineMat);
  line.userData = {
    speed: Math.random() * 0.3 + 0.1,
    resetY: y + 100,
    length: length
  };
  scene.add(line);
  rainLines.push(line);
}

const connectionLines = [];
function updateConnections() {
  
  connectionLines.forEach(l => scene.remove(l));
  connectionLines.length = 0;

  for (let i = 0; i < cubes.length; i++) {
    for (let j = i + 1; j < cubes.length; j++) {
      const dist = cubes[i].position.distanceTo(cubes[j].position);
      if (dist < 15) {
        const geo = new THREE.BufferGeometry().setFromPoints([
          cubes[i].position,
          cubes[j].position
        ]);
        const mat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: Math.max(0.01, 0.06 - dist * 0.004)
        });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        connectionLines.push(line);
      }
    }
  }
}

const clock = new THREE.Clock();
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  frameCount++;

  currentScroll += (targetScroll - currentScroll) * 0.05;

  cubes.forEach((cube, i) => {
    const d = cube.userData;
    cube.rotation.x += d.rotSpeed * (1 + scrollProgress * 2);
    cube.rotation.y += d.rotSpeedY * (1 + scrollProgress * 2);
    cube.position.y = d.baseY + Math.sin(time * d.floatSpeed * 100 + d.floatOffset) * 1.5;
    
    cube.position.y += currentScroll * 0.02 * (i % 3 === 0 ? 1.5 : 0.5);
  });

  spheres.forEach((sphere) => {
    sphere.rotation.x += sphere.userData.rotSpeed;
    sphere.rotation.y += sphere.userData.rotSpeed * 0.7;
  });

  octahedrons.forEach((oct) => {
    oct.rotation.x += oct.userData.rotSpeed;
    oct.rotation.z += oct.userData.rotSpeed * 0.5;
  });

  const posArr = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    posArr[i * 3 + 1] += particleSpeeds[i];
    if (posArr[i * 3 + 1] > 125) {
      posArr[i * 3 + 1] = -125;
      posArr[i * 3] = (Math.random() - 0.5) * 80;
    }
  }
  particles.geometry.attributes.position.needsUpdate = true;

  rainLines.forEach(line => {
    const posAttr = line.geometry.attributes.position;
    const arr = posAttr.array;
    arr[1] -= line.userData.speed;
    arr[4] -= line.userData.speed;
    if (arr[1] < -100) {
      arr[1] = line.userData.resetY;
      arr[4] = arr[1] - line.userData.length;
    }
    posAttr.needsUpdate = true;
  });

  camera.position.x = Math.sin(scrollProgress * Math.PI * 0.5) * 5;
  camera.position.y = scrollProgress * -15;
  camera.position.z = 30 - scrollProgress * 10;
  camera.rotation.z = Math.sin(scrollProgress * Math.PI) * 0.02;
  camera.lookAt(0, camera.position.y, 0);

  if (frameCount % 60 === 0) {
    updateConnections();
  }

  renderer.render(scene, camera);
}

window.addEventListener('scroll', () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = window.scrollY / maxScroll;
  targetScroll = window.scrollY;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateConnections();
animate();

gsap.registerPlugin(ScrollTrigger);

function splitTextIntoChars(el) {
  const text = el.textContent;
  el.textContent = '';
  text.split('').forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.setProperty('--char-index', i);
    el.appendChild(span);
  });
}

document.querySelectorAll('[data-animate="letters"]').forEach(el => {
  splitTextIntoChars(el);
});

window.startHeroAnimations = function() {
  const heroChars = document.querySelectorAll('.hero-title .char');
  let heroLastRevealed = 0;
  gsap.to(heroChars, {
    opacity: 1,
    duration: 0.05,
    stagger: 0.06,
    delay: 0.3,
    ease: 'none',
    onUpdate: function() {
      let revealed = 0;
      heroChars.forEach(ch => {
        if (parseFloat(getComputedStyle(ch).opacity) > 0.5) revealed++;
      });
      while (heroLastRevealed < revealed) {
        if (typeof playTypingClick === 'function') playTypingClick();
        heroLastRevealed++;
      }
    }
  });

  document.querySelectorAll('.section-hero [data-animate="fade-up"]').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0);
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 1.0 + delay,
      ease: 'power2.out'
    });
  });
};

document.querySelectorAll('.section:not(.section-hero) [data-animate="letters"]').forEach(el => {
  const chars = el.querySelectorAll('.char');
  let lastRevealed = 0;
  gsap.to(chars, {
    opacity: 1,
    duration: 0.05,
    stagger: 0.03,
    ease: 'none',
    scrollTrigger: {
      trigger: el,
      start: 'top 95%',
      toggleActions: 'play none none none'
    },
    onUpdate: function() {
      
      let revealed = 0;
      chars.forEach(ch => {
        if (parseFloat(getComputedStyle(ch).opacity) > 0.5) revealed++;
      });
      
      while (lastRevealed < revealed) {
        if (typeof playTypingClick === 'function') playTypingClick();
        lastRevealed++;
      }
    }
  });
});

function wrapTextChars(el) {
  const nodes = Array.from(el.childNodes);
  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const frag = document.createDocumentFragment();
      node.textContent.split('').forEach(ch => {
        const span = document.createElement('span');
        span.className = 'tchar';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        frag.appendChild(span);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      
      wrapTextChars(node);
    }
  });
}

function prepareTypewrite(el) {
  if (el.dataset.typewriteReady) return;
  el.dataset.typewriteReady = 'true';
  wrapTextChars(el);
  el.querySelectorAll('.tchar').forEach(ch => {
    ch.style.opacity = '0';
  });
}

const allParas = document.querySelectorAll(
  '.section:not(.section-hero) p[data-animate="fade-up"]'
);

const allLis = document.querySelectorAll(
  '.section:not(.section-hero) li'
);

const allH3Fade = document.querySelectorAll(
  '.section:not(.section-hero) h3[data-animate="fade-up"]:not([data-animate="letters"])'
);

const nestedParas = document.querySelectorAll(
  '.section:not(.section-hero) .details-block p, .section:not(.section-hero) .details-block h3, .section:not(.section-hero) .how-details p, .section:not(.section-hero) .how-details h3, .section:not(.section-hero) .philosophy-block h3, .section:not(.section-hero) .comparison h3'
);

const footerTagline = document.querySelector('.footer-tagline');
const footerMeta = document.querySelector('.footer-meta');
const securityNote = document.querySelector('.security-note');
const limitationsIntro = document.querySelector('.limitations-intro');

const allTypewriteTargets = new Set([
  ...allParas,
  ...allLis,
  ...allH3Fade,
  ...nestedParas
]);

[footerTagline, footerMeta, securityNote, limitationsIntro].forEach(el => {
  if (el) allTypewriteTargets.add(el);
});

allTypewriteTargets.forEach(el => {
  
  if (el.getAttribute('data-animate') === 'letters') return;
  
  if (el.tagName === 'H2') return;
  prepareTypewrite(el);
});

const compareRows = document.querySelectorAll('.compare-row:not(.compare-header)');
compareRows.forEach(row => {
  if (!row.dataset.typewriteReady) {
    row.dataset.typewriteReady = 'true';
    row.querySelectorAll('span').forEach(span => wrapTextChars(span));
    row.querySelectorAll('.tchar').forEach(ch => { ch.style.opacity = '0'; });
  }
});

const secLayers = document.querySelectorAll('.security-layer');
secLayers.forEach(layer => {
  if (!layer.dataset.typewriteReady) {
    layer.dataset.typewriteReady = 'true';
    layer.querySelectorAll('h4, p').forEach(el => wrapTextChars(el));
    layer.querySelectorAll('.tchar').forEach(ch => { ch.style.opacity = '0'; });
  }
});

const flowNodes = document.querySelectorAll('.flow-node, .flow-arrow');
flowNodes.forEach(el => {
  prepareTypewrite(el);
});

const archNodes = document.querySelectorAll('.arch-node, .arch-arrow');
archNodes.forEach(el => {
  prepareTypewrite(el);
});

document.querySelectorAll('.code-block pre code').forEach(el => {
  prepareTypewrite(el);
});

document.querySelectorAll('.stat-item').forEach(el => {
  prepareTypewrite(el);
});

document.querySelectorAll('.terminal-output pre').forEach(el => {
  prepareTypewrite(el);
});

document.querySelectorAll('.module-card').forEach(el => {
  prepareTypewrite(el);
});

document.querySelectorAll('.inspired-name, .inspired-desc').forEach(el => {
  prepareTypewrite(el);
});

function playSoftTypingClick() {
  if (typeof audioCtx === 'undefined' || !audioCtx || !audioInitialized) return;
  const now = audioCtx.currentTime;
  const bufferSize = audioCtx.sampleRate * 0.01; 
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const env = Math.exp(-i / (bufferSize * 0.12));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2500 + Math.random() * 1500;
  filter.Q.value = 1.2;
  const clickGain = audioCtx.createGain();
  clickGain.gain.setValueAtTime(0.06 + Math.random() * 0.04, now); 
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
  source.connect(filter);
  filter.connect(clickGain);
  clickGain.connect(typingGain);
  source.start(now);
  source.stop(now + 0.02);
}

const typewriteObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const el = entry.target;
    if (!el._typewriteTween) return;
    if (entry.isIntersecting) {
      el._typewriteTween.resume();
    } else {
      el._typewriteTween.pause();
    }
  });
}, { threshold: 0.01 });

function typewriteElement(el) {
  const chars = el.querySelectorAll('.tchar');
  if (!chars.length) return;
  
  if (el._typewriteTween && el._typewriteTween.isActive()) return;
  let clickCounter = 0;
  el._typewriteTween = gsap.to(chars, {
    opacity: 1,
    duration: 0.02,
    stagger: 0.018,
    ease: 'none',
    onUpdate: function() {
      clickCounter++;
      if (clickCounter % 5 === 0) playSoftTypingClick(); 
    },
    onComplete: function() {
      
      typewriteObserver.unobserve(el);
      el._typewriteTween = null;
    }
  });
  
  typewriteObserver.observe(el);

  const rect = el.getBoundingClientRect();
  const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
  if (!isVisible) {
    el._typewriteTween.pause();
  }
}

function typewriteWithDelay(el, delay) {
  setTimeout(() => typewriteElement(el), delay);
}

document.querySelectorAll('.section:not(.section-hero) [data-animate="fade-up"]').forEach(el => {
  
  if (el.tagName === 'LI') return;
  if (el.tagName === 'UL') return; 
  if (el.classList.contains('compare-row')) return;
  if (el.classList.contains('security-layer')) return;
  if (el.classList.contains('flow-node') || el.classList.contains('flow-arrow')) return;
  if (el.classList.contains('flow-diagram')) return; 
  if (el.closest('.arch-flow')) return; 
  
  if (el.classList.contains('comparison')) return;
  
  if (el.classList.contains('footer-tagline')) return;
  if (el.classList.contains('footer-meta')) return;

  const hasTypewrite = el.dataset.typewriteReady === 'true';
  
  const typewriteChildren = el.querySelectorAll('[data-typewrite-ready="true"]');
  const hasTypewriteChildren = typewriteChildren.length > 0;
  const shouldTypewrite = hasTypewrite || hasTypewriteChildren;

  gsap.to(el, {
    opacity: shouldTypewrite ? 0.85 : 1,
    y: 0,
    duration: 0.4,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 95%',
      toggleActions: 'play none none none'
    },
    onComplete: () => {
      
      if (hasTypewrite) {
        typewriteElement(el);
      }
      
      if (hasTypewriteChildren) {
        let delayIndex = 0;
        typewriteChildren.forEach(child => {
          if (child.tagName === 'LI') return; 
          typewriteWithDelay(child, delayIndex * 100);
          delayIndex++;
        });
      }
    }
  });
});

document.querySelectorAll('.section:not(.section-hero) ul').forEach(ul => {
  const items = ul.querySelectorAll('li');
  const staggerDelay = 0.06; 
  const itemDuration = 0.4;

  if (ul.getAttribute('data-animate') === 'fade-up') {
    gsap.to(ul, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ul,
        start: 'top 95%',
        toggleActions: 'play none none none'
      }
    });
  }

  items.forEach((li, i) => {
    gsap.fromTo(li,
      { opacity: 0, x: -10 },
      {
        opacity: 0.85,
        x: 0,
        duration: itemDuration,
        delay: i * staggerDelay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ul,
          start: 'top 95%',
          toggleActions: 'play none none none'
        },
        onComplete: () => {
          if (li.dataset.typewriteReady === 'true') typewriteElement(li);
        }
      }
    );
  });
});

const flowDiagram = document.querySelector('.flow-diagram[data-animate="fade-up"]');
if (flowDiagram) {
  gsap.to(flowDiagram, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: flowDiagram,
      start: 'top 95%',
      toggleActions: 'play none none none'
    }
  });
}
if (flowNodes.length) {
  const staggerDelay = 0.12;
  flowNodes.forEach((node, i) => {
    gsap.fromTo(node,
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        delay: i * staggerDelay,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.flow-diagram',
          start: 'top 95%',
          toggleActions: 'play none none none'
        },
        onComplete: () => {
          if (node.dataset.typewriteReady === 'true') typewriteElement(node);
        }
      }
    );
  });
}

const comparisonContainer = document.querySelector('.comparison[data-animate="fade-up"]');
if (comparisonContainer) {
  
  const comparisonTypewriteChildren = comparisonContainer.querySelectorAll('[data-typewrite-ready="true"]');
  gsap.to(comparisonContainer, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: comparisonContainer,
      start: 'top 95%',
      toggleActions: 'play none none none'
    },
    onComplete: () => {
      comparisonTypewriteChildren.forEach(child => {
        typewriteElement(child);
      });
    }
  });
}
if (compareRows.length) {
  const staggerDelay = 0.07;
  compareRows.forEach((row, i) => {
    gsap.fromTo(row,
      { opacity: 0, x: -15, y: 0 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.35,
        delay: i * staggerDelay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.compare-grid',
          start: 'top 95%',
          toggleActions: 'play none none none'
        },
        onComplete: () => {
          typewriteElement(row);
        }
      }
    );
  });
}

if (secLayers.length) {
  const staggerDelay = 0.15;
  secLayers.forEach((layer, i) => {
    gsap.fromTo(layer,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        delay: i * staggerDelay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: secLayers[0],
          start: 'top 95%',
          toggleActions: 'play none none none'
        },
        onComplete: () => {
          typewriteElement(layer);
        }
      }
    );
  });
}

if (footerTagline) {
  gsap.fromTo(footerTagline,
    { opacity: 0, scale: 0.9, letterSpacing: '8px' },
    {
      opacity: 1,
      scale: 1,
      letterSpacing: '3px',
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: footerTagline,
        start: 'top 95%',
        toggleActions: 'play none none none'
      },
      onComplete: () => {
        typewriteElement(footerTagline);
      }
    }
  );
}

if (footerMeta) {
  gsap.fromTo(footerMeta,
    { opacity: 0, y: 10 },
    {
      opacity: 0.3,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: footerMeta,
        start: 'top 95%',
        toggleActions: 'play none none none'
      },
      onComplete: () => {
        typewriteElement(footerMeta);
      }
    }
  );
}

const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section[data-section]');

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const targetSection = document.querySelector(`[data-section="${item.dataset.target}"]`);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

function updateSpiralNav() {
  const scrollY = window.scrollY;
  const windowH = window.innerHeight;
  const isMobile = window.innerWidth <= 600;

  let activeIndex = 0;
  sections.forEach((sec, i) => {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= windowH * 0.5) {
      activeIndex = i;
    }
  });

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll - window.scrollY < 50) {
    activeIndex = sections.length - 1;
  }

  navItems.forEach((item, i) => {
    
    if (i === activeIndex) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }

    const wave = Math.sin((scrollY * 0.003) + (i * 0.6)) * 8;

    if (isMobile) {
      item.style.transform = i === activeIndex
        ? `translateY(${wave}px) scale(1.15)`
        : `translateY(${wave}px) scale(1)`;
    } else {
      item.style.transform = i === activeIndex
        ? `translateX(${wave}px) scale(1.1)`
        : `translateX(${wave}px) scale(1)`;
    }
  });
}

window.addEventListener('scroll', updateSpiralNav);
updateSpiralNav();

const sectionOrder = ['hero','what','limitations','philosophy','how','web4','localai','knowledge','security','naan','implant','poe','sourcecode','architecture','corecode','stats','build','modules','inspired','footer'];
const sectionNames = {
  hero: 'SynapseNet',
  what: 'What Is',
  limitations: 'Limits',
  philosophy: 'Philosophy',
  how: 'How',
  web4: 'Web 4.0',
  localai: 'Local AI',
  knowledge: 'Knowledge',
  security: 'Security',
  naan: 'NAAN',
  implant: 'Implant',
  poe: 'PoE',
  sourcecode: 'Source',
  architecture: 'Arch',
  corecode: 'C++',
  stats: 'Stats',
  build: 'Build',
  modules: 'Modules',
  inspired: 'Inspired',
  footer: 'Future'
};

function getActiveSectionIndex() {
  const windowH = window.innerHeight;
  let activeIdx = 0;
  sectionOrder.forEach((key, i) => {
    const sec = document.querySelector(`[data-section="${key}"]`);
    if (sec) {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= windowH * 0.5) {
        activeIdx = i;
      }
    }
  });

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll - window.scrollY < 50) {
    activeIdx = sectionOrder.length - 1;
  }

  return activeIdx;
}

function updateMobileNav() {
  if (window.innerWidth > 600) return;
  const label = document.getElementById('mobile-nav-label');
  if (!label) return;
  const idx = getActiveSectionIndex();
  const nextIdx = Math.min(idx + 1, sectionOrder.length - 1);
  if (nextIdx !== idx) {
    label.textContent = sectionNames[sectionOrder[nextIdx]] || '';
  } else {
    label.textContent = '';
  }
}

window.scrollToNextSection = function() {
  const activeIdx = getActiveSectionIndex();
  const allSections = sectionOrder.map(key => document.querySelector(`[data-section="${key}"]`)).filter(Boolean);
  const nextIdx = Math.min(activeIdx + 1, allSections.length - 1);
  const nextSec = allSections[nextIdx];
  if (nextSec) {
    nextSec.scrollIntoView({ behavior: 'smooth' });
  }
};

window.addEventListener('scroll', updateMobileNav);
updateMobileNav();

const fileTreeLines = document.querySelectorAll('.file-tree-line');
if (fileTreeLines.length) {
  fileTreeLines.forEach((line, i) => {
    const isDir = line.classList.contains('is-dir');
    gsap.to(line, {
      opacity: isDir ? 0.9 : 0.7,
      duration: 0.15,
      delay: i * 0.04,
      ease: 'none',
      scrollTrigger: {
        trigger: '.file-tree',
        start: 'top 95%',
        toggleActions: 'play none none none'
      },
      onComplete: () => {
        if (i % 3 === 0 && typeof playSoftTypingClick === 'function') playSoftTypingClick();
      }
    });
  });
}

const archFlowItems = document.querySelectorAll('.arch-flow > [data-animate="fade-up"]');
if (archFlowItems.length) {
  archFlowItems.forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: i * 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.arch-flow',
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        onComplete: () => {
          
          if (el.dataset.typewriteReady === 'true') typewriteElement(el);
          
          el.querySelectorAll('.arch-node').forEach((node, ni) => {
            if (node.dataset.typewriteReady === 'true') {
              setTimeout(() => typewriteElement(node), ni * 150);
            }
          });
        }
      }
    );
  });
}

const codeBlocks = document.querySelectorAll('.code-block');
if (codeBlocks.length) {
  codeBlocks.forEach((block, i) => {
    gsap.to(block, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay: i * 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: block,
        start: 'top 95%',
        toggleActions: 'play none none none'
      },
      onComplete: () => {
        const codeEl = block.querySelector('pre code');
        if (codeEl && codeEl.dataset.typewriteReady === 'true') {
          typewriteElement(codeEl);
        }
      }
    });
  });
}

const statItems = document.querySelectorAll('.stat-item');
if (statItems.length) {
  statItems.forEach((item, i) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      delay: i * 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.stat-grid',
        start: 'top 95%',
        toggleActions: 'play none none none'
      },
      onComplete: () => {
        if (item.dataset.typewriteReady === 'true') typewriteElement(item);
      }
    });
  });
}

const terminalOutputs = document.querySelectorAll('.terminal-output');
if (terminalOutputs.length) {
  terminalOutputs.forEach((block, i) => {
    gsap.to(block, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay: i * 0.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: block,
        start: 'top 95%',
        toggleActions: 'play none none none'
      },
      onComplete: () => {
        const pre = block.querySelector('pre');
        if (pre && pre.dataset.typewriteReady === 'true') typewriteElement(pre);
      }
    });
  });
}

const moduleCards = document.querySelectorAll('.module-card');
if (moduleCards.length) {
  moduleCards.forEach((card, i) => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      delay: i * 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.module-grid',
        start: 'top 95%',
        toggleActions: 'play none none none'
      },
      onComplete: () => {
        if (card.dataset.typewriteReady === 'true') typewriteElement(card);
      }
    });
  });
}

(function() {
  function updateGuideLine() {
    var svg = document.getElementById('guide-line');
    if (!svg) return;

    var indicator = document.querySelector('.scroll-indicator');
    var isMobile = window.innerWidth <= 600;
    var navArrow = isMobile 
      ? document.getElementById('mobile-nav-arrow') 
      : document.getElementById('desktop-nav-arrow');
    if (!indicator || !navArrow) return;

    var w = window.innerWidth;
    var h = window.innerHeight;

    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

    var indRect = indicator.getBoundingClientRect();
    var startX = indRect.left + indRect.width / 2;
    var startY = indRect.bottom;

    var arrowRect = navArrow.getBoundingClientRect();
    var endX, endY;
    if (isMobile) {
      endX = arrowRect.left + arrowRect.width / 2;
      endY = arrowRect.top + arrowRect.height / 2;
    } else {
      endX = arrowRect.left;
      endY = arrowRect.top + arrowRect.height / 2;
    }

    var d = 'M ' + startX + ' ' + startY + ' L ' + startX + ' ' + endY + ' L ' + endX + ' ' + endY;

    var guidePath = document.getElementById('guide-path');
    if (guidePath) guidePath.setAttribute('d', d);
  }

  function loop() {
    var gl = document.getElementById('guide-line');
    if (gl) {
      var scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > window.innerHeight * 0.3) {
        gl.style.opacity = '0';
      } else if (gl.classList.contains('visible')) {
        gl.style.opacity = '1';
        updateGuideLine();
      }
    }
    requestAnimationFrame(loop);
  }

  var glEl = document.getElementById('guide-line');
  if (glEl) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'class' && glEl.classList.contains('visible')) {
          updateGuideLine();
        }
      });
    });
    observer.observe(glEl, { attributes: true });
  }

  requestAnimationFrame(loop);
})();
