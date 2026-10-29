# Testing & Verification Guide

This document contains instructions for running automated compiler and bundle verifications, as well as a comprehensive manual test checklist covering core workflows and edge cases on physical devices or simulators.

---

## Automated Verification

Run these commands from the project root:

```bash
# 1. Type Check (Strict TypeScript validation)
npx tsc --noEmit

# 2. Dead Code & Unused Parameter Audit
npx tsc --noEmit --noUnusedLocals --noUnusedParameters

# 3. Production Bundle Compilation (Verifies Metro bundler routes and assets)
$env:EXPO_NO_TELEMETRY="1"; npx expo export --output-dir temp_export
# On macOS/Linux: EXPO_NO_TELEMETRY=1 npx expo export --output-dir temp_export
# Remove output afterwards: rm -rf temp_export
```

Expected output: All commands must exit with code 0 and produce zero errors.

---

## Manual Test Checklist

### 1. Authentication & Session Management
- [ ] **Sign Up with Valid Credentials**: Enter a new email and password (minimum 6 characters). Tap "Create Account". Expected: User account is created in Supabase Auth, and the app transitions immediately to the home screen.
- [ ] **Sign Up Validation Errors**: Attempt sign-up with invalid email format (e.g., `user@domain`) or short password (< 6 chars). Expected: Inline error messages appear under fields; no network request is sent.
- [ ] **Sign In with Valid Credentials**: Enter existing user credentials and tap "Sign In". Expected: Successfully signs in and loads existing records.
- [ ] **Sign In with Invalid Credentials**: Enter wrong password. Expected: Displays clean, friendly toast/alert: "Invalid email or password"; no raw Supabase exception strings or stack traces appear.
- [ ] **Session Persistence Across App Restarts**: Close the application completely from the multitasking tray. Reopen the app. Expected: Bypasses login screen immediately and loads the user's dashboard/records without requiring re-authentication.
- [ ] **Clean Sign Out Without Noise**: Navigate to Settings and tap "Sign Out". Confirm in the dialog. Expected: In-flight requests cancel, storage URL caches clear, user state resets, and the app transitions cleanly to `/login` with zero error toasts or console errors.

### 2. Record Management (CRUD)
- [ ] **Create Text Note**: Tap `+` FAB. Enter title (e.g., "Grocery Shopping"), select category "Personal", enter notes. Tap "Save". Expected: Record saves to Postgres, appears at the top of the home list with correct title, category chip, and date.
- [ ] **Create Note with Camera Image**: Tap `+` FAB. Tap "Add Photo" -> "Take Photo". Accept camera permissions, take a photo. Save note. Expected: Photo compresses, uploads to private storage, thumbnail renders in list, and detail view shows the image.
- [ ] **Create Note with Gallery Image**: Tap `+` FAB. Tap "Add Photo" -> "Choose from Library". Select photo. Save note. Expected: Successfully uploads and displays.
- [ ] **Edit Note Fields**: Open an existing note, tap Edit. Change title, notes, and category. Tap "Save Changes". Expected: Updates persist to the database and reflect in list and detail views.
- [ ] **Replace Existing Image**: Open a note that has an image, tap Edit. Tap "Change Photo" and select a different image. Save. Expected: New image is uploaded to storage, old image file is purged from storage bucket, and new image renders without caching glitches.
- [ ] **Remove Image**: Open an existing note with an image, tap Edit. Tap "Remove Photo". Save. Expected: Record updates with `image_path = null`, storage file is deleted from bucket, and card returns to text-only mode.
- [ ] **Delete Record**: Open note details, tap trash icon. Confirm deletion. Expected: Record row is deleted from `public.records`, storage image is purged from the bucket, and user is navigated back to the home list.

### 3. Search, Filter, Sort, and Pinning
- [ ] **Category Filter Chips**: Tap a category chip (e.g., "Work"). Expected: List filters to show only records matching that category. Tap again or tap "All" to clear.
- [ ] **Text Search**: Type a search keyword. Expected: Real-time debounced query filters results by title and notes via ILIKE.
- [ ] **Special Character Search**: Enter `%`, `_`, `\`, `'`, and commas `,` in the search field. Expected: Query executes safely without crashing PostgREST or throwing syntax errors.
- [ ] **Combined Search & Filter**: Select category "Personal" and type a search term. Expected: Returns intersection of category match and text search match.
- [ ] **Sort Menu Options**: Tap the sort button in the list header. Switch between "Newest", "Oldest", and "Title A–Z". Expected: FlatList reorders immediately according to the selected option.
- [ ] **Pin / Unpin Notes**: Tap the pin icon on a card or detail screen. Expected: Pinned notes float to the top of the list with a highlighted border and pin badge. Tapping again unpins.
- [ ] **Empty States**:
  - Filter for a category or search term with zero matches. Expected: Displays "No matching notes found" with clear search button.
  - Delete all notes in an account. Expected: Displays "No notes yet" with "Create your first note" action button.

### 4. Image Handling & Edge Cases
- [ ] **Permission Cancellation**: Tap camera or gallery and cancel without taking/selecting a photo. Expected: App resumes without crashing or hanging.
- [ ] **Large Photo Compression**: Capture a high-resolution photo from a device camera (> 10MB). Expected: Image is resized and compressed to < 800KB before upload, completing within seconds on standard network.
- [ ] **Fullscreen Image Viewer**: On the note detail screen, tap the hero image. Expected: Opens modal fullscreen image viewer with close button and pan/zoom capability.
- [ ] **Signed URL Expiration & Refresh**: Leave the app idle or advance device clock by 2 hours. Expected: Signed URLs regenerate automatically on next view without showing broken image icons.

### 5. Network & Offline Awareness
- [ ] **Disconnect Network**: Turn on Airplane mode or disable Wi-Fi/cellular. Expected: "No internet connection" banner appears at the top of active screens.
- [ ] **Blocked Mutations Offline**: Attempt to create, edit, or delete a note while offline. Expected: Action is blocked and non-blocking toast appears ("Cannot perform action while offline").
- [ ] **Reconnect Network**: Turn off Airplane mode. Expected: Offline banner disappears; normal operations resume.

### 6. Security & Row Level Security (RLS) Isolation
- [ ] **Cross-User Data Isolation**:
  - Create User A, add 2 notes with images. Note down record UUIDs.
  - Sign out, create or sign in as User B.
  - Expected: User B sees zero records from User A.
  - Attempt to fetch User A's record ID directly via API/query. Expected: PostgREST returns empty set / 404.
  - Attempt to fetch User A's image from the `record-images` bucket. Expected: Supabase Storage returns 403 Forbidden.
