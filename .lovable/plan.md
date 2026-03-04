

## Plan: Complete Remaining Steps (10–16 + Settings)

Based on the plan and current codebase, here's what's done and what remains:

**Already Complete:** Steps 1–9 (Theme, Landing, DB Schema, Auth, Onboarding, Layout, Dashboard, Tasks/Kanban, Ideas Inbox with AI extraction)

**Remaining Steps to Build:**

### Step 10: File Upload on Ideas Page
- Add drag-and-drop file upload zone to the Ideas page
- Upload files to `project-files` storage bucket
- Create `analyze-file` edge function that reads file content and extracts tasks via Lovable AI
- Support TXT files (read directly); for PDF/DOCX, extract text server-side
- Store `source_file_url` on the idea record

### Step 11–12: AI Chat Assistant
- Create `chat` edge function using Lovable AI with streaming SSE
- Build a slide-out chat panel (Sheet component) accessible from the header
- System prompt aware of project context (tasks, ideas)
- Token-by-token streaming with markdown rendering (install `react-markdown`)
- Quick prompt buttons ("Summarize my tasks", "What should I focus on?", "Break down this idea")
- Handle 429/402 errors with user-friendly toasts

### Step 13: Team Tracker Page
- New `/team` route and page
- Display project members with roles from `project_members` table
- Show workload per member (task count by status)
- Invitation management: send invitations, view pending invitations
- Add UPDATE policy on `project_members` for owners
- Add nav item to sidebar

### Step 14–15: Reports & Analytics Page
- Create `generate-report` edge function that queries tasks/ideas and produces AI summaries
- Build Reports page with daily/weekly report cards
- Add velocity chart using Recharts (tasks completed over time)
- Burnout/bottleneck indicators based on overdue tasks and workload distribution
- Store generated reports in `reports` table

### Step 16: i18n (English + Arabic RTL)
- Install a lightweight i18n solution or build a simple context-based one
- Extract all UI strings into translation files
- Add RTL support via `dir="rtl"` when Arabic is selected
- Language selector in Settings page

### Settings Page
- Profile editing (display name, bio, avatar upload to storage)
- Project settings (name, description, color, archive)
- Team member management (list members, remove, invite)
- Language preference

### Implementation Order (7 tasks)

1. **AI Chat Assistant** (Steps 11–12) — edge function + streaming panel in header
2. **File Upload & Analysis** (Step 10) — drag-drop on Ideas page + edge function
3. **Settings Page** — profile editing, project settings, language preference
4. **Team Tracker** (Step 13) — members page with workload visualization
5. **Reports & Analytics** (Steps 14–15) — AI-generated reports + Recharts
6. **i18n** (Step 16) — English/Arabic with RTL support
7. **Polish** — wire up Dashboard quick actions, update plan.md

### Technical Notes

- All AI features use Lovable AI gateway via edge functions (LOVABLE_API_KEY already configured)
- `react-markdown` package needed for chat rendering
- Recharts already installed for reports charts
- Storage bucket `project-files` already exists (private) for file uploads
- Database migration needed: add UPDATE policy on `project_members` for team management
- New edge functions: `chat`, `analyze-file`, `generate-report`
- New routes: `/team` added to App.tsx and sidebar

