# Limitations & Future Roadmap

This document outlines the architectural trade-offs, deliberate constraints, and known limitations in Smart Capture, along with an engineering roadmap of what would be built given additional time.

---

## Current Limitations & Trade-Offs

### 1. Network Dependency for Mutations
- **Current State**: The application requires an active internet connection to create, edit, or delete notes. Record caching and signed-URL caching are in-memory for the active session. If a user loses connectivity, the app displays an offline banner and prevents mutations rather than queuing them locally.
- **Trade-Off Reason**: Implementing a resilient two-way synchronization engine with conflict resolution (e.g., last-write-wins vs. operational transforms) adds substantial architectural surface area and dependencies. For the scope of this project, ensuring rock-solid online reliability and clean error boundaries was prioritized over a partial or fragile offline sync queue.

### 2. Single Image Attachment per Record
- **Current State**: Each record supports exactly zero or one attached image.
- **Trade-Off Reason**: A 1:1 relationship between records and storage files simplifies cleanup lifecycles, orphaned asset rollback, and database schema constraints. Supporting multiple images would require a separate `record_images` join table, gallery carousel components, multi-file upload progress tracking, and batch signed URL resolution.

### 3. Media Types Restricted to Static Images
- **Current State**: Only JPEG, PNG, and WebP images are supported. Audio memos, video attachments, and PDF uploads are excluded.
- **Trade-Off Reason**: Supporting video and audio entails streaming protocols, chunked background uploads, media player integration, and significantly higher storage consumption.

### 4. Supabase Free Tier Inactivity Pause
- **Current State**: Supabase free-tier projects automatically pause after 7 consecutive days of inactivity. Re-enabling takes 1-2 minutes from the Supabase web dashboard.
- **Trade-Off Reason**: An expected operational characteristic of the free hosted Postgres service. For enterprise deployment, a paid plan or self-hosted Supabase instance prevents dormancy.

### 5. Email Confirmation Disabled for Evaluation
- **Current State**: Email confirmation is disabled in Supabase Auth configuration to allow immediate evaluation and sign-in.
- **Trade-Off Reason**: Enabling mandatory email confirmation in Expo Go requires setting up custom URL schemes, associated domains, and deep-link verification handlers in `app/_layout.tsx`. In production, email confirmation must be enabled with universal links.

### 6. Lossy JPEG Compression
- **Current State**: Images captured from the camera or gallery are compressed to JPEG at 0.7 quality and resized to a maximum width of 1600 pixels.
- **Trade-Off Reason**: Mobile camera sensors frequently produce 12MB+ files. Resizing and re-encoding minimizes bandwidth consumption and ensures uploads succeed on weak mobile connections, but strips EXIF metadata, HDR color spaces, and RAW camera formats.

### 7. Search Implementation (PostgREST ILIKE)
- **Current State**: Search queries execute via PostgREST `or(title.ilike.*,notes.ilike.*)`.
- **Trade-Off Reason**: Simple substring matching is fast and sufficient for moderate datasets (hundreds of records per user). It does not include stemming (e.g., searching "running" matching "run"), phonetic search, or weighted relevance ranking, which would require Postgres `tsvector` generated columns and GIN indexes.

---

## Engineering Roadmap (With 2 Additional Weeks)

If allocated two additional development weeks, the following enhancements would be prioritized:

### 1. Local-First SQLite Synchronization Queue
- Integrate a local SQLite layer using WatermelonDB or PowerSync.
- Mutations would write immediately to local SQLite and enter a persistent outbox queue.
- A background worker would flush the outbox when connectivity returns, providing full offline creation and offline editing.

### 2. Automated OCR for Receipts and Documents
- Integrate a cloud function or on-device text recognition library (such as ML Kit or Google Cloud Vision API) to extract text and dates automatically from captured receipt images.
- Populate extracted text directly into the notes field or dedicated metadata columns.

### 3. Full-Text Search with Postgres TSVECTOR
- Add a generated `search_tsv` column to `public.records` combining `title` and `notes` with English stemming.
- Add a GIN index on `search_tsv` and update `recordService.ts` to utilize Postgres full-text search operators (`textSearch()`).

### 4. Tagging System & Multi-Select Operations
- Create a normalized `tags` and `record_tags` table structure.
- Add multi-tag filtering on the home screen alongside primary categories.
- Introduce bulk selection mode in the list view for batch deletion, bulk categorization, and batch export.
