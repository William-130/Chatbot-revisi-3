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
  Minimize2,
  X
} from 'lucide-react';
import { VideoAvatar, type AvatarState } from './VideoAvatar';

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

interface EnhancedChatInterfaceProps {
  websiteId?: string;
  apiEndpoint?: string;
  initialMessage?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left' | 'center';
  minimized?: boolean;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export function EnhancedChatInterface({
  websiteId = 'demo-website-id',
  apiEndpoint = '/api/chat',
  initialMessage = 'Hi! How can I help you today?',
  theme = 'dark',
  position = 'bottom-right',
  minimized = false,
  showAvatar = true,
  avatarSize = 'lg'
}: EnhancedChatInterfaceProps) {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(minimized);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Voice and TTS state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [currentSpeechText, setCurrentSpeechText] = useState('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isInterruptedRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID'; // Indonesian language

      recognition.onstart = () => {
        setIsListening(true);
        setAvatarState('listening');
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
          recognition.stop();
          handleSendMessage(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setAvatarState('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (avatarState === 'listening') {
          setAvatarState('idle');
        }
      };

      recognitionRef.current = recognition;
    }

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
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, [initialMessage, avatarState]);

  // Text-to-Speech function with real-time subtitles
  const speakText = useCallback((text: string) => {
    if (!speechEnabled || !text) {
      console.log('❌ TTS disabled or no text');
      return;
    }

    console.log('🔊 TTS Starting:', text.substring(0, 50) + '...');

    // Stop any current speech gracefully and clear timeouts
    if (speechSynthesis.speaking) {
      isInterruptedRef.current = true;
      speechSynthesis.cancel();
      
      // Clear any pending subtitle updates
      setCurrentSpeechText('');
      
      // Wait longer for proper cleanup
      setTimeout(() => startSpeech(), 200);
    } else {
      startSpeech();
    }

    function startSpeech() {
      // Reset interrupt flag
      isInterruptedRef.current = false;
      
      // Ensure clean state before starting
      setIsSpeaking(false);
      setCurrentSpeechText('');
      setAvatarState('speaking');
      
      // Split text into chunks for progressive display
      const words = text.split(' ');
      let currentWordIndex = 0;
      let subtitleTimeout: NodeJS.Timeout | null = null;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      utterance.lang = 'id-ID';

      // Progressive subtitle display with cleanup
      const updateSubtitle = () => {
        if (isInterruptedRef.current) {
          console.log('🔊 Subtitle update cancelled (interrupted)');
          return;
        }
        
        if (currentWordIndex < words.length) {
          const displayedText = words.slice(0, currentWordIndex + 1).join(' ');
          setCurrentSpeechText(displayedText);
          currentWordIndex++;
          
          const delay = 60000 / (utterance.rate * 150);
          subtitleTimeout = setTimeout(updateSubtitle, delay);
        }
      };

      const cleanup = () => {
        if (subtitleTimeout) {
          clearTimeout(subtitleTimeout);
          subtitleTimeout = null;
        }
        setIsSpeaking(false);
        setAvatarState('idle');
        
        // Keep subtitles for 2 seconds after speech ends (if not interrupted)
        if (!isInterruptedRef.current) {
          setTimeout(() => {
            if (!isInterruptedRef.current) {
              setCurrentSpeechText('');
            }
          }, 2000);
        } else {
          setCurrentSpeechText('');
        }
      };

      utterance.onstart = () => {
        if (isInterruptedRef.current) {
          console.log('🔊 TTS start cancelled (interrupted)');
          return;
        }
        
        console.log('🔊 TTS Started successfully');
        setIsSpeaking(true);
        setAvatarState('speaking');
        updateSubtitle();
      };

      utterance.onend = () => {
        console.log('🔊 TTS Ended normally');
        cleanup();
      };

      utterance.onerror = (event) => {
        console.log('🔊 TTS Event:', event.error);
        
        // Handle different error types
        if (event.error === 'interrupted') {
          console.log('🔊 TTS was interrupted (normal behavior)');
          isInterruptedRef.current = true;
        } else {
          console.error('🔊 TTS Error:', event.error);
        }
        
        cleanup();
      };

      // Set voice if available
      const voices = speechSynthesis.getVoices();
      const indonesianVoice = voices.find(voice => 
        voice.lang.includes('id') || voice.lang.includes('ID')
      );
      
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
        console.log('🔊 Using voice:', indonesianVoice.name);
      }

      utteranceRef.current = utterance;
      
      try {
        // Double-check we haven't been interrupted before speaking
        if (!isInterruptedRef.current) {
          speechSynthesis.speak(utterance);
        } else {
          console.log('🔊 TTS cancelled before speaking (interrupted)');
          cleanup();
        }
      } catch (error) {
        console.error('🔊 Speech synthesis error:', error);
        cleanup();
      }
    }
  }, [speechEnabled]);

  // Start/stop voice listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  }, [isListening]);

  // Send message function
  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    // Stop any current speech immediately when user sends a message
    if (speechSynthesis.speaking) {
      console.log('🔊 Interrupting current speech for new message');
      isInterruptedRef.current = true;
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeechText('');
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setAvatarState('thinking');

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
            voiceInput: isListening,
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
        content: data.content || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.',
        timestamp: data.timestamp || Date.now(),
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response with proper state management
      if (speechEnabled && assistantMessage.content) {
        setTimeout(() => {
          console.log('🔊 Starting TTS for:', assistantMessage.content);
          speakText(assistantMessage.content);
        }, 300);
      } else {
        // Reset to idle if speech is disabled
        setTimeout(() => {
          setAvatarState('idle');
        }, 500);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setAvatarState('idle');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, sessionId, websiteId, apiEndpoint, speechEnabled, isListening, speakText]);

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
          // Minimized state with avatar
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsMinimized(false)}
            className="cursor-pointer"
          >
            <VideoAvatar 
              state={avatarState}
              size="sm"
              showSubtitles={false}
              className="hover:scale-110 transition-transform"
            />
          </motion.div>
        ) : (
          // Full chat interface
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`
              w-96 h-[500px] rounded-lg shadow-2xl border-2 ${themeClasses}
              flex flex-col overflow-hidden
            `}
          >
            {/* Header */}
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  avatarState === 'idle' ? 'bg-gray-400' :
                  avatarState === 'listening' ? 'bg-blue-400' :
                  avatarState === 'speaking' ? 'bg-green-400' :
                  avatarState === 'thinking' ? 'bg-purple-400' : 'bg-gray-400'
                }`} />
                <h3 className="font-semibold">AI Assistant</h3>
                <button
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className={`p-1 rounded text-xs ${
                    speechEnabled 
                      ? 'text-green-400' 
                      : 'text-gray-400'
                  }`}
                  title={speechEnabled ? 'Suara Aktif' : 'Suara Nonaktif'}
                >
                  {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                {isSpeaking && (
                  <button
                    onClick={() => {
                      console.log('🔊 Manual TTS stop requested');
                      isInterruptedRef.current = true;
                      speechSynthesis.cancel();
                      setIsSpeaking(false);
                      setCurrentSpeechText('');
                      setAvatarState('idle');
                    }}
                    className="p-1 rounded text-red-400 hover:bg-red-400 hover:bg-opacity-20"
                    title="Berhenti Bicara"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded hover:bg-opacity-20 hover:bg-gray-500"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
              {/* Video Avatar */}
              <VideoAvatar 
                state={avatarState}
                size="xl"
                showSubtitles={false}
                currentText={currentSpeechText}
                className="mb-4"
              />
              
              {/* Subtitle Area */}
              <div className="h-20 flex items-center justify-center px-4 w-full">
                <AnimatePresence mode="wait">
                  {currentSpeechText && isSpeaking ? (
                    <motion.div
                      key={currentSpeechText}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center"
                    >
                      <div className="bg-black bg-opacity-60 text-white text-sm px-4 py-2 rounded-lg backdrop-blur-sm border border-gray-600 max-w-xs">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-medium leading-relaxed"
                        >
                          {currentSpeechText}
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <div className="bg-gray-700 bg-opacity-60 text-gray-300 text-sm px-4 py-2 rounded-lg backdrop-blur-sm border border-gray-600">
                        <div className="flex items-center space-x-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                          />
                          <span>Sedang berpikir...</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-gray-400 text-sm"
                    >
                      {isListening 
                        ? 'Sedang mendengarkan...' 
                        : 'Silakan ketik atau klik mikrofon untuk berbicara'
                      }
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Input Section */}
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? 'Sedang mendengarkan...' : 'Ketik pesan Anda...'}
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
                    disabled={isLoading || isSpeaking}
                    className={`
                      p-2 rounded-lg transition-colors disabled:opacity-50
                      ${isListening
                        ? 'bg-red-500 text-white animate-pulse'
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
                  disabled={isLoading || !inputText.trim() || isListening}
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
              
              {/* Last Message Display (Optional) */}
              {messages.length > 1 && (
                <div className="mt-3 text-xs text-gray-400">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-400 font-medium">Anda:</span>
                    <span className="flex-1 truncate">{messages[messages.length - 2]?.content}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
