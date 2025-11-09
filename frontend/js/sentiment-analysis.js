document.addEventListener('DOMContentLoaded', function() {
    const sentimentText = document.getElementById('sentimentText');
    const analyzeSentimentBtn = document.getElementById('analyzeSentimentBtn');
    const sentimentResults = document.getElementById('sentimentResults');
    const sentimentLoading = document.getElementById('sentimentLoading');
    const sentimentError = document.getElementById('sentimentError');
    const sentimentNeedle = document.getElementById('sentimentNeedle');
    const sentimentLabel = document.getElementById('sentimentLabel');
    const sentimentValue = document.getElementById('sentimentValue');
    const entitiesList = document.getElementById('entitiesList');
    const topicsList = document.getElementById('topicsList');

    // Quick examples
    document.querySelectorAll('.example-btn').forEach(button => {
        button.addEventListener('click', function() {
            sentimentText.value = this.getAttribute('data-text');
        });
    });

    // Analyze sentiment
    analyzeSentimentBtn.addEventListener('click', async function() {
        const text = sentimentText.value.trim();
        
        if (!text) {
            alert('Please enter some text to analyze');
            return;
        }

        showLoading();
        
        try {
            const response = await fetch('/api/analyze-sentiment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            
            if (response.ok) {
                displaySentimentResults(data);
            } else {
                throw new Error(data.error || 'Failed to analyze sentiment');
            }
        } catch (error) {
            console.error('Error:', error);
            showError();
        }
    });

    function showLoading() {
        sentimentResults.classList.add('hidden');
        sentimentError.classList.add('hidden');
        sentimentLoading.classList.remove('hidden');
    }

    function showError() {
        sentimentLoading.classList.add('hidden');
        sentimentError.classList.remove('hidden');
    }

    function displaySentimentResults(data) {
        sentimentLoading.classList.add('hidden');
        sentimentError.classList.add('hidden');
        
        // Update sentiment gauge
        const score = data.sentiment_score || 0;
        const angle = (score + 1) * 90; // Convert -1 to 1 scale to 0-180 degrees
        
        sentimentNeedle.style.transform = `rotate(${angle}deg)`;
        sentimentLabel.textContent = data.sentiment_label.charAt(0).toUpperCase() + data.sentiment_label.slice(1);
        sentimentValue.textContent = `Score: ${score.toFixed(2)}`;
        
        // Update entities
        entitiesList.innerHTML = '';
        if (data.entities && data.entities.length > 0) {
            data.entities.slice(0, 10).forEach(entity => {
                const tag = document.createElement('span');
                tag.className = 'entity-tag';
                tag.textContent = entity.entityId || entity;
                entitiesList.appendChild(tag);
            });
        } else {
            entitiesList.innerHTML = '<span class="no-data">No entities detected</span>';
        }
        
        // Update topics
        topicsList.innerHTML = '';
        if (data.topics && data.topics.length > 0) {
            data.topics.slice(0, 10).forEach(topic => {
                const tag = document.createElement('span');
                tag.className = 'topic-tag';
                tag.textContent = topic.label || topic;
                topicsList.appendChild(tag);
            });
        } else {
            topicsList.innerHTML = '<span class="no-data">No topics detected</span>';
        }
        
        sentimentResults.classList.remove('hidden');
    }
});
