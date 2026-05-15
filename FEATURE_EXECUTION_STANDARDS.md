# HackJudge Feature Execution Standards & Blueprints

Date: 2026-05-11

---

## 1. FEATURE IMPLEMENTATION BLUEPRINTS

### Feature 1: Auth
**Responsibilities**:
- User sign up / login / logout
- Session management
- Protected route redirection
- Password reset

**Boundaries**:
- Owns auth pages (login, signup)
- Owns session hooks
- Owns auth middleware
- Depends on: profiles

**Data Ownership**:
- `auth.users` (Supabase)
- `profiles` table

**APIs Used**:
- Supabase Auth API
- Server Actions (`loginAction`, `signupAction`, `logoutAction`)

**Realtime Behavior**:
- None (auth doesn't need realtime)

**Cache Invalidation**:
- Invalidate `QUERY_KEYS.auth.session` on login/logout
- Invalidate `QUERY_KEYS.auth.profile` on profile change

**Loading/Error Flows**:
- Loading skeleton on login/signup forms
- Error toast on auth failure
- Redirect on success

**Optimistic Updates**:
- None (auth is critical, no optimistic)

**Permissions/RLS**:
- Supabase Auth handles RLS via `auth.uid()`
- No custom RLS needed for auth

**Edge Cases**:
- Email already exists
- Invalid credentials
- Network failures
- Session expiration
- Password reset expired links

**Scaling Risks**:
- None (Supabase Auth handles scaling)

---

### Feature 2: Profiles
**Responsibilities**:
- Profile management
- Avatar upload
- Profile display

**Boundaries**:
- Owns profile page
- Owns profile hooks
- Depends on: auth, storage

**Data Ownership**:
- `profiles` table
- `public-avatars` bucket

**APIs Used**:
- Profiles repository
- StorageService (avatars)

**Realtime Behavior**:
- None (profile changes rarely)

**Cache Invalidation**:
- Invalidate `QUERY_KEYS.auth.profile` on update

**Loading/Error Flows**:
- Avatar loading skeleton
- Error toast on upload failure

**Optimistic Updates**:
- Optimistically update profile UI
- Revert on error

**Permissions/RLS**:
- Users can edit own profile
- Admins can edit any profile
- `public-avatars` bucket RLS

**Edge Cases**:
- Large avatar files
- Invalid image formats
- Network failure mid-upload

**Scaling Risks**:
- Avatar storage costs (monitor bucket size)

---

### Feature 3: Hackathons
**Responsibilities**:
- Hackathon CRUD
- Hackathon listing
- Hackathon details

**Boundaries**:
- Owns hackathon pages
- Owns hackathon hooks
- Depends on: auth, profiles, storage

**Data Ownership**:
- `hackathons` table
- `public-hackathon-banners` bucket
- `categories`, `rubric_criteria`, `timeline_events`, `problem_statements`

**APIs Used**:
- HackathonsRepository
- StorageService (banners)

**Realtime Behavior**:
- None (hackathons change rarely)

**Cache Invalidation**:
- Invalidate `QUERY_KEYS.hackathons.all` on create/update
- Invalidate `QUERY_KEYS.hackathons.detail(id)` on update

**Loading/Error Flows**:
- Hackathon list skeleton
- Hackathon detail skeleton

**Optimistic Updates**:
- Optimistically add to list
- Revert on error

**Permissions/RLS**:
- Creators can edit own hackathons
- Admins can edit any
- Public can view public hackathons

**Edge Cases**:
- Invalid dates (registration > submission)
- Large banner files
- Hackathon deletion (cascade)

**Scaling Risks**:
- Large hackathon lists (paginate!)

---

### Feature 4: Teams
**Responsibilities**:
- Team creation
- Team member management
- Invite system

**Boundaries**:
- Owns team pages
- Owns team hooks
- Depends on: auth, hackathons, profiles

**Data Ownership**:
- `teams` table
- `team_members` table

**APIs Used**:
- TeamsRepository (to be created)

**Realtime Behavior**:
- Team member joins/leaves (optional)

**Cache Invalidation**:
- Invalidate `QUERY_KEYS.teams.byHackathon(hackathonId)` on change
- Invalidate `QUERY_KEYS.teams.myTeam(hackathonId)` on change

**Loading/Error Flows**:
- Team list skeleton
- Team members skeleton

**Optimistic Updates**:
- Optimistically add/remove members

**Permissions/RLS**:
- Team leaders can manage members
- Admins can manage any team
- Unique team names per hackathon

**Edge Cases**:
- Team full (max size)
- Invite code expired
- User already in a team

**Scaling Risks**:
- Large team lists (paginate!)

---

### Feature 5: Projects
**Responsibilities**:
- Project submission
- Project editing
- Project listing
- Project details

**Boundaries**:
- Owns project pages
- Owns project hooks
- Depends on: auth, hackathons, teams, storage

**Data Ownership**:
- `projects` table
- `project_tech_stack` table
- `public-project-covers` bucket
- `private-demo-assets` bucket

**APIs Used**:
- ProjectsRepository
- StorageService (covers, demo assets)

**Realtime Behavior**:
- None (projects change occasionally)

**Cache Invalidation**:
- Invalidate `QUERY_KEYS.projects.byHackathon(hackathonId)` on change
- Invalidate `QUERY_KEYS.projects.detail(id)` on change

**Loading/Error Flows**:
- Project list skeleton
- Project cover skeleton

**Optimistic Updates**:
- Optimistically add to list
- Optimistically update UI

**Permissions/RLS**:
- Team leaders can edit own project
- One project per team per hackathon
- Public can view submitted projects

**Edge Cases**:
- Submission after deadline
- Missing required fields
- Large cover files

**Scaling Risks**:
- Large project lists (paginate!)

---

### Feature 6: Scoring
**Responsibilities**:
- Judge scoring
- Score editing
- Judge progress

**Boundaries**:
- Owns scoring UI
- Owns scoring hooks
- Depends on: auth, hackathons, projects, judges

**Data Ownership**:
- `scores` table
- `score_criteria` table

**APIs Used**:
- ScoringRepository (to be created)

**Realtime Behavior**:
- Score updates (trigger leaderboard update)
- Judge progress

**Cache Invalidation**:
- Invalidate `QUERY_KEYS.scoring.byProject(projectId)` on change
- Invalidate `QUERY_KEYS.scoring.myScores(hackathonId)` on change
- Invalidate `QUERY_KEYS.leaderboard.byHackathon(hackathonId)` on change

**Loading/Error Flows**:
- Score form loading
- Judge progress skeleton

**Optimistic Updates**:
- Optimistically update score in UI
- Optimistically update leaderboard
- Revert on error

**Permissions/RLS**:
- Judges can edit own scores
- One score per judge per project
- Admins can view all scores

**Edge Cases**:
- Scoring after deadline
- Duplicate scores (handled by unique constraint)
- Score outside 0-100 range

**Scaling Risks**:
- High write load (many judges scoring)
- Trigger performance (monitor `update_project_score`)

---

### Feature 7: Leaderboard
**Responsibilities**:
- Leaderboard display
- Live updates
- Filtering/sorting

**Boundaries**:
- Owns leaderboard page
- Owns leaderboard hooks
- Depends on: auth, hackathons, scoring, projects

**Data Ownership**:
- `projects` (denormalized scores)
- `leaderboard` materialized view

**APIs Used**:
- Leaderboard queries (from `src/data/queries/get-leaderboard`)

**Realtime Behavior**:
- Live leaderboard updates (every 10s, or realtime)
- Subscribes to `hackathon:{id}:leaderboard` channel

**Cache Invalidation**:
- Invalidate on score change
- Refresh leaderboard materialized view periodically

**Loading/Error Flows**:
- Leaderboard skeleton
- Error state with retry

**Optimistic Updates**:
- Optimistically update leaderboard on score change
- Smooth transitions

**Permissions/RLS**:
- Anyone can view public leaderboards
- Private hackathons = only participants/judges/admins

**Edge Cases**:
- Ties in scores
- Projects with no scores (show at bottom)
- Disqualified projects (hidden)

**Scaling Risks**:
- High read load (leaderboard viewed by everyone)
- Use materialized view + caching!

---

### Feature 8: Admin
**Responsibilities**:
- Hackathon management
- Judge assignment
- User management
- Exports

**Boundaries**:
- Owns admin pages
- Owns admin hooks
- Depends on: ALL features

**Data Ownership**:
- All tables (via RLS admin access)
- `private-exports` bucket

**APIs Used**:
- All repositories
- StorageService (exports)

**Realtime Behavior**:
- Judge progress updates
- Activity logs

**Cache Invalidation**:
- Invalidate all queries on admin changes

**Permissions/RLS**:
- Only admin role can access
- Full access to all data

**Edge Cases**:
- Accidental deletions (soft delete!)
- Large exports

**Scaling Risks**:
- Large admin tables (paginate!)

---

### Feature 9: Judge Dashboard
**Responsibilities**:
- Judge-specific view
- Unjudged projects list
- Scoring progress
- Assigned hackathons

**Boundaries**:
- Owns judge dashboard pages
- Owns judge dashboard hooks
- Depends on: auth, hackathons, projects, scoring

**Data Ownership**:
- `judges` table
- `scores` table

**APIs Used**:
- JudgesRepository (to be created)
- ScoringRepository

**Realtime Behavior**:
- New projects to judge
- Score saved confirmation

**Cache Invalidation**:
- Invalidate `QUERY_KEYS.scoring.judgeProgress(hackathonId)`

**Permissions/RLS**:
- Only active judges can access
- Only see assigned hackathons

**Edge Cases**:
- No projects left to judge
- Hackathon judging deadline passed

---

### Feature 10: Notifications
**Responsibilities**:
- Notification display
- Notification preferences
- Realtime notifications

**Boundaries**:
- Owns notification UI
- Owns notification hooks
- Depends on: auth, realtime

**Data Ownership**:
- Notifications table (to be created)

**APIs Used**:
- Supabase Realtime

**Realtime Behavior**:
- Live notification delivery
- Presence for online status

**Permissions/RLS**:
- Users can only see own notifications

---

## 2. IMPLEMENTATION ORDER (Dependency-Aware)

### Phase 1: Foundation (Must Be First)
1. ✅ **Auth** - Required for everything else
2. ✅ **Profiles** - Depends on auth
3. 🔜 **Form System** - Shared dependency
4. 🔜 **Mutation + Query Patterns** - Shared dependency

### Phase 2: Core Features
5. **Hackathons** - Core entity, depends on auth/profiles/storage
6. **Teams** - Depends on hackathons
7. **Projects** - Depends on teams + storage

### Phase 3: Judging System
8. **Scoring** - Depends on projects
9. **Leaderboard** - Depends on scoring

### Phase 4: Role-Specific
10. **Judge Dashboard** - Depends on scoring
11. **Admin** - Depends on all

### Phase 5: Polish
12. **Notifications** - Depends on realtime

---

## 3. COMPLETE AUTH FLOW (Implementation Guide)

### Security Implications
- **Middleware**: Protect routes at edge, no client-side auth checks
- **Server Actions**: All mutations server-side, no client-side Supabase auth
- **Session Handling**: Supabase Auth manages sessions securely
- **No Secrets in Client**: Never expose service_role key

### SSR Considerations
- **Server Components**: Use `requireAuth()` server-side
- **Client Components**: Use `useAuth()` hook with React Query
- **Session Refresh**: Supabase handles automatically

### Middleware Strategy
- **Public Routes**: `/login`, `/signup`
- **Protected Routes**: `/dashboard/*`
- **Redirect**: Unauthenticated → `/login`, Authenticated → `/dashboard`

### Redirect Strategy
- **After login/signup**: `/dashboard`
- **After logout**: `/login`
- **Unauthorized access**: `/login` with return URL

---

## 4. FORM SYSTEM STANDARDS

### react-hook-form Patterns
```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
})
```

### Zod Validation Patterns
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

### Server Validation
- Always re-validate on server
- Never trust client validation
- Use same Zod schema on client + server

### Optimistic UX
- Disable form during submission
- Show loading state
- Show success toast
- Show error toast

### Async Validation
- Check unique email/username
- Check unique team name
- Debounce async checks

### File Upload Validation
- Use `FileValidator` before upload
- Validate MIME, size, extension
- Validate dimensions for images

---

## 5. MUTATION + QUERY STANDARDS

### Query Key Usage
```typescript
QUERY_KEYS.hackathons.detail(id)
QUERY_KEYS.projects.byHackathon(hackathonId)
```

### Invalidation Strategy
```typescript
queryClient.invalidateQueries({ 
  queryKey: ["projects", hackathonId] 
})
```

### Optimistic Updates
```typescript
onMutate: async (newData) => {
  // Cancel outgoing refetches
  // Optimistically update cache
  // Return context for rollback
}
onError: (err, newData, context) => {
  // Rollback optimistic update
}
onSettled: () => {
  // Invalidate queries
}
```

### Pagination Strategy
- Offset-based for leaderboards
- Cursor-based for large lists
- Use React Query infinite queries

---

## 6. FILE UPLOAD SYSTEM STANDARDS

### Upload Pipeline
1. Validate file (FileValidator)
2. Show progress
3. Upload to storage
4. Get URL
5. Submit form with URL

### Drag/Drop UX
- Visual drop zone
- Drag active state
- File previews

### Progress Tracking
- Show upload percentage
- Cancel button
- Retry on failure

---

## 7. REALTIME SYSTEM STANDARDS

### Channel Lifecycle
1. Subscribe on mount
2. Handle updates
3. Unsubscribe on unmount
4. Reconnect automatically

### Reconnection Handling
- Supabase handles automatically
- Show reconnection status
- Refresh data on reconnect

---

## 8. ROUTE ARCHITECTURE

### Route Groups
```
app/
├── (auth)/
│   ├── login/
│   ├── signup/
│   └── layout.tsx
├── (dashboard)/
│   ├── page.tsx
│   ├── hackathons/
│   ├── teams/
│   ├── projects/
│   ├── admin/
│   ├── judge/
│   └── layout.tsx
└── layout.tsx
```

### Protected Segments
- All `/dashboard/*` protected by middleware
- Admin routes `/dashboard/admin/*` protected by role guard
- Judge routes `/dashboard/judge/*` protected by role guard

---

## 9. CRITICAL RULE: EVERY FEATURE EXPLANATION

For EVERY feature implemented, ALWAYS document:
1. What was built
2. Why it was built that way
3. Why alternatives were rejected
4. Future scaling implications
5. Performance considerations
6. Security considerations
7. Possible future bottlenecks

---

## 10. ASK BEFORE ASSUMING

If ANYTHING is unclear:
- Schema details? Ask!
- UX flow? Ask!
- Product logic? Ask!
- Business rules? Ask!

DO NOT SILENTLY GUESS BEHAVIOR!
