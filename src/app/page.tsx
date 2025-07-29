'use client';

import { EnhancedChatInterface } from '@/components/EnhancedChatInterface';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-8">
            AI Assistant
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            Experience the future of conversational AI with our advanced 
            <br />
            voice-enabled chatbot system
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Voice Interaction</h3>
              <p className="text-gray-300 text-sm">Natural voice conversations with real-time interruption support</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Context</h3>
              <p className="text-gray-300 text-sm">RAG-powered responses using your website&apos;s content</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time</h3>
              <p className="text-gray-300 text-sm">Lightning-fast responses with WebSocket connectivity</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">🚀 Production Mode Active</h3>
            <p className="text-gray-300 mb-6">
              Sistem sekarang menggunakan Google Gemini 1.5 Flash AI untuk memberikan respons yang lebih cerdas dan natural. 
              Klik ikon chat untuk memulai percakapan!
            </p>
            
            {/* Features */}
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-white mb-2">🤖 AI Gemini 1.5 Flash</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Respons AI yang cerdas dan kontekstual</li>
                  <li>• Dukungan bahasa Indonesia natural</li>
                  <li>• Pemahaman pertanyaan yang kompleks</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">🎤 Voice + Avatar</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Voice recognition Indonesia</li>
                  <li>• Text-to-Speech dengan subtitle real-time</li>
                  <li>• Avatar video interaktif</li>
                  <li>• Interface modern dan responsif</li>
                </ul>
              </div>
            </div>
            
            {/* Status Update */}
            <div className="mt-6 p-4 bg-green-900/30 rounded-lg border border-green-500/30">
              <h4 className="font-semibold text-green-300 mb-2">✅ Status: Production Ready</h4>
              <p className="text-sm text-green-200 mb-2">
                Sistem telah diupgrade ke production mode dengan:
              </p>
              <ul className="text-xs text-green-200 space-y-1">
                <li>• Google Gemini 1.5 Flash AI Integration ✅</li>
                <li>• Enhanced Chat Interface ✅</li>
                <li>• Voice & TTS Support ✅</li>
                <li>• Interactive Video Avatar ✅</li>
                <li>• Real-time Subtitle System ✅</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Interface with Gemini AI */}
      <EnhancedChatInterface 
        websiteId="production-website-id"
        initialMessage="Halo! Saya adalah asisten AI yang menggunakan teknologi Google Gemini 1.5 Flash. Saya siap membantu menjawab pertanyaan Anda dengan respons yang lebih cerdas dan natural. Silakan bertanya apa saja!"
        theme="dark"
        position="bottom-right"
        showAvatar={true}
        avatarSize="lg"
      />

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-gray-400">
          Powered by Next.js, PostgreSQL, pgvector, and Google Gemini 1.5 Flash
        </p>
      </div>
    </div>
  );
}
