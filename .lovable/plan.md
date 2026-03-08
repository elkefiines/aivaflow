

## Plan: Redesign Dashboard to Match Reference Image

The user wants the authenticated Dashboard page (`src/pages/Dashboard.tsx`) to visually replicate the landing page's `DashboardPreview` component layout — but powered by **real project data** instead of static values.

### Layout (matching the reference image exactly)

1. **Welcome header**: "Welcome in, {user display_name}" — same typography as DashboardPreview
2. **Status bars row + stats row**: 4 horizontal progress bars (Projects completion %, Tasks done %, AI usage %, Reports %) + 3 stat cards (Overdue Tasks, Days saved, AI Actions) — computed from real data
3. **Bottom 3-column grid (col-span 2 + 7 + 3)**:
   - **Summary panel** (col-span-2): In Progress / Review / Backlog percentages with animated bars
   - **Task completion chart** (col-span-7): SVG polyline chart with month labels, period toggles, tooltip
   - **Vulnerability / AI insights panel** (col-span-3): Priority circle, colored dots, Threats circle — same as DashboardPreview

### Data Sources (real, not static)

- **Status bars**: Derive percentages from actual task/idea/report counts
- **Stats**: Overdue tasks from tasks table, days saved = completed tasks count, AI Actions = ideas count
- **Summary bars**: Compute In Progress / Review (backlog) / Done percentages from task statuses
- **Chart**: Use task `updated_at` dates to plot completions over 12 months
- **Vulnerability panel**: Keep decorative (same as landing preview)

### Technical Approach

- Rewrite `src/pages/Dashboard.tsx` to use the same visual structure, classes, and animations from `DashboardPreview.tsx`
- Keep the existing data-fetching logic (tasks, members, ideas)
- Add animated number counters and animated bars (reuse or inline the helpers from DashboardPreview)
- Use framer-motion for entrance animations
- Remove the old card grid + recent tasks + quick actions layout entirely
- Fetch user profile display name for the welcome message

### Single file change
- `src/pages/Dashboard.tsx` — full rewrite matching DashboardPreview layout with real data

