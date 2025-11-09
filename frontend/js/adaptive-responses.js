document.addEventListener('DOMContentLoaded', function() {
    const userMessage = document.getElementById('userMessage');
    const contextInput = document.getElementById('contextInput');
    const emotionSelect = document.getElementById('emotionSelect');
    const generateResponseBtn = document.getElementById('generateResponseBtn');
    const clearConversationBtn = document.getElementById('clearConversation');
    const messageHistory = document.getElementById('messageHistory');
    const responseLoading = document.getElementById('responseLoading');
    const responseError = document.getElementById('responseError');

    let conversationHistory = [];

    // Conversation starters
    document.querySelectorAll('.starter-btn').forEach(button => {
        button.addEventListener('click', function() {
            userMessage.value = this.getAttribute('data-message');
            contextInput.value = this.getAttribute('data-context');
        });
    });

    // Generate response
    generateResponseBtn.addEventListener('click', async function() {
        const message = userMessage.value.trim();
        
        if (!message) {
            alert('Please enter a message');
            return;
        }

        // Add user message to conversation
        addMessageToHistory('user', message);
        
        // Show loading state
        showLoading();
        
        try {
            const response = await fetch('/api/generate-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: message,
                    context: contextInput.value,
                    emotion: emotionSelect.value
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Add AI response to conversation
                addMessageToHistory('ai', data.ai_response);
                
                // Clear input
                userMessage.value = '';
                contextInput.value = '';
            } else {
                throw new Error(data.error || 'Failed to generate response');
            }
        } catch (error) {
            console.error('Error:', error);
            showError();
        }
    });

    // Clear conversation
    clearConversationBtn.addEventListener('click', function() {
        conversationHistory = [];
        messageHistory.innerHTML = `
            <div class="ai-message">
                <div class="message-avatar">AI</div>
                <div class="message-content">
                    <p>Hello! I'm your emotionally intelligent AI assistant. How can I help you today? Feel free to share what's on your mind.</p>
                </div>
            </div>
        `;
    });

    function showLoading() {
        responseError.classList.add('hidden');
        responseLoading.classList.remove('hidden');
    }

    function showError() {
        responseLoading.classList.add('hidden');
        responseError.classList.remove('hidden');
    }

    function addMessageToHistory(sender, content) {
        responseLoading.classList.add('hidden');
        responseError.classList.add('hidden');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${sender === 'user' ? 'You' : 'AI'}</div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
        
        messageHistory.appendChild(messageDiv);
        messageHistory.scrollTop = messageHistory.scrollHeight;
        
        // Add to conversation history
        conversationHistory.push({
            sender,
            content,
            timestamp: new Date().toISOString()
        });
    }
});