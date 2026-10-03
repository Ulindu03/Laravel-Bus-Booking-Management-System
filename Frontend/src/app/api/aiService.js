import api from './axios';

/**
 * AI/ML API Service — Serendib Go
 * ChatBot, Demand Predictions, Segment Availability, Pattern Insights
 */
export const aiService = {
    // ============================================
    // CHATBOT — AI Assistant endpoints
    // ============================================

    /** Send a message to the AI chatbot (non-streaming fallback) */
    sendMessage: async (message) => {
        const res = await api.post('/ai/chat', { message });
        return res.data;
    },

    /**
     * Stream a message to the AI chatbot via SSE.
     * Calls onChunk(text) as each token arrives, and onDone(metadata) when complete.
     * Returns an AbortController so caller can cancel the stream.
     */
    streamMessage: (message, { onChunk, onDone, onError }) => {
        const controller = new AbortController();
        const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = localStorage.getItem('token');

        fetch(`${baseURL}/api/ai/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ message }),
            signal: controller.signal,
        })
        .then(async (response) => {
            if (!response.ok) {
                onError?.('AI service returned an error. Please try again.');
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE lines from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.done) {
                                onDone?.(data);
                            } else if (data.chunk) {
                                onChunk?.(data.chunk);
                            }
                        } catch (e) {
                            // Skip malformed JSON lines
                        }
                    }
                }
            }
        })
        .catch((err) => {
            if (err.name !== 'AbortError') {
                onError?.(err.message || 'Connection failed');
            }
        });

        return controller;
    },

    /** Get chat history for authenticated user */
    getChatHistory: async (limit = 20) => {
        const res = await api.get('/ai/chat/history', { params: { limit } });
        return res.data;
    },

    /** Submit feedback on a chat response */
    sendFeedback: async (conversationId, helpful) => {
        const res = await api.post('/ai/chat/feedback', {
            conversation_id: conversationId,
            helpful,
        });
        return res.data;
    },

    // ============================================
    // SEGMENT AVAILABILITY — Seat map data
    // ============================================

    /** Get AI-powered segment availability for a schedule */
    getSegmentAvailability: async (scheduleId) => {
        const res = await api.get(`/ai/segments/${scheduleId}`);
        return res.data;
    },

    // ============================================
    // ADMIN — Predictions & Insights
    // ============================================

    /** Get demand prediction for a route (admin only) */
    getDemandPrediction: async (routeId, date, hour) => {
        const res = await api.get(`/admin/ai/predict/demand/${routeId}`, {
            params: { date, hour },
        });
        return res.data;
    },

    /** Get passenger pattern insights (admin only) */
    getPatternInsights: async () => {
        const res = await api.get('/admin/ai/insights/patterns');
        return res.data;
    },

    /** Check AI system health (admin only) */
    getHealthStatus: async () => {
        const res = await api.get('/admin/ai/health');
        return res.data;
    },
};
