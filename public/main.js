document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const characterName = document.getElementById('character-name');
    const characterDescription = document.getElementById('character-description');
    const characterAvatar = document.getElementById('character-avatar');
    const chatIcon = document.querySelector('.chat-icon');
    const chatInterface = document.querySelector('.chat-interface');
    
    // Mobile elements
    const mobileUserInput = document.getElementById('mobile-user-input');
    const mobileSendBtn = document.getElementById('mobile-send-btn');

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

    const sendMessage = async (inputElement = userInput) => {
        const message = inputElement.value.trim();
        if (message === '') return;

        // Only add message to chat if chat interface is visible (desktop/tablet)
        if (window.innerWidth > 768) {
            addMessage(message, 'user');
        }
        
        // Clear input
        inputElement.value = '';

        // Show typing indicator only on desktop/tablet
        let typingIndicator = null;
        if (window.innerWidth > 768) {
            typingIndicator = showTypingIndicator();
        }

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            
            // Hide typing indicator and show AI response only on desktop/tablet
            if (window.innerWidth > 768) {
                setTimeout(() => {
                    hideTypingIndicator(typingIndicator);
                    addMessage(data.reply, 'ai');
                }, 1000); // Simulate AI thinking time
            }
            
        } catch (error) {
            console.error('Error:', error);
            if (window.innerWidth > 768) {
                hideTypingIndicator(typingIndicator);
                addMessage('Sorry, something went wrong.', 'ai');
            }
        }
    };

    const initializeChat = () => {
        // Add initial AI welcome message only on desktop/tablet
        if (window.innerWidth > 768) {
            addMessage('Hai, User. Welcome back to mee!', 'ai');
        }
    };

    const toggleChat = () => {
        chatInterface.classList.toggle('minimized');
        chatIcon.classList.toggle('minimized');
    };

    // Event listeners
    sendBtn.addEventListener('click', () => sendMessage(userInput));
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(userInput);
        }
    });
    chatIcon.addEventListener('click', toggleChat);
    
    // Mobile event listeners
    if (mobileSendBtn && mobileUserInput) {
        mobileSendBtn.addEventListener('click', () => sendMessage(mobileUserInput));
        mobileUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage(mobileUserInput);
            }
        });
    }

    // Initialize
    fetchCharacterInfo();
    initializeChat();
});
