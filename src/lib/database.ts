import { Pool } from 'pg';

// Global connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(text, params);
  return results[0] || null;
}

// Website management
export interface Website {
  id: string;
  domain: string;
  name: string;
  api_key: string;
  created_at: Date;
  updated_at: Date;
  last_crawled_at?: Date;
  crawl_status: 'pending' | 'crawling' | 'completed' | 'failed';
  settings: Record<string, any>;
  is_active: boolean;
}

export interface Document {
  id: string;
  website_id: string;
  content: string;
  url: string;
  title?: string;
  embedding?: number[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ChatSession {
  id: string;
  website_id: string;
  session_token: string;
  user_ip?: string;
  user_agent?: string;
  created_at: Date;
  ended_at?: Date;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  website_id: string;
  message_type: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: Date;
}

// Database operations
export const db = {
  websites: {
    async findByDomain(domain: string): Promise<Website | null> {
      return queryOne<Website>(
        'SELECT * FROM websites WHERE domain = $1 AND is_active = true',
        [domain]
      );
    },
    
    async findByApiKey(apiKey: string): Promise<Website | null> {
      return queryOne<Website>(
        'SELECT * FROM websites WHERE api_key = $1 AND is_active = true',
        [apiKey]
      );
    },
    
    async create(data: Partial<Website>): Promise<Website> {
      const result = await queryOne<Website>(
        `INSERT INTO websites (domain, name, api_key, settings) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [data.domain, data.name, data.api_key, JSON.stringify(data.settings || {})]
      );
      if (!result) throw new Error('Failed to create website');
      return result;
    },
    
    async updateCrawlStatus(id: string, status: Website['crawl_status']): Promise<void> {
      await query(
        'UPDATE websites SET crawl_status = $1, last_crawled_at = NOW() WHERE id = $2',
        [status, id]
      );
    }
  },
  
  documents: {
    async create(data: Partial<Document>): Promise<Document> {
      const result = await queryOne<Document>(
        `INSERT INTO documents (website_id, content, url, title, embedding, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          data.website_id,
          data.content,
          data.url,
          data.title,
          data.embedding ? `[${data.embedding.join(',')}]` : null,
          JSON.stringify(data.metadata || {})
        ]
      );
      if (!result) throw new Error('Failed to create document');
      return result;
    },
    
    async deleteByWebsiteId(websiteId: string): Promise<void> {
      await query('DELETE FROM documents WHERE website_id = $1', [websiteId]);
    },
    
    async similaritySearch(
      websiteId: string,
      embedding: number[],
      limit: number = 5,
      threshold: number = 0.7
    ): Promise<Document[]> {
      return query<Document>(
        `SELECT *, (1 - (embedding <=> $2)) as similarity 
         FROM documents 
         WHERE website_id = $1 
         AND (1 - (embedding <=> $2)) > $3
         ORDER BY embedding <=> $2 
         LIMIT $4`,
        [websiteId, `[${embedding.join(',')}]`, threshold, limit]
      );
    }
  },
  
  chatSessions: {
    async create(data: Partial<ChatSession>): Promise<ChatSession> {
      const result = await queryOne<ChatSession>(
        `INSERT INTO chat_sessions (website_id, session_token, user_ip, user_agent) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [data.website_id, data.session_token, data.user_ip, data.user_agent]
      );
      if (!result) throw new Error('Failed to create chat session');
      return result;
    },
    
    async findByToken(token: string): Promise<ChatSession | null> {
      return queryOne<ChatSession>(
        'SELECT * FROM chat_sessions WHERE session_token = $1 AND is_active = true',
        [token]
      );
    },
    
    async end(id: string): Promise<void> {
      await query(
        'UPDATE chat_sessions SET ended_at = NOW(), is_active = false WHERE id = $1',
        [id]
      );
    }
  },
  
  chatHistory: {
    async create(data: Partial<ChatMessage>): Promise<ChatMessage> {
      const result = await queryOne<ChatMessage>(
        `INSERT INTO chat_history (session_id, website_id, message_type, content, metadata) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [data.session_id, data.website_id, data.message_type, data.content, JSON.stringify(data.metadata || {})]
      );
      if (!result) throw new Error('Failed to create chat message');
      return result;
    },
    
    async getBySessionId(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
      return query<ChatMessage>(
        `SELECT * FROM chat_history 
         WHERE session_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [sessionId, limit]
      );
    }
  }
};
