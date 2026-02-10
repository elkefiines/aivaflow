# AIVA Flow — AI-Powered Project Management

> From idea to execution, powered by AI.

Transform how your team manages projects. AIVA Flow uses artificial intelligence to analyze files, generate tasks, track progress, and deliver automated reports.

---

## Design Reference

Inspired by [Outcrowd's Resq.io](https://dribbble.com/shots/26742281-Website-for-an-Incident-Management-Platform) — dark cosmic aesthetic with glassmorphism, electric blue accents, and bold typography.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#05050D` | Page background |
| `--card` | `#0C1024` | Card/panel surfaces |
| `--border` | `#181E5B` | Borders, dividers |
| `--primary` | `#0A26E6` | CTAs, accents |
| `--secondary` | `#2B39A6` | Gradients, secondary |
| `--foreground` | `#EFF0F4` | Primary text |
| `--muted` | `#9EA4C0` | Muted text |
| `--warm-accent` | `#8D5A74` | Warm highlights |
| `--subtle-gray` | `#514F5C` | Subtle borders |

### Typography
- **Display**: Space Grotesk (headings)
- **Body**: Inter (paragraphs, UI)
- Mixed weight headlines: bold + italic accent words

### Effects
- Glassmorphism: `backdrop-blur-xl` + semi-transparent bg + subtle borders
- Cosmic gradients: layered radial gradients
- Diagonal light streaks: CSS pseudo-elements
- Glow effects: blue box-shadow on CTAs and cards

---

## Implementation Progress

### Phase 1: Foundation
- [x] **Step 1**: Theme + Design System — CSS variables, Tailwind config, custom utilities
- [x] **Step 2**: Landing Page — Hero, Dashboard Preview, Features, How It Works, CTA, Footer
- [ ] **Step 3**: Database Schema — All tables, RLS policies, storage bucket, realtime
- [ ] **Step 4**: Authentication Pages — Login/Signup with dark glassmorphism theme

### Phase 2: Core App
- [ ] **Step 5**: Onboarding Wizard — Profile → Project → Invite → AI Intro
- [ ] **Step 6**: App Layout — Sidebar, header, project switcher, content area
- [ ] **Step 7**: Dashboard Page — Health score, stats, charts, AI recommendations
- [ ] **Step 8**: Task Management — Kanban/list views, full CRUD, bulk actions

### Phase 3: AI Features
- [ ] **Step 9**: Idea Inbox — Text input, AI conversion, results display
- [ ] **Step 10**: File Upload + Analysis — Drag-drop, AI extraction, task review
- [ ] **Step 11**: AI Edge Functions — chat, convert-idea, analyze-file, generate-report
- [ ] **Step 12**: AI Assistant — Streaming chat, quick prompts, markdown rendering

### Phase 4: Team & Reporting
- [ ] **Step 13**: Team Tracker — Member cards, workload, invitations
- [ ] **Step 14**: Reports — Daily/weekly auto-generated reports
- [ ] **Step 15**: Analytics — Velocity, trends, bottleneck detection, predictions
- [ ] **Step 16**: i18n — English + Arabic (RTL) support

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Lovable Cloud (Supabase)
- **AI**: Lovable AI Gateway (Gemini models)
- **Charts**: Recharts

---

## File Structure

```
src/
  components/
    landing/     — Navbar, Hero, DashboardPreview, Features, HowItWorks, CTA, Footer
    auth/        — LoginForm, SignupForm, AuthGuard
    onboarding/  — Wizard steps
    layout/      — AppSidebar, AppHeader, AppLayout
    dashboard/   — HealthScore, StatCards, ProgressOverview, RiskSummary
    tasks/       — KanbanBoard, TaskCard, TaskDetail, TaskForm
    ideas/       — IdeaInput, IdeaList, ConvertedResult
    team/        — TeamMemberCard, WorkloadBar, InviteMemberModal
    ai/          — AIChatPanel, StreamingMessage, QuickPrompts
    reports/     — ReportCard, DailyReport, WeeklyReport
    analytics/   — VelocityChart, CompletionTrends, DeliveryPrediction
  pages/         — Index, Login, Signup, Dashboard, TaskBoard, etc.
  hooks/         — useAuth, useProjects, useTasks, useTeam, etc.
  i18n/          — en.json, ar.json, LanguageContext
supabase/
  functions/     — chat, convert-idea, analyze-file, generate-report
```

---

## Development

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```
