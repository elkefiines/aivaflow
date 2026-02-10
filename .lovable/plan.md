

# AIVA Flow - Design-First Implementation Plan

Building the complete AIVA Flow application with the design system faithfully replicated from the Dribbble reference (Outcrowd's Resq.io incident management platform).

---

## Design System (Exact Dribbble Color Match)

The exact color palette from the Dribbble shot will be used:

- `#05050D` -- Primary background (near-black)
- `#0C1024` -- Card/panel background (slightly lighter)
- `#181E5B` -- Dark navy (secondary surfaces, borders)
- `#0A26E6` -- Electric blue (primary accent, CTAs)
- `#2B39A6` -- Blue-purple (secondary accent, gradients)
- `#514F5C` -- Subtle gray (borders, dividers)
- `#EFF0F4` -- Primary text (off-white)
- `#9EA4C0` -- Muted text (descriptions, labels)
- `#8D5A74` -- Accent warm (used sparingly for highlights)

### Typography Style (from reference)
- Headlines: Large, bold, mixed-weight styling (some words italic or accented)
- Body: Clean sans-serif, generous line height
- Hierarchy through size and opacity rather than color variation

### Visual Effects (from reference)
- Cosmic/space-like gradient backgrounds with diagonal light streaks
- Glassmorphism panels: `backdrop-blur`, semi-transparent backgrounds with subtle white/blue borders
- Soft glow effects behind cards and accent elements
- Rounded corners (16px-24px on cards)
- Minimal borders, relying on elevation and background contrast

---

## Implementation Order

This is a massive application. It will be built incrementally, starting with the visual foundation that matches the Dribbble design, then layering in functionality.

### Step 1: Theme + Design System
- Update CSS variables in `index.css` to match the exact Dribbble palette
- Add custom Tailwind utilities for glassmorphism, glow effects, cosmic gradients
- Add all animations: fade-in, slide-up, scale-in, glow-pulse, shimmer, AI thinking
- Custom font setup if needed

### Step 2: Landing Page (matches Dribbble hero exactly)
- **Navbar**: "AIVA Flow" logo left, nav links center (Features, How it Works, Pricing), two buttons right (Login outlined, Get Started filled blue)
- **Hero Section**: 
  - Large headline with mixed weight: *"From idea to execution"* (italic accent) **"powered by AI"** (bold white)
  - Subtitle in muted gray text
  - Two CTA buttons: "Book a demo" (filled electric blue, rounded), "Try it free" (outlined, rounded)
  - Cosmic gradient background with diagonal light streaks (CSS radial/conic gradients + pseudo-elements)
- **Dashboard Preview**: A mock dashboard card embedded below the hero, showing the app interface with tabs, stats (38 critical, 26 days open, 103 overnight), summary bars, chart, and vulnerability card -- all in dark glassmorphism style
- **Features Section**: Cards with icons, title, description -- dark glass panels with subtle borders
- **How It Works**: 3-step flow with connecting elements
- **CTA Section**: Final call-to-action

### Step 3: Database Schema
- Create all tables: `profiles`, `projects`, `project_members`, `project_invitations`, `tasks`, `task_dependencies`, `task_comments`, `ideas`, `project_files`, `reports`, `daily_standups`
- Set up RLS policies with `is_project_member` function
- Create `project-files` storage bucket
- Enable realtime on key tables

### Step 4: Authentication Pages
- Login and Signup pages matching the dark theme
- Glassmorphism form cards centered on cosmic background
- Email/password auth
- Redirect logic (new users -> onboarding, returning -> dashboard)

### Step 5: Onboarding Wizard
- 4-step wizard: Profile -> Project -> Invite Team -> AI Intro
- Step indicator with glow on active step
- Dark glassmorphism cards for each step
- Animated transitions between steps

### Step 6: App Layout
- **Sidebar**: Dark panel, icon + label nav items, active state with blue glow/highlight, collapsible
- **Header**: Project switcher, AI status indicator (pulsing cyan dot), language toggle (EN/AR), user avatar dropdown
- **Content area**: Page transitions with fade-in animation

### Step 7: Dashboard Page
- Health score circular progress (animated)
- Stat cards matching Dribbble style (icon + number + label)
- Progress bars for task status breakdown
- Incident/task frequency chart (line chart, Recharts, dark themed)
- AI recommendations panel
- Vulnerability/risk card with priority indicators

### Step 8: Task Management (Full CRUD)
- **Kanban Board**: Columns with drag indicators, task cards with priority badges, assignee avatars, AI confidence dots
- **List View**: Dark themed table with sorting/filtering
- **Task Detail Panel**: Slide-over with all fields, inline editing, subtasks, dependencies, comments
- **Create/Edit/Delete**: Full CRUD with confirmation dialogs
- **Bulk Actions**: Multi-select and batch update/delete

### Step 9: Idea Inbox
- Text input with "Convert with AI" button
- Ideas list with status badges
- AI conversion results displayed in expandable panels

### Step 10: Project File Upload + Analysis
- Drag-and-drop file upload zone (dark themed)
- File list with status indicators
- AI analysis results with task review panel

### Step 11: AI Edge Functions
- `chat` -- Streaming assistant (Gemini via Lovable AI)
- `convert-idea` -- Idea to structured tasks
- `analyze-file` -- Document analysis to tasks
- `generate-report` -- Daily/weekly report generation
- `ai-recommendations` -- Dashboard insights

### Step 12: AI Assistant Page
- Chat interface with streaming messages
- Quick prompt buttons in glassmorphism style
- AI thinking animation (pulsing dots)
- Markdown rendering for responses

### Step 13: Team Tracker + Invitations
- Team member cards with workload bars, focus scores, burnout indicators
- Invite by email modal
- Invitation acceptance flow

### Step 14: Reports Page
- Daily and weekly auto-generated reports
- Report cards with period selectors
- Generate on-demand button

### Step 15: Analytics
- Velocity chart, completion trends, bottleneck detection (all Recharts, dark themed)
- Delivery prediction timeline

### Step 16: i18n (English + Arabic RTL)
- Language context provider
- Translation JSON files
- RTL layout toggle
- CSS logical properties throughout

---

## Technical Details

### File Structure

```text
src/
  i18n/
    en.json, ar.json, LanguageContext.tsx
  components/
    landing/
      Navbar.tsx, Hero.tsx, DashboardPreview.tsx
      Features.tsx, HowItWorks.tsx, CTASection.tsx, Footer.tsx
    auth/
      LoginForm.tsx, SignupForm.tsx, AuthGuard.tsx
    onboarding/
      OnboardingWizard.tsx, ProfileStep.tsx, ProjectStep.tsx
      InviteStep.tsx, AIIntroStep.tsx
    layout/
      AppSidebar.tsx, AppHeader.tsx, AppLayout.tsx
      ProjectSwitcher.tsx, AIStatusIndicator.tsx, LanguageToggle.tsx
    dashboard/
      HealthScore.tsx, StatCards.tsx, ProgressOverview.tsx
      RiskSummary.tsx, AIRecommendations.tsx, ActivityFeed.tsx
    ideas/
      IdeaInput.tsx, IdeaList.tsx, IdeaCard.tsx, ConvertedResult.tsx
    projects/
      ProjectCard.tsx, ProjectGrid.tsx, CreateProjectModal.tsx
      FileUpload.tsx, FileAnalysisResult.tsx, FileList.tsx
    tasks/
      KanbanBoard.tsx, KanbanColumn.tsx, TaskCard.tsx
      TaskDetail.tsx, TaskListView.tsx, TaskForm.tsx
      TaskDependencies.tsx, SubtaskList.tsx, BulkActions.tsx
      TaskComments.tsx, DeleteTaskDialog.tsx
    team/
      TeamMemberCard.tsx, WorkloadBar.tsx, BurnoutIndicator.tsx
      InviteMemberModal.tsx
    ai/
      AIChatPanel.tsx, AIThinkingAnimation.tsx, StreamingMessage.tsx
      QuickPrompts.tsx, GeneratedTasksReview.tsx
    reports/
      ReportCard.tsx, DailyReport.tsx, WeeklyReport.tsx
      ReportsList.tsx
    analytics/
      VelocityChart.tsx, CompletionTrends.tsx
      BottleneckDetection.tsx, DeliveryPrediction.tsx
  pages/
    Landing.tsx, Login.tsx, Signup.tsx, Onboarding.tsx
    Dashboard.tsx, IdeaInbox.tsx, Projects.tsx
    TaskBoard.tsx, Team.tsx, AIAssistant.tsx
    Analytics.tsx, Reports.tsx, DailyStandup.tsx
  hooks/
    useAuth.ts, useProjects.ts, useTasks.ts, useTeam.ts
    useIdeas.ts, useReports.ts, useLanguage.ts, useStreamChat.ts
    useFileUpload.ts
  lib/
    ai-stream.ts
supabase/
  functions/
    chat/index.ts
    convert-idea/index.ts
    analyze-file/index.ts
    generate-report/index.ts
    ai-recommendations/index.ts
```

### Key Design Patterns from Dribbble Reference

1. **Hero gradient**: Multiple radial gradients layered -- deep blue center fading to black edges, with a diagonal light streak (pseudo-element with rotated linear gradient and blur)
2. **Dashboard preview card**: Dark rounded card (`bg-[#0C1024]`) with thin border (`border-[#181E5B]/30`), tabs navigation, stat blocks with colored icons, chart area, sidebar panels
3. **Stat cards**: Icon with colored background circle + large number + label below, arranged horizontally
4. **Progress bars**: Colored segments (green/blue/pink) with percentage labels on a dark track
5. **Buttons**: Primary = filled electric blue with slight glow on hover; Secondary = transparent with border

The first implementation message will build Steps 1-2 (Design System + Landing Page) to establish the visual identity immediately.

