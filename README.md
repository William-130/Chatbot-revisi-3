# Advanced Multi-Tenant RAG Chatbot System

A highly sophisticated, voice-enabled, multi-tenant RAG (Retrieval-Augmented Generation) chatbot system built with Next.js 14, PostgreSQL, pgvector, and Google Gemini AI.

![RAG Chatbot Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=RAG+Chatbot+System)

## 🚀 Key Features

### 🎯 Multi-Tenant RAG System
- **Domain-Isolated Data**: Each website's data is strictly isolated using metadata filtering
- **pgvector Integration**: Vector embeddings stored directly in PostgreSQL
- **Smart Context Retrieval**: Relevant document chunks retrieved based on semantic similarity

### 🎤 Real-Time Voice Conversations
- **Bidirectional Voice Chat**: Natural voice conversations with interruption support
- **Voice Activity Detection**: Advanced VAD using `@ricky0123/vad-web`
- **Web Speech API**: Browser-native speech recognition and synthesis
- **Real-Time Communication**: WebSocket-based low-latency messaging

### 🤖 AI-Powered Intelligence
- **Google Gemini Integration**: State-of-the-art language model for responses
- **Context-Aware Responses**: Combines retrieved documents with conversation history
- **Streaming Responses**: Real-time response generation and delivery

### 🕷️ Automated Data Ingestion
- **Smart Web Crawling**: Puppeteer-based website crawling with respect for robots.txt
- **Intelligent Text Chunking**: LangChain-powered text splitting for optimal retrieval
- **Automatic Embedding**: Google Gemini embeddings for all content chunks
- **Background Processing**: Scalable crawling pipeline with status tracking

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL     │    │  Google Gemini  │
│                 │    │   + pgvector     │    │      API        │
│  Frontend +     │◄──►│                  │    │                 │
│  API Routes     │    │  • websites      │◄──►│  • Embeddings   │
│                 │    │  • documents     │    │  • Chat Model   │
│  • Chat UI      │    │  • chat_history  │    │                 │
│  • Voice Input  │    │  • chat_sessions │    │                 │
│  • WebSockets   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌──────────────────┐
│   Web Crawler   │    │   Vector Store   │
│                 │    │                  │
│  • Puppeteer    │    │  • Similarity    │
│  • Cheerio      │    │    Search        │
│  • LangChain    │    │  • Metadata      │
│  • Background   │    │    Filtering     │
│    Processing   │    │                  │
└─────────────────┘    └──────────────────┘
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, WebSocket support
- **Database**: PostgreSQL with pgvector extension
- **AI/ML**: Google Gemini (Chat + Embeddings), LangChain
- **Web Scraping**: Puppeteer, Cheerio
- **Voice**: Web Speech API, VAD (Voice Activity Detection)
- **Real-time**: WebSockets for bidirectional communication

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 15+ with pgvector extension
- **Google Gemini API** key
- **Modern browser** with Web Speech API support

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd chatbot-revisi-3
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/rag_chatbot"
GOOGLE_GEMINI_API_KEY="your_google_gemini_api_key_here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Create database and enable pgvector
createdb rag_chatbot
psql rag_chatbot -c "CREATE EXTENSION vector;"

# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the demo!

## 📊 Database Schema

### Core Tables

#### `websites`
```sql
- id (UUID, Primary Key)
- domain (VARCHAR, Unique)
- name (VARCHAR)
- api_key (VARCHAR, Unique)
- crawl_status (VARCHAR)
- settings (JSONB)
- created_at, updated_at
```

#### `documents`
```sql
- id (UUID, Primary Key)
- website_id (UUID, Foreign Key)
- content (TEXT)
- url (VARCHAR)
- title (VARCHAR)
- embedding (vector(768)) -- Google Gemini embeddings
- metadata (JSONB) -- For domain filtering
- created_at, updated_at
```

#### `chat_sessions` & `chat_history`
```sql
-- Session management and conversation tracking
-- Supports multi-tenant isolation
```

## 🎯 API Endpoints

### Chat API
```
POST /api/chat
- Send messages and get AI responses
- Automatic RAG context retrieval
- Session management

GET /api/chat
- Connection status and info
```

### Crawl API
```
POST /api/crawl
- Start website crawling
- Background processing
- Status tracking

GET /api/crawl?websiteId=<id>
- Get crawl status and statistics
```

### WebSocket
```
WS /api/chat-socket
- Real-time bidirectional communication
- Voice interaction support
- Session persistence
```

## 🎤 Voice Features

### Speech Recognition
- **Continuous Listening**: Background voice detection
- **Real-time Transcription**: Live speech-to-text conversion
- **Multi-language Support**: Configurable language models

### Voice Synthesis
- **Natural Speech**: High-quality text-to-speech
- **Interruption Support**: Smart conversation flow
- **Voice Selection**: Multiple voice options

### Voice Activity Detection
- **Smart Interruption**: Detect when user starts speaking
- **Conversation Flow**: Natural turn-taking
- **Background Monitoring**: Continuous voice activity monitoring

## 🕷️ Web Crawling

### Features
- **Intelligent Crawling**: Respects robots.txt and rate limits
- **Content Extraction**: Smart content area detection
- **Text Chunking**: Optimal chunk sizes for RAG retrieval
- **Duplicate Detection**: Avoid processing same content twice

### Configuration
```javascript
const crawlOptions = {
  maxPages: 50,
  maxDepth: 3,
  respectRobotsTxt: true,
  delayBetweenRequests: 1000,
  excludePatterns: ['/admin', '/login'],
  includePatterns: ['/blog', '/docs'],
};
```

## 🔧 Component Usage

### ChatInterface Component

```tsx
import { ChatInterface } from '@/components/ChatInterface';

<ChatInterface 
  websiteId="your-website-id"
  apiEndpoint="/api/chat"
  initialMessage="Hi! How can I help you?"
  theme="dark"
  position="bottom-right"
/>
```

### Props
- `websiteId`: Unique identifier for domain isolation
- `apiEndpoint`: Chat API endpoint
- `initialMessage`: Welcome message
- `theme`: 'light' | 'dark'
- `position`: 'bottom-right' | 'bottom-left' | 'center'

## 🚀 Deployment

### Production Setup

1. **Database**: Set up PostgreSQL with pgvector on your cloud provider
2. **Environment**: Configure production environment variables
3. **Build**: Run `npm run build`
4. **Deploy**: Deploy to Vercel, Railway, or your preferred platform

### Environment Variables (Production)
```env
DATABASE_URL="postgresql://prod-user:password@prod-host:5432/rag_chatbot"
GOOGLE_GEMINI_API_KEY="your_production_api_key"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your_secure_production_secret"
NODE_ENV="production"
```

## 🔒 Security Considerations

- **API Key Management**: Secure storage of Google Gemini API keys
- **Domain Isolation**: Strict data separation between websites
- **Input Validation**: Sanitization of all user inputs
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Proper cross-origin resource sharing

## 📈 Performance Optimization

- **Vector Indexing**: Optimized pgvector indexes for fast similarity search
- **Connection Pooling**: Efficient database connection management
- **Caching**: Smart caching of embeddings and responses
- **Batch Processing**: Efficient bulk operations for crawling
- **WebSocket Optimization**: Minimal latency real-time communication

## 🧪 Testing

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
```

## 📚 Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [LangChain Documentation](https://js.langchain.com/)
- [Web Speech API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- GitHub Issues
- Documentation
- Community Discord

---

**Built with ❤️ using Next.js, PostgreSQL, and Google Gemini AI**
