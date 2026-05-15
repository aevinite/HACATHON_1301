# HackJudge Feature Domain Architecture

Date: 2026-05-11

## Executive Summary

**Complete feature-based architecture with proper domain separation, data flow, state management, and implementation planning.**

---

## 1. FEATURE-BASED ARCHITECTURE

### Feature Boundaries

```
src/features/
├── auth/                      # Authentication & session management
├── profiles/                  # User profiles & avatars
├── hackathons/                # Hackathon CRUD & management
├── teams/                     # Team management & members
├── projects/                  # Project submissions
├── scoring/                   # Judge scoring system
├── leaderboard/               # Leaderboard display & updates
├── admin/                     # Admin panel
├── judge-dashboard/           # Judge-specific dashboard
└── notifications/             # Notifications system
```

### Domain Separation Principles

**Each Feature Contains**:
- ✅ `components/` - UI components specific to this feature
- ✅ `hooks/` - Feature-specific hooks
- ✅ `api/` - Feature-specific API calls
- ✅ `services/` - Business logic
- ✅ `schemas/` - Zod validation schemas
- ✅ `types/` - Feature-specific types
- ✅ `utils/` - Feature utilities
- ✅ `constants.ts` - Feature constants
- ✅ `server.ts` - Server-side logic

**Cross-Feature Rules**:
- ❌ No direct imports between feature components
- ✅ Use shared components from `src/components/`
- ✅ Use data layer from `src/data/`
- ✅ Use utilities from `src/lib/`
- ✅ Share types via `src/types/`

---

## 2. FEATURE FOLDER STRUCTURE

### Example: auth Feature

```
src/features/auth/
├── components/               # LoginForm, SignupForm, etc.
├── hooks/                    # useAuth, useSession, etc.
├── api/                      # API calls (login, signup, logout)
├── services/                 # Business logic (session refresh)
├── schemas/                  # loginSchema, signupSchema
├── types/                    # AuthState, Session, etc.
├── utils/                    # token helpers, etc.
├── constants.ts              # routes, config
└── server.ts                 # server-side auth checks
```

### Why This Structure Scales

1. **Co-location**: All feature code in one place
2. **Discoverability**: Easy to find everything related to a feature
3. **Maintainability**: Changing a feature only touches one folder
4. **Deletion Safety**: Delete entire folder to remove feature
5. **Team Collaboration**: Multiple devs can work on separate features

### Avoiding Cross-Feature Chaos

**Dependency Rules**:
```
features/auth → src/lib, src/data, src/types
features/profiles → src/lib, src/data, src/types
features/hackathons → src/lib, src/data, src/types
features/teams → src/lib, src/data, src/types
... ALL features → NO direct imports between features!
```

**Shared Components**:
- Generic UI in `src/components/ui/`
- Shared feature-agnostic UI in `src/components/`
- Never put feature-specific UI in `src/components/`

### Preventing Circular Dependencies

**Rules**:
1. Features never import from other features
2. All shared logic lives in `src/lib/` or `src/data/`
3. All shared types live in `src/types/`
4. Use dependency inversion for cross-feature communication

---

## 3. DATA FLOW ARCHITECTURE

### Server/Client Boundaries

```
┌─────────────────────────────────────────┐
│          SERVER COMPONENTS              │
│  - Fetch data via repositories          │
│  - No useState/useEffect                │
│  - No interactivity                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         CLIENT COMPONENTS               │
│  - Interactivity (useState, handlers)   │
│  - React Query for data fetching        │
│  - Realtime subscriptions               │
└─────────────────────────────────────────┘
```

### Repository Usage

**Server Components**:
```tsx
// Direct repository usage
import { HackathonsRepository } from "@/data"

export default async function Page() {
  const repo = new HackathonsRepository()
  const hackathons = await repo.findPublic()
  return <HackathonList hackathons={hackathons} />
}
```

**Client Components**:
```tsx
// React Query wrapper around repository
import { useQuery } from "@tanstack/react-query"
import { getPublicHackathons } from "@/features/hackathons/api"

export function HackathonList() {
  const { data } = useQuery({
    queryKey: QUERY_KEYS.hackathons.public,
    queryFn: getPublicHackathons,
  })
  return <div>{/* ... */}</div>
}
```

### Mutation Flow

```
User Action → Client Form → React Query Mutation → 
Server Action → Repository → Database → 
Invalidate Cache → UI Updates
```

### Optimistic Update Flow

```
1. User submits score
2. Update cache optimistically
3. Show pending UI
4. Send to server
5. If success → confirm cache
6. If error → revert cache + show error
```

### Cache Invalidation Strategy

| Action | What to Invalidate |
|--------|---------------------|
| Submit project | `projects.byHackathon`, `projects.myProject` |
| Update score | `scoring.byProject`, `leaderboard.byHackathon` |
| Update team | `teams.byHackathon`, `teams.myTeam` |

### Error Handling Flow

```
Error → AppError type → 
Toast notification (user-friendly) → 
Log to service (for debugging) → 
Retry strategy (if applicable)
```

---

## 4. STATE MANAGEMENT STRATEGY

### What to Use Where

| State Type | Tool | Reason |
|-----------|------|--------|
| **Server Data** | React Query | Caching, invalidation, background refetch |
| **Local UI State** | React useState | Form inputs, modals, toggles |
| **Global UI State** | React Context (sparingly) | Theme, auth session (rare) |
| **URL State** | Next.js searchParams | Filters, pagination, tabs |
| **Realtime Data** | Supabase Realtime | Leaderboard, score updates |

### Server State (React Query)
**Uses**: All data from database
**Why**:
- ✅ Built-in caching
- ✅ Automatic background refetch
- ✅ Stale-while-revalidate
- ✅ Easy invalidation

### Local State (useState)
**Uses**:
- Form inputs before submit
- Modal open/closed
- Tab selection
- Toggle switches

### Context (Sparingly!)
**Uses**:
- Theme provider
- Auth session (only if needed everywhere)
**Never use for**:
- Server data (use React Query)
- Form state (use react-hook-form)
- Any state that doesn't need to be global

### URL State
**Uses**:
- Pagination: `?page=2&limit=20`
- Filters: `?category=ai&search=foo`
- Tabs: `?tab=judging`
**Why**:
- Shareable URLs
- Bookmarkable
- Browser back/forward works

---

## 5. REACT QUERY / CACHE STRATEGY

### Query Keys

```typescript
QUERY_KEYS = {
  auth: {
    session: ["auth", "session"],
    profile: ["auth", "profile"],
  },
  hackathons: {
    all: ["hackathons"],
    public: ["hackathons", "public"],
    detail: (id: string) => ["hackathons", id],
  },
  // ... etc
}
```
**Why**: Hierarchical, easy to invalidate

### Invalidation Patterns

```typescript
// Invalidate single query
queryClient.invalidateQueries({ queryKey: ["projects", id] })

// Invalidate all queries under a prefix
queryClient.invalidateQueries({ queryKey: ["projects"] })

// Invalidate multiple
queryClient.invalidateQueries({ 
  queryKey: ["projects"] 
})
queryClient.invalidateQueries({ 
  queryKey: ["leaderboard", hackathonId] 
})
```

### Pagination

**Offset-based** (good for leaderboards):
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ["leaderboard", hackathonId],
  queryFn: ({ pageParam = 0 }) => getLeaderboard(hackathonId, pageParam),
  getNextPageParam: (lastPage, allPages) => 
    lastPage.length === 20 ? allPages.length : undefined,
})
```

### Stale Times

| Data | Stale Time | Why |
|------|-------------|-----|
| Auth session | 5 min | Rarely changes |
| Hackathon list | 1 min | Changes occasionally |
| Leaderboard | 10 sec | Changes frequently |
| Project details | 30 sec | Changes sometimes |

### Realtime Synchronization

**Pattern**:
1. Subscribe to realtime channel
2. On update → invalidate React Query cache
3. React Query refetches automatically
4. UI updates

---

## 6. FORM ARCHITECTURE

### Validation Flow

```
User Input → react-hook-form → Zod Schema →
Validation Error → Show inline errors
Validation Success → Submit → Server Action
```

### Zod Schemas

**Location**: `src/features/{feature}/schemas/`
**Reuse**: Share between client and server
**Why**: Single source of truth

### react-hook-form Integration

```typescript
const form = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "" },
})
```

### Async Validation

**Example**: Unique team name
```typescript
const form = useForm({
  resolver: zodResolver(teamSchema),
})

// Check uniqueness on blur
const checkTeamNameUnique = async (name: string) => {
  const exists = await checkTeamNameExists(name, hackathonId)
  return !exists
}
```

### Upload Integration

**Pattern**:
1. Validate file with `FileValidator`
2. Upload to storage first
3. Get storage URL
4. Submit form with storage URL
5. Update database

---

## 7. REALTIME ARCHITECTURE

### What Should Be Realtime

| Feature | Realtime? | Why |
|---------|------------|-----|
| Leaderboard updates | ✅ Yes | Users expect live updates |
| Score updates | ✅ Yes | Judges need to see progress |
| Judge progress | ✅ Yes | Admins need to monitor |
| Notifications | ✅ Yes | Users expect instant |
| Hackathon CRUD | ❌ No | Changes rarely |
| Team creation | ❌ No | Changes rarely |

### What Should NOT Be Realtime

- **Reads that don't change often**
- **Heavy data (large lists)**
- **Anything that can be cached**
- **Bulk operations**

### Websocket Scaling Implications

**At 100 concurrent users**:
- ✅ No problem, single Supabase Realtime instance

**At 1000 concurrent users**:
- ⚠️ Monitor connection count
- ⚠️ Consider channel sharding

**At 10,000+ concurrent users**:
- 🔴 Need enterprise plan
- 🔴 Shard by hackathon ID
- 🔴 Consider presence vs full data

---

## 8. ERROR HANDLING SYSTEM

### Typed Errors

```typescript
class AppError extends Error {
  code: string
  statusCode: number
  details?: unknown
}

class AuthError extends AppError {}
class ForbiddenError extends AppError {}
class NotFoundError extends AppError {}
class ValidationError extends AppError {}
class UploadError extends AppError {}
```

### Toast Handling

```typescript
// Use useToast hook
const { toast } = useToast()

// On error
toast({
  title: "Error",
  description: error.message,
  variant: "destructive",
})
```

### Auth Failures

**Pattern**:
1. Catch 401 error
2. Clear session
3. Redirect to login
4. Show toast

### Upload Failures

**Pattern**:
1. Catch upload error
2. Show user-friendly message
3. Allow retry
4. Clean up partial uploads

### Retry Strategy

| Action | Retries | Delay |
|--------|---------|-------|
| Queries | 2 | Exponential backoff |
| Mutations | 1 | Immediate |
| Uploads | 2 | 1 second |

### Offline Handling

- Use React Query offline persistence
- Queue mutations while offline
- Sync when back online
- Show offline indicator

---

## 9. FEATURE IMPLEMENTATION ORDER (Dependency-Aware)

### Phase 1: Foundation (Must Be First)
1. ✅ **auth** - Required for everything else
2. ✅ **profiles** - Depends on auth
3. 🔜 **hackathons** - Core entity, depends on auth/profiles

### Phase 2: Core Features (Depend on Foundation)
4. **teams** - Depends on hackathons, auth
5. **projects** - Depends on teams, hackathons, storage
6. **scoring** - Depends on projects, rubric, auth

### Phase 3: Display Features (Depend on Core)
7. **leaderboard** - Depends on scoring, projects
8. **judge-dashboard** - Depends on scoring, projects
9. **admin** - Depends on all

### Phase 4: Polish
10. **notifications** - Depends on realtime, all features

---

## 10. DECISION EXPLANATIONS

### Why Feature-Based Architecture?
- ✅ Co-location: All feature code together
- ✅ Discoverability: Easy to find
- ✅ Maintainability: Change in one place
- ✅ Deletion safety: Delete entire folder
- ❌ Tradeoff: More folders, but worth it

### Why React Query for Server State?
- ✅ Built-in caching
- ✅ Background refetch
- ✅ Stale-while-revalidate
- ✅ Easy invalidation
- ❌ Tradeoff: Learning curve, but worth it

### Why Minimal Context?
- ✅ Avoids provider hell
- ✅ Better performance
- ✅ Simpler debugging
- ❌ Tradeoff: Pass some props down, but worth it

### Why URL State?
- ✅ Shareable URLs
- ✅ Bookmarkable
- ✅ Browser back/forward
- ❌ Tradeoff: Serialization limits, but worth it

---

## SCALING IMPLICATIONS

### At 100 Users
- ✅ Everything works great
- ✅ React Query caching reduces DB load
- ✅ Realtime channels are fine

### At 1000 Users
- ⚠️ Monitor realtime connection count
- ⚠️ Consider increasing cache times
- ⚠️ Add read replicas

### At 10,000 Users
- 🔴 Enterprise Supabase plan needed
- 🔴 Shard realtime channels
- 🔴 Separate read/write DBs
- 🔴 Consider Redis for caching

---

## FUTURE MIGRATION RISKS

### Risk: React Query Version Changes
- **Mitigation**: Keep React Query updated, use stable API

### Risk: Realtime Provider Change
- **Mitigation**: Abstract realtime behind feature API

### Risk: Storage Provider Change
- **Mitigation**: Storage service already abstracted

---

## CONCLUSION

**Feature Domain Architecture Ready!**
- ✅ Feature boundaries defined
- ✅ Folder structure created
- ✅ Data flow architecture planned
- ✅ State management strategy defined
- ✅ React Query strategy planned
- ✅ Form architecture designed
- ✅ Realtime architecture planned
- ✅ Error handling system designed
- ✅ Implementation order defined

All decisions explained with tradeoffs, scaling, and maintainability in mind!
