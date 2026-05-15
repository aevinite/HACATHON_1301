# HackJudge Shared UI & Design System Architecture

Date: 2026-05-11

## Executive Summary

**Complete shared UI system, design system, component standards, app shell, and strategy documentation.**

---

## 1. SHARED UI SYSTEM

### UI Primitives (shadcn/ui)

All components built on Radix UI primitives via shadcn/ui:

| Component | Purpose |
|-----------|---------|
| `Button` | Clickable actions |
| `Card` | Container for content |
| `Input` | Text input |
| `Label` | Form labels |
| `Toast` | Notifications |
| `Skeleton` | Loading states |
| `Avatar` | User profile images |
| `Badge` | Status indicators |
| `Table` | Data tables |
| `Dialog` | Modals |
| `Form` | Form system (react-hook-form + Zod) |
| `DropdownMenu` | Context menus |

### Layout System

**Grid System**: Tailwind Grid
- Mobile first
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Containers: `container` class (max-width centered)

**Spacing System**: Tailwind spacing scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Card System

```tsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Footer
  </CardFooter>
</Card>
```

### Modal System (Dialog)

```tsx
<Dialog>
  <DialogTrigger>Open Modal</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content
    <DialogFooter>
      <DialogClose>Cancel</DialogClose>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Loading States

```tsx
// Skeleton
<Skeleton className="h-48 w-full rounded-lg" />

// LoadingState component
<LoadingState type="card" count={3} />
<LoadingState type="list" count={5} />
<LoadingState type="page" />
<LoadingState type="table" count={10} />
```

### Empty States

```tsx
<EmptyState
  icon={FolderOpen}
  title="No projects yet"
  description="Create your first project to get started"
  action={{ label: "Create Project", onClick: () => {} }}
/>
```

### Error States

```tsx
<ErrorState
  title="Failed to load"
  description="Please check your connection and try again"
  retry={() => refetch()}
/>
```

---

## 2. DESIGN SYSTEM ARCHITECTURE

### Color Tokens (Tailwind + CSS Variables)

**Semantic Colors** (already in globals.css):
- `--background`: Page background
- `--foreground`: Text color
- `--card`: Card background
- `--card-foreground`: Card text
- `--primary`: Primary brand color
- `--primary-foreground`: Text on primary
- `--secondary`: Secondary color
- `--muted`: Muted background
- `--muted-foreground`: Muted text
- `--accent`: Accent color
- `--destructive`: Error/danger
- `--border`: Border color
- `--input`: Input border
- `--ring`: Focus ring

**Why CSS Variables?**
- ✅ Theme switching (light/dark)
- ✅ Consistent colors across components
- ✅ No hardcoded hex values
- ✅ Easy to update brand colors

### Spacing Scale (Tailwind Default)

```
0    0px
px   1px
0.5  2px
1    4px
1.5  6px
2    8px
2.5  10px
3    12px
3.5  14px
4    16px
5    20px
6    24px
7    28px
8    32px
9    36px
10   40px
11   44px
12   48px
14   56px
16   64px
20   80px
24   96px
28   112px
32   128px
36   144px
40   160px
44   176px
48   192px
52   208px
56   224px
60   240px
64   256px
72   288px
80   320px
96   384px
```

### Typography Scale (Tailwind Default)

| Class | Size | Line Height | Use Case |
|-------|------|-------------|----------|
| text-xs | 0.75rem | 1rem | Helper text |
| text-sm | 0.875rem | 1.25rem | Body small |
| text-base | 1rem | 1.5rem | Body |
| text-lg | 1.125rem | 1.75rem | Body large |
| text-xl | 1.25rem | 1.75rem | Subheading |
| text-2xl | 1.5rem | 2rem | Heading small |
| text-3xl | 1.875rem | 2.25rem | Heading |
| text-4xl | 2.25rem | 2.5rem | Heading large |

### Border Radius System

```
none    0px
sm      0.125rem (2px)
DEFAULT 0.5rem (8px)
md      0.375rem (6px)
lg      0.5rem (8px)
xl      0.75rem (12px)
2xl     1rem (16px)
3xl     1.5rem (24px)
full    9999px
```

### Shadow System

```
sm      subtle shadow
DEFAULT standard shadow
md      medium shadow
lg      large shadow
xl      extra large shadow
2xl     2x large shadow
```

### Animation Rules

**What to Animate**:
- ✅ Hover states (subtle)
- ✅ Enter/exit transitions
- ✅ Loading states
- ✅ Modal/dialog animations

**What NOT to Animate**:
- ❌ Large layout shifts
- ❌ Constant animations (distracting)
- ❌ Expensive properties (top, left - use transform)

**Animation Duration**:
- Fast: 150ms
- Normal: 200ms
- Slow: 300ms

### Z-Index Strategy

```
dropdown   100
sticky     200
banner     300
overlay    400
modal      500
popover    600
skipLink   700
toast      800
tooltip    900
```

### Responsive Breakpoints

```
sm    640px   (mobile landscape)
md    768px   (tablet)
lg    1024px  (laptop)
xl    1280px  (desktop)
2xl   1536px  (large desktop)
```

---

## 3. COMPONENT STANDARDS

### Component Structure

```tsx
// Example component structure
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MyComponentProps {
  className?: string
  children: React.ReactNode
  variant?: "default" | "outline"
}

export function MyComponent({
  className,
  children,
  variant = "default",
}: MyComponentProps) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-input bg-background",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  )
}
```

### Props Patterns

**Always**:
- ✅ Accept `className` prop
- ✅ Use TypeScript interfaces
- ✅ Forward refs when needed
- ✅ Default values for optional props

**Composition vs Configuration**

**Prefer composition**:
```tsx
<Button>
  <Icon className="mr-2" />
  Click me
</Button>
```

**Avoid configuration**:
```tsx
// ❌ Avoid
<Button icon={Icon} label="Click me" />
```

### Controlled vs Uncontrolled Components

**Controlled** (preferred for forms):
```tsx
const [value, setValue] = useState("")
<Input value={value} onChange={(e) => setValue(e.target.value)} />
```

**Uncontrolled** (for simple inputs):
```tsx
const ref = useRef<HTMLInputElement>(null)
<Input ref={ref} />
```

### Memoization Strategy

**Memoize when**:
- ✅ Component receives the same props often
- ✅ Component is expensive to render
- ✅ Component is used in lists

**Don't memoize when**:
- ❌ Props change frequently
- ❌ Component is simple/cheap to render
- ❌ Premature optimization

### Accessibility Requirements

**All interactive components must**:
- ✅ Have `role` attribute if not semantic HTML
- ✅ Have `aria-label` or visible text
- ✅ Be keyboard accessible (Tab, Enter, Space)
- ✅ Have focus states
- ✅ Support screen readers
- ✅ Have sufficient color contrast (4.5:1)

### Naming Conventions

**Files**:
- Components: PascalCase (`MyComponent.tsx`)
- Hooks: camelCase with "use" prefix (`useMyHook.ts`)
- Utilities: camelCase (`myUtility.ts`)
- Constants: UPPER_SNAKE_CASE (`MY_CONSTANT.ts`)

**Props**:
- Boolean props: `isLoading`, `isDisabled`, `isOpen`
- Event handlers: `onClick`, `onChange`, `onSubmit`

---

## 4. FEATURE IMPLEMENTATION RULES

### How Hooks Are Written

```tsx
// use prefix
// Accept options object
// Return object with clear properties
export function useHackathons(options?: { limit?: number }) {
  const query = useQuery({
    queryKey: QUERY_KEYS.hackathons.public,
    queryFn: getPublicHackathons,
  })

  return {
    ...query,
    hackathons: query.data,
  }
}
```

### Mutation Structure

```tsx
const mutation = useMutation({
  mutationFn: createProject,
  onMutate: async (newProject) => {
    // Optimistic update
  },
  onError: (err, newProject, context) => {
    // Revert optimistic update
  },
  onSettled: () => {
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["projects"] })
  },
})
```

### Query Structure

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ["hackathons", hackathonId],
  queryFn: () => getHackathon(hackathonId),
  enabled: !!hackathonId,
  staleTime: 60 * 1000,
})
```

### Form Structure

```tsx
const form = useForm<ProjectFormValues>({
  resolver: zodResolver(projectSchema),
  defaultValues: {
    name: "",
    description: "",
  },
})

function onSubmit(values: ProjectFormValues) {
  mutation.mutate(values)
}

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type="submit">Submit</Button>
    </form>
  </Form>
)
```

### Modal Structure

```tsx
const [open, setOpen] = useState(false)

return (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <Button>Open Modal</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
      </DialogHeader>
      {/* Content */}
    </DialogContent>
  </Dialog>
)
```

### Upload Flow

```
1. Validate file (FileValidator)
2. Show upload progress
3. Upload to storage (StorageService)
4. Get storage URL
5. Submit form with URL
6. Update database
7. Show success toast
```

### Optimistic Update Flow

```
1. User submits
2. Disable form
3. Optimistically update cache
4. Show pending state
5. Send to server
6. If success → confirm
7. If error → revert + show error
8. Re-enable form
```

### Loading/Error Handling Patterns

**Loading**:
```tsx
if (isLoading) return <LoadingState type="card" />
```

**Error**:
```tsx
if (error) return <ErrorState retry={() => refetch()} />
```

**Suspense**:
```tsx
<Suspense fallback={<LoadingState />}>
  <MyComponent />
</Suspense>
```

---

## 5. APP SHELL ARCHITECTURE

### Sidebar Architecture

**Desktop**:
- Fixed left sidebar (256px wide)
- Always visible
- Navigation items with icons
- Logo at top

**Mobile**:
- Hidden by default
- Hamburger menu button in header
- Overlay when open
- Swipe to close

### Mobile Navigation

- Header with logo + hamburger
- Sidebar slides in from left
- Overlay darkens background
- Click overlay or X to close

### Route Groups

```
app/
├── (auth)/              # Public auth routes
├── (dashboard)/         # Protected routes with shell
│   ├── page.tsx
│   ├── hackathons/
│   ├── teams/
│   └── projects/
└── layout.tsx
```

### Protected Layouts

```tsx
// (dashboard)/layout.tsx
import { AppShell } from "@/components/shell/app-shell"
import { requireAuth } from "@/features/auth/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return <AppShell>{children}</AppShell>
}
```

### Role-Based Layouts

- **Admin**: Full sidebar + admin section
- **Judge**: Judging-focused sidebar
- **Team**: Participant-focused sidebar

### Dashboard Shell

- Sidebar navigation
- Main content area
- Responsive grid
- Loading/error states

---

## 6. RESPONSIVE STRATEGY

### Mobile-First Approach

**Always start with mobile styles first**:
```tsx
// Default = mobile
<div className="grid gap-4">
  {/* Content */}
</div>

// Tablet and up
<div className="grid gap-4 md:grid-cols-2">
  {/* Content */}
</div>

// Desktop and up
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>
```

### Tablet Handling

- 2 column grid
- Larger touch targets
- More spacing

### Desktop Scaling

- 3 column grid
- Full sidebar visible
- More content density

### Ultra-Wide Behavior

- Max-width container
- Centered content
- No excessive stretching

### Responsive Containers

```tsx
// Centered with max width
<div className="container mx-auto px-4">
  {/* Content */}
</div>
```

### Responsive Typography

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

### Responsive Grids

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* Cards */}
</div>
```

### Hero Section Guidelines

**Vertically Compact**:
- Maximum height: 60vh on mobile
- Maximum height: 50vh on desktop
- No excessive padding

**Horizontally Adaptive**:
- Full width container
- Responsive grid
- Flexible content

**Visually Premium**:
- Clean typography hierarchy
- Subtle shadows
- Good whitespace

---

## 7. ANIMATION SYSTEM

### Motion Principles

**Subtle**: No jarring animations
**Purposeful**: Only animate when meaningful
**Consistent**: Same timing curves across app
**Respectful**: Honor reduced-motion preferences

### Hover Animations

```tsx
// Subtle hover
<button className="transition-colors hover:bg-accent">
  Hover me
</button>

// Scale + shadow
<div className="transition-all hover:scale-105 hover:shadow-lg">
  Hover card
</div>
```

### Loading Transitions

```tsx
// Skeleton pulse
<Skeleton className="animate-pulse" />
```

### Page Transitions

- Fade in on mount
- No full page transitions (jarring)
- Subtle opacity changes

### Modal Animations

- Scale in when opening
- Fade in overlay
- Scale out when closing
- Respect reduced-motion

### Realtime Update Animations

- Subtle highlight when content updates
- Fade new items in
- No distracting animations

### Reduced Motion Support

```tsx
// Check prefers-reduced-motion
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Only animate if not reduced
if (!prefersReducedMotion) {
  // Animate
}
```

---

## 8. ACCESSIBILITY SYSTEM

### Keyboard Navigation

**All interactive elements must**:
- ✅ Be reachable via Tab
- ✅ Have visible focus ring
- ✅ Be activatable via Enter/Space
- ✅ Have logical focus order

### Focus States

```tsx
// Default Tailwind focus ring
<button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
  Focusable
</button>
```

### ARIA Usage

**Use semantic HTML first**:
```tsx
// ✅ Good
<button>Click</button>

// ❌ Avoid
<div onClick={handleClick}>Click</div>
```

**When to use ARIA**:
- When semantic HTML isn't available
- For complex widgets (tabs, modals)
- For dynamic content

### Screen Reader Support

**All content must**:
- ✅ Have descriptive labels
- ✅ Use proper heading hierarchy (h1 → h2 → h3)
- ✅ Have alt text for images
- ✅ Announce dynamic changes

### Color Contrast

**Minimum 4.5:1** for normal text
**Minimum 3:1** for large text

**How to test**:
- Use browser dev tools
- Use Figma plugins
- Test in grayscale

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. PERFORMANCE UI STRATEGY

### Lazy Loading

**Components**:
```tsx
// Next.js dynamic import
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <LoadingState />,
  ssr: false,
})
```

**Images**:
```tsx
// Next.js Image component
<Image
  src={src}
  alt={alt}
  width={800}
  height={600}
  loading="lazy"
/>
```

### Code Splitting

**Automatic**: Next.js does route-based code splitting
**Manual**: Use `dynamic()` for heavy components

### Image Loading

- Use Next.js Image component
- Set proper dimensions
- Use lazy loading
- Use modern formats (WebP)
- Use responsive images

### Virtualization

**For long lists**:
```tsx
// Use react-window or react-virtual
import { FixedSizeList } from "react-window"

const List = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>{items[index]}</div>
    )}
  </FixedSizeList>
)
```

### Suspense Boundaries

```tsx
<Suspense fallback={<LoadingState />}>
  <MyComponent />
</Suspense>

<Suspense fallback={<LoadingState />}>
  <ErrorBoundary fallback={<ErrorState />}>
    <MyComponent />
  </ErrorBoundary>
</Suspense>
```

### Streaming Strategy

- Use Next.js Streaming SSR
- Show loading states early
- Stream content as it's ready
- Good UX on slow connections

---

## 10. STANDARDS VS CUSTOMIZATION

### What to Standardize

✅ **Yes, standardize**:
- All UI primitives
- Design tokens (colors, spacing, typography)
- Component patterns
- Loading/error/empty states
- Form system
- Navigation patterns
- Animation timing

### What to Customize

✅ **Yes, customize**:
- Feature-specific content
- Page layouts (within grid system)
- Feature-specific animations (subtle)
- Feature-specific copy

---

## DECISION EXPLANATIONS

### Why shadcn/ui?

- ✅ Radix UI primitives (accessible)
- ✅ Copy-paste components (no npm dependency hell)
- ✅ Tailwind CSS (consistent styling)
- ✅ TypeScript first
- ❌ Tradeoff: More files in repo, but worth it

### Why Tailwind CSS?

- ✅ No CSS files to manage
- ✅ Consistent styling across app
- ✅ Easy to refactor
- ✅ Great DX
- ❌ Tradeoff: Long class names, but manageable

### Why Mobile-First?

- ✅ Forces prioritization of important content
- ✅ Better performance on mobile
- ✅ Scales up nicely
- ❌ Tradeoff: Sometimes need to override styles, but worth it

### Why Semantic HTML?

- ✅ Accessible by default
- ✅ Better SEO
- ✅ Better maintainability
- ❌ Tradeoff: More thought required, but worth it

---

## SCALING IMPLICATIONS

### At 100 Users
- ✅ Everything works great
- ✅ No performance issues
- ✅ Easy to maintain

### At 1000 Users
- ⚠️ Watch bundle size
- ⚠️ Consider code splitting more
- ⚠️ Monitor image loading

### At 10,000 Users
- 🔴 Virtualize long lists
- 🔴 Aggressive code splitting
- 🔴 Image CDN optimization
- 🔴 Performance monitoring

---

## FUTURE MAINTENANCE RISKS

### Risk: Component Drift
- **Mitigation**: Regular design audits, enforce standards in PRs

### Risk: Bundle Bloat
- **Mitigation**: Regular bundle analysis, code splitting, lazy loading

### Risk: Accessibility Regressions
- **Mitigation**: Automated accessibility tests, manual checks

---

## CONCLUSION

**Shared UI & Design System Ready!**
- ✅ Complete UI primitives
- ✅ Design tokens and scales
- ✅ Component standards
- ✅ App shell architecture
- ✅ Responsive strategy
- ✅ Animation system
- ✅ Accessibility system
- ✅ Performance strategy
- ✅ Complete documentation

All decisions explained with tradeoffs, scaling, DX, and maintenance!
