import { NextRequest } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import { db } from '@/lib/database';
import { generateRAGResponse } from '@/lib/rag';
import { v4 as uuidv4 } from 'uuid';

interface ChatWebSocket extends WebSocket {
  sessionId?: string;
  websiteId?: string;
  isAlive?: boolean;
}

interface ChatMessage {
  type: 'message' | 'voice_start' | 'voice_end' | 'typing' | 'error' | 'system';
  content?: string;
  sessionId?: string;
  websiteId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

// WebSocket server instance
let wss: WebSocketServer | null = null;

// Store active connections
const activeConnections = new Map<string, ChatWebSocket>();

function initializeWebSocketServer() {
  if (wss) return wss;

  // Create HTTP server for WebSocket upgrade
  const server = createServer();
  wss = new WebSocketServer({ server });

  wss.on('connection', async (ws: ChatWebSocket, request) => {
    console.log('New WebSocket connection established');
    
    // Extract website info from query parameters or headers
    const url = parse(request.url || '', true);
    const websiteId = url.query.websiteId as string;
    const sessionToken = url.query.sessionToken as string || uuidv4();
    
    if (!websiteId) {
      ws.close(1008, 'Website ID required');
      return;
    }

    // Verify website exists
    const website = await db.websites.findByApiKey(websiteId);
    if (!website) {
      ws.close(1008, 'Invalid website ID');
      return;
    }

    // Create or get chat session
    let session = await db.chatSessions.findByToken(sessionToken);
    if (!session) {
      session = await db.chatSessions.create({
        website_id: website.id,
        session_token: sessionToken,
        user_ip: request.socket.remoteAddress,
        user_agent: request.headers['user-agent'],
      });
    }

    // Store connection info
    ws.sessionId = session.id;
    ws.websiteId = website.id;
    ws.isAlive = true;
    activeConnections.set(session.id, ws);

    // Send welcome message
    const welcomeMessage: ChatMessage = {
      type: 'system',
      content: 'Connected to chat assistant',
      sessionId: session.id,
      websiteId: website.id,
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(welcomeMessage));

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message: ChatMessage = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (error) {
        console.error('Error handling message:', error);
        const errorMessage: ChatMessage = {
          type: 'error',
          content: 'Failed to process message',
          timestamp: Date.now(),
        };
        ws.send(JSON.stringify(errorMessage));
      }
    });

    // Handle connection close
    ws.on('close', async () => {
      console.log('WebSocket connection closed');
      if (ws.sessionId) {
        activeConnections.delete(ws.sessionId);
        // Mark session as ended
        await db.chatSessions.end(ws.sessionId);
      }
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (ws.sessionId) {
        activeConnections.delete(ws.sessionId);
      }
    });

    // Heartbeat to detect broken connections
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Periodic cleanup of dead connections
  const interval = setInterval(() => {
    wss?.clients.forEach((ws: ChatWebSocket) => {
      if (ws.isAlive === false) {
        ws.terminate();
        if (ws.sessionId) {
          activeConnections.delete(ws.sessionId);
        }
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Start server on a dynamic port
  const port = process.env.WEBSOCKET_PORT || 3001;
  server.listen(port, () => {
    console.log(`WebSocket server listening on port ${port}`);
  });

  return wss;
}

async function handleMessage(ws: ChatWebSocket, message: ChatMessage) {
  if (!ws.sessionId || !ws.websiteId) {
    return;
  }

  const { type, content } = message;

  switch (type) {
    case 'message':
      if (!content) return;

      // Save user message to database
      await db.chatHistory.create({
        session_id: ws.sessionId,
        website_id: ws.websiteId,
        message_type: 'user',
        content,
        metadata: message.metadata || {},
      });

      // Send typing indicator
      const typingMessage: ChatMessage = {
        type: 'typing',
        sessionId: ws.sessionId,
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(typingMessage));

      // Get chat history for context
      const history = await db.chatHistory.getBySessionId(ws.sessionId, 10);
      const chatHistory = history
        .reverse()
        .slice(0, -1) // Exclude the current message
        .map(msg => ({
          role: msg.message_type as 'user' | 'assistant',
          content: msg.content,
        }));

      // Generate RAG response
      const ragResponse = await generateRAGResponse(
        content,
        ws.websiteId,
        chatHistory,
        { limit: 5, threshold: 0.7 }
      );

      // Save assistant response to database
      await db.chatHistory.create({
        session_id: ws.sessionId,
        website_id: ws.websiteId,
        message_type: 'assistant',
        content: ragResponse.answer,
        metadata: {
          sources: ragResponse.sources,
          context_used: ragResponse.context.totalSources,
        },
      });

      // Send response back to client
      const responseMessage: ChatMessage = {
        type: 'message',
        content: ragResponse.answer,
        sessionId: ws.sessionId,
        timestamp: Date.now(),
        metadata: {
          sources: ragResponse.sources,
          contextSources: ragResponse.context.totalSources,
        },
      };
      ws.send(JSON.stringify(responseMessage));
      break;

    case 'voice_start':
      // Handle voice interaction start
      const voiceStartMessage: ChatMessage = {
        type: 'voice_start',
        sessionId: ws.sessionId,
        timestamp: Date.now(),
      };
      // Broadcast to other connections in the same session if needed
      ws.send(JSON.stringify(voiceStartMessage));
      break;

    case 'voice_end':
      // Handle voice interaction end
      const voiceEndMessage: ChatMessage = {
        type: 'voice_end',
        sessionId: ws.sessionId,
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(voiceEndMessage));
      break;

    default:
      console.log('Unknown message type:', type);
  }
}

// API route handler for WebSocket upgrade
export async function GET(request: NextRequest) {
  // Initialize WebSocket server
  const server = initializeWebSocketServer();
  
  // For development, return connection info
  return new Response(JSON.stringify({
    status: 'WebSocket server running',
    port: process.env.WEBSOCKET_PORT || 3001,
    connections: activeConnections.size,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Handle WebSocket upgrade
export async function POST(request: NextRequest) {
  return new Response('WebSocket endpoint - use WebSocket connection', {
    status: 426,
    headers: {
      'Upgrade': 'websocket',
    },
  });
}
