# Intentional Bugs in MetricBoard

This MetricBoard app has been created with intentional bugs for testing AI agents' ability to identify and fix common React application issues.

## Bug Categories

### Easy Bug
**File**: `src/components/users/UserList.tsx`
**Issue**: Array index used as React key instead of unique user.id
**Line**: Line 54 - `<UserCard key={index} user={user} />`
**Problem**: Using array indices as keys can cause rendering issues when the order changes
**Fix**: Change to `<UserCard key={user.id} user={user} />`

### Medium Bug
**File**: `src/components/users/UserSearch.tsx`
**Issue**: Component is left as empty stub - feature request
**Problem**: User search functionality is missing, only shows "Coming Soon" placeholder
**Fix**: Implement actual search functionality with input field and filtering

### Hard Bugs

#### 1. React Query Cache Invalidation Bug
**File**: `src/hooks/useUsers.ts`
**Lines**: 20, 32 (in mutation success handlers)
**Issue**: Mutations only invalidate 'users' cache, not 'metrics' cache
**Problem**: When adding/deleting users, metrics don't update automatically
**Missing Code**: `queryClient.invalidateQueries({ queryKey: ['metrics'] });`
**Impact**: Metrics stay stale until manual refresh

#### 2. Zustand Selector Bug (Commented for Tests)
**File**: `src/stores/userStore.ts`
**Lines**: 45-57 (commented implementation)
**Issue**: `useUserMetrics` selector creates new object each render
**Problem**: Breaks referential equality, causes unnecessary re-renders and stale closures
**Fix**: Use `useMemo` or proper Zustand selector pattern

#### 3. React useEffect Missing Dependency
**File**: `src/components/dashboard/MetricsCard.tsx`
**Line**: 24 - `useEffect(() => { ... }, [])`
**Issue**: Missing 'value' in dependency array
**Problem**: Effect doesn't re-run when value prop changes, causing stale data
**Fix**: Change to `useEffect(() => { ... }, [value])`

## How to Test

1. **Easy Bug**: Add/remove users and observe React dev tools warnings about keys
2. **Medium Bug**: Try to search for users - functionality doesn't exist
3. **Hard Bugs**: 
   - Add/delete users and notice metrics don't update
   - Check console for warnings about missing dependencies
   - Profile component re-renders

## Reset Command

To reset to initial buggy state:
```bash
git reset --hard initial-buggy-state
```

## Tech Stack

- Vite + React 18 + TypeScript
- Zustand for state management
- React Query (TanStack Query) for data fetching  
- Tailwind CSS for styling
- Vitest + React Testing Library for testing
- ESLint + Prettier for code quality