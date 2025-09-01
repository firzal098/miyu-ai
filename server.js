require('dotenv').config();
const express = require('express');
const path = require('path');
const { getReply, characterInfo } = require('./ai/grumpy_dwarf.js');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/character-info', (req, res) => {
    res.json(characterInfo);
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    const aiReply = await getReply(userMessage);
    res.json({ reply: aiReply });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});