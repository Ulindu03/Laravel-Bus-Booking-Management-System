'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { aiService } from '@/app/api/aiService';
import styles from './ChatWidget.module.css';

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: 'Hello! 👋 I\'m the Serendib Go Assistant. I can help you find buses, check routes, and answer booking questions. How can I help you today?',
            time: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const streamAbortRef = useRef(null);

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            streamAbortRef.current?.abort();
        };
    }, []);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
            setHasUnread(false);
        }
    }, [isOpen]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isTyping) return;

        // Abort any existing stream
        streamAbortRef.current?.abort();

        // Add user message
        const userMessage = { type: 'user', text, time: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Create a placeholder bot message for streaming
        const botMsgId = Date.now();
        setMessages(prev => [...prev, {
            id: botMsgId,
            type: 'bot',
            text: '',
            time: new Date(),
            isStreaming: true,
        }]);

        try {
            // Use streaming API for real-time token display
            const controller = aiService.streamMessage(text, {
                onChunk: (chunk) => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === botMsgId
                            ? { ...msg, text: msg.text + chunk }
                            : msg
                    ));
                },
                onDone: (metadata) => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === botMsgId
                            ? {
                                ...msg,
                                isStreaming: false,
                                conversationId: metadata.conversation_id,
                                responseTime: metadata.response_time_ms,
                            }
                            : msg
                    ));
                    setIsTyping(false);
                    if (!isOpen) setHasUnread(true);
                },
                onError: (error) => {
                    // Fallback: try non-streaming API
                    fallbackNonStreaming(text, botMsgId);
                },
            });

            streamAbortRef.current = controller;
        } catch (error) {
            fallbackNonStreaming(text, botMsgId);
        }
    };

    // Fallback to non-streaming if SSE fails
    const fallbackNonStreaming = async (text, botMsgId) => {
        try {
            const result = await aiService.sendMessage(text);
            if (result.success) {
                setMessages(prev => prev.map(msg =>
                    msg.id === botMsgId
                        ? {
                            ...msg,
                            text: result.data.response,
                            isStreaming: false,
                            conversationId: result.data.conversation_id,
                            responseTime: result.data.response_time_ms,
                        }
                        : msg
                ));
            } else {
                setMessages(prev => prev.map(msg =>
                    msg.id === botMsgId
                        ? { ...msg, text: 'Sorry, I couldn\'t process your request. Please try again.', isStreaming: false, isError: true }
                        : msg
                ));
            }
        } catch (err) {
            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, text: 'The AI assistant is currently offline. Please try again later.', isStreaming: false, isError: true }
                    : msg
            ));
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFeedback = async (conversationId, helpful) => {
        try {
            await aiService.sendFeedback(conversationId, helpful);
            // Mark the message as rated
            setMessages(prev => prev.map(msg =>
                msg.conversationId === conversationId
                    ? { ...msg, rated: helpful ? 'up' : 'down' }
                    : msg
            ));
        } catch (err) {
            // Silently fail
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Quick suggestion chips
    const suggestions = [
        'Show me available routes',
        'Colombo to Kandy buses',
        'How to cancel a booking?',
        'What buses go to Galle?',
    ];

    const handleSuggestionClick = (text) => {
        if (isTyping) return;
        setInput('');

        // Abort any existing stream
        streamAbortRef.current?.abort();

        // Add user message directly
        const userMessage = { type: 'user', text, time: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setIsTyping(true);

        const botMsgId = Date.now();
        setMessages(prev => [...prev, {
            id: botMsgId,
            type: 'bot',
            text: '',
            time: new Date(),
            isStreaming: true,
        }]);

        const controller = aiService.streamMessage(text, {
            onChunk: (chunk) => {
                setMessages(prev => prev.map(msg =>
                    msg.id === botMsgId ? { ...msg, text: msg.text + chunk } : msg
                ));
            },
            onDone: (metadata) => {
                setMessages(prev => prev.map(msg =>
                    msg.id === botMsgId
                        ? { ...msg, isStreaming: false, conversationId: metadata.conversation_id, responseTime: metadata.response_time_ms }
                        : msg
                ));
                setIsTyping(false);
            },
            onError: () => fallbackNonStreaming(text, botMsgId),
        });
        streamAbortRef.current = controller;
    };

    return (
        <>
            {/* Floating Chat Button */}
            <button
                className={`${styles.chatToggle} ${isOpen ? styles.chatToggleActive : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open AI Assistant'}
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                        </svg>
                        {hasUnread && <span className={styles.unreadDot} />}
                    </>
                )}
                <span className={styles.pulseRing} />
            </button>

            {/* Chat Window */}
            <div className={`${styles.chatWindow} ${isOpen ? styles.chatWindowOpen : ''}`}>
                {/* Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.headerInfo}>
                        <div className={styles.avatarWrap}>
                            <div className={styles.avatar}>🤖</div>
                            <span className={styles.onlineDot} />
                        </div>
                        <div className={styles.headerText}>
                            <span className={styles.headerTitle}>Serendib Go Assistant</span>
                            <span className={styles.headerStatus}>
                                {isTyping ? 'Typing...' : 'Online — AI Powered'}
                            </span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className={styles.messagesArea}>
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`${styles.messageBubble} ${msg.type === 'user' ? styles.userBubble : styles.botBubble} ${msg.isError ? styles.errorBubble : ''}`}
                        >
                            {msg.type === 'bot' && (
                                <div className={styles.botAvatar}>🤖</div>
                            )}
                            <div className={styles.bubbleContent}>
                                <p className={styles.messageText}>
                                    {msg.text}
                                    {msg.isStreaming && <span className={styles.streamCursor}>|</span>}
                                </p>
                                {!msg.isStreaming && (
                                <div className={styles.messageFooter}>
                                    <span className={styles.messageTime}>{formatTime(msg.time)}</span>
                                    {msg.type === 'bot' && msg.conversationId && !msg.rated && (
                                        <div className={styles.feedbackBtns}>
                                            <button
                                                onClick={() => handleFeedback(msg.conversationId, true)}
                                                className={styles.feedbackBtn}
                                                title="Helpful"
                                            >👍</button>
                                            <button
                                                onClick={() => handleFeedback(msg.conversationId, false)}
                                                className={styles.feedbackBtn}
                                                title="Not helpful"
                                            >👎</button>
                                        </div>
                                    )}
                                    {msg.rated && (
                                        <span className={styles.ratedBadge}>
                                            {msg.rated === 'up' ? '👍 Thanks!' : '👎 Noted'}
                                        </span>
                                    )}
                                </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator — only show before first token arrives */}
                    {isTyping && !messages.some(m => m.isStreaming && m.text.length > 0) && (
                        <div className={`${styles.messageBubble} ${styles.botBubble}`}>
                            <div className={styles.botAvatar}>🤖</div>
                            <div className={styles.typingIndicator}>
                                <span /><span /><span />
                            </div>
                        </div>
                    )}

                    {/* Suggestion chips — show only at start */}
                    {messages.length <= 1 && !isTyping && (
                        <div className={styles.suggestions}>
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    className={styles.suggestionChip}
                                    onClick={() => handleSuggestionClick(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={styles.inputArea}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={user ? 'Ask me anything about travel...' : 'Type your question...'}
                        className={styles.chatInput}
                        disabled={isTyping}
                        maxLength={1000}
                    />
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default ChatWidget;
