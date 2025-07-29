import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { db, Website, Document } from './database';
import { createEmbeddingsBatch } from './rag';

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  respectRobotsTxt?: boolean;
  delayBetweenRequests?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface CrawlResult {
  success: boolean;
  pagesProcessed: number;
  documentsCreated: number;
  errors: string[];
}

export class WebsiteCrawler {
  private website: Website;
  private options: CrawlOptions;
  private visitedUrls: Set<string> = new Set();
  private errors: string[] = [];

  constructor(website: Website, options: CrawlOptions = {}) {
    this.website = website;
    this.options = {
      maxPages: 50,
      maxDepth: 3,
      respectRobotsTxt: true,
      delayBetweenRequests: 1000,
      excludePatterns: [
        '/admin',
        '/wp-admin',
        '/login',
        '/checkout',
        '/cart',
        '.pdf',
        '.jpg',
        '.png',
        '.gif',
        '.zip',
        '.exe'
      ],
      includePatterns: [],
      ...options,
    };
  }

  async crawl(): Promise<CrawlResult> {
    console.log(`Starting crawl for website: ${this.website.domain}`);
    
    try {
      // Update crawl status
      await db.websites.updateCrawlStatus(this.website.id, 'crawling');

      // Clear existing documents
      await db.documents.deleteByWebsiteId(this.website.id);

      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (compatible; RagBot/1.0; +https://yourbot.com/bot)'
      );

      const documentsToCreate: Partial<Document>[] = [];
      
      // Start crawling from the main domain
      await this.crawlUrl(page, this.website.domain, 0, documentsToCreate);

      // Close browser
      await browser.close();

      // Process documents in batches
      const processedCount = await this.processDocuments(documentsToCreate);

      // Update crawl status
      await db.websites.updateCrawlStatus(this.website.id, 'completed');

      return {
        success: true,
        pagesProcessed: this.visitedUrls.size,
        documentsCreated: processedCount,
        errors: this.errors,
      };

    } catch (error) {
      console.error('Crawl error:', error);
      this.errors.push(`General crawl error: ${error.message}`);
      
      // Update crawl status to failed
      await db.websites.updateCrawlStatus(this.website.id, 'failed');

      return {
        success: false,
        pagesProcessed: this.visitedUrls.size,
        documentsCreated: 0,
        errors: this.errors,
      };
    }
  }

  private async crawlUrl(
    page: puppeteer.Page,
    url: string,
    depth: number,
    documentsToCreate: Partial<Document>[]
  ): Promise<void> {
    // Check constraints
    if (depth > this.options.maxDepth! || 
        this.visitedUrls.size >= this.options.maxPages! ||
        this.visitedUrls.has(url)) {
      return;
    }

    // Check URL patterns
    if (!this.shouldCrawlUrl(url)) {
      return;
    }

    this.visitedUrls.add(url);
    console.log(`Crawling: ${url} (depth: ${depth})`);

    try {
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Get page content
      const content = await page.content();
      const title = await page.title();

      // Extract text content using Cheerio
      const $ = cheerio.load(content);
      
      // Remove script, style, and other non-content elements
      $('script, style, nav, footer, header, .navigation, .menu, .sidebar').remove();
      
      // Extract main content
      let textContent = '';
      const contentSelectors = [
        'main',
        '.content',
        '.main-content',
        'article',
        '.post',
        '.entry-content',
        'body'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          textContent = element.text();
          break;
        }
      }

      // Fallback to body text if no content found
      if (!textContent) {
        textContent = $('body').text();
      }

      // Clean up text
      textContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      if (textContent.length > 100) { // Only process pages with substantial content
        // Split text into chunks
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
          separators: ['\n\n', '\n', '. ', ' ', ''],
        });

        const chunks = await splitter.splitText(textContent);

        // Create document entries for each chunk
        chunks.forEach((chunk, index) => {
          documentsToCreate.push({
            website_id: this.website.id,
            content: chunk,
            url: url,
            title: title,
            metadata: {
              source_domain: this.website.domain,
              chunk_index: index,
              total_chunks: chunks.length,
              crawl_timestamp: new Date().toISOString(),
              page_title: title,
            },
          });
        });
      }

      // Find and queue internal links
      if (depth < this.options.maxDepth!) {
        const links = await page.$$eval('a[href]', (anchors) =>
          anchors
            .map((anchor) => (anchor as HTMLAnchorElement).href)
            .filter((href) => href && !href.startsWith('mailto:') && !href.startsWith('tel:'))
        );

        // Process internal links
        const internalLinks = links
          .filter((link) => this.isInternalLink(link))
          .slice(0, 10); // Limit links per page

        for (const link of internalLinks) {
          await new Promise(resolve => setTimeout(resolve, this.options.delayBetweenRequests));
          await this.crawlUrl(page, link, depth + 1, documentsToCreate);
        }
      }

    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      this.errors.push(`Error crawling ${url}: ${error.message}`);
    }
  }

  private shouldCrawlUrl(url: string): boolean {
    // Check exclude patterns
    for (const pattern of this.options.excludePatterns!) {
      if (url.toLowerCase().includes(pattern.toLowerCase())) {
        return false;
      }
    }

    // Check include patterns (if specified)
    if (this.options.includePatterns!.length > 0) {
      for (const pattern of this.options.includePatterns!) {
        if (url.toLowerCase().includes(pattern.toLowerCase())) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  private isInternalLink(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const domainObj = new URL(this.website.domain);
      return urlObj.hostname === domainObj.hostname;
    } catch {
      return false;
    }
  }

  private async processDocuments(documentsToCreate: Partial<Document>[]): Promise<number> {
    if (documentsToCreate.length === 0) {
      return 0;
    }

    console.log(`Processing ${documentsToCreate.length} document chunks...`);

    try {
      // Extract text content for embedding
      const texts = documentsToCreate.map(doc => doc.content!);

      // Create embeddings in batches
      console.log('Creating embeddings...');
      const embeddings = await createEmbeddingsBatch(texts);

      // Save documents to database
      let createdCount = 0;
      for (let i = 0; i < documentsToCreate.length; i++) {
        const doc = documentsToCreate[i];
        doc.embedding = embeddings[i];

        try {
          await db.documents.create(doc);
          createdCount++;
        } catch (error) {
          console.error(`Error saving document ${i}:`, error);
          this.errors.push(`Error saving document: ${error.message}`);
        }
      }

      console.log(`Successfully created ${createdCount} documents`);
      return createdCount;

    } catch (error) {
      console.error('Error processing documents:', error);
      this.errors.push(`Error processing documents: ${error.message}`);
      return 0;
    }
  }
}

// Utility function to start crawling a website
export async function crawlWebsite(
  websiteId: string,
  options?: CrawlOptions
): Promise<CrawlResult> {
  const website = await db.websites.findByApiKey(websiteId);
  if (!website) {
    throw new Error('Website not found');
  }

  const crawler = new WebsiteCrawler(website, options);
  return await crawler.crawl();
}

// API endpoint for triggering crawls
export async function startCrawl(
  websiteId: string,
  options?: CrawlOptions
): Promise<{ success: boolean; message: string; jobId?: string }> {
  try {
    // Validate website
    const website = await db.websites.findByApiKey(websiteId);
    if (!website) {
      return { success: false, message: 'Website not found' };
    }

    // Check if already crawling
    if (website.crawl_status === 'crawling') {
      return { success: false, message: 'Website is already being crawled' };
    }

    // Start crawl in background (in production, use a proper queue system)
    const jobId = `crawl-${website.id}-${Date.now()}`;
    
    // In a real implementation, you'd use a job queue like Bull or Bee Queue
    // For now, we'll run it directly (not recommended for production)
    setTimeout(async () => {
      try {
        await crawlWebsite(websiteId, options);
      } catch (error) {
        console.error('Background crawl error:', error);
      }
    }, 1000);

    return {
      success: true,
      message: 'Crawl started successfully',
      jobId,
    };

  } catch (error) {
    console.error('Error starting crawl:', error);
    return {
      success: false,
      message: `Error starting crawl: ${error.message}`,
    };
  }
}
