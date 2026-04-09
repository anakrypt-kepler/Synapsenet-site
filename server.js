const express = require('express');
const path = require('path');
const { generateResponse } = require('./chatbot');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/chat', handleChat);

function handleChat(req, res) {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }
  const result = generateResponse(message.trim());
  res.json(result);
}

app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.endsWith('/api/chat')) {
    return handleChat(req, res);
  }
  next();
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SynapseNet server running on http://0.0.0.0:${PORT}`);
});
