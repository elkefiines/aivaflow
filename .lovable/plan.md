# خطة التحسينات الشاملة

نطاق متفق عليه: UX/UI + الأداء + تحسين الميزات + الحركة. سأنفّذ مجموعة تحسينات أفقية تطال كل الصفحات بدل إعادة بناء واحدة منها.

## 1) الأداء (Performance)

- **Code splitting للصفحات الثقيلة**: تحويل المسارات في `src/App.tsx` إلى `React.lazy` مع `Suspense` (Dashboard, Tasks, Analytics, GanttChart, Reports, Calendar, Ideas, Automations, Messages, AdminPanel, FocusMode, MemberProfile, TeamMood, MyStats). الصفحات العامة (Index/Login/Signup) تبقى eager.
- **Splash/Suspense fallback** موحّد يطابق الثيم الكوني (شعار + spinner + تدرّج).
- **TanStack Query defaults**: ضبط `staleTime: 30s` و `gcTime: 5min` و `refetchOnWindowFocus: false` لتقليل الطلبات المكرّرة.
- **Skeletons** بدل spinners في Dashboard/Tasks/Analytics للحد من CLS.

## 2) تحسينات UX/UI أفقية

- **مكوّن `PageHeader` موحّد** (عنوان + وصف + actions) لاستبدال الترويسات المتكرّرة في الصفحات.
- **`EmptyState` و `ErrorState`** موجودان — استخدامهما في كل صفحة لا تحتوي عليهما (Tasks, Ideas, Goals, Calendar, Activity).
- **Toasters** محسّنة: رسائل عربية واضحة عند الأخطاء الشائعة (RLS, network, AI rate limit).
- **Focus rings** متّسقة على كل أزرار `outline`/`ghost` للوصولية.
- **Sidebar** : تمييز العنصر النشط بحدّ ملوّن خفيف + transition.

## 3) تحسينات حركية (Motion)

- **`PageTransition` wrapper** باستخدام Framer Motion (`AnimatePresence` + fade/slide خفيف) على كل المسارات داخل `AppLayout`.
- **Stagger** بسيط لبطاقات Dashboard widgets و Kanban columns عند أول mount.
- **Micro-interactions**: hover scale خفيف على بطاقات المهام/المشاريع، spring على فتح Dialogs.
- احترام `prefers-reduced-motion`.

## 4) تحسينات الميزات الموجودة (صغيرة وعالية القيمة)

- **Kanban**: إضافة badge لعدد المهام في كل عمود + سحب أسهل بصرياً (highlight on drag-over).
- **Tasks**: زر "نسخ المهمة" وزر "تكرار سريع" في القائمة.
- **Notifications**: زر "تعليم الكل كمقروء" في الـ NotificationBell (إن لم يكن موجوداً).
- **Global Search**: عرض آخر 5 بحوث في localStorage عند فتح ⌘K فارغة.
- **Activity Feed**: فلتر سريع حسب نوع الحدث.
- **Settings**: قسم "اختصارات لوحة المفاتيح" يعرض الاختصارات المتاحة.

## القسم التقني

- ملفات جديدة: `src/components/layout/PageTransition.tsx`, `src/components/layout/PageHeader.tsx`, `src/components/shared/PageLoader.tsx`.
- تعديل: `src/App.tsx` (lazy + Suspense + QueryClient defaults), `src/components/tasks/KanbanBoard.tsx`, `src/pages/Tasks.tsx`, `src/components/notifications/NotificationBell.tsx`, `src/components/search/GlobalSearch.tsx`, `src/pages/ActivityFeed.tsx`, `src/pages/Settings.tsx`, `src/components/layout/AppSidebar.tsx`.
- لا تغييرات على قاعدة البيانات أو RLS.
- لا تكسير لأي API/route قائم.

هل أبدأ بالتنفيذ؟ يمكنني أيضاً تنفيذ القسم 1 (الأداء) و 3 (الحركة) فقط أولاً إذا أردت تسليماً أسرع.
