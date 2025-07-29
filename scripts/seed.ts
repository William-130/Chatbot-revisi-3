import { db } from '../src/lib/database';
import { v4 as uuidv4 } from 'uuid';

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    // Create demo website
    const demoWebsite = await db.websites.create({
      domain: 'https://demo.example.com',
      name: 'Demo Website',
      api_key: 'demo-website-id',
      settings: {
        crawl_enabled: true,
        max_pages: 50,
        voice_enabled: true,
      },
    });

    console.log('✅ Created demo website:', demoWebsite.domain);

    // Create sample documents for demo
    const sampleDocuments = [
      {
        content: 'Welcome to our demo website! We offer cutting-edge AI solutions for businesses. Our platform provides intelligent chatbots, voice assistants, and automated customer support systems.',
        url: 'https://demo.example.com/',
        title: 'Home - Demo Website',
        metadata: {
          source_domain: 'https://demo.example.com',
          page_type: 'homepage',
        },
      },
      {
        content: 'Our AI chatbot services include natural language processing, machine learning models, and conversational AI. We specialize in creating intelligent virtual assistants that can understand and respond to human queries.',
        url: 'https://demo.example.com/services',
        title: 'AI Services - Demo Website',
        metadata: {
          source_domain: 'https://demo.example.com',
          page_type: 'services',
        },
      },
      {
        content: 'Contact us for more information about our AI solutions. Email: contact@demo.example.com, Phone: (555) 123-4567. Our team is available 24/7 to help you with your AI needs.',
        url: 'https://demo.example.com/contact',
        title: 'Contact Us - Demo Website',
        metadata: {
          source_domain: 'https://demo.example.com',
          page_type: 'contact',
        },
      },
    ];

    // Create embeddings and documents
    const { createEmbeddingsBatch } = await import('../src/lib/rag');
    const texts = sampleDocuments.map(doc => doc.content);
    const embeddings = await createEmbeddingsBatch(texts);

    for (let i = 0; i < sampleDocuments.length; i++) {
      const doc = sampleDocuments[i];
      await db.documents.create({
        website_id: demoWebsite.id,
        content: doc.content,
        url: doc.url,
        title: doc.title,
        embedding: embeddings[i],
        metadata: doc.metadata,
      });
    }

    console.log('✅ Created sample documents for demo');
    console.log('✅ Database seeding completed successfully');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
