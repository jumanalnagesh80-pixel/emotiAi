document.addEventListener('DOMContentLoaded', function() {
    const emotionText = document.getElementById('emotionText');
    const detectEmotionBtn = document.getElementById('detectEmotionBtn');
    const emotionResults = document.getElementById('emotionResults');
    const emotionLoading = document.getElementById('emotionLoading');
    const emotionError = document.getElementById('emotionError');
    const dominantEmoji = document.getElementById('dominantEmoji');
    const dominantEmotion = document.getElementById('dominantEmotion');
    const dominantConfidence = document.getElementById('dominantConfidence');
    const emotionBars = document.getElementById('emotionBars');

    // Quick emotion examples
    document.querySelectorAll('.emotion-example').forEach(button => {
        button.addEventListener('click', function() {
            emotionText.value = this.getAttribute('data-text');
        });
    });

    // Detect emotion
    detectEmotionBtn.addEventListener('click', async function() {
        const text = emotionText.value.trim();
        
        if (!text) {
            alert('Please enter some text to analyze');
            return;
        }

        // Show loading state
        showLoading();
        
        try {
            const response = await fetch('/api/detect-emotion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            
            if (response.ok) {
                displayEmotionResults(data);
            } else {
                throw new Error(data.error || 'Failed to analyze emotions');
            }
        } catch (error) {
            console.error('Error:', error);
            showError();
        }
    });

    function showLoading() {
        emotionResults.classList.add('hidden');
        emotionError.classList.add('hidden');
        emotionLoading.classList.remove('hidden');
    }

    function showError() {
        emotionLoading.classList.add('hidden');
        emotionError.classList.remove('hidden');
    }

    function displayEmotionResults(data) {
        emotionLoading.classList.add('hidden');
        emotionError.classList.add('hidden');
        
        // Update dominant emotion
        const emotionEmojis = {
            'joy': '😊',
            'sadness': '😢',
            'anger': '😠',
            'fear': '😨',
            'surprise': '😲',
            'love': '❤️'
        };
        
        dominantEmoji.textContent = emotionEmojis[data.dominant_emotion] || '😊';
        dominantEmotion.textContent = data.dominant_emotion.charAt(0).toUpperCase() + data.dominant_emotion.slice(1);
        dominantConfidence.textContent = `Confidence: ${Math.round(data.confidence * 100)}%`;
        
        // Create emotion bars
        emotionBars.innerHTML = '';
        data.emotions.forEach(emotion => {
            const percentage = Math.round(emotion.score * 100);
            const bar = document.createElement('div');
            bar.className = 'emotion-bar';
            bar.innerHTML = `
                <span class="emotion-label">${emotion.label.charAt(0).toUpperCase() + emotion.label.slice(1)}</span>
                <div class="emotion-progress">
                    <div class="emotion-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="emotion-percentage">${percentage}%</span>
            `;
            emotionBars.appendChild(bar);
        });
        
        emotionResults.classList.remove('hidden');
    }
});