import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteId, options } = body;

    if (!websiteId) {
      return Response.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Import dynamically to avoid build issues
    const { startCrawl } = await import('@/lib/crawler');
    
    const result = await startCrawl(websiteId, options);

    return Response.json(result);

  } catch (error) {
    console.error('Error in crawl API:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const websiteId = url.searchParams.get('websiteId');

    if (!websiteId) {
      return Response.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Import dynamically to avoid build issues
    const { db } = await import('@/lib/database');
    
    const website = await db.websites.findByApiKey(websiteId);
    if (!website) {
      return Response.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    // Get document count
    const documents = await db.query(
      'SELECT COUNT(*) as count FROM documents WHERE website_id = $1',
      [website.id]
    );

    return Response.json({
      website: {
        id: website.id,
        domain: website.domain,
        name: website.name,
        crawl_status: website.crawl_status,
        last_crawled_at: website.last_crawled_at,
        created_at: website.created_at,
        is_active: website.is_active,
      },
      documentCount: parseInt(documents[0]?.count || '0'),
    });

  } catch (error) {
    console.error('Error in crawl status API:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
