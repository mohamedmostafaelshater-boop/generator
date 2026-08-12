# مولّد أوصاف المنتجات

## خطوات النشر على Vercel (الأسهل والمجانية)

### 1. جهّز مفتاح Anthropic API
- روح على https://console.anthropic.com
- اعمل حساب (لو مش عندك)
- من قسم "API Keys" اعمل مفتاح جديد وانسخه — هتحتاجه في خطوة 4

### 2. اربط المشروع بـ Vercel
- روح على https://vercel.com واعمل حساب (تقدر تسجل بحساب GitHub مباشرة)
- اضغط "Add New Project"
- اختار الـ repository إلي رفعته
- Vercel هيكتشف تلقائياً إنه مشروع Next.js

### 3. ضيف المفتاح السري (الخطوة الأهم)
- قبل الـ Deploy، روح لقسم "Environment Variables"
- الاسم: ANTHROPIC_API_KEY
- القيمة: المفتاح إلي نسخته من خطوة 1
- اضغط "Deploy"

### 4. خلاص، الموقع شغال
