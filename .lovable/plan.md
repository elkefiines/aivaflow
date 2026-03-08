## Plan: Complete Remaining Steps (10–16 + Settings)

**All Steps Complete ✅**

### Completed:
1. ✅ Steps 1–9: Theme, Landing, DB Schema, Auth, Onboarding, Layout, Dashboard, Tasks/Kanban, Ideas Inbox
2. ✅ Step 10: File Upload & Analysis — drag-drop zone on Ideas page + `analyze-file` edge function
3. ✅ Steps 11–12: AI Chat Assistant — `chat` edge function with streaming SSE + slide-out panel in header
4. ✅ Step 13: Team Tracker — `/team` route with member cards, workload visualization, invitation management
5. ✅ Steps 14–15: Reports & Analytics — `generate-report` edge function + velocity charts with Recharts
6. ✅ Step 16: i18n — English/Arabic with RTL support, language context, language selector in Settings
7. ✅ Settings Page — profile editing, project settings, language preference

### Technical Implementation:
- Edge functions: `process-idea`, `chat`, `analyze-file`, `generate-report`
- All AI features use Lovable AI gateway (google/gemini-3-flash-preview)
- i18n via LanguageContext + translations file
- RTL via `dir="rtl"` on document element
- Storage bucket `project-files` for file uploads
- UPDATE policy added on `project_members` for team management
