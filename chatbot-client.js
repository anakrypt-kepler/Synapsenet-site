
(function () {
  'use strict';

  let sections = [];
  let faq = [];
  let project = {};
  let keywordIndex = new Map();
  let knowledgeLoaded = false;

  const STOPWORDS = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','shall','should','may','might','must','can','could','of','in','to','for','with','on','at','by','from','as','into','through','during','before','after','above','below','between','out','off','over','under','again','further','then','once','here','there','all','both','each','few','more','most','other','some','such','nor','not','only','own','same','so','than','too','very','just','it','its','this','that','these','those','i','me','my','we','us','our','you','your','he','him','his','she','her','they','them','their','and','but','or','if']);

  function tokenize(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, ' ')
      .split(/[\s\-]+/)
      .filter(w => w.length > 0 && !STOPWORDS.has(w));
  }

  function buildKeywordIndex() {
    keywordIndex = new Map();
    sections.forEach((section, idx) => {
      section.keywords.forEach(kw => {
        const kwLower = kw.toLowerCase();
        if (!keywordIndex.has(kwLower)) keywordIndex.set(kwLower, []);
        keywordIndex.get(kwLower).push(idx);
      });
    });
  }

  function computeScore(queryTokens, section) {
    let score = 0;
    const keywordSet = new Set(section.keywords.map(k => k.toLowerCase()));
    const titleTokens = tokenize(section.title);

    if (!section._contentTokenSet) {
      section._contentTokenSet = new Set(tokenize(section.content));
    }
    const contentTokenSet = section._contentTokenSet;

    for (const qt of queryTokens) {
      
      if (keywordSet.has(qt)) {
        score += 12;
        continue; 
      }

      for (const kw of section.keywords) {
        const kwLower = kw.toLowerCase();
        if (kwLower.length > qt.length && kwLower.includes(' ')) {
          
          if (kwLower.split(/\s+/).includes(qt)) {
            score += 6;
          }
        }
      }

      if (qt.length >= 3) {
        for (const kw of section.keywords) {
          const kwLower = kw.toLowerCase();
          if (kwLower !== qt) {
            if (kwLower.startsWith(qt) || qt.startsWith(kwLower)) score += 5;
            else if (qt.length >= 4 && (kwLower.includes(qt) || qt.includes(kwLower))) score += 3;
          }
        }
      }

      if (titleTokens.includes(qt)) {
        score += 8;
      }
      
      for (const tt of titleTokens) {
        if (qt.length >= 3 && tt !== qt && (tt.startsWith(qt) || qt.startsWith(tt))) {
          score += 4;
        }
      }

      if (contentTokenSet.has(qt)) {
        score += 2;
      }
    }

    const matchedKeywords = queryTokens.filter(qt => keywordSet.has(qt)).length;
    if (matchedKeywords >= 2) score += matchedKeywords * 5;

    return score;
  }

  function findFaqMatch(query) {
    let bestMatch = null;
    let bestScore = 0;

    const queryTokens = tokenize(query);

    for (const item of faq) {
      const faqTokens = tokenize(item.q);
      let score = 0;

      for (const qt of queryTokens) {
        if (faqTokens.includes(qt)) score += 4;
        if (qt.length >= 3) {
          for (const ft of faqTokens) {
            if (ft !== qt && ft.length >= 3) {
              if (ft.startsWith(qt) || qt.startsWith(ft)) score += 2;
              else if (qt.length >= 4 && (ft.includes(qt) || qt.includes(ft))) score += 1;
            }
          }
        }
      }

      const synonymMap = {
        'secure': ['safe', 'security', 'protection', 'encryption'],
        'safe': ['secure', 'security'],
        'launch': ['release', 'when', 'date', 'available'],
        'earn': ['tokens', 'rewards', 'ngt', 'mining'],
        'model': ['llama', 'gguf', 'onnx'],
        'join': ['start', 'participate', 'connect', 'run'],
        'different': ['compare', 'versus', 'vs', 'unique'],
        'private': ['privacy', 'anonymous', 'tor', 'hidden'],
        'cost': ['free', 'price', 'pay']
      };
      for (const qt of queryTokens) {
        if (synonymMap[qt]) {
          for (const syn of synonymMap[qt]) {
            if (faqTokens.includes(syn)) score += 3;
          }
        }
        for (const [key, syns] of Object.entries(synonymMap)) {
          if (syns.includes(qt) && faqTokens.includes(key)) score += 3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    return bestScore >= 6 ? bestMatch : null;
  }

  const SYNAPSE_TERMS = new Set([
    'synapse', 'synapsenet', 'ngt', 'kepler', 'poe', 'naan', 'web4',
    'p2p', 'peer', 'dht', 'kademlia', 'gossip', 'tor', 'obfs4', 'socks5',
    'darknet', 'onion', 'bridge', 'relay',
    'decentralized', 'distributed', 'node', 'nodes', 'network',
    'intelligence', 'knowledge', 'collective',
    'token', 'tokens', 'mining', 'mine', 'miner',
    'security', 'crypto', 'encryption', 'quantum', 'encrypt',
    'ed25519', 'aes', 'kyber', 'dilithium', 'sphincs', 'otp', 'bb84',
    'blockchain', 'bitcoin', 'btc', 'chain',
    'consensus', 'validator', 'validators', 'validation', 'validate',
    'stake', 'staking', 'reputation',
    'agent', 'agents', 'autonomous', 'naan',
    'implant', 'neurochip', 'neural', 'brain', 'bci',
    'philosophy', 'limitation', 'limitations',
    'privacy', 'private', 'anonymous', 'anonymity', 'censorship',
    'contribute', 'contributor', 'contributing', 'reward', 'rewards', 'earn',
    'model', 'models', 'llama', 'gguf', 'onnx', 'inference', 'safetensors',
    'github', 'code', 'source', 'repository', 'repo', 'open',
    'project', 'version', 'release', 'alpha', 'alphaV4',
    'creator', 'founder', 'author',
    'future', 'vision', 'roadmap', 'concept', 'cortex', 'symbiosis',
    'spam', 'antispam', 'hashcash', 'collusion', 'sybil',
    'simhash', 'minhash', 'pagerank', 'citation', 'novelty',
    'emergence', 'deterministic', 'verifiable',
    'quality', 'score',
    'wallet', 'utxo', 'transaction', 'fee',
    'docker', 'tauri', 'desktop', 'tui', 'terminal', 'rpc',
    'architecture', 'runtime', 'module', 'component',
    'knowledge', 'replication', 'storage', 'capacity',
    'dandelion', 'stealth', 'amnesia',
    'how', 'what', 'who', 'when', 'where', 'why', 'which',
    'tell', 'explain', 'describe', 'compare', 'about',
    'work', 'works', 'run', 'running', 'start', 'join', 'use',
    'feature', 'features', 'support', 'supported',
    'safe', 'secure', 'protection',
    'web', 'clearnet',
    'ide', 'vscode', 'synapseid',
    'update', 'governance', 'manifest',
    'sandbox', 'python',
    'startup', 'boot', 'sequence',
    'remediation', 'backlog', 'blocker',
    'deferred', 'planned',
    'protocol', 'wire', 'handshake',
    'board', 'execution', 'development',
    'phases', 'phase', 'stage',
    'use', 'cases', 'benefits', 'users',
    'formula', 'math', 'theorem', 'proof'
  ]);

  const QUESTION_WORDS = new Set(['how', 'what', 'who', 'when', 'where', 'why', 'which', 'tell', 'explain', 'describe', 'compare', 'about', 'work', 'works', 'does', 'use', 'run']);

  function isOffTopic(query) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return false;

    const qLower = query.toLowerCase();
    if (/v0[\._]?[0-9]/.test(qLower) || /alpha/i.test(qLower)) return false;

    let hasSubstantiveMatch = false;

    for (const qt of queryTokens) {
      
      if (QUESTION_WORDS.has(qt)) continue;

      if (SYNAPSE_TERMS.has(qt)) {
        hasSubstantiveMatch = true;
        break;
      }
      
      if (qt.length >= 3) {
        for (const term of SYNAPSE_TERMS) {
          if (QUESTION_WORDS.has(term)) continue;
          if (term.startsWith(qt) || qt.startsWith(term)) { hasSubstantiveMatch = true; break; }
          if (qt.length >= 5 && term.length >= 5 && (term.includes(qt) || qt.includes(term))) { hasSubstantiveMatch = true; break; }
        }
        if (hasSubstantiveMatch) break;
      }
    }

    return !hasSubstantiveMatch;
  }

  const FALLBACK_LINKS = [
    { label: 'SynapseNet Whitepaper', url: 'https://github.com/anakrypt-kepler/SynapseNet' },
    { label: 'SynapseNet AI Repository', url: 'https://github.com/anakrypt-kepler/Synapsenetai' },
    { label: 'Kepler (Creator)', url: 'https://github.com/anakrypt-kepler' }
  ];

  function formatFallbackLinks() {
    return '\n\nFor more details, check:\n' + FALLBACK_LINKS.map(l => '> ' + l.label + ': ' + l.url).join('\n');
  }

  function generateResponse(query) {
    if (!knowledgeLoaded) {
      return { text: "Knowledge base is still loading. Please try again in a moment.", sources: [] };
    }

    if (!query || query.trim().length === 0) {
      return { text: "Ask me anything about SynapseNet — the decentralized intelligence network." + formatFallbackLinks(), sources: [] };
    }

    const greetings = ['hello', 'hi', 'hey', 'greetings', 'sup', 'yo', 'good morning', 'good evening', 'good afternoon'];
    const qLower = query.toLowerCase().trim().replace(/[!?.]+$/, '');
    if (greetings.includes(qLower)) {
      return {
        text: 'Welcome to SynapseNet — A Decentralized Intelligence Network.\n\n"' + project.quote + '"\n\nNote: SynapseNet is currently under active development. All information shown is from the whitepaper and design documentation.\n\nI can answer questions about: the project overview, how it works, Proof of Emergence, NGT tokens, security layers, NAAN agents, Web 4.0, Tor integration, P2P networking, architecture, and much more.\n\nWhat would you like to know?',
        sources: []
      };
    }

    if (isOffTopic(query)) {
      return {
        text: "I can only answer questions about the SynapseNet project.\n\nTry asking about: how it works, P2P networking, Tor integration, Proof of Emergence, NGT tokens, NAAN agents, security layers, the architecture, Docker deployment, or anything else about SynapseNet." + formatFallbackLinks(),
        sources: []
      };
    }

    const queryTokens = tokenize(query);

    const faqMatch = findFaqMatch(query);

    const scored = sections.map(s => ({ section: s, score: computeScore(queryTokens, s) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0 && !faqMatch) {
      return {
        text: "I don't have specific information about that in my knowledge base yet. This project is in active development — new documentation is being added regularly." + formatFallbackLinks(),
        sources: []
      };
    }

    let response = '';
    let sources = [];

    if (faqMatch) {
      response += faqMatch.a + '\n\n';
    }

    const maxSections = faqMatch ? 1 : 2;
    const topSections = scored.slice(0, maxSections);

    for (const { section } of topSections) {
      
      if (faqMatch && faqMatch.a.length > 80) {
        const faqTokens = new Set(tokenize(faqMatch.a));
        const sectionTokens = tokenize(section.content);
        const overlap = sectionTokens.filter(t => faqTokens.has(t)).length;
        if (overlap > 8) continue;
      }

      let content = section.content;
      if (content.length > 800) {
        
        const cutoff = content.indexOf('.', 750);
        if (cutoff > 0 && cutoff < 900) {
          content = content.substring(0, cutoff + 1);
        } else {
          content = content.substring(0, 800) + '...';
        }
      }

      response += '**' + section.title + '**\n' + content;
      sources.push(section.title);

      if (section.details && section.details.comparison_with_bitcoin) {
        const comp = section.details.comparison_with_bitcoin;
        response += '\n\n| Aspect | Bitcoin | SynapseNet |\n|--------|---------|------------|\n';
        const keys = Object.keys(comp.Bitcoin);
        for (const key of keys) {
          response += '| ' + key.charAt(0).toUpperCase() + key.slice(1) + ' | ' + comp.Bitcoin[key] + ' | ' + comp.SynapseNet[key] + ' |\n';
        }
      }

      response += '\n\n';
    }

    response += '\n\n*Note: SynapseNet is in active development. Details shown are from design docs and whitepaper.*';

    if (response.length < 200) {
      response += formatFallbackLinks();
    }

    return { text: response.trim(), sources: sources };
  }

  function loadKnowledge() {
    fetch('knowledge.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        sections = data.sections || [];
        faq = data.faq || [];
        project = data.project || {};
        buildKeywordIndex();
        knowledgeLoaded = true;
        console.log('[SynapseNet] Knowledge base loaded: ' + sections.length + ' sections, ' + faq.length + ' FAQs');
      })
      .catch(function (err) {
        console.error('[SynapseNet] Failed to load knowledge.json:', err);
      });
  }

  window.clientGenerateResponse = generateResponse;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadKnowledge);
  } else {
    loadKnowledge();
  }

})();
