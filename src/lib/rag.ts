import { GoogleGenerativeAI } from '@google/generative-ai';
import { db, Document } from './database';

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Embedding model for similarity search
const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

// Chat model for response generation
const chatModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

export interface RAGContext {
  documents: Document[];
  totalSources: number;
  similarity_threshold: number;
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  sources: string[];
}

/**
 * Core RAG retriever function that performs similarity search
 * with metadata filtering by source domain
 */
export async function retrieveRelevantDocuments(
  query: string,
  websiteId: string,
  options: {
    limit?: number;
    threshold?: number;
  } = {}
): Promise<RAGContext> {
  const { limit = 5, threshold = 0.7 } = options;

  try {
    // Generate embedding for the query
    const result = await embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding.values;

    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error('Failed to generate query embedding');
    }

    // Perform similarity search with metadata filtering
    const documents = await db.documents.similaritySearch(
      websiteId,
      queryEmbedding,
      limit,
      threshold
    );

    return {
      documents,
      totalSources: documents.length,
      similarity_threshold: threshold,
    };
  } catch (error) {
    console.error('Error in RAG retrieval:', error);
    return {
      documents: [],
      totalSources: 0,
      similarity_threshold: threshold,
    };
  }
}

/**
 * Generate a contextual response using retrieved documents
 */
export async function generateRAGResponse(
  query: string,
  websiteId: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: {
    limit?: number;
    threshold?: number;
    includeContext?: boolean;
  } = {}
): Promise<RAGResponse> {
  const { includeContext = true } = options;

  try {
    // Retrieve relevant documents
    const context = await retrieveRelevantDocuments(query, websiteId, options);

    // Build the prompt with context
    const contextText = context.documents
      .map((doc, index) => `Source ${index + 1} (${doc.url}):\n${doc.content}`)
      .join('\n\n');

    // Construct conversation history
    const historyText = chatHistory
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `You are a helpful AI assistant for this website. Use the provided context to answer the user's question accurately and helpfully.

Context from the website:
${contextText}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

Current question: ${query}

Instructions:
- Answer based primarily on the provided context
- If the context doesn't contain relevant information, politely say so
- Be conversational and helpful
- Keep responses concise but informative
- Reference specific sources when relevant

Answer:`;

    // Generate response using Gemini
    const result = await chatModel.generateContent(prompt);
    const answer = result.response.text();

    // Extract source URLs
    const sources = [...new Set(context.documents.map(doc => doc.url))];

    return {
      answer,
      context: includeContext ? context : { documents: [], totalSources: 0, similarity_threshold: 0 },
      sources,
    };
  } catch (error) {
    console.error('Error generating RAG response:', error);
    return {
      answer: "I'm sorry, I encountered an error while processing your question. Please try again.",
      context: { documents: [], totalSources: 0, similarity_threshold: 0 },
      sources: [],
    };
  }
}

/**
 * Create embedding for a text chunk
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values || [];
  } catch (error) {
    console.error('Error creating embedding:', error);
    return [];
  }
}

/**
 * Batch create embeddings for multiple texts
 */
export async function createEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => createEmbedding(text));
    const batchResults = await Promise.all(batchPromises);
    embeddings.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
}
