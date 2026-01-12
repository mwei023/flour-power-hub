# CI/CD Fixes TODO

## Issues to Fix
1. **Backend ESLint Error**: `SyntaxError: Cannot use import statement outside a module` in `backend/eslint.config.js`
2. **Frontend Type-Check Error**: `npm error Missing script: "type-check"`

## Fixes

### Fix 1: Backend ESLint - Rename config to .mjs
- [x] Rename `backend/eslint.config.js` to `backend/eslint.config.mjs`
- [x] Update package.json lint script to reference the new file path if needed

### Fix 2: Frontend Type-Check - Add missing script
- [x] Add `"type-check": "tsc --noEmit"` to root `package.json` scripts

## Verification
- [x] Run `npm run lint` in backend to verify ESLint works
- [x] Run `npm run type-check` in root to verify type checking works

## Summary
Both CI/CD test failures have been fixed:
- **Backend ESLint**: Fixed by renaming `eslint.config.js` to `eslint.config.mjs` (ESM extension)
- **Frontend Type-Check**: Fixed by adding `"type-check": "tsc --noEmit"` script to package.json

