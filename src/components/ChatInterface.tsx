'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Send, 
  MessageCircle,
  Volume2,
  VolumeX,
  Settings,
  Minimize2,
  Maximize2
} from 'lucide-react';

// Voice Activity Detection
import type { MicVAD } from '@ricky0123/vad-web';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    sources?: string[];
    contextSources?: number;
  };
}

interface ChatInterfaceProps {
  websiteId: string;
  apiEndpoint?: string;
  initialMessage?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left' | 'center';
  minimized?: boolean;
}

export function ChatInterface({
  websiteId,
  apiEndpoint = '/api/chat',
  initialMessage = 'Hi! How can I help you today?',
  theme = 'dark',
  position = 'bottom-right',
  minimized = false
}: ChatInterfaceProps) {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(minimized);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Voice-related state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const vadRef = useRef<MicVAD | null>(null);
  const isInterruptedRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInputText(finalTranscript);
          handleSendMessage(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Initialize VAD for interruption detection
    initializeVAD();

    // Add initial welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'assistant',
      content: initialMessage,
      timestamp: Date.now(),
    };
    setMessages([welcomeMessage]);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (vadRef.current) {
        vadRef.current.destroy();
      }
    };
  }, [initialMessage]);

  // Initialize Voice Activity Detection
  const initializeVAD = async () => {
    try {
      const { MicVAD } = await import('@ricky0123/vad-web');
      
      vadRef.current = await MicVAD.new({
        onSpeechStart: () => {
          // User started speaking - interrupt bot if it's speaking
          if (isSpeaking) {
            interruptSpeech();
          }
        },
        onSpeechEnd: () => {
          // User stopped speaking
          console.log('User stopped speaking');
        },
        onVADMisfire: () => {
          console.log('VAD misfire');
        },
      });
    } catch (error) {
      console.error('Failed to initialize VAD:', error);
    }
  };

  // Interrupt current speech
  const interruptSpeech = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      isInterruptedRef.current = true;
    }
  }, []);

  // Text-to-Speech function
  const speakText = useCallback((text: string) => {
    if (!speechEnabled || !text) return;

    // Stop any current speech
    speechSynthesis.cancel();
    isInterruptedRef.current = false;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Get available voices and prefer a natural one
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Enhanced') ||
      voice.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (!isInterruptedRef.current && voiceEnabled) {
        // Auto-start listening after bot finishes speaking
        startListening();
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    synthesisRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [speechEnabled, voiceEnabled]);

  // Start/stop voice listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      vadRef.current?.pause();
    } else {
      startListening();
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      vadRef.current?.start();
      setVoiceEnabled(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }, []);

  // Send message function
  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Stop listening while processing
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          websiteId,
          sessionId,
          metadata: {
            timestamp: Date.now(),
            voiceInput: voiceEnabled,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update session ID if received
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.content,
        timestamp: data.timestamp,
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response if voice is enabled
      if (voiceEnabled && speechEnabled) {
        speakText(data.content);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, sessionId, websiteId, apiEndpoint, voiceEnabled, speechEnabled, isListening, speakText]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  };

  // Theme classes
  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white border-gray-700'
    : 'bg-white text-gray-900 border-gray-200';

  return (
    <div className={`z-50 ${positionClasses[position]}`}>
      <AnimatePresence>
        {isMinimized ? (
          // Minimized chat button
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsMinimized(false)}
            className={`
              w-16 h-16 rounded-full shadow-lg border-2 ${themeClasses}
              flex items-center justify-center hover:scale-105 transition-transform
              ${voiceEnabled ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : ''}
            `}
          >
            {voiceEnabled && (isListening || isSpeaking) ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Mic className="w-6 h-6" />
              </motion.div>
            ) : (
              <MessageCircle className="w-6 h-6" />
            )}
          </motion.button>
        ) : (
          // Full chat interface
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`
              w-80 h-96 rounded-lg shadow-2xl border-2 ${themeClasses}
              flex flex-col overflow-hidden
            `}
          >
            {/* Header */}
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${voiceEnabled ? 'bg-green-400' : 'bg-gray-400'}`} />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 ${!speechEnabled ? 'opacity-50' : ''}`}
                >
                  {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded hover:bg-opacity-20 hover:bg-gray-500"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-xs px-3 py-2 rounded-lg text-sm
                      ${message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.type === 'system'
                        ? 'bg-yellow-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    {message.content}
                    {message.metadata?.sources && message.metadata.sources.length > 0 && (
                      <div className="mt-2 text-xs opacity-75">
                        Sources: {message.metadata.contextSources} relevant documents
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-current rounded-full opacity-60"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-current rounded-full opacity-60"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-current rounded-full opacity-60"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? 'Listening...' : 'Type your message...'}
                  disabled={isLoading || isListening}
                  className={`
                    flex-1 px-3 py-2 rounded-lg border text-sm
                    ${theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:opacity-50
                  `}
                />
                
                {/* Voice toggle button */}
                {recognitionRef.current && (
                  <button
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`
                      p-2 rounded-lg transition-colors disabled:opacity-50
                      ${isListening
                        ? 'bg-red-500 text-white'
                        : voiceEnabled
                        ? 'bg-green-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
                
                {/* Send button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputText.trim()}
                  className={`
                    p-2 rounded-lg transition-colors disabled:opacity-50
                    ${theme === 'dark'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
                  `}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {/* Voice status indicator */}
              {voiceEnabled && (
                <div className="mt-2 text-xs text-center opacity-75">
                  {isListening
                    ? 'Listening... Speak your message'
                    : isSpeaking
                    ? 'AI is speaking... Interrupt anytime'
                    : 'Voice mode active - Click mic to talk'
                  }
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
