

# خطة تطويرية وتحسينية شاملة + نظام رسائل داخلية

## التحليل الحالي

المشروع يتضمن: Landing page، Dashboard، Tasks (Kanban/List)، Ideas، Team، Reports، Settings، Chat AI، إشعارات، ودعم RTL/i18n. البنية جيدة لكن تحتاج تحسينات في الاحترافية وتجربة المستخدم.

---

## الجزء الأول: نظام الرسائل الداخلية (Messages)

### قاعدة البيانات
- إنشاء جدول `messages` بالأعمدة: `id`, `project_id`, `sender_id`, `content`, `created_at`
- تفعيل Realtime على الجدول
- سياسات RLS: أعضاء المشروع فقط يقرأون ويكتبون

### الواجهة
- صفحة `/messages` جديدة تُضاف للـ Sidebar بأيقونة `MessageSquare`
- تصميم chat-style: قائمة رسائل مع حقل إرسال في الأسفل
- عرض اسم المرسل + avatar + وقت الرسالة
- تحديث فوري عبر Realtime subscription
- إشعار عند وصول رسالة جديدة

### الملفات المتأثرة
- Migration SQL جديد
- `src/pages/Messages.tsx` (جديد)
- `src/components/layout/AppSidebar.tsx` — إضافة رابط
- `src/App.tsx` — إضافة Route
- `src/i18n/translations.ts` — ترجمات جديدة

---

## الجزء الثاني: تحسينات احترافية

### 1. تحسين Landing Page
- ترجمة Hero و Features و CTA للعربية باستخدام `useLanguage`
- إضافة language switcher في Navbar
- تحسين الأنيميشن وإضافة scroll-based animations

### 2. تحسين Dashboard
- إضافة skeleton loaders أثناء التحميل بدل الشاشة الفارغة
- عرض تاريخ آخر تحديث
- إضافة ترحيب بالوقت (صباح/مساء)

### 3. تحسين إدارة المهام
- إضافة فلترة حسب الأولوية والحالة والعضو المُسند إليه
- إضافة بحث نصي في المهام
- إضافة due date في بطاقة Kanban

### 4. تحسين صفحة الفريق
- عرض آخر نشاط لكل عضو
- إضافة تأكيد قبل حذف عضو (AlertDialog)

### 5. تحسين الإعدادات
- إضافة تبويب "Danger Zone" لحذف المشروع
- إضافة تغيير كلمة المرور من داخل الإعدادات

### 6. تحسينات UX عامة
- Empty states محسّنة بأيقونات ورسائل مفيدة
- Loading skeletons في كل الصفحات
- Breadcrumbs في الهيدر
- تأكيد قبل العمليات الحساسة (حذف مهمة، حذف فكرة)
- Keyboard shortcuts (Ctrl+K للبحث)

### 7. تحسين الأمان
- إضافة rate limiting على edge functions
- تحسين validation على المدخلات

---

## ترتيب التنفيذ

1. **نظام الرسائل** — DB migration + صفحة Messages + Realtime + Sidebar
2. **Skeleton loaders** — Dashboard, Tasks, Ideas, Team
3. **فلترة وبحث المهام** — Tasks page
4. **تحسين Landing** — ترجمة + language switcher
5. **تحسينات UX** — AlertDialogs, empty states, breadcrumbs
6. **تحسينات Dashboard** — ترحيب بالوقت + آخر تحديث
7. **تحسينات Settings** — تغيير كلمة المرور + Danger Zone

