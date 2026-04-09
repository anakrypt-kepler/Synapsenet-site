
let audioCtx = null;
let musicPlaying = false;
let musicNodes = [];
let masterGain = null;
let typingGain = null;
let musicGain = null;
let audioInitialized = false;

function initAudio() {
  if (audioInitialized) return;
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 1.0;
  masterGain.connect(audioCtx.destination);
  
  typingGain = audioCtx.createGain();
  typingGain.gain.value = 0.12;
  typingGain.connect(masterGain);
  
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.0;
  musicGain.connect(masterGain);
  
  audioInitialized = true;
  
  const overlay = document.getElementById('audio-start');
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  setTimeout(() => overlay.style.display = 'none', 500);
  
  function tryStartHero() {
    if (typeof window.startHeroAnimations === 'function') {
      window.startHeroAnimations();
    } else {
      setTimeout(tryStartHero, 100);
    }
  }
  tryStartHero();
  
  const ghLink = document.getElementById('github-link');
  if (ghLink) ghLink.classList.add('visible');
  
  setTimeout(() => { const heroImg = document.querySelector('.hero-image'); if (heroImg) { heroImg.style.transition = 'opacity 1s ease, transform 1s ease'; heroImg.style.opacity = '0.75'; heroImg.style.transform = 'translateY(0)'; }}, 200);
  
  const spiralNav = document.getElementById('spiral-nav');
  if (spiralNav) spiralNav.classList.add('visible');
  
  const guideLine = document.getElementById('guide-line');
  if (guideLine) guideLine.classList.add('visible');
  
  const chatToggle = document.getElementById('chat-toggle');
  if (chatToggle) chatToggle.classList.add('visible');
  
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) mobileNav.style.display = '';
  
  startAmbientMusic();
  
  setupTypingSounds();
}

function playTypingClick() {
  if (!audioCtx || !audioInitialized) return;
  
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
  source.stop(now + 0.025);
}

function setupTypingSounds() {
  
  const chars = document.querySelectorAll('.char');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const el = mutation.target;
        const opacity = parseFloat(getComputedStyle(el).opacity);
        if (opacity > 0.5 && !el.dataset.clicked) {
          el.dataset.clicked = 'true';
          playTypingClick();
        }
      }
    });
  });
  
  chars.forEach(char => {
    observer.observe(char, { attributes: true, attributeFilter: ['style'] });
  });
  
  const fadeEls = document.querySelectorAll('[data-animate="fade-up"]');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.soundPlayed) {
        entry.target.dataset.soundPlayed = 'true';
        
        playBlockRevealSound();
      }
    });
  }, { threshold: 0.3 });
  
  fadeEls.forEach(el => fadeObserver.observe(el));
}

function playBlockRevealSound() {
  if (!audioCtx || !audioInitialized) return;
  
  const now = audioCtx.currentTime;
  const bufferSize = audioCtx.sampleRate * 0.04;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    const env = Math.exp(-i / (bufferSize * 0.2));
    data[i] = (Math.random() * 2 - 1) * env * 0.3;
  }
  
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  
  const g = audioCtx.createGain();
  g.gain.value = 0.15;
  
  source.connect(filter);
  filter.connect(g);
  g.connect(typingGain);
  source.start(now);
  source.stop(now + 0.05);
}

function startAmbientMusic() {
  if (!audioCtx) return;
  
  musicPlaying = true;
  
  musicGain.gain.setValueAtTime(0, audioCtx.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 4);
  
  const droneFreqs = [65.41, 98.0, 130.81];
  
  droneFreqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1 + i * 0.05;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.5 + i * 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    const g = audioCtx.createGain();
    g.gain.value = 0.25 - i * 0.05;
    
    osc.connect(g);
    g.connect(musicGain);
    osc.start();
    
    musicNodes.push(osc, lfo);
  });
  
  const shimmerFreqs = [261.63, 392.0, 523.25]; 
  
  shimmerFreqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const ampLfo = audioCtx.createOscillator();
    ampLfo.type = 'sine';
    ampLfo.frequency.value = 0.03 + i * 0.02; 
    const ampLfoGain = audioCtx.createGain();
    ampLfoGain.gain.value = 0.04;
    
    const baseGain = audioCtx.createGain();
    baseGain.gain.value = 0.04;
    
    ampLfo.connect(ampLfoGain);
    ampLfoGain.connect(baseGain.gain);
    
    osc.connect(baseGain);
    baseGain.connect(musicGain);
    
    osc.start();
    ampLfo.start();
    
    musicNodes.push(osc, ampLfo);
  });
  
  const noiseSize = audioCtx.sampleRate * 4;
  const noiseBuffer = audioCtx.createBuffer(1, noiseSize, audioCtx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseSize; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }
  
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 400;
  noiseFilter.Q.value = 0.5;
  
  const noiseLfo = audioCtx.createOscillator();
  noiseLfo.type = 'sine';
  noiseLfo.frequency.value = 0.05;
  const noiseLfoGain = audioCtx.createGain();
  noiseLfoGain.gain.value = 200;
  noiseLfo.connect(noiseLfoGain);
  noiseLfoGain.connect(noiseFilter.frequency);
  
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.015;
  
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(musicGain);
  
  noise.start();
  noiseLfo.start();
  
  musicNodes.push(noise, noiseLfo);
  
  scheduleBellTone();
  
}

function scheduleBellTone() {
  if (!musicPlaying || !audioCtx) return;
  
  const delay = 4000 + Math.random() * 8000; 
  
  setTimeout(() => {
    if (!musicPlaying || !audioCtx) return;
    
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; 
    const freq = notes[Math.floor(Math.random() * notes.length)];
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.03, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3);
    
    osc.connect(g);
    g.connect(musicGain);
    osc.start(now);
    osc.stop(now + 3.5);
    
    scheduleBellTone();
  }, delay);
}

function stopAmbientMusic() {
  musicPlaying = false;
  
  if (musicGain) {
    musicGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
  }
  
  setTimeout(() => {
    musicNodes.forEach(node => {
      try { node.stop(); } catch(e) {}
    });
    musicNodes = [];
  }, 1200);
  
}

function toggleMusic() {}

function updatePlayerUI() {}

window.initAudio = initAudio;
window.toggleMusic = toggleMusic;
