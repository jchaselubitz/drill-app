# Supabase Client Initialization Fix

## Issue
Error: `[AuthRetryableFetchError: Cannot assign to read-only property 'NONE']`

This error occurred because there were two separate Supabase client instances being created in the application:
- `lib/supabase.ts` - Using process.env variables
- `lib/supabaseClient.ts` - Using expo-constants

This double initialization caused conflicts in the Supabase auth module's internal state management.

## Solution
1. **Removed duplicate file**: Deleted `lib/supabase.ts` 
2. **Consolidated imports**: Updated all imports to use the single, correct `lib/supabaseClient.ts`:
   - `context/AuthContext.tsx`
   - `lib/actions/userActions.ts`
   - `lib/actions/libraryActions.ts`
   - `screens/LoginScreen.tsx`

3. **Enhanced auth configuration**: Updated `lib/supabaseClient.ts` to include:
   - AsyncStorage integration for proper React Native session persistence
   - Auto-refresh token functionality
   - Session persistence
   - Disabled URL-based session detection (not applicable to React Native)

## Files Modified
- ✅ `context/AuthContext.tsx` - Updated import
- ✅ `lib/supabaseClient.ts` - Enhanced with proper auth config and AsyncStorage
- ✅ `lib/actions/userActions.ts` - Updated import
- ✅ `lib/actions/libraryActions.ts` - Updated import
- ✅ `screens/LoginScreen.tsx` - Updated import
- ❌ `lib/supabase.ts` - Deleted (removed duplicate)

## Result
Single, centralized Supabase client instance with proper React Native configuration prevents initialization conflicts and auth errors.
