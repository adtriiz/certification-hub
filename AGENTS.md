# AGENTS.md - Development Guidelines for Certification Hub

This document provides essential information for AI agents working on the Certification Hub codebase.

## Project Overview

Certification Hub is a React + TypeScript application built with Vite, featuring shadcn/ui components, Supabase backend, and comprehensive certification management functionality. The app enables browsing, managing, and tracking professional certifications with admin capabilities.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server (port 8080)
- `npm run build` - Production build
- `npm run build:dev` - Development build 
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Testing Commands
- `vitest` - Run all tests (uses Vitest with jsdom)
- `vitest run` - Run tests once
- `vitest <filename>` - Run single test file
- `vitest --reporter=verbose` - Detailed test output

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── certifications/ # Feature-specific components
├── pages/            # Main application views
├── hooks/            # Custom React hooks
├── integrations/
│   └── supabase/     # Supabase client config
├── types/            # TypeScript type definitions
├── lib/              # Utility functions
└── data/             # Static data and types
```

## Code Style Guidelines

### Import Organization
- External libraries first (React, TanStack Query, etc.)
- Internal imports using `@/` alias
- UI components from `@/components/ui/`
- Feature components from `@/components/<feature>/`
- Types from `@/types/`

```typescript
// External
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Internal 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Certification } from "@/data/certifications";
```

### Component Structure
- Use React.forwardRef for components accepting ref
- Implement displayName for named components
- Use class-variance-authority (cva) for component variants
- Export both component and variants when applicable

```typescript
const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn("base-styles", className)} ref={ref} {...props} />;
  }
);
MyComponent.displayName = "MyComponent";
```

### TypeScript Conventions
- Strict mode enabled with noImplicitAny, noUnusedLocals, strictNullChecks
- Use interfaces for object shapes, types for unions/primitives
- Prefix unused parameters with underscore (`_`)
- Use explicit return types for public functions

```typescript
interface ComponentProps {
  title: string;
  onSubmit?: (data: FormData) => void;
}

type Status = "loading" | "success" | "error";
```

### State Management
- Use TanStack Query for server state
- Local state with useState/useReducer
- Form state with react-hook-form + zod validation

```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ["certifications"],
  queryFn: fetchCertifications,
});
```

### Error Handling
- Use ErrorBoundary component wrapping the app
- Throw errors in query functions for TanStack Query to handle
- Validate data with zod schemas
- Handle loading and error states in UI

### Naming Conventions
- Components: PascalCase (MyComponent)
- Hooks: camelCase with 'use' prefix (useCertifications)
- Functions/variables: camelCase (fetchData, isLoading)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL)
- Files: kebab-case for folders, PascalCase for components

### UI Patterns
- Use shadcn/ui components consistently
- Apply cn() utility for conditional classes
- Implement responsive design with Tailwind
- Use semantic HTML elements
- Accessible aria labels and roles

### Database Integration
- Supabase client configured in `@/integrations/supabase/client`
- Use TypeScript types from database schema
- Handle real-time subscriptions where needed
- Implement optimistic updates for better UX

## Testing Guidelines

- Tests use Vitest with @testing-library/react
- Test files: `*.test.tsx` or `*.test.ts`
- Setup in `src/test/setup.ts` with @testing-library/jest-dom
- Focus on behavior testing over implementation details
- Use descriptive test names with "should" format

## Development Workflow

1. Run `npm run lint` before committing
2. Ensure TypeScript compilation with no errors
3. Test components manually in dev server
4. Follow existing component patterns
5. Use `@/` path alias for internal imports
6. Keep components focused and composable

## Key Dependencies

- **UI**: shadcn/ui, Radix UI primitives, Tailwind CSS
- **State**: TanStack Query, react-hook-form, zod
- **Backend**: Supabase (auth, database, functions)
- **Icons**: Lucide React
- **Routing**: React Router DOM with HashRouter
- **Build**: Vite with SWC compilation

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Common Patterns

### Custom Hooks
Create reusable data fetching hooks following the useCertifications pattern.

### Form Handling
Use react-hook-form with zod resolvers for validation.

### Modal/Dialog Components
Use shadcn/ui Dialog components with consistent state management.

### Data Tables
Implement sorting, filtering, and pagination using Table components.

### Loading States
Use LoadingSpinner component for async operations.