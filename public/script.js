document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const stopBtn = document.getElementById('stop-btn');
    const characterName = document.getElementById('character-name');
    const characterDescription = document.getElementById('character-description');
    const characterAvatar = document.getElementById('character-avatar');
    const chatIcon = document.querySelector('.chat-icon');
    const chatInterface = document.querySelector('.chat-interface');
    
    // Mobile elements
    const mobileUserInput = document.getElementById('mobile-user-input');
    const mobileSendBtn = document.getElementById('mobile-send-btn');
    const mobileMicBtn = document.getElementById('mobile-mic-btn');
    const mobileStopBtn = document.getElementById('mobile-stop-btn');
    const mobileAiBubble = document.getElementById('mobile-ai-bubble');
    const mobileAiBubbleText = document.getElementById('mobile-ai-bubble-text');
    const mobileInputContainer = document.querySelector('.mobile-input-container');
    
    // Speech recognition variables
    let recognition = null;
    let isRecording = false;
    let currentLanguage = 'id-ID'; // Default to Indonesian
    
    // AI typing state variables
    let isAITyping = false;
    let currentAbortController = null;

    // Initialize speech recognition
    const initSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = currentLanguage;
            
            recognition.onstart = () => {
                isRecording = true;
                updateMicButtonState(true);
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const currentInput = window.innerWidth > 768 ? userInput : mobileUserInput;
                currentInput.value = transcript;
                toggleIconVisibility(currentInput);
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                isRecording = false;
                updateMicButtonState(false);
            };
            
            recognition.onend = () => {
                isRecording = false;
                updateMicButtonState(false);
            };
        } else {
            console.warn('Speech recognition not supported');
        }
    };

    // Toggle icon visibility based on input content and AI typing state    
    const toggleIconVisibility = (inputElement) => {
        const hasText = inputElement.value.trim().length > 0;
        const isDesktop = window.innerWidth > 768;
        
        if (isAITyping) {
            // Show stop button when AI is typing
            if (isDesktop) {
                micBtn.style.display = 'none';
                sendBtn.style.display = 'none';
                stopBtn.style.display = 'flex';
            } else {
                mobileMicBtn.style.display = 'none';
                mobileSendBtn.style.display = 'none';
                mobileStopBtn.style.display = 'flex';
            }
        } else {
            // Normal state - show mic or send based on input content
            if (isDesktop) {
                micBtn.style.display = hasText ? 'none' : 'flex';
                sendBtn.style.display = hasText ? 'flex' : 'none';
                stopBtn.style.display = 'none';
            } else {
                mobileMicBtn.style.display = hasText ? 'none' : 'flex';
                mobileSendBtn.style.display = hasText ? 'flex' : 'none';
                mobileStopBtn.style.display = 'none';
            }
        }
    };

    // Set AI typing state
    const setAITypingState = (typing) => {
        isAITyping = typing;
        
        // Disable/enable inputs
        userInput.disabled = typing;
        mobileUserInput.disabled = typing;
        
        // Update icon visibility
        toggleIconVisibility(userInput);
        toggleIconVisibility(mobileUserInput);
    };

    // Show mobile AI bubble
    const showMobileAiBubble = (message) => {
        if (mobileAiBubble && mobileAiBubbleText) {
            mobileAiBubbleText.textContent = message;
            mobileAiBubble.style.display = 'block';
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                hideMobileAiBubble();
            }, 5000);
        }
    };

    // Hide mobile AI bubble
    const hideMobileAiBubble = () => {
        if (mobileAiBubble) {
            mobileAiBubble.style.display = 'none';
        }
    };

    // Stop AI response
    const stopAIResponse = () => {
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
        }
        
        // Hide typing indicator
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            hideTypingIndicator(typingIndicator);
        }
        
        // Reset AI typing state
        setAITypingState(false);
        
        // Add stopped message
        if (window.innerWidth > 768) {
            addMessage('Response stopped by user.', 'ai');
        } else {
            showMobileAiBubble('Response stopped by user.');
        }
    };

    // Update mic button state (recording/not recording)
    const updateMicButtonState = (recording) => {
        const isDesktop = window.innerWidth > 768;
        const micButton = isDesktop ? micBtn : mobileMicBtn;
        
        if (recording) {
            micButton.classList.add('recording');
        } else {
            micButton.classList.remove('recording');
        }
    };

    // Detect language based on input text
    const detectLanguage = (text) => {
        // Simple language detection based on common words
        const indonesianWords = ['dan', 'atau', 'dengan', 'untuk', 'dari', 'yang', 'ini', 'itu', 'saya', 'kamu', 'dia', 'kami', 'mereka', 'adalah', 'akan', 'sudah', 'belum', 'tidak', 'bukan', 'juga', 'hanya', 'saja', 'lagi', 'sudah', 'pernah', 'selalu', 'kadang', 'sering', 'jarang', 'tidak', 'ya', 'tidak', 'baik', 'buruk', 'besar', 'kecil', 'tinggi', 'rendah', 'panjang', 'pendek', 'baru', 'lama', 'muda', 'tua', 'cepat', 'lambat', 'mudah', 'sulit', 'mahal', 'murah', 'banyak', 'sedikit', 'semua', 'sebagian', 'setiap', 'beberapa', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'halo', 'hai', 'terima', 'kasih', 'maaf', 'tolong', 'bisa', 'mau', 'ingin', 'perlu', 'harus', 'boleh', 'tidak', 'jangan', 'sudah', 'belum', 'akan', 'sedang', 'lagi', 'masih', 'sudah', 'pernah', 'selalu', 'kadang', 'sering', 'jarang', 'tidak', 'ya', 'tidak', 'baik', 'buruk', 'besar', 'kecil', 'tinggi', 'rendah', 'panjang', 'pendek', 'baru', 'lama', 'muda', 'tua', 'cepat', 'lambat', 'mudah', 'sulit', 'mahal', 'murah', 'banyak', 'sedikit', 'semua', 'sebagian', 'setiap', 'beberapa', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'];
        const englishWords = ['and', 'or', 'with', 'for', 'from', 'the', 'this', 'that', 'i', 'you', 'he', 'she', 'we', 'they', 'is', 'are', 'was', 'were', 'will', 'would', 'can', 'could', 'should', 'must', 'have', 'has', 'had', 'do', 'does', 'did', 'am', 'be', 'been', 'being', 'good', 'bad', 'big', 'small', 'high', 'low', 'long', 'short', 'new', 'old', 'young', 'fast', 'slow', 'easy', 'hard', 'expensive', 'cheap', 'many', 'few', 'all', 'some', 'every', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hello', 'hi', 'thank', 'you', 'sorry', 'please', 'can', 'will', 'want', 'need', 'must', 'may', 'not', 'dont', 'already', 'yet', 'will', 'going', 'still', 'always', 'sometimes', 'often', 'rarely', 'yes', 'no', 'good', 'bad', 'big', 'small', 'high', 'low', 'long', 'short', 'new', 'old', 'young', 'fast', 'slow', 'easy', 'hard', 'expensive', 'cheap', 'many', 'few', 'all', 'some', 'every', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
        
        const words = text.toLowerCase().split(/\s+/);
        let indonesianCount = 0;
        let englishCount = 0;
        
        words.forEach(word => {
            if (indonesianWords.includes(word)) indonesianCount++;
            if (englishWords.includes(word)) englishCount++;
        });
        
        return indonesianCount > englishCount ? 'id-ID' : 'en-US';
    };

    // Update language for speech recognition
    const updateLanguage = (language) => {
        currentLanguage = language;
        if (recognition) {
            recognition.lang = currentLanguage;
        }
        
        // Update mic button title to show current language
        const isDesktop = window.innerWidth > 768;
        const micButton = isDesktop ? micBtn : mobileMicBtn;
        const languageName = currentLanguage === 'id-ID' ? 'Indonesia' : 'English';
        micButton.title = `Speech Recognition - ${languageName}`;
    };

    // Start/stop speech recognition
    const toggleSpeechRecognition = () => {
        if (!recognition) {
            console.warn('Speech recognition not available');
            return;
        }
        
        // Auto-detect language from current input if any
        const currentInput = window.innerWidth > 768 ? userInput : mobileUserInput;
        if (currentInput.value.trim()) {
            const detectedLang = detectLanguage(currentInput.value);
            updateLanguage(detectedLang);
        } else {
            // If no input text, try to detect from browser language or use Indonesian as default
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('id')) {
                updateLanguage('id-ID');
            } else {
                updateLanguage('id-ID'); // Default to Indonesian
            }
        }
        
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

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
        if (message === '' || isAITyping) return;

        // Set AI typing state
        setAITypingState(true);

        // Only add message to chat if chat interface is visible (desktop/tablet)
        if (window.innerWidth > 768) {
            addMessage(message, 'user');
        }
        
        // Clear input
        inputElement.value = '';
        
        // Update icon visibility after clearing input
        toggleIconVisibility(inputElement);

        // Show typing indicator only on desktop/tablet
        let typingIndicator = null;
        if (window.innerWidth > 768) {
            typingIndicator = showTypingIndicator();
        }

        // Create abort controller for this request
        currentAbortController = new AbortController();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
                signal: currentAbortController.signal
            });

            const data = await response.json();
            
            // Hide typing indicator and show AI response
            if (window.innerWidth > 768) {
                setTimeout(() => {
                    hideTypingIndicator(typingIndicator);
                    addMessage(data.reply, 'ai');
                    // Reset AI typing state after response
                    setAITypingState(false);
                }, 1000); // Simulate AI thinking time
            } else {
                // Show AI response in mobile bubble
                setTimeout(() => {
                    showMobileAiBubble(data.reply);
                    // Reset AI typing state after response
                    setAITypingState(false);
                }, 1000); // Simulate AI thinking time
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
                // Don't show error message for aborted requests
            } else {
                console.error('Error:', error);
                if (window.innerWidth > 768) {
                    hideTypingIndicator(typingIndicator);
                    addMessage('Sorry, something went wrong.', 'ai');
                } else {
                    showMobileAiBubble('Sorry, something went wrong.');
                }
            }
            // Reset AI typing state on error
            setAITypingState(false);
        } finally {
            currentAbortController = null;
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
    
    // Input change listeners for icon toggle and language detection
    userInput.addEventListener('input', () => {
        toggleIconVisibility(userInput);
        // Auto-detect language when typing
        if (userInput.value.trim()) {
            const detectedLang = detectLanguage(userInput.value);
            updateLanguage(detectedLang);
        }
    });
    
    mobileUserInput.addEventListener('input', () => {
        toggleIconVisibility(mobileUserInput);
        // Auto-detect language when typing
        if (mobileUserInput.value.trim()) {
            const detectedLang = detectLanguage(mobileUserInput.value);
            updateLanguage(detectedLang);
        }
    });
    
    // Mic button event listeners
    micBtn.addEventListener('click', toggleSpeechRecognition);
    mobileMicBtn.addEventListener('click', toggleSpeechRecognition);
    
    // Stop button event listeners
    stopBtn.addEventListener('click', stopAIResponse);
    mobileStopBtn.addEventListener('click', stopAIResponse);
    
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
    initSpeechRecognition();
    fetchCharacterInfo();
    initializeChat();
    
    // Initial icon visibility setup
    toggleIconVisibility(userInput);
    toggleIconVisibility(mobileUserInput);
    
    // Initialize language
    updateLanguage(currentLanguage);
    
    // Add click event to hide mobile bubble when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && mobileAiBubble && mobileAiBubble.style.display === 'block') {
            if (!mobileAiBubble.contains(e.target) && !mobileInputContainer.contains(e.target)) {
                hideMobileAiBubble();
            }
        }
    });
});