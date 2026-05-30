# Auren CMS — AI Agent Rules

> **Read the root `../AGENTS.md` FIRST for global rules (translations, design tokens, roles, enums).**

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript 5**
- **TailwindCSS 4** (with `@theme` in `globals.css`)
- **next-auth v4** (Keycloak provider)
- **TanStack React Query v5** (data fetching & cache)
- **React Hook Form v7** + **Zod v4** (forms & validation)
- **next-intl v4** (internationalization)
- **Lucide React** (icons)
- **Sonner** (toast notifications)
- **date-fns** (date formatting)
- **clsx** + **tailwind-merge** (conditional class merging)

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx            # Root layout: Inter font, lang="es", Providers wrapper
│   ├── page.tsx              # Landing / redirect to dashboard
│   ├── providers.tsx         # SessionProvider (next-auth) + QueryClientProvider (React Query)
│   ├── globals.css           # TailwindCSS @theme with Auren design tokens
│   ├── middleware.ts         # Auth guard: protects /dashboard/* routes
│   ├── api/                  # NextAuth API routes
│   └── dashboard/
│       ├── layout.tsx        # Dashboard shell: sidebar + header
│       ├── page.tsx          # Dashboard home (stats & metrics)
│       ├── patients/         # Patient management
│       ├── professionals/    # Professional management
│       ├── appointments/     # Appointment scheduling
│       ├── medications/      # Medication tracking
│       ├── surveys/          # Clinical questionnaires
│       ├── chat/             # Real-time chat
│       └── settings/         # App settings
├── components/
│   ├── layout/               # sidebar.tsx, header.tsx
│   └── ui/                   # Button, Input, Select, TextArea, PatientCombobox
├── lib/
│   ├── api-client.ts         # ApiClient class — THE ONLY way to call the backend
│   └── utils.ts              # Utility functions (clsx + twMerge)
└── types/
    └── index.ts              # ALL TypeScript types/interfaces for the domain
```

---

## ⛔ CRITICAL RULES

### 1. NEVER hardcode colors — use TailwindCSS classes

Colors are defined in `src/app/globals.css` via `@theme` blocks, sourced from `auren-shared/design-system/tokens/colors.json`.

```tsx
// ✅ CORRECT — use Tailwind classes with Auren tokens
<div className="bg-primary-600 text-white">
<span className="text-danger-500">
<div className="text-risk-critical">

// ❌ WRONG — never hardcode hex values
<div style={{ color: '#2563EB' }}>
<span className="text-[#EF4444]">
```

Available color classes:
- `primary-{50-900}`, `primary-default`
- `success-{50,500,600}`, `success-default`
- `warning-{50,500,600}`, `warning-default`
- `danger-{50,500,600}`, `danger-default`
- `risk-{low,moderate,high,critical}`
- Font: `font-sans` (Inter), `font-mono` (JetBrains Mono)

### 2. NEVER hardcode user-visible strings

Use the translation system. All strings come from `auren-shared/translations/common/`.
See root AGENTS.md for the full rules.

### 3. NEVER bypass the API client

ALL backend requests go through `src/lib/api-client.ts`:

```tsx
import { api } from '@/lib/api-client';

// The client auto-attaches the Bearer token from next-auth session
const patients = await api.get<PageResponse<Patient>>('/v1/patients?page=0&size=20');
const created = await api.post<Patient>('/v1/patients', requestBody);
```

- **DO NOT** use raw `fetch()` to call the backend
- **DO NOT** create alternative API clients
- The client handles: auth token injection, JSON serialization, error handling, 204 responses

---

## Authentication

### Setup
- Provider: **NextAuth v4** with **Keycloak**
- Config: `src/app/api/auth/[...nextauth]/route.ts`
- Environment: `.env.local` (KEYCLOAK_ID, KEYCLOAK_SECRET, KEYCLOAK_ISSUER)
- Session includes `accessToken` from Keycloak

### Route Protection
- `src/middleware.ts` uses `withAuth` from `next-auth/middleware`
- Pattern: `/dashboard/:path*` — all dashboard routes require authentication
- **DO NOT** add public routes under `/dashboard/`

### Client-side auth
- Use `SessionProvider` from providers.tsx (already wraps the app)
- Access session: `useSession()` from `next-auth/react`

---

## Data Fetching — React Query

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

// Queries
const { data, isLoading } = useQuery({
  queryKey: ['patients', page, status],
  queryFn: () => api.get<PageResponse<Patient>>(`/v1/patients?page=${page}&status=${status}`),
});

// Mutations
const mutation = useMutation({
  mutationFn: (data: PatientCreateRequest) => api.post<Patient>('/v1/patients', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
});
```

- Default `staleTime`: 5 minutes (configured in providers.tsx)
- Default `retry`: 1
- `refetchOnWindowFocus`: disabled
- React Query Devtools are included in dev mode
- **ALWAYS** use descriptive `queryKey` arrays

---

## Forms — React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  centerId: z.string().uuid(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

- **ALWAYS** validate with Zod schemas
- **ALWAYS** use `zodResolver` with react-hook-form
- Display errors inline near the field

---

## Types

**ALL domain types live in `src/types/index.ts`**. Do NOT scatter types across files.

Existing types: `Patient`, `PatientCreateRequest`, `Appointment`, `Medication`, `Prescription`, `SurveyTemplate`, `SurveyQuestion`, `SurveyResponse`, `DailyMood`, `Professional`, `Center`, `DashboardStats`, `UserProfile`, `PageResponse<T>`

When adding a new type:
1. Add it to `src/types/index.ts`
2. Make sure it matches the backend DTO exactly (field names, nullability)
3. Use union types for enums: `"LOW" | "MODERATE" | "HIGH" | "CRITICAL"`

---

## UI Components

### Available in `src/components/ui/`
- **Button** — variants: `primary`, `secondary`, `danger`, `ghost`. Props: `isLoading`, `variant`
- **Input** — standard text input
- **Select** — dropdown select
- **TextArea** — multiline input
- **PatientCombobox** — patient search/select combo box

### Barrel export
```tsx
import { Button, Input, Select, TextArea } from '@/components/ui';
```

### Rules
- **ALWAYS** check if a UI component already exists before creating a new one
- New reusable components go in `src/components/ui/`
- Page-specific components stay in the page's directory
- Layout components go in `src/components/layout/`
- Use Tailwind classes with Auren tokens — NEVER inline styles

---

## Notifications

```tsx
import { toast } from 'sonner';

toast.success('Patient created successfully');
toast.error('Failed to save changes');
```

- **ALWAYS** use Sonner for user notifications
- **DO NOT** use `alert()` or custom notification systems

---

## Icons

```tsx
import { Users, Calendar, Plus } from 'lucide-react';

<Users className="h-5 w-5" />
```

- **ALWAYS** use Lucide React for icons
- **DO NOT** add other icon libraries
