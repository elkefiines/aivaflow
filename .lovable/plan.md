

## Plan: Dashboard Enhancements, Team Direct-Add, and Visual Polish

### Changes Overview

**1. Dashboard — Clickable bars + new sections**
- Make status bars navigate: "Projects" → `/tasks`, "Tasks done" → `/tasks`, "AI usage" → `/ideas`, "Reports" → `/reports`
- Make summary items (In Progress/Review/Backlog) clickable → `/tasks`
- Add **Recent Tasks** section (last 5 tasks, showing title, status badge with color, priority, assignee)
- Add **Team Members** strip (avatars + names of project members, fetched from project_members + profiles)
- Use `useNavigate` from react-router-dom for navigation

**2. Team Page — Direct add by email+password (no email sending)**
- Replace the invitation system with a **direct member add** flow:
  - Owner enters email + password to create a new user account via `supabase.auth.signUp()` with auto-confirm behavior
  - Then immediately insert into `project_members` table
  - This bypasses email verification — user will need auto-confirm enabled
- Keep existing member cards and removal logic

**3. Visual color enhancements**
- Task cards in Kanban: add left-border color coding by priority (critical=red, high=amber, medium=blue, low=gray)
- Team member cards: add colored avatar backgrounds cycling through a palette
- Dashboard recent tasks: color-coded status badges (emerald for done, amber for in_progress, purple for review, gray for backlog)

### Files to modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Add `useNavigate`, wrap bars/summary in clickable divs, fetch recent tasks (limit 5) and team members, render two new sections below the grid |
| `src/pages/Team.tsx` | Replace invite form with email+password form, call `supabase.auth.signUp()` then insert into `project_members`, remove invitations section |
| `src/components/tasks/KanbanBoard.tsx` | Add left-border color per priority on task cards |

### Database changes
- Need to enable auto-confirm for signups so the owner can create accounts directly (using `configure_auth` tool)
- No schema changes needed

### Technical details

**Dashboard new sections layout** — Add a second row below the 12-col grid:
- `col-span-8`: Recent Tasks — table-like list of 5 most recent tasks with colored status dots
- `col-span-4`: Team — avatar stack with names, link to `/team`

**Team direct-add flow:**
```
1. Owner fills email + password + display name
2. Call supabase.auth.signUp({ email, password, data: { display_name } })
3. On success, insert into project_members(project_id, user_id, role: 'member')
4. Reload member list
```

Note: Auto-confirm must be enabled so the created user can sign in immediately without email verification. This will be configured via the auth tool.

