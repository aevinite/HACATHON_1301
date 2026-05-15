# HackJudge Database Architecture

## Overview

This document describes the complete PostgreSQL + Supabase database architecture for HackJudge, preserving 100% of the original business logic from the MongoDB reference.

---

## Table of Contents

1. [Tables & Relations](#tables--relations)
2. [Key Business Rules Preserved](#key-business-rules-preserved)
3. [Triggers & Functions](#triggers--functions)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Indexing Strategy](#indexing-strategy)
6. [Performance & Scaling](#performance--scaling)

---

## Tables & Relations

### ER Diagram Summary

```
profiles (1) --< teams (leader)
profiles (1) --< team_members
profiles (1) --< judges
profiles (1) --< projects (submitted_by)
profiles (1) --< scores (judge)
profiles (1) --< hackathons (created_by)

hackathons (1) --< categories
hackathons (1) --< rubric_criteria
hackathons (1) --< timeline_events
hackathons (1) --< problem_statements
hackathons (1) --< teams
hackathons (1) --< projects
hackathons (1) --< judges
hackathons (1) --< scores

teams (1) --< team_members
teams (1) --< projects

projects (1) --< project_tech_stack
projects (1) --< scores

scores (1) --< score_criteria

categories (1) --< projects
rubric_criteria (1) --< score_criteria
```

---

### 1. `profiles`

**Purpose**: Extends Supabase Auth users with additional profile data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | FK to auth.users |
| `full_name` | TEXT | User's full name |
| `avatar_url` | TEXT | Profile picture URL |
| `role` | TEXT | User role: admin/team/judge/organizer |
| `is_active` | BOOLEAN | Account active status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Triggers**:
- Auto-creates profile when user signs up (via `on_auth_user_created`)
- Auto-updates `updated_at`

---

### 2. `hackathons`

**Purpose**: Main hackathon event with all configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Hackathon name |
| `description` | TEXT | Full description |
| `theme` | TEXT | Hackathon theme |
| `banner_image` | TEXT | Banner image URL |
| `status` | TEXT | Lifecycle: draft/registration/submission/judging/completed |
| `is_public` | BOOLEAN | Public visibility |
| `registration_start_date` | TIMESTAMPTZ | When registration opens |
| `registration_deadline` | TIMESTAMPTZ | When registration closes |
| `start_date` | TIMESTAMPTZ | Hackathon start |
| `submission_deadline` | TIMESTAMPTZ | When submissions close |
| `judging_deadline` | TIMESTAMPTZ | When judging closes |
| `min_team_size` | INTEGER | Minimum team members |
| `max_team_size` | INTEGER | Maximum team members |
| `created_by` | UUID | FK to profiles (admin/creator) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Preserved Rules**:
- Auto status transitions based on deadlines
- Team size validation

---

### 3. `teams`

**Purpose**: Teams participating in hackathons.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Team name |
| `hackathon_id` | UUID | FK to hackathons |
| `leader_id` | UUID | FK to profiles (team leader) |
| `invite_code` | TEXT | Unique invite code |
| `is_active` | BOOLEAN | Team active status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Unique Constraints**:
- `(name, hackathon_id)`: Unique team names per hackathon

---

### 4. `projects`

**Purpose**: Project submissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Project name |
| `tagline` | TEXT | Short tagline |
| `description` | TEXT | Full description |
| `hackathon_id` | UUID | FK to hackathons |
| `team_id` | UUID | FK to teams |
| `submitted_by` | UUID | FK to profiles |
| `category_id` | UUID | FK to categories |
| `cover_image` | TEXT | Cover image URL |
| `video_url` | TEXT | Demo video URL |
| `github_url` | TEXT | GitHub repo URL |
| `live_url` | TEXT | Live demo URL |
| `status` | TEXT | draft/submitted/disqualified |
| `is_visible` | BOOLEAN | Public visibility |
| `average_score` | NUMERIC | Denormalized average score |
| `total_judged` | INTEGER | Number of judges who scored |
| `rank` | INTEGER | Leaderboard rank |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Unique Constraints**:
- `(team_id, hackathon_id)`: One project per team per hackathon

---

### 5. `scores` & `score_criteria`

**Purpose**: Judge scores, one per judge per project.

#### `scores`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `project_id` | UUID | FK to projects |
| `judge_id` | UUID | FK to profiles |
| `hackathon_id` | UUID | FK to hackathons |
| `total_score` | NUMERIC | Weighted total score |
| `comment` | TEXT | Judge feedback |
| `is_submitted` | BOOLEAN | Score submitted status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Unique Constraints**:
- `(project_id, judge_id)`: One score per judge per project

#### `score_criteria`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `score_id` | UUID | FK to scores |
| `criterion_id` | UUID | FK to rubric_criteria |
| `criterion_name` | TEXT | Denormalized criterion name |
| `score` | NUMERIC | Score for this criterion |
| `max_score` | INTEGER | Max possible score |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

### Remaining Tables

- `categories`: Project categories per hackathon
- `rubric_criteria`: Scoring rubric with weights
- `timeline_events`: Hackathon timeline
- `problem_statements`: Problem statement files
- `team_members`: Members of each team
- `project_tech_stack`: Tech stack tags
- `judges`: Judges assigned to hackathons

---

## Key Business Rules Preserved

1. **One score per judge per project** (unique constraint)
2. **Weighted rubric scoring** (rubric_criteria.weight)
3. **Automatic project averages** (trigger: `update_project_score`)
4. **Leaderboard ranking** (projects.rank)
5. **Submission deadline locking** (enforced in app logic + RLS)
6. **Judging deadline locking** (enforced in app logic + RLS)
7. **Unique team names per hackathon** (unique constraint)
8. **Team size validation** (min/max)
9. **Visibility/disqualification** (is_visible, status)
10. **One project per team** (unique constraint)

---

## Triggers & Functions

### 1. `handle_updated_at()`
**Purpose**: Auto-update `updated_at` timestamps.
**Applies to**: profiles, hackathons, teams, projects, judges, scores
**Why**: Consistent timestamps without app code.

### 2. `handle_new_user()`
**Purpose**: Create profile when user signs up via Supabase Auth.
**Why**: Syncs auth.users with public.profiles.

### 3. `update_project_score()`
**Purpose**: Update project aggregates (average_score, total_judged) when scores change.
**Trigger**: After INSERT/UPDATE/DELETE on scores
**Why**: Denormalization for fast leaderboard queries without expensive joins.

---

## Row Level Security (RLS)

### Core Principles
- **RLS-first**: Security enforced at database level
- **Minimal app logic**: No duplicated auth checks
- **Role-based**: Admin/Team/Judge/Organizer permissions

### Summary Table

| Table | Read Access | Write Access |
|-------|-------------|--------------|
| profiles | Own + admin | Own + admin |
| hackathons | Public (is_public) | Creator + admin |
| teams | Public | Leader + admin |
| team_members | Public | Leader + admin |
| projects | Visible + team + admin | Team leader + admin |
| scores | Own judge + admin | Own judge |
| judges | Own + admin | Admin |
| All others | Public | Creator/hackathon admin + admin |

---

## Indexing Strategy

### Common Query Patterns Optimized:
1. **Hackathons**: `status`, `created_by`, `is_public`
2. **Projects**: `hackathon_id+status`, `hackathon_id+average_score DESC`, `is_visible`, text search
3. **Scores**: `project_id`, `judge_id`, `hackathon_id+judge_id`
4. **Teams**: `hackathon_id`, `leader_id`
5. **Text Search**: GIN index on `to_tsvector(name || ' ' || tagline || ' ' || description)`

### Performance:
- No N+1 queries
- Denormalized aggregates (average_score)
- Composite indexes for common filters
- Unique constraints prevent duplicates

---

## Performance & Scaling

### Normalization vs Denormalization
- **Normalized**: Most tables (3NF)
- **Denormalized**:
  - `projects.average_score` / `total_judged` (frequent reads)
  - `score_criteria.criterion_name` (avoid joins)

### Scaling Considerations
1. **Read Heavy**: Leaderboards benefit from denormalized aggregates
2. **Write Heavy**: Scores update frequently, trigger keeps aggregates in sync
3. **Partitioning**: Could partition `scores` and `projects` by `hackathon_id` for large events
4. **Realtime**: Supabase Realtime for live score updates
5. **Caching**: Redis for leaderboards in production

---

## Migration Files

1. `00001_initial_schema.sql` - All tables, constraints, indexes
2. `00002_triggers_functions_rls.sql` - Triggers, functions, RLS policies

Apply in order using Supabase Dashboard or CLI.

---

## Type Generation

Run to generate TypeScript types:

```bash
npm run db:types
```

(Set `PROJECT_ID` in your environment)
