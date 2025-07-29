# 🚀 Panduan Setup Mode Produksi

## ✅ Status Sekarang
- ✅ Avatar dikecilkan di pojok kanan bawah 
- ✅ Interface chatbot lengkap dengan voice & TTS
- ✅ Database schema siap
- ⚠️ **Mode Demo** - perlu diaktifkan ke mode produksi

## 🔧 Langkah-langkah Menuju Produksi

### **1. Setup Database PostgreSQL + pgvector**

#### A. Install PostgreSQL dengan pgvector
```bash
# Windows (gunakan PostgreSQL installer)
# Download dari: https://www.postgresql.org/download/windows/
# Pastikan version 12+ untuk support pgvector

# Setelah install PostgreSQL, install pgvector extension
# Buka psql dan jalankan:
CREATE EXTENSION IF NOT EXISTS vector;
```

#### B. Buat Database
```bash
# Buka Command Prompt/PowerShell sebagai admin
createdb ChatbotDB
```

#### C. Update File .env
```bash
# Copy .env.example ke .env dan isi:
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/rag_chatbot"
GOOGLE_GEMINI_API_KEY="your_actual_gemini_api_key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_random_secret_32_chars_min"
NODE_ENV="development"
```

### **2. Dapatkan Google Gemini API Key**
1. Kunjungi: https://makersuite.google.com/app/apikey
2. Login dengan Google account
3. Buat API key baru
4. Copy key ke .env file

### **3. Jalankan Database Migration**
```bash
npm run migrate
```

### **4. Aktifkan Mode Produksi**

#### A. Update Chat API (keluar dari demo mode)
File yang perlu diubah: `src/app/api/chat/route.ts`

#### B. Aktifkan RAG Pipeline  
File yang perlu diubah: `src/lib/rag.ts`

#### C. Setup Web Crawler
File yang perlu diubah: `src/lib/crawler.ts`

### **5. Fitur yang Akan Diaktifkan**

#### ✅ **RAG (Retrieval-Augmented Generation)**
- Pencarian semantik dalam database vector
- Context-aware responses berdasarkan konten website
- Similarity search dengan pgvector

#### ✅ **Web Crawler**
- Automatic website crawling
- Content extraction dan indexing
- Scheduled re-crawling

#### ✅ **Multi-tenant Support**
- Multiple websites per instance
- API key authentication
- Isolated data per tenant

#### ✅ **Advanced Chat Features**
- Session management
- Chat history
- Source citations
- Contextual responses

### **6. Testing Setup**
```bash
# Test database connection
npm run test-db

# Test crawler
npm run test-crawler

# Test RAG pipeline
npm run test-rag
```

### **7. Optional: Admin Dashboard**
- Website management
- Crawl status monitoring
- Analytics dashboard
- User management

## 🎯 **Next Steps Priority**
1. **High Priority**: Setup database & Gemini API
2. **High Priority**: Activate RAG pipeline
3. **Medium Priority**: Setup web crawler
4. **Low Priority**: Admin dashboard

## 📁 **File Structure Produksi**
```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts (✅ sudah ada, perlu update)
│   │   ├── admin/ (⚠️ perlu dibuat)
│   │   └── crawler/ (⚠️ perlu dibuat)
│   ├── admin/ (⚠️ optional dashboard)
│   └── page.tsx (✅ sudah ada)
├── components/
│   ├── EnhancedChatInterface.tsx (✅ sudah ada)
│   ├── VideoAvatar.tsx (✅ sudah ada)
│   └── AdminDashboard.tsx (⚠️ optional)
├── lib/
│   ├── database.ts (✅ sudah ada)
│   ├── rag.ts (⚠️ perlu aktivasi)
│   ├── crawler.ts (⚠️ perlu aktivasi)
│   └── auth.ts (⚠️ optional)
└── scripts/
    ├── migrate.ts (✅ sudah ada)
    ├── seed.ts (⚠️ perlu dibuat)
    └── test-*.ts (⚠️ perlu dibuat)
```

## 🚦 **Langkah Berikutnya**
Pilih opsi:
1. **Quick Setup**: Aktivasi database + Gemini API + RAG (30 menit)
2. **Full Setup**: Semua fitur termasuk crawler + admin (2-3 jam)
3. **Custom**: Pilih fitur spesifik yang diinginkan
