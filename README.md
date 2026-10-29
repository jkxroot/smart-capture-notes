# Smart Capture

A mobile notes and media capture application built with React Native, Expo, and Supabase.

Demo video: [Walkthrough Video (YouTube / Loom)](#)

---

## Screenshots

The application follows a content-first, distraction-free visual design system with warm terracotta accents and light/dark theme support.

| Home & List | Note Details | Add Note |
|:---:|:---:|:---:|
| ![Home Screen](docs/screenshots/01-home.png) | ![Record Detail](docs/screenshots/02-detail.png) | ![Add Record](docs/screenshots/03-add.png) |

| Edit Note | Category Analytics | Account & Settings |
|:---:|:---:|:---:|
| ![Edit Record](docs/screenshots/04-edit.png) | ![Dashboard](docs/screenshots/05-dashboard.png) | ![Settings](docs/screenshots/06-settings.png) |

---

## Tech Stack

| Technology | Version | Purpose | Why Chosen Over Alternatives |
|---|---|---|---|
| Expo | ~58.0.21 | Managed React Native development platform | Provides unified tooling and cross-platform native capabilities without native Xcode/Android Studio overhead. |
| React Native | 0.88.1 | Mobile application runtime | Renders native platform primitives for optimal performance. |
| TypeScript | ~6.0.3 | Language and static typing | Enforces strict compiler safety and domain modeling across contexts and services. |
| expo-router | ~58.0.28 | File-based navigation and route guards | Replaces imperative navigation boilerplate with predictable directory-based routing, deep links, and type-safe parameters. |
| @supabase/supabase-js | ^2.118.0 | Auth, Postgres database, and private object storage | Provides an integrated Postgres backend with Row Level Security (RLS) instead of managing separate database, auth, and storage services. Chosen over Firebase for relational querying, SQL schema enforcement, and standard Postgres RLS. |
| @react-native-async-storage/async-storage | 2.2.0 | Session persistence engine | Native storage adapter passed to Supabase client (`persistSession: true`, `autoRefreshToken: true`) for persistence across application terminations. |
| expo-image-picker | ~58.0.10 | Camera capture and photo library access | Standardized permission handling and asset selection on iOS and Android. |
| expo-image-manipulator | ~58.0.16 | Client-side image compression and resizing | Constrains uploads to 1600px width and 0.7 JPEG compression prior to upload, keeping files well below 1MB. |
| expo-file-system & base64-arraybuffer | ~58.0.13 / ^1.0.2 | Binary file reading and conversion | React Native's `FormData` and `Blob` APIs exhibit known upload corruption across OS versions. Reading base64 and converting to `ArrayBuffer` guarantees deterministic binary uploads to Supabase Storage. |
| expo-image | ~58.0.18 | Performant image rendering | Built-in memory and disk caching with crossfade transitions, avoiding layout flicker. |
| expo-sharing | ~58.0.21 | Native share sheet integration | Invokes platform-native share dialogs for media and plain-text summaries without third-party native libraries. |
| @react-native-community/netinfo | 12.0.1 | Network state monitoring | Real-time connectivity awareness driving inline banners and preventing orphaned network requests. |

---

## Quick Start (Under 5 Minutes)

### 1. Prerequisites
- Node.js 18+ (tested on Node 22 and 24)
- npm or pnpm
- Expo Go application installed on your iOS or Android device (or an emulator running)
- A Supabase account and project

### 2. Clone and Install Dependencies
```bash
git clone <repository-url> smart-capture
cd smart-capture
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Populate `.env` with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_key_here
```
*(Both legacy JWT anon keys and modern `sb_publishable_...` keys are fully supported).*

### 4. Apply Database Schema
Execute the SQL in the **Supabase Setup** section below inside your Supabase Project SQL Editor.

### 5. Run the Application
```bash
npx expo start -c
```
Scan the displayed QR code with Expo Go (Android) or the native Camera app (iOS).

---

## Supabase Setup

Run the following SQL script directly in the **SQL Editor** of your Supabase dashboard. It sets up the table schema, indexes, timestamp trigger, Row Level Security (RLS) policies, and the private storage bucket with folder isolation.

```sql
-- 1. Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create records table
CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  notes TEXT CHECK (char_length(notes) <= 2000),
  category TEXT NOT NULL CHECK (category IN ('Personal', 'Work', 'Ideas', 'Receipts', 'Travel', 'Other')),
  image_path TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Ensure columns and indexes exist
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_records_user_created ON public.records (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_user_pinned ON public.records (user_id, is_pinned DESC, created_at DESC);

-- 4. Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_records_updated_at ON public.records;
CREATE TRIGGER set_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable Table RLS
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own records" ON public.records;
DROP POLICY IF EXISTS "Users can insert own records" ON public.records;
DROP POLICY IF EXISTS "Users can update own records" ON public.records;
DROP POLICY IF EXISTS "Users can delete own records" ON public.records;

CREATE POLICY "Users can select own records"
  ON public.records FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own records"
  ON public.records FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own records"
  ON public.records FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own records"
  ON public.records FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 6. Configure Private Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'record-images',
  'record-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 7. Storage Bucket RLS Policies (Folder isolation: {user_id}/{record_id}.jpg)
DROP POLICY IF EXISTS "Users can upload their own record images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own record images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own record images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own record images" ON storage.objects;

CREATE POLICY "Users can upload their own record images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own record images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own record images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own record images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'record-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

> Note: In the Supabase Dashboard under **Authentication > Email Auth**, disable "Confirm email" for immediate sign-in during local evaluation.

---

## Project Structure

```
smart-capture/
├── app/                           # Expo Router file-based route definitions
│   ├── _layout.tsx                # Font loading, splash orchestration, global auth navigation guard
│   ├── (auth)/                    # Unauthenticated route group
│   │   ├── _layout.tsx            # Simple headerless stack
│   │   ├── login.tsx              # Email/password authentication form
│   │   └── signup.tsx             # New account registration form
│   └── (app)/                     # Protected route group (requires active session)
│       ├── _layout.tsx            # Header configuration, RecordsProvider, tabs
│       ├── index.tsx              # Note list, search, category chips, sort menu, FAB
│       ├── add.tsx                # Note creation form with photo capture sheet
│       ├── record/
│       │   └── [id].tsx           # Record detail view, fullscreen image, pin, share, delete
│       ├── edit/
│       │   └── [id].tsx           # Record update form with image replacement/removal
│       ├── dashboard.tsx          # Category metrics and distribution bars
│       └── settings.tsx           # Account email display, network info, sign out
├── src/
│   ├── components/                # Reusable design system primitives
│   │   ├── ActionSheet.tsx        # Bottom modal action selector
│   │   ├── Button.tsx             # Primary, secondary, outline, danger button variants
│   │   ├── Card.tsx               # Hairline-bordered surface container
│   │   ├── Chip.tsx               # Category filter pill with selected accent state
│   │   ├── ConfirmDialog.tsx      # Modal alert for destructive actions
│   │   ├── EmptyState.tsx         # Graphic empty placeholders for lists and search
│   │   ├── IconButton.tsx         # Accessible touch target icon button (min 44x44)
│   │   ├── ImageViewer.tsx        # Fullscreen zoomable image viewer modal
│   │   ├── Input.tsx              # Labeled text field with inline error and character counter
│   │   ├── OfflineBanner.tsx      # Network status warning banner
│   │   ├── RecordCard.tsx         # List item card with thumbnail, pin toggle, and metadata
│   │   ├── Screen.tsx             # Safe area, keyboard avoidance, and max-width layout wrapper
│   │   ├── Skeleton.tsx           # Pulse-animated loading placeholder
│   │   └── SortMenu.tsx           # Bottom sheet sort order selector
│   ├── context/                   # Shared React application state
│   │   ├── AuthContext.tsx        # Supabase auth session, profile, signout cleanup
│   │   ├── NetworkContext.tsx     # Real-time online/offline monitoring
│   │   ├── RecordsContext.tsx     # Record collections, pagination, search, optimistic pin, rollback
│   │   ├── ThemeContext.tsx       # System theme detection, color tokens, typography
│   │   └── ToastContext.tsx       # Transient non-blocking notifications
│   ├── lib/
│   │   └── supabase.ts            # Configured Supabase client with AsyncStorage integration
│   ├── services/                  # Stateless business logic and API callers
│   │   ├── authService.ts         # Supabase Auth SDK wrappers
│   │   ├── imageService.ts        # Image picker invocation and client-side compression
│   │   ├── recordService.ts       # Database CRUD queries, ilike search, and category counts
│   │   ├── shareService.ts        # expo-sharing file export logic
│   │   └── storageService.ts      # Binary upload, signed URL caching, and file deletion
│   ├── theme/                     # Design tokens
│   │   ├── colors.ts              # Warm terracotta palette (light and dark)
│   │   ├── spacing.ts             # Spacing scale and border radius definitions
│   │   └── typography.ts          # Inter font configurations and text hierarchy
│   ├── types/                     # TypeScript definitions
│   │   └── record.ts              # RecordItem model, categories, sort options
│   └── utils/                     # Pure helper functions
│       ├── errors.ts              # Error categorization and human-readable message mapping
│       ├── escape.ts              # PostgREST ilike pattern escaping (%, _, \, commas)
│       ├── formatDate.ts          # Localized relative and full date formatting
│       └── haptics.ts             # Tactile feedback helpers
├── supabase/
│   └── schema.sql                 # Canonical database and storage migration
├── docs/                          # Architecture, testing, and limitation documentation
│   ├── ARCHITECTURE.md            # Data flow diagrams, storage, and security model
│   ├── LIMITATIONS.md             # Trade-offs, current constraints, and roadmap
│   └── TESTING.md                 # Manual verification checklist and verification steps
├── app.json                       # Expo configuration
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # Strict TypeScript configuration
```

---

## Architectural Decisions

### 1. Private Storage with Signed URLs
All user images reside in a strictly private Supabase bucket (`record-images`). Direct public URLs do not exist. Access requires short-lived signed URLs (1-hour time-to-live). To eliminate repetitive network requests while browsing lists, signed URLs are cached in-memory with expiration timestamps. If a signed URL expires, the service silently fetches a fresh URL. Objects are partitioned by user ID (`{user_id}/{record_id}.jpg`), enforced at the storage engine level by Postgres RLS policies.

### 2. Session Persistence and Zero-Flicker Navigation Guard
Authentication uses `@react-native-async-storage/async-storage` plugged into the Supabase client. When the app boots, `app/_layout.tsx` blocks navigation until both the custom Inter font family loads and the initial session status resolves. The `NavigationGuard` component automatically synchronizes route states: unauthenticated users cannot enter `(app)` screens, and authenticated users cannot revisit `(auth)` screens. During sign-out, in-flight requests are cancelled, storage caches and context records are flushed, and navigation transitions cleanly to the login screen without surfacing spurious network or 401 errors.

### 3. Client-Side Image Pre-Processing
Mobile camera sensors produce uncompressed images between 5MB and 15MB. Uploading raw files over mobile connections wastes bandwidth and increases latency. Prior to binary conversion, images are processed on-device with `expo-image-manipulator`, constraining dimensions to a maximum width of 1600px with 70% JPEG quality. This consistently outputs files under 800KB with negligible visual degradation on mobile screens.

### 4. Deterministic Binary Uploads
React Native implementations of `FormData` and `Blob` are historically erratic across Android and iOS versions. The app reads the compressed local file into base64 via `expo-file-system`, converts it into an `ArrayBuffer` using `base64-arraybuffer`, and sends the raw buffer to Supabase Storage with explicit MIME types. If the subsequent database record insertion fails, the uploaded storage object is deleted immediately to prevent storage orphans.

### 5. Defensive Search Pattern Escaping
PostgREST interprets commas `,`, percent signs `%`, underscores `_`, and backslashes `\` as filter grammar operators. Entering these characters in a standard search input can trigger SQL syntax errors from PostgREST. The application filters queries through `escapeIlikePattern()`, which escapes PostgREST wildcards and removes comma separators before passing parameters to `.or()`.

---

## Known Limitations

- **Network Dependency**: Mutations require an active internet connection. The app provides real-time offline banners and disables mutation actions with clear messages, but does not yet maintain a durable local SQLite synchronization queue.
- **Single Attachment**: Records support one attached image. Multi-image galleries are not implemented.
- **Lossy Compression**: Source photos are compressed to JPEG; RAW and HEIC metadata are not retained.

For a detailed review of constraints and future roadmap plans, see [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

---

## Verification and Testing

To verify TypeScript and application compilation:
```bash
# Verify static types
npx tsc --noEmit

# Check unused parameters and imports
npx tsc --noEmit --noUnusedLocals --noUnusedParameters

# Verify production bundle export
npx expo export --output-dir temp_export
```

For the comprehensive manual test plan covering authentication, CRUD, image manipulation, search edge cases, and offline behavior, refer to [docs/TESTING.md](docs/TESTING.md).

---

## License

MIT License. Designed and engineered for evaluation.
