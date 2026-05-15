# HackJudge Architecture

## Core Principles

### 1. Server Components by Default
**Pattern**: All components are Server Components unless they require interactivity.

**Why?**
- Better performance (less client-side JS)
- Direct database access without API routes
- Smaller bundle sizes
- Improved SEO

**When to use Client Components**:
- User interactivity (useState, useEffect)
- Browser APIs (window, document)
- Event handlers (onClick, onSubmit)
- State management libraries

---

### 2. Server Actions for Mutations/Forms
**Pattern**: Use `use server` functions for all data mutations.

**Why?**
- No need for API routes for simple forms
- Type-safe form handling
- Built-in error handling with `useFormState`
- Progressive enhancement

**When to use Route Handlers**:
- Webhooks from external services
- External API integrations
- Complex API responses (non-JSON, streaming, etc.)
- Public APIs

---

### 3. Feature-Based Scalable Structure
**Pattern**: Group code by feature, not by type.

**Structure**:
```
src/
├── features/
│   ├── auth/
│   │   ├── server.ts      # Server-side auth logic
│   │   ├── components/    # Feature-specific components
│   │   └── hooks/         # Feature-specific hooks
│   ├── judging/
│   ├── participants/
│   ├── submissions/
│   └── teams/
```

**Why?**
- Easier to navigate and maintain
- Clear ownership of code
- Better scalability as features grow
- Easier to delete/remove features

---

### 4. Zod Validation
**Pattern**: All form data is validated with Zod schemas.

**Why?**
- Type-safe validation
- Reusable schemas across server and client
- Clear error messages
- Easy to maintain and update

---

### 5. RLS-First Security
**Pattern**: All database access is protected by Row Level Security (RLS) policies.

**Why?**
- Security enforced at database level
- Single source of truth for permissions
- Works with Server Components and Server Actions
- No duplicate authorization checks needed

---

## Architecture Decisions

### Tech Stack Rationale

| Technology | Choice | Reason |
|------------|--------|--------|
| Framework | Next.js 15 App Router | Modern, built-in RSC, SSG/SSR/ISR |
| Database | Supabase PostgreSQL | Open source, RLS, realtime, auth built-in |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, customizable, great DX |
| Forms | react-hook-form + Zod | Performant, type-safe, great validation |
| Auth | Supabase Auth | Integrated with DB, OAuth, email/password |
| Animations | Framer Motion | Powerful, declarative, great DX |

---

## Directory Structure

```
hackjudge/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth route group (public)
│   │   ├── (dashboard)/        # Dashboard route group (protected)
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── loading.tsx         # Global loading state
│   │   └── error.tsx           # Global error boundary
│   ├── components/             # Shared components
│   │   └── ui/                 # shadcn/ui components
│   ├── features/               # Feature modules
│   ├── hooks/                  # Shared hooks
│   ├── lib/                    # Utilities
│   │   ├── supabase.ts         # Browser client
│   │   ├── supabase-server.ts  # Server client
│   │   └── utils.ts            # cn() utility
│   ├── config/                 # App config
│   ├── validations/            # Zod schemas
│   ├── actions/                # Server Actions
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── middleware.ts               # Auth middleware
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Scalability Plan

### Phase 2: Database & RLS
- Define database schema (users, profiles, teams, submissions, scores, etc.)
- Implement RLS policies for all tables
- Generate TypeScript types with Supabase CLI
- Add roles and permissions system

### Phase 3: Features
- Team management
- Submission system
- Judging interface
- Real-time scoring
- Admin dashboard

### Phase 4: Polish
- Analytics
- Notifications
- Export/import
- Performance optimizations
