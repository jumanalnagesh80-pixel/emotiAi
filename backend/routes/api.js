const express = require('express');
const axios = require('axios');
const router = express.Router();

// Free APIs we'll use
const APIS = {
    // Hugging Face Inference API (free tier)
    HUGGING_FACE: 'https://api-inference.huggingface.co/models',
    // TextRazor for sentiment analysis (free tier: 500 requests/day)
    TEXT_RAZOR: 'https://api.textrazor.com',
    // ParallelDots for emotion detection (free tier available)
    PARALLEL_DOTS: 'https://apis.paralleldots.com/v4',
    // OpenAI-compatible free API
    OPEN_ROUTER: 'https://openrouter.ai/api/v1'
};

// Emotion Detection - Using Hugging Face
router.post('/detect-emotion', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Using a free emotion detection model from Hugging Face
        const response = await axios.post(
            `${APIS.HUGGING_FACE}/j-hartmann/emotion-english-distilroberta-base`,
            { inputs: text },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN || 'your_hugging_face_token'}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const emotions = response.data[0];
        const dominantEmotion = emotions.reduce((prev, current) => 
            prev.score > current.score ? prev : current
        );

        res.json({
            text,
            emotions,
            dominant_emotion: dominantEmotion.label,
            confidence: dominantEmotion.score
        });
    } catch (error) {
        console.error('Emotion detection error:', error.response?.data || error.message);
        
        // Fallback: Simple rule-based emotion detection
        const fallbackResult = fallbackEmotionDetection(req.body.text);
        res.json(fallbackResult);
    }
});

// Sentiment Analysis - Using TextRazor (free tier)
router.post('/analyze-sentiment', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Using TextRazor for detailed sentiment analysis
        const response = await axios.post(APIS.TEXT_RAZOR + '/analyze', 
            `text=${encodeURIComponent(text)}&extractors=entities,topics,sentiment`,
            {
                headers: {
                    'X-TextRazor-Key': process.env.TEXT_RAZOR_KEY || 'your_textrazor_key',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const sentiment = response.data.response.sentiment;
        
        res.json({
            text,
            sentiment: sentiment || {},
            sentiment_score: sentiment ? sentiment.score : 0,
            sentiment_label: getSentimentLabel(sentiment ? sentiment.score : 0),
            entities: response.data.response.entities || [],
            topics: response.data.response.topics || []
        });
    } catch (error) {
        console.error('Sentiment analysis error:', error.response?.data || error.message);
        
        // Fallback sentiment analysis
        const fallbackResult = fallbackSentimentAnalysis(req.body.text);
        res.json(fallbackResult);
    }
});

// Adaptive Responses - Using OpenRouter (free tier alternative)
router.post('/generate-response', async (req, res) => {
    try {
        const { text, context, emotion } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Using OpenRouter as a free alternative to OpenAI
        const prompt = createResponsePrompt(text, context, emotion);
        
        const response = await axios.post(APIS.OPEN_ROUTER + '/chat/completions', 
            {
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an emotionally intelligent AI assistant. Provide empathetic, context-aware responses that match the emotional tone of the user's message."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 150
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPEN_ROUTER_KEY || 'your_openrouter_key'}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'EmotiAI'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;
        
        res.json({
            original_text: text,
            context,
            detected_emotion: emotion,
            ai_response: aiResponse,
            response_style: analyzeResponseStyle(aiResponse)
        });
    } catch (error) {
        console.error('Response generation error:', error.response?.data || error.message);
        
        // Fallback response generation
        const fallbackResult = fallbackResponseGeneration(req.body.text, req.body.emotion);
        res.json(fallbackResult);
    }
});

// Fallback functions for when APIs are unavailable
function fallbackEmotionDetection(text) {
    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'love'];
    const scores = emotions.map(emotion => ({
        label: emotion,
        score: Math.random() * 0.3 + 0.1 // Random scores for demo
    }));
    
    // Simple keyword matching for better fallback
    const textLower = text.toLowerCase();
    if (textLower.includes('happy') || textLower.includes('good') || textLower.includes('great')) {
        scores.find(e => e.label === 'joy').score = 0.9;
    }
    if (textLower.includes('sad') || textLower.includes('bad') || textLower.includes('upset')) {
        scores.find(e => e.label === 'sadness').score = 0.9;
    }
    if (textLower.includes('angry') || textLower.includes('mad') || textLower.includes('frustrated')) {
        scores.find(e => e.label === 'anger').score = 0.9;
    }

    const dominant = scores.reduce((prev, current) => 
        prev.score > current.score ? prev : current
    );

    return {
        text,
        emotions: scores,
        dominant_emotion: dominant.label,
        confidence: dominant.score,
        note: "Using fallback emotion detection"
    };
}

function fallbackSentimentAnalysis(text) {
    const textLower = text.toLowerCase();
    let score = 0;
    
    // Simple sentiment scoring
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'horrible'];
    
    positiveWords.forEach(word => {
        if (textLower.includes(word)) score += 0.1;
    });
    
    negativeWords.forEach(word => {
        if (textLower.includes(word)) score -= 0.1;
    });
    
    // Normalize score to -1 to 1 range
    score = Math.max(-1, Math.min(1, score));
    
    return {
        text,
        sentiment_score: score,
        sentiment_label: getSentimentLabel(score),
        note: "Using fallback sentiment analysis"
    };
}

function fallbackResponseGeneration(text, emotion) {
    const responses = {
        joy: [
            "That's wonderful to hear! Your positive energy is contagious. 😊",
            "I'm so happy for you! It's great to see you in such good spirits.",
            "What fantastic news! Your joy really shines through in your message."
        ],
        sadness: [
            "I'm sorry you're feeling this way. Remember that difficult moments are temporary. 💙",
            "It sounds like you're going through a tough time. I'm here to listen and support you.",
            "Your feelings are completely valid. Take things one step at a time."
        ],
        anger: [
            "I can sense your frustration. Sometimes expressing these feelings can be cathartic.",
            "It's understandable to feel angry in this situation. Let's work through this together.",
            "Strong emotions like anger can be powerful motivators for change when channeled constructively."
        ],
        fear: [
            "It's okay to feel afraid. Facing our fears is how we grow stronger.",
            "I understand this might be scary. Remember that you've overcome challenges before.",
            "Take a deep breath. You're stronger than you think, and you can handle this."
        ],
        default: [
            "Thank you for sharing that with me. I'm here to help however I can.",
            "I appreciate you opening up about this. Let me know how I can support you.",
            "That's really interesting. Tell me more about how you're feeling."
        ]
    };
    
    const emotionKey = emotion && responses[emotion] ? emotion : 'default';
    const randomResponse = responses[emotionKey][Math.floor(Math.random() * responses[emotionKey].length)];
    
    return {
        original_text: text,
        detected_emotion: emotion,
        ai_response: randomResponse,
        response_style: "empathetic",
        note: "Using fallback response generation"
    };
}

function getSentimentLabel(score) {
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
}

function createResponsePrompt(text, context, emotion) {
    return `User message: "${text}"
    ${context ? `Context: ${context}` : ''}
    ${emotion ? `Detected emotion: ${emotion}` : ''}
    
    Please provide an empathetic, emotionally intelligent response that matches the user's emotional state and addresses their message appropriately.`;
}

function analyzeResponseStyle(response) {
    if (response.includes('!') || response.includes('wonderful') || response.includes('great')) return 'enthusiastic';
    if (response.includes('sorry') || response.includes('understand') || response.includes('support')) return 'empathetic';
    if (response.includes('suggest') || response.includes('recommend') || response.includes('try')) return 'helpful';
    return 'neutral';
}

module.exports = router;