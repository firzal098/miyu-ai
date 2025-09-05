document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const characterName = document.getElementById('character-name');
    const characterDescription = document.getElementById('character-description');
    const characterAvatar = document.getElementById('character-avatar');
    const chatIcon = document.querySelector('.chat-icon');
    const chatInterface = document.querySelector('.chat-interface');

    const fetchCharacterInfo = async () => {
        try {
            const response = await fetch('/character-info');
            const data = await response.json();
            characterName.textContent = data.name;
            characterDescription.textContent = data.description;
            // characterAvatar.style.backgroundImage = `url(${data.avatar})`;
        } catch (error) {
            console.error('Error fetching character info:', error);
            // Set default character info if API fails
            characterName.textContent = 'Dorothy';
            characterDescription.textContent = 'ABO: Dorothy x Blablabla';
        }
    };

    const addMessage = (message, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        // Add love-icon-1 and Dorothy text for AI messages only
        if (sender === 'ai') {
            const loveIcon = document.createElement('div');
            loveIcon.classList.add('love-icon', 'love-icon-1');
            messageElement.appendChild(loveIcon);
            
            const dorothyText = document.createElement('div');
            dorothyText.classList.add('dorothy-text');
            dorothyText.textContent = '• Dorothy';
            messageElement.appendChild(dorothyText);
        }
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.textContent = message;
        
        messageElement.appendChild(messageContent);
        chatBox.appendChild(messageElement);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            chatBox.scrollTo({
                top: chatBox.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    };

    const showTypingIndicator = () => {
        const typingElement = document.createElement('div');
        typingElement.classList.add('typing-indicator');
        typingElement.innerHTML = `
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatBox.appendChild(typingElement);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            chatBox.scrollTo({
                top: chatBox.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
        
        return typingElement;
    };

    const hideTypingIndicator = (typingElement) => {
        if (typingElement && typingElement.parentNode) {
            typingElement.parentNode.removeChild(typingElement);
        }
    };

    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (message === '') return;

        addMessage(message, 'user');
        userInput.value = '';

        // Show typing indicator
        const typingIndicator = showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            
            // Hide typing indicator and show AI response
            setTimeout(() => {
                hideTypingIndicator(typingIndicator);
                addMessage(data.reply, 'ai');
            }, 1000); // Simulate AI thinking time
            
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator(typingIndicator);
            addMessage('Sorry, something went wrong.', 'ai');
        }
    };

    const initializeChat = () => {
        // Add initial AI welcome message
        addMessage('Hai, User. Welcome back to mee!', 'ai');
    };

    const toggleChat = () => {
        chatInterface.classList.toggle('minimized');
        chatIcon.classList.toggle('minimized');
    };

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    chatIcon.addEventListener('click', toggleChat);

    // Initialize
    fetchCharacterInfo();
    initializeChat();
});
