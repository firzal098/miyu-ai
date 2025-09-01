document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const characterName = document.getElementById('character-name');
    const characterDescription = document.getElementById('character-description');
    const characterAvatar = document.getElementById('character-avatar');

    const fetchCharacterInfo = async () => {
        try {
            const response = await fetch('/character-info');
            const data = await response.json();
            characterName.textContent = data.name;
            characterDescription.textContent = data.description;
            // characterAvatar.style.backgroundImage = `url(${data.avatar})`;
        } catch (error) {
            console.error('Error fetching character info:', error);
        }
    };

    const addMessage = (message, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (message === '') return;

        addMessage(message, 'user');
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            addMessage(data.reply, 'ai');
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, something went wrong.', 'ai');
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    fetchCharacterInfo();
});