# Architecture & System Design

Smart Capture is built on a client-server architecture using Expo / React Native on the client and Supabase (PostgreSQL, GoTrue Auth, and Storage) on the backend. This document describes the system components, data flows, storage lifecycle, security model, and error handling strategies.

---

## High-Level System Architecture

```
+-------------------------------------------------------------------------+
|                              Client Layer                               |
|                                                                         |
|  +------------------+  +-------------------+  +----------------------+  |
|  |   UI / Screens   |  |   Context State   |  |   Design Tokens      |  |
|  |  (expo-router)   |  | (Auth, Records,   |  | (Colors, Spacing,    |  |
|  |                  |  |  Network, Theme)  |  |  Inter Typography)   |  |
|  +--------+---------+  +---------+---------+  +----------------------+  |
|           |                      |                                      |
|           +----------+-----------+                                      |
|                      |                                                  |
|  +-------------------+-----------------------------------------------+  |
|  |                         Services Layer                            |  |
|  |  +---------------+  +----------------+  +-----------------------+ |  |
|  |  | authService   |  | recordService  |  | storageService        | |  |
|  |  +---------------+  +----------------+  | (In-memory URL cache) | |  |
|  |                                         +-----------------------+ |  |
|  |  +---------------+  +----------------+                            |  |
|  |  | imageService  |  | shareService   |                            |  |
|  |  +---------------+  +----------------+                            |  |
|  +-------------------+-----------------------------------------------+  |
|                      |                                                  |
|  +-------------------+-----------------------------------------------+  |
|  |               Supabase Client (@supabase/supabase-js)             |  |
|  |            Session Persistence: AsyncStorage                      |  |
|  +-------------------+-----------------------------------------------+  |
+----------------------|--------------------------------------------------+
                       | HTTPS / REST / PostgREST
                       v
+-------------------------------------------------------------------------+
|                             Supabase Cloud                              |
|                                                                         |
|  +-------------------+  +--------------------+  +--------------------+  |
|  |    GoTrue Auth    |  | PostgREST / Postgres| |   Storage Service  |  |
|  | (JWT Tokens,      |  | (public.records,   |  | (record-images     |  |
|  |  User Identities) |  |  RLS, Indexes,     |  |  Private Bucket,   |  |
|  |                   |  |  Triggers)         |  |  Folder RLS)       |  |
|  +-------------------+  +--------------------+  +--------------------+  |
+-------------------------------------------------------------------------+
```

---

## Detailed Data Flows

### 1. Authentication (Sign Up & Sign In)
```
User -> UI Form -> authService.signIn / signUp
                 -> Supabase GoTrue Auth
                 -> Receives JWT access_token & refresh_token
                 -> AsyncStorage writes session keys
                 -> AuthContext state updates (user, session)
                 -> NavigationGuard automatically redirects from (auth) to (app)
```
- Session persistence is handled by `@react-native-async-storage/async-storage`.
- In-flight requests during sign-out are cancelled via request IDs in `RecordsContext`.
- No raw error strings are displayed; `utils/errors.ts` maps GoTrue responses into actionable user messages.

### 2. Create Record with Image Attachment
```
User captures/picks image -> expo-image-manipulator (resizes <= 1600px, 0.7 JPEG)
                          -> expo-file-system reads base64
                          -> base64-arraybuffer converts to ArrayBuffer
                          -> storageService.uploadRecordImage:
                             Target: record-images/{user_id}/{record_id}.jpg
                          -> IF upload succeeds:
                             recordService.createRecord:
                             INSERT INTO public.records (title, notes, category, image_path, user_id)
                          -> IF database INSERT fails:
                             storageService.deleteRecordImage (cleans up orphan image)
                          -> IF both succeed:
                             RecordsContext updates collection state
```

### 3. Read & List Records with Signed URLs
```
(app)/index mounted -> RecordsContext.loadRecords()
                    -> recordService.getRecords(filters, pagination, sort)
                    -> SELECT * FROM public.records WHERE user_id = auth.uid() ...
                    -> FlatList renders items via RecordCard
                    -> Each RecordCard checks storageService URL cache:
                       - IF cache hit and not expired: use cached signed URL
                       - IF cache miss or expired: call storage.createSignedUrl (TTL 3600s)
                       - Store fresh URL in in-memory cache with timestamp
                    -> expo-image renders image with memory-disk caching
```

### 4. Edit Record (Image Lifecycle)
Three paths exist during an update:
- **Keep Existing Image**: Only text fields and category are updated. `image_path` remains untouched.
- **Replace Image**: New image is compressed and uploaded to storage. Once the database update completes with the new path, the old image is deleted from storage, and its signed URL cache entry is invalidated.
- **Remove Image**: Database record is updated with `image_path = null`. The existing storage object is deleted, and its cache entry is purged.

### 5. Delete Record
```
User taps Delete -> ConfirmDialog confirmation prompt
                 -> recordService.deleteRecord(id)
                 -> DELETE FROM public.records WHERE id = id (RLS enforces user_id)
                 -> IF record had image_path:
                    storageService.deleteRecordImage(image_path)
                    storageService cache entry invalidated
                 -> RecordsContext removes record from local state
                 -> Screen navigates back to list view
```

### 6. Sign Out
```
User confirms Sign Out -> AuthContext.signOut()
                       -> Cancels active in-flight fetch requests in RecordsContext
                       -> Flushes signed URL in-memory cache (storageService.clearCache())
                       -> Clears RecordsContext items, counts, and filters
                       -> Calls supabase.auth.signOut() (suppresses transient network errors)
                       -> Resets user state to null
                       -> NavigationGuard replaces route with (auth)/login
```

---

## Storage & Caching Model

### Why Private Bucket?
Public buckets allow anyone with the file URL to view private user data, creating severe privacy risks. By configuring `record-images` with `public = false`, the storage layer rejects any unauthenticated or unauthorized access.

### Signed URL Caching Strategy
- **Time-To-Live (TTL)**: Signed URLs are issued with a 3600-second (1-hour) expiration.
- **In-Memory Cache**: `storageService` maintains a `Map<string, { url: string; expiresAt: number }>`.
- **Cache Hit Check**: An entry is considered valid if `Date.now() < expiresAt - 300_000` (5-minute safety threshold before actual token expiration).
- **Graceful Re-fetch**: If an expired or broken URL is encountered, the cache entry is invalidated and a fresh signed URL is fetched silently.
- **Cache Invalidation**: Whenever an image is replaced, removed, or the user signs out, cache entries are immediately pruned.

---

## Security & Row Level Security (RLS)

All database and storage operations are secured directly in PostgreSQL using Row Level Security policies.

### 1. Database Table (`public.records`)
```sql
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
```
- **SELECT**: Restricted to rows where `user_id = auth.uid()`.
- **INSERT**: Enforced `WITH CHECK (user_id = auth.uid())`. Even if a compromised client attempts to pass a foreign `user_id`, Postgres rejects the insert.
- **UPDATE**: Enforced `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`. Users cannot reassign ownership or modify rows belonging to others.
- **DELETE**: Restricted to rows where `user_id = auth.uid()`.

### 2. Storage Bucket (`storage.objects`)
Storage policies parse the first path component of the object name using `(storage.foldername(name))[1]`:
- Objects must follow the structure `{user_id}/{record_id}.jpg`.
- Policies verify that the root folder matches `auth.uid()::text`.
- Users cannot read, upload, modify, or delete objects belonging to other users' directories.

---

## Offline & Error Handling Model

### Real-Time Connectivity Awareness
- The app uses `@react-native-community/netinfo` through `NetworkContext`.
- When connectivity drops, an `OfflineBanner` is rendered at the top of active screens.
- Destructive and creation actions check `isOffline` and display a clear non-blocking notification ("Cannot perform action while offline") rather than initiating doomed network calls.

### Error Isolation and Translation
Raw error codes from network layers, PostgREST, and Supabase Auth are mapped into human-readable messages in `src/utils/errors.ts`:
- **Auth Errors**: Translated to simple guidance ("Invalid email or password", "Email already in use").
- **Network Timeouts**: Mapped to "Unable to reach server. Please check your connection."
- **Permission Denials**: Mapped to "Access denied. Please check your credentials."
- **Storage Quota / MIME Errors**: Mapped to clear image format and size advisories.
- Technical stack traces are logged via `console.warn` exclusively during `__DEV__` execution and never presented in production UI.
