const express = require('express');
const path = require('path');
const { getGrumpyDwarfReply, characterInfo } = require('./ai/grumpy_dwarf.js');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/character-info', (req, res) => {
    res.json(characterInfo);
});

app.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    const aiReply = getGrumpyDwarfReply(userMessage);
    res.json({ reply: aiReply });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});