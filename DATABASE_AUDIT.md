# HackJudge Database Architecture Audit

Date: 2026-05-11

## Executive Summary

**Overall Status**: GOOD architecture with some opportunities for optimization and scaling.

**Strengths**:
- Proper normalization (3NF)
- Good use of triggers for denormalized aggregates
- Unique constraints enforce business rules
- RLS policies follow least privilege
- Good initial index coverage

**Areas for Improvement**:
- Some RLS policies have expensive EXISTS chains
- Missing pagination and sorting composite indexes
- No materialized views for leaderboards
- No partitioning strategy for large hackathons
- Missing soft delete patterns
- Missing audit logging

---

## 1. RLS PERFORMANCE REVIEW

### 1.1 Current Policy Analysis

#### High Risk Policies

##### `projects` - Team Member Access
```sql
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    LEFT JOIN public.team_members tm ON tm.team_id = t.id
    WHERE t.id = projects.team_id AND (t.leader_id = auth.uid() OR tm.user_id = auth.uid())
  ) OR ...
)
```
**Problem**: 
- LEFT JOIN + OR condition inside EXISTS = expensive at scale
- Runs for EVERY ROW queried
- Will cause sequential scans

**Risk at 10k+**: Yes - this will slow down project listings
**Risk at 100k+**: Critical - query times > 1s

##### `team_members` - Team Leader Access
```sql
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = team_members.team_id AND t.leader_id = auth.uid()
  ) OR ...
)
```
**Problem**:
- EXISTS subquery runs per row
- Could be optimized with proper joins

---

### 1.2 RLS Optimization Recommendations

#### Priority 1 (Fix Immediately)
1. **Replace expensive EXISTS with proper FK checks where possible**
2. **Add computed roles column to profiles for faster policy checks**
3. **Precompute team member lists**

#### Priority 2 (Before 10k Users)
1. **Create security definer lookup functions**
2. **Cache common auth checks**
3. **Materialize access control lists**

---

## 2. QUERY PERFORMANCE REVIEW

### 2.1 Common Query Patterns

#### 1. Leaderboard Query
```sql
-- Expected pattern: Get top N projects by average_score for a hackathon
SELECT * FROM projects 
WHERE hackathon_id = $1 AND status = 'submitted' AND is_visible = true
ORDER BY average_score DESC NULLS LAST, created_at ASC
LIMIT 20 OFFSET 0;
```
**Current Index**: `idx_projects_hackathon_score` (hackathon_id, average_score DESC)
**Rating**: ⚠️ GOOD BUT INCOMPLETE

**Missing**: Composite index including `status` and `is_visible`
**Bottleneck at 10k projects**: Yes - will filter after index scan
**Bottleneck at 100k projects**: Critical - sequential scan on filtered columns

---

#### 2. Judge Scoring Workflow
```sql
-- Get unjudged projects
SELECT p.* FROM projects p
LEFT JOIN scores s ON s.project_id = p.id AND s.judge_id = $1
WHERE p.hackathon_id = $2 
  AND p.status = 'submitted' 
  AND p.is_visible = true
  AND s.id IS NULL
ORDER BY p.created_at DESC;
```
**Rating**: ⚠️ MEDIUM RISK

**Bottleneck at 1k projects**: Noticeable
**Bottleneck at 10k projects**: Slow (>500ms)
**Bottleneck at 100k projects**: Critical (>10s)

---

#### 3. Score Aggregation (via Trigger)
```sql
SELECT ROUND(AVG(total_score)::NUMERIC, 2), COUNT(*) 
FROM scores 
WHERE project_id = $1 AND is_submitted = true;
```
**Current**: Trigger after INSERT/UPDATE/DELETE on scores
**Rating**: ✅ EXCELLENT

**Why good?**
- Denormalized aggregates avoid expensive joins on every read
- Trigger keeps data consistent
- Reads are O(1) instead of O(N)

---

### 2.2 Query Optimization Recommendations

#### Priority 1 (Fix Immediately)
1. **Add composite index for leaderboard**:
   ```sql
   CREATE INDEX idx_projects_leaderboard ON projects (
     hackathon_id, 
     status, 
     is_visible, 
     average_score DESC NULLS LAST,
     created_at ASC
   );
   ```

2. **Add unjudged projects index**:
   ```sql
   -- Use a partial index or materialized view
   CREATE MATERIALIZED VIEW unjudged_projects AS
   SELECT p.* FROM projects p
   LEFT JOIN scores s ON s.project_id = p.id
   WHERE s.id IS NULL;
   ```

---

## 3. INDEX AUDIT

### 3.1 Current Index Coverage

| Table | Indexes Present | Missing Critical Indexes |
|-------|-----------------|--------------------------|
| `profiles` | PK | (role) |
| `hackathons` | PK, status, created_by, is_public | (created_by, status) composite |
| `teams` | PK, hackathon_id, leader_id, (name, hackathon_id) | ✅ Good |
| `team_members` | PK, team_id, user_id | ✅ Good |
| `projects` | PK, hackathon_id, team_id, (hackathon, status), (hackathon, score), is_visible, text search | ⚠️ Missing leaderboard composite |
| `scores` | PK, project_id, judge_id, hackathon_id, (hackathon, judge) | (project_id, is_submitted) |
| `judges` | PK, hackathon_id, user_id | ✅ Good |

### 3.2 Index Recommendations

#### Priority 1 (Before Launch)
```sql
-- Leaderboard optimization
CREATE INDEX idx_projects_leaderboard_composite 
ON projects (hackathon_id, status, is_visible, average_score DESC NULLS LAST);

-- Score query optimization
CREATE INDEX idx_scores_project_submitted 
ON scores (project_id, is_submitted);

-- Hackathon query optimization
CREATE INDEX idx_hackathons_creator_status 
ON hackathons (created_by, status);

-- Profile role query optimization
CREATE INDEX idx_profiles_role 
ON profiles (role);
```

#### Priority 2 (Before 10k Users)
```sql
-- Pagination/sorting
CREATE INDEX idx_projects_created 
ON projects (hackathon_id, created_at DESC);

CREATE INDEX idx_scores_judge_created 
ON scores (judge_id, created_at DESC);
```

---

## 4. POSTGRESQL BEST PRACTICES REVIEW

### 4.1 Normalization vs Denormalization

**Current**: Mostly 3NF (good), with strategic denormalization:
- `projects.average_score` / `total_judged` - ✅ GOOD (read-heavy)
- `score_criteria.criterion_name` - ✅ GOOD (avoids joins)

**Missing**:
- `hackathons.status` could benefit from auto-transition trigger
- No `teams.member_count` denormalized column

---

### 4.2 Trigger Cost

**Current Triggers**:
1. `on_auth_user_created` - ✅ Very low cost (once per user)
2. `handle_updated_at` - ✅ Very low cost (per update)
3. `update_project_score` - ⚠️ MEDIUM cost (per score change)

**`update_project_score` Risk at 100k+ submissions**:
- High write amplification: 1 score change = 1 project update
- If 10 judges update scores per minute = 600 updates/minute
- Could cause table bloat and deadlocks

**Mitigation**:
- Batch updates
- Use background jobs for recalculation
- Consider a queue system

---

### 4.3 Row Growth & Partitioning

**Current**: No partitioning

**Risk at 100k+ projects**:
- Sequential scans get slower
- Indexes get larger
- Backup/restore times increase
- VACUUM takes longer

**Future-Proofing (Priority 2 - After 10k)**:
- Partition `scores` by `hackathon_id`
- Partition `projects` by `hackathon_id`
- Use declarative partitioning

---

### 4.4 Cascade Strategies

**Current**: All FKs use `ON DELETE CASCADE`

**Risk**:
- Accidental deletion of hackathon = ALL data lost
- No audit trail of deletions

**Improvement**:
- Use soft deletes (`deleted_at TIMESTAMPTZ`)
- Keep cascade for safety but add RLS to prevent accidental deletes
- Archive old data instead of deleting

---

## 5. SUPABASE-SPECIFIC REVIEW

### 5.1 RLS at Scale

**Supabase Specific**:
- Supabase enforces RLS for all client queries
- Server-side can bypass with service_role key
- RLS is applied per-query, per-row

**At 10k concurrent users**:
- RLS overhead ~1-2ms per query (acceptable)
- Caching helps reduce load

**At 100k concurrent users**:
- RLS overhead could become noticeable
- Need more read replicas
- Consider using materialized views with RLS bypass

---

### 5.2 Realtime Implications

**Current**: No realtime enabled

**Planned Usage**:
- Live score updates
- Leaderboard updates
- Team activity

**Supabase Realtime Cost**:
- 1 concurrent connection = ~1 MB memory
- 10k concurrent = ~10 GB
- 100k concurrent = ~100 GB (needs enterprise plan)

**Optimization**:
- Use presence for online users
- Only subscribe to necessary channels
- Throttle updates (e.g., leaderboard every 10s)

---

### 5.3 Storage Architecture Planning

**Current**: No storage configured

**Needed Buckets**:
```
hackjudge/
├── problem-statements/  (private, admin-only)
├── project-covers/      (public-read)
├── team-avatars/        (public-read)
└── user-avatars/        (public-read)
```

**Supabase Storage RLS**:
- Need to define bucket-level RLS policies
- Use signed URLs for private files
- Set up image resizing (Supabase Image Transformation)

---

### 5.4 Auth Integration Safety

**Current**: Good - profiles linked via trigger to auth.users

**Missing**:
- Email verification trigger
- Password reset logging
- Session audit logs

---

## 6. ARCHITECTURE PLANNING FOR NEXT PHASES

### 6.1 Data Layer / Repository Pattern

**Recommendation**: Create repository layer for data access

```
src/
├── data/
│   ├── repositories/
│   │   ├── hackathons-repository.ts
│   │   ├── teams-repository.ts
│   │   ├── projects-repository.ts
│   │   └── scores-repository.ts
│   └── queries/
│       ├── get-leaderboard.ts
│       ├── get-unjudged-projects.ts
│       └── get-judge-progress.ts
```

**Benefits**:
- Centralized query logic
- Easier to optimize queries
- Better type safety
- Easier to add caching

---

### 6.2 Caching Strategy

**Recommended Stack**:
- **Application Cache**: `lru-cache` for server-side (Next.js)
- **Database Cache**: Supabase Read Replicas
- **Edge Cache**: Vercel Edge Functions / CDN

**What to Cache**:
- ✅ Hackathon public listings (5min TTL)
- ✅ Leaderboards (10s TTL, or invalidate on score change)
- ✅ User profiles (1hr TTL)
- ❌ Never cache scores or submissions

---

### 6.3 Realtime Architecture

**Recommended Pattern**:
```
Client → Supabase Realtime → DB Trigger → Publish
```

**Channels**:
- `hackathon:{id}:leaderboard` - Leaderboard updates
- `project:{id}:scores` - Score changes
- `team:{id}:activity` - Team activity

---

### 6.4 Optimistic UI Strategy

**For Judge Scoring**:
1. User submits score
2. Update UI optimistically
3. Send to server
4. Listen for realtime confirmation
5. Reconcile if needed

**For Leaderboards**:
- Use background refresh + realtime
- Avoid full optimistic leaderboard

---

### 6.5 File Upload Architecture

**Flow**:
1. Client requests signed URL from API route
2. Client uploads directly to Supabase Storage
3. Client notifies server with file URL
4. Server updates DB record

**Optimization**:
- Use Supabase Image Transformation for cover images
- Generate thumbnails on upload
- Set up virus scanning (enterprise)

---

## 7. SCALING CONCERNS BY SCALE

### 7.1 At 100 Users
**What works**: Everything
**What to watch**: Nothing - architecture is fine
**Cost**: Low

### 7.2 At 1,000 Users
**What works**: Everything
**What to watch**: 
- `update_project_score` trigger might have minor delays
- Add the recommended composite indexes
**Cost**: Moderate

### 7.3 At 10,000 Users
**What needs fixing**:
- ✅ Add composite indexes (priority 1)
- ✅ Optimize RLS policies
- ⚠️ Consider read replicas
- ⚠️ Add caching layer
- ⚠️ Monitor trigger performance
**Risk of failure**: MEDIUM if not optimized

### 7.4 At 100,000 Users / 100k+ Submissions
**What needs re-architecting**:
- 🔴 Partition large tables
- 🔴 Materialized views for leaderboards
- 🔴 Queue system for score updates
- 🔴 Separate read/write DBs
- 🔴 Enterprise Supabase plan with high availability
**Risk of failure**: CRITICAL if not addressed

---

## 8. ACTIONABLE CHECKLIST

### Before Launch (Priority 1)
- [ ] Add composite leaderboard index
- [ ] Add `idx_scores_project_submitted` index
- [ ] Optimize expensive RLS EXISTS clauses
- [ ] Add `deleted_at` columns for soft deletes
- [ ] Configure Supabase Storage buckets with RLS
- [ ] Add email verification trigger

### Before 10k Users (Priority 2)
- [ ] Implement repository pattern
- [ ] Add LRU cache for public data
- [ ] Create materialized view for leaderboards
- [ ] Add basic audit logging
- [ ] Set up Supabase Realtime for live updates
- [ ] Implement optimistic UI for scoring

### Before 100k Users (Priority 3)
- [ ] Table partitioning by hackathon_id
- [ ] Read replicas setup
- [ ] Queue system for async operations
- [ ] Rate limiting and throttling
- [ ] Advanced monitoring and alerting

---

## CONCLUSION

**Current Architecture**: Solid foundation for launch!

**Immediate Next Step**: Implement the repository pattern and add the missing indexes.

**Document**: Keep this audit updated as the system grows.

**Remember**: Optimize based on real usage patterns - don't pre-optimize everything too early!
