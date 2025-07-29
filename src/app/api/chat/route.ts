import type { NextRequest } from 'next/server';

// CORS headers for embedding
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Simple WebSocket message interface
export interface ChatMessage {
  type: 'message' | 'voice_start' | 'voice_end' | 'typing' | 'error' | 'system' | 'response';
  content?: string;
  sessionId?: string;
  websiteId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Gemini AI Integration
async function generateGeminiResponse(message: string): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `Anda adalah asisten AI yang membantu menjawab pertanyaan dalam bahasa Indonesia. 
Berikan jawaban yang informatif, ramah, dan natural.

Pertanyaan: ${message}

Jawaban:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Maaf, saya tidak dapat memproses permintaan Anda saat ini. Silakan coba lagi.';
  }
}

// Chat API route for handling messages via HTTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, websiteId, sessionId } = body;

    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Processing with Gemini AI:', message);

    // Generate response using Gemini AI
    const responseContent = await generateGeminiResponse(message);

    // Return enhanced response with Gemini AI
    return Response.json({
      type: 'response',
      content: responseContent,
      sessionId: sessionId || `prod-session-${Date.now()}`,
      timestamp: Date.now(),
      metadata: {
        aiModel: 'Google Gemini 1.5 Flash',
        productionMode: true,
        hasDatabase: false,
        version: '2.0'
      },
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return Response.json(
      { 
        content: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi dalam beberapa saat.',
        type: 'error',
        timestamp: Date.now()
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// GET endpoint for API status
export async function GET() {
  return Response.json({
    status: 'Production Chat API with Gemini AI',
    mode: 'Gemini 1.5 Flash Integration Active',
    features: [
      'Google Gemini 1.5 Flash AI',
      'Indonesian Language Support',
      'Voice & TTS Integration',
      'Real-time Responses',
      'CORS Enabled for Embedding'
    ],
    endpoints: {
      chat: '/api/chat',
      embed: '/embed',
    },
  }, {
    headers: corsHeaders
  });
}
