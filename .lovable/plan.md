

# Fix: Team Members Forced Through Onboarding

## Problem
When a team member is created via the "create-team-member" function, the `handle_new_user` database trigger creates their profile with `onboarding_completed = false`. When they log in, `AppLayout` checks this flag and redirects them to `/onboarding`, forcing them to create a new project — even though they were already added to an existing project.

## Solution

Two changes:

### 1. Edge Function: Mark onboarding as complete for invited members
In `supabase/functions/create-team-member/index.ts`, after creating a new user and adding them to the project, update their profile to set `onboarding_completed = true`. This way they skip onboarding entirely and go straight to the dashboard.

### 2. Onboarding page: Skip project step if user already has projects
As a safety net, modify `src/pages/Onboarding.tsx` to check if the user is already a member of any project. If so, skip the Project and Invite steps and go directly to a simplified flow (Profile + AI Intro only), or skip onboarding altogether.

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/create-team-member/index.ts` | After creating user, set `onboarding_completed = true` on their profile |
| `src/pages/Onboarding.tsx` | Add check: if user already belongs to a project, skip project/invite steps or mark onboarding complete and redirect |

No database migrations needed.

