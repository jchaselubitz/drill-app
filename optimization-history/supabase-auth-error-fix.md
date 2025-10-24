# Supabase Auth Error Fix - "Cannot assign to read-only property 'NONE'"

## Issue
The application was throwing:
```
[AuthRetryableFetchError: Cannot assign to read-only property 'NONE']
```

This error occurred in the `AuthContext.tsx` when trying to initialize the Supabase client.

## Root Causes Identified

### 1. **Duplicate Supabase Client Files**
- `lib/supabase.ts` (using process.env)
- `lib/supabaseClient.ts` (using expo-constants)
- Both files were creating separate client instances, causing initialization conflicts

### 2. **Missing URL Polyfill**
- React Native doesn't have native URL support
- Supabase requires URL parsing capabilities
- Without the polyfill, Supabase's internal modules fail to initialize properly

### 3. **Metro Cache Issues**
- Old, broken code was cached by the Metro bundler
- Changes weren't taking effect until cache was cleared

## Solution Implemented

### Step 1: Removed Duplicate Client
- ✅ Deleted `lib/supabase.ts`
- ✅ Consolidated all imports to use `lib/supabaseClient.ts`
- Updated imports in:
  - `context/AuthContext.tsx`
  - `lib/actions/userActions.ts`
  - `lib/actions/libraryActions.ts`  
  - `screens/LoginScreen.tsx`

### Step 2: Added URL Polyfill
- ✅ Installed `react-native-url-polyfill` package
- ✅ Added polyfill import at the top of `app/_layout.tsx` (root entry point)
- ✅ Ensured polyfill loads before any Supabase code

### Step 3: Proper Auth Configuration
Enhanced `lib/supabaseClient.ts` with:
- AsyncStorage for session persistence
- Auto-refresh token enabled
- Session persistence enabled  
- URL-based session detection disabled (not applicable to React Native)

### Step 4: Cleared Metro Cache
- ✅ Ran `yarn start:expo --clear` to clear cached code
- This ensures the new, fixed code is loaded

## Files Modified

### Deleted:
- ❌ `lib/supabase.ts`

### Updated:
- ✅ `app/_layout.tsx` - Added URL polyfill import at top
- ✅ `lib/supabaseClient.ts` - Enhanced auth config, removed duplicate SupabaseClient import
- ✅ `context/AuthContext.tsx` - Updated import path
- ✅ `lib/actions/userActions.ts` - Updated import path
- ✅ `lib/actions/libraryActions.ts` - Updated import path
- ✅ `screens/LoginScreen.tsx` - Updated import path

### Added:
- ✅ `react-native-url-polyfill` package

## Key Learnings

1. **Single Source of Truth**: Only create one Supabase client instance in the entire app
2. **Polyfills Required**: React Native requires URL polyfill for Supabase
3. **Import Order Matters**: Polyfills must be imported before any code that uses them
4. **Cache Clearing**: Always clear Metro cache when dealing with module initialization issues

## Testing

After applying these fixes:
1. Clear Metro cache with `yarn start:expo --clear`
2. Restart the app
3. The auth error should be resolved
4. Sign in/sign out should work properly
