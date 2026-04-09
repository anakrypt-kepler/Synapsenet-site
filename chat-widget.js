
let chatOpen = false;
let savedScrollY = 0;
let botBusy = false;         
let activeInterval = null;   
let activeTimeout = null;    

function toggleChat() {
  const panel = document.getElementById('chat-panel');
  const toggle = document.getElementById('chat-toggle');
  chatOpen = !chatOpen;

  if (chatOpen) {
    panel.classList.add('open');
    toggle.classList.add('hidden');
    if (window.innerWidth <= 600) {
      savedScrollY = window.scrollY;
      document.body.classList.add('chat-open-mobile');
      document.body.style.top = -savedScrollY + 'px';
    }
  } else {
    
    if (document.body.classList.contains('chat-open-mobile')) {
      var bodyTop = parseInt(document.body.style.top || '0', 10);
      savedScrollY = Math.abs(bodyTop);
    }
    panel.classList.remove('open');
    toggle.classList.remove('hidden');
    
    stopBotOutput();
    if (document.body.classList.contains('chat-open-mobile')) {
      document.body.classList.remove('chat-open-mobile');
      document.body.style.top = '';
      window.scrollTo(0, savedScrollY);
    }
  }
}

function stopBotOutput() {
  if (activeInterval) { clearInterval(activeInterval); activeInterval = null; }
  if (activeTimeout) { clearTimeout(activeTimeout); activeTimeout = null; }
  removeTyping();
  botBusy = false;
}

function playChatTypingClick() {
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
  clickGain.gain.setValueAtTime(0.04 + Math.random() * 0.03, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
  source.connect(filter);
  filter.connect(clickGain);
  if (typeof typingGain !== 'undefined' && typingGain) {
    clickGain.connect(typingGain);
  } else if (typeof masterGain !== 'undefined' && masterGain) {
    clickGain.connect(masterGain);
  } else {
    clickGain.connect(audioCtx.destination);
  }
  source.start(now);
  source.stop(now + 0.02);
}

function parseBotText(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (html.includes('|')) {
    const lines = html.split('\n');
    let tableHtml = '';
    let inTable = false;
    let processed = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (trimmed.replace(/[|\-\s]/g, '') === '') continue;
        if (!inTable) { tableHtml = '<table class="chat-table">'; inTable = true; }
        const cells = trimmed.split('|').filter(c => c.trim() !== '');
        const tag = tableHtml.includes('<tr>') ? 'td' : 'th';
        tableHtml += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
      } else {
        if (inTable) { tableHtml += '</table>'; processed.push(tableHtml); tableHtml = ''; inTable = false; }
        processed.push(line);
      }
    }
    if (inTable) { tableHtml += '</table>'; processed.push(tableHtml); }
    html = processed.join('\n');
  }

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function typewriteBotMessage(container, html, callback) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg bot-msg';
  container.appendChild(msg);

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const segments = [];
  function walkNodes(node) {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        for (const ch of child.textContent) {
          segments.push({ type: 'char', value: ch });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'BR') {
          segments.push({ type: 'html', value: '<br>' });
        } else if (child.tagName === 'TABLE') {
          segments.push({ type: 'html', value: child.outerHTML });
        } else {
          segments.push({ type: 'tag-open', value: `<${child.tagName.toLowerCase()}>` });
          walkNodes(child);
          segments.push({ type: 'tag-close', value: `</${child.tagName.toLowerCase()}>` });
        }
      }
    }
  }
  walkNodes(temp);

  let currentHtml = '';
  let charIndex = 0;
  let clickCounter = 0;
  const charsPerFrame = 2;
  const intervalMs = 18;

  activeInterval = setInterval(() => {
    
    if (!chatOpen) {
      clearInterval(activeInterval);
      activeInterval = null;
      botBusy = false;
      return;
    }

    let added = 0;
    while (charIndex < segments.length && added < charsPerFrame) {
      const seg = segments[charIndex];
      if (seg.type === 'char') {
        currentHtml += seg.value;
        added++;
        clickCounter++;
        if (clickCounter % 4 === 0) playChatTypingClick();
      } else {
        currentHtml += seg.value;
      }
      charIndex++;
    }

    msg.innerHTML = currentHtml;
    container.scrollTop = container.scrollHeight;

    if (charIndex >= segments.length) {
      clearInterval(activeInterval);
      activeInterval = null;
      botBusy = false;
      if (callback) callback();
    }
  }, intervalMs);
}

function showTyping() {
  const container = document.getElementById('chat-messages');
  const typing = document.createElement('div');
  typing.className = 'chat-msg bot-msg typing-indicator';
  typing.id = 'typing-msg';
  typing.innerHTML = '<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-msg');
  if (el) el.remove();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;
  if (botBusy) return; 

  botBusy = true;
  input.value = '';

  const container = document.getElementById('chat-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user-msg';
  userMsg.textContent = message;
  container.appendChild(userMsg);
  container.scrollTop = container.scrollHeight;

  showTyping();

  activeTimeout = setTimeout(function () {
    activeTimeout = null;
    if (!chatOpen) { botBusy = false; return; }
    const data = window.clientGenerateResponse(message);
    removeTyping();
    const html = parseBotText(data.text);
    typewriteBotMessage(container, html);
  }, 300 + Math.random() * 200);
}

function askHint(el) {
  const text = el.textContent.trim();
  if (!text) return;
  if (botBusy) return; 

  botBusy = true;

  const container = document.getElementById('chat-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user-msg';
  userMsg.textContent = text;
  container.appendChild(userMsg);
  container.scrollTop = container.scrollHeight;

  showTyping();

  activeTimeout = setTimeout(function () {
    activeTimeout = null;
    if (!chatOpen) { botBusy = false; return; }
    const data = window.clientGenerateResponse(text);
    removeTyping();
    const html = parseBotText(data.text);
    typewriteBotMessage(container, html);
  }, 300 + Math.random() * 200);
}

(function() {
  function initScrollBlock() {
    var panel = document.getElementById('chat-panel');
    if (!panel) return;

    panel.addEventListener('wheel', function(e) {
      var target = e.target;
      var scrollable = target.closest('#chat-messages') || target.closest('#chat-hints');

      if (scrollable) {
        var st = scrollable.scrollTop;
        var sh = scrollable.scrollHeight;
        var ch = scrollable.clientHeight;
        var canScroll = sh > ch;
        var atTop = st <= 0;
        var atBottom = st + ch >= sh - 1;

        if (canScroll && !atTop && !atBottom) {
          e.stopPropagation();
          return;
        }
        if (canScroll) {
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
            e.stopPropagation();
            return;
          }
        }
      }
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    panel.addEventListener('touchmove', function(e) {
      e.stopPropagation();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollBlock);
  } else {
    initScrollBlock();
  }
})();

window.toggleChat = toggleChat;
window.sendChat = sendChat;
window.askHint = askHint;
