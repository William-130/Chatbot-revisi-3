'use client';

import { EmbedChatbot } from '@/components/EmbedChatbot';
import { Suspense } from 'react';

interface EmbedPageProps {
  searchParams: {
    websiteId?: string;
    theme?: 'light' | 'dark';
    apiUrl?: string;
    position?: 'bottom-right' | 'bottom-left' | 'center';
  };
}

function EmbedContent({ searchParams }: EmbedPageProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <EmbedChatbot
        websiteId={searchParams.websiteId || 'production-website-id'}
        apiUrl={searchParams.apiUrl || '/api/chat'}
        theme={searchParams.theme || 'dark'}
        position={searchParams.position || 'bottom-right'}
        initialMessage="Halo! Saya asisten AI. Ada yang bisa saya bantu?"
      />
    </div>
  );
}

export default function EmbedPage({ searchParams }: EmbedPageProps) {
  return (
    <Suspense fallback={<div>Loading chatbot...</div>}>
      <EmbedContent searchParams={searchParams} />
    </Suspense>
  );
}
