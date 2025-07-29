# Embed Chatbot ke Website Lain

## 🚀 Cara Embed Chatbot Anda

### **Metode 1: Script Sederhana (Recommended)**

Tambahkan script ini ke website target:

```html
<!-- Chatbot Widget Script -->
<script>
  (function() {
    // Konfigurasi chatbot
    const CHATBOT_CONFIG = {
      apiUrl: 'https://your-domain.com/api/chat', // Ganti dengan domain Anda
      websiteId: 'production-website-id',
      theme: 'dark', // atau 'light'
      position: 'bottom-right', // bottom-left, center
      initialMessage: 'Halo! Ada yang bisa saya bantu?'
    };

    // Load CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://your-domain.com/embed/chatbot.css';
    document.head.appendChild(linkElement);

    // Load chatbot container
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chatbot-widget';
    document.body.appendChild(chatbotContainer);

    // Load React component
    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://your-domain.com/embed/chatbot.js';
    scriptElement.onload = function() {
      // Initialize chatbot
      if (window.ChatbotWidget) {
        window.ChatbotWidget.init(CHATBOT_CONFIG);
      }
    };
    document.head.appendChild(scriptElement);
  })();
</script>
```

### **Metode 2: iframe Embed**

```html
<!-- Chatbot iframe -->
<iframe 
  src="https://your-domain.com/embed?websiteId=your-website-id&theme=dark"
  width="400" 
  height="600"
  frameborder="0"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
</iframe>
```

### **Metode 3: NPM Package (Advanced)**

```bash
npm install your-chatbot-package
```

```javascript
import { ChatbotWidget } from 'your-chatbot-package';

function App() {
  return (
    <div>
      <ChatbotWidget 
        apiUrl="https://your-domain.com/api/chat"
        websiteId="your-website-id"
        theme="dark"
      />
    </div>
  );
}
```

## 🛠️ Setup untuk Embed

### **1. Buat API Endpoint untuk Cross-Origin**

Tambahkan ke `/api/chat/route.ts`:

```typescript
// Tambahkan CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers });
}
```

### **2. Buat Embed Component**

Komponen terpisah untuk embedding:

```typescript
// src/components/EmbedChatbot.tsx
export function EmbedChatbot({ websiteId, apiUrl, theme }: EmbedProps) {
  return (
    <EnhancedChatInterface
      websiteId={websiteId}
      apiEndpoint={apiUrl}
      theme={theme}
      position="bottom-right"
    />
  );
}
```

### **3. Buat Embed Page**

```typescript
// src/app/embed/page.tsx
export default function EmbedPage({ searchParams }: { 
  searchParams: { websiteId: string; theme: string } 
}) {
  return (
    <EmbedChatbot 
      websiteId={searchParams.websiteId}
      theme={searchParams.theme}
      apiUrl="/api/chat"
    />
  );
}
```

## 📊 Dashboard untuk Management (Opsional)

### **Admin Dashboard Features:**
- ✅ Manage multiple websites
- ✅ Generate embed codes
- ✅ View chat analytics
- ✅ Configure chatbot settings
- ✅ Monitor usage statistics

### **Embed Code Generator:**
```typescript
function generateEmbedCode(websiteId: string, options: EmbedOptions) {
  return `
<script>
  (function() {
    const config = ${JSON.stringify({ websiteId, ...options })};
    // ... embed script
  })();
</script>
  `;
}
```

## 🔐 Security & Authentication

### **API Key per Website:**
```typescript
// Validasi API key untuk setiap website
const website = await validateApiKey(apiKey);
if (!website) {
  return Response.json({ error: 'Invalid API key' }, { status: 401 });
}
```

### **Domain Whitelist:**
```typescript
// Cek domain yang diizinkan
const allowedDomains = website.allowedDomains || [];
const origin = request.headers.get('origin');
if (!allowedDomains.includes(origin)) {
  return Response.json({ error: 'Domain not allowed' }, { status: 403 });
}
```

## 🚀 Deployment untuk Embed

### **1. Deploy ke Vercel/Netlify**
```bash
npm run build
vercel --prod
```

### **2. Setup CDN untuk Embed Files**
- Host static files di CDN
- Optimize untuk loading speed
- Enable GZIP compression

### **3. Monitor Usage**
- Track embed installations
- Monitor API usage
- Analytics per website

## 💡 Best Practices

### **Performance:**
- ✅ Lazy load chatbot component
- ✅ Minimize bundle size
- ✅ Use CDN for static assets
- ✅ Implement caching

### **Security:**
- ✅ Validate API keys
- ✅ Implement rate limiting
- ✅ Sanitize user inputs
- ✅ Use HTTPS only

### **UX:**
- ✅ Responsive design
- ✅ Theme customization
- ✅ Multiple languages
- ✅ Accessibility support

## 📞 Integration Examples

### **WordPress Plugin:**
```php
// WordPress shortcode
add_shortcode('chatbot', function($atts) {
  $websiteId = $atts['website-id'];
  return "<div id='chatbot-{$websiteId}'></div>
          <script>loadChatbot('{$websiteId}');</script>";
});
```

### **Shopify App:**
```liquid
<!-- Shopify theme integration -->
{{ 'chatbot.js' | asset_url | script_tag }}
<script>
  ChatbotWidget.init({
    websiteId: '{{ shop.metafields.chatbot.website_id }}',
    theme: 'light'
  });
</script>
```

### **React/Vue/Angular:**
```javascript
// Modern framework integration
import { ChatbotWidget } from '@your-org/chatbot-react';

<ChatbotWidget 
  websiteId="your-id"
  customStyles={{ primaryColor: '#007bff' }}
/>
```
