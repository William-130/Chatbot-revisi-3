'use client';

import React from 'react';
import { EnhancedChatInterface } from '@/components/EnhancedChatInterface';

interface EmbedChatbotProps {
  websiteId?: string;
  apiUrl?: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left' | 'center';
  initialMessage?: string;
}

export function EmbedChatbot({
  websiteId = 'production-website-id',
  apiUrl = '/api/chat',
  theme = 'dark',
  position = 'bottom-right',
  initialMessage = 'Halo! Ada yang bisa saya bantu?'
}: EmbedChatbotProps) {
  return (
    <div className="chatbot-embed">
      <EnhancedChatInterface
        websiteId={websiteId}
        apiEndpoint={apiUrl}
        initialMessage={initialMessage}
        theme={theme}
        position={position}
        showAvatar={true}
        avatarSize="lg"
      />
    </div>
  );
}
