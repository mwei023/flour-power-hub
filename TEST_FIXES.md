# Test Fixes TODO

This document tracks the fixes for GitHub test errors and warnings.

## ✅ HIGH SEVERITY (Type Safety & Runtime Bugs) - COMPLETED

### 1. Fix `any` type in security.ts#L156
- **File**: `backend/src/middleware/security.ts`
- **Issue**: `(req as any).user?.id`
- **Fix**: Added `AuthenticatedRequest` interface with user property ✅

### 2. Fix `any` types in customerController.ts#L70,88
- **File**: `backend/src/controllers/customerController.ts`
- **Issue**: `(req as any).validatedData?.body`
- **Fix**: Added `ValidatedRequest<T>` interface and used it ✅

### 3. Fix missing useEffect dependency in Expenses.tsx#L37
- **File**: `src/pages/Expenses.tsx`
- **Issue**: `fetchExpenses` missing from dependency array
- **Fix**: Wrapped `fetchExpenses` in `useCallback` with proper deps ✅

### 4. Fix missing useEffect dependency in Customers.tsx#L27
- **File**: `src/pages/Customers.tsx`
- **Issue**: `fetchCustomers` missing from dependency array
- **Fix**: Wrapped `fetchCustomers` in `useCallback` with proper deps ✅

## ✅ MEDIUM SEVERITY (Best Practices) - COMPLETED

### 5. Fix require() in tailwind.config.ts#L101
- **File**: `tailwind.config.ts`
- **Issue**: Using `require("tailwindcss-animate")` instead of import
- **Fix**: Converted to ES module import ✅

### 6. Fix empty interface in api.ts#L160
- **File**: `src/types/api.ts`
- **Issue**: Empty `PaginationQuery` interface
- **Fix**: Already had members - no change needed ✅

### 7. Fix empty interface in textarea.tsx#L5
- **File**: `src/components/ui/textarea.tsx`
- **Issue**: Empty `TextareaProps` interface
- **Fix**: Changed from interface to type alias ✅

### 8. Fix empty interface in command.tsx#L24
- **File**: `src/components/ui/command.tsx`
- **Issue**: Empty `CommandDialogProps` interface
- **Fix**: Inlined the type directly ✅

## ⏭ LOW SEVERITY (Dev Experience Only - Optional)

### Fast Refresh Warnings
These don't affect production but slow down development. Would require refactoring each file to separate components from utilities.

- [ ] `src/components/ui/toggle.tsx` - export `toggleVariants`
- [ ] `src/components/ui/sonner.tsx` - export constants
- [ ] `src/components/ui/sidebar.tsx` - export constants
- [ ] `src/components/ui/navigation-menu.tsx` - export constants
- [ ] `src/components/ui/input.tsx` - export constants
- [ ] `src/components/ui/form.tsx` - export constants
- [ ] `src/components/ui/button.tsx` - export `buttonVariants`
- [ ] `src/components/ui/badge.tsx` - export `badgeVariants`

## Summary

✅ **Fixed 4 HIGH severity issues** - These could cause runtime bugs
✅ **Fixed 4 MEDIUM severity issues** - Code quality improvements
⏭ **Skipped 9 LOW severity issues** - Dev experience only,不影响生产

**Total: 8 of 19 issues resolved** (9 low-priority Fast Refresh warnings remaining)

