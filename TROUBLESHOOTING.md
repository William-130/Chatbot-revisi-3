# 🚀 Quick Setup Instructions

## ❌ Masalah yang Ditemukan & Solusi:

### **1. Avatar State Tidak Berubah - FIXED ✅**
**Masalah:** Avatar stuck di idle, tidak berubah state
**Solusi:** 
- ✅ Diperbaiki TTS function dengan logging
- ✅ Ditambah voice loading handling
- ✅ Diperbaiki state management

### **2. Tidak Ada Respons - PERLU DICEK 🔍**
**Kemungkinan Penyebab:**
- Gemini API key tidak valid/quota habis
- Network issues
- CORS errors

**Cara Debug:**
1. Buka browser console (F12)
2. Lihat error messages
3. Cek network tab untuk API calls

### **3. Database Setup Error - DIPERBAIKI ✅**
**Masalah:** npm run setup-database error
**Solusi:** 
- ✅ Script baru yang lebih sederhana
- ✅ Better error handling
- ✅ Step-by-step verification

## 🛠️ Langkah Setup PostgreSQL:

### **A. Install PostgreSQL (Jika Belum)**
1. Download: https://www.postgresql.org/download/windows/
2. Install dengan default settings
3. Ingat password yang Anda set

### **B. Buat Database**
1. Buka **pgAdmin** atau **Command Prompt**
2. Login ke PostgreSQL:
```bash
psql -U postgres
```
3. Buat database:
```sql
CREATE DATABASE "ChatbotDB";
```
4. Exit: `\q`

### **C. Update .env File**
```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ChatbotDB"
GOOGLE_GEMINI_API_KEY="AIzaSyAmhAFwTMY4tVXSajw6UymrpLwfjkix_aU"
```

### **D. Test Database**
```bash
npm run test-db
```

## 🤖 Test Chatbot:

### **1. Jalankan Development Server**
```bash
npm run dev
```

### **2. Buka Browser**
- URL: http://localhost:3000
- Buka Console (F12) untuk debug

### **3. Test Features**
- ✅ Klik avatar kecil di pojok
- ✅ Ketik pesan
- ✅ Perhatikan console logs
- ✅ Test voice input (mikrofon)
- ✅ Lihat perubahan avatar state

### **4. Expected Behavior**
```
🔊 TTS Starting: [text]...
🔊 Available voices: [number]
🔊 Using Indonesian voice: [voice name]
🔊 TTS Started
🔊 TTS Ended
```

## 🌐 Embed ke Website Lain:

### **Method 1: iframe (Termudah)**
```html
<iframe 
  src="http://localhost:3000/embed"
  width="400" 
  height="600"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
</iframe>
```

### **Method 2: JavaScript Embed**
```html
<script>
(function() {
  const iframe = document.createElement('iframe');
  iframe.src = 'http://localhost:3000/embed?theme=dark';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;z-index:9999';
  document.body.appendChild(iframe);
})();
</script>
```

### **Method 3: Production Deployment**
1. Deploy ke Vercel/Netlify
2. Update iframe src ke production URL
3. Tambahkan domain management

## 🔧 Troubleshooting:

### **Avatar Tidak Berubah:**
```javascript
// Cek di console browser:
console.log('Avatar state:', avatarState);
console.log('Is speaking:', isSpeaking);
console.log('Speech enabled:', speechEnabled);
```

### **Tidak Ada Suara:**
1. Cek browser permissions
2. Cek volume sistem
3. Test di browser lain

### **API Error:**
1. Cek Gemini API key di console
2. Cek quota Gemini API
3. Cek network connectivity

### **Database Error:**
1. Pastikan PostgreSQL running
2. Cek credentials di .env
3. Test connection manual

## 📞 Support Commands:

```bash
# Test database
npm run test-db

# Start development  
npm run dev

# Build for production
npm run build

# Check API status
curl http://localhost:3000/api/chat
```

## 🎯 Next Steps Setelah Working:

1. **✅ Test semua fitur lokal**
2. **🌐 Deploy ke production**
3. **🔗 Setup embedding**
4. **📊 Add analytics (optional)**
5. **🛡️ Add security features**

## 📋 Priority Checklist:

- [ ] PostgreSQL installed & running
- [ ] Database created successfully  
- [ ] .env file configured correctly
- [ ] Gemini API working
- [ ] Avatar states changing
- [ ] TTS working with voice
- [ ] Voice input working
- [ ] Embed page accessible
- [ ] CORS headers working

**Status Update: Production mode ACTIVE with Gemini Pro! 🚀**
