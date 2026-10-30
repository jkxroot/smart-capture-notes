# Limitations & Future Roadmap

This document outlines the architectural trade-offs, deliberate constraints, and known limitations in Smart Capture, along with an engineering roadmap of what would be built given additional time.

---

## Current Limitations & Trade-Offs

### 1. Offline Sync Scope
- **Current State**: Create / edit / delete can be queued in SQLite (`outbox`) while offline and flushed when connectivity returns. Pin toggles and share still require an active connection. Cached list rows are stored locally for offline browsing.
- **Trade-Off Reason**: Full CRDT / multi-device conflict resolution was out of scope; FIFO outbox with last-write-wins is sufficient for a single-device internship evaluation build.

### 2. Multi-Image Caps
- **Current State**: Up to 5 images per record (`image_paths` text array + legacy `image_path` primary).
- **Trade-Off Reason**: Caps upload time and storage on free-tier projects while covering the assignment bonus.

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

### 7. Search Implementation
- **Current State**: Prefers Postgres full-text search on generated `search_tsv` (`websearch`), with escaped ILIKE fallback if the FTS column is unavailable.
- **Trade-Off Reason**: FTS covers stemming for English notes; ILIKE remains as a compatibility path for older databases.

---

## Engineering Roadmap (With 2 Additional Weeks)

If allocated two additional development weeks, the following enhancements would be prioritized:

### 1. Stronger Conflict Resolution for Offline Sync
- Replace FIFO last-write-wins with device clocks + server `updated_at` merge rules (or PowerSync/WatermelonDB) for multi-device edits of the same note.

### 2. Automated OCR for Receipts and Documents
- Integrate a cloud function or on-device text recognition library (such as ML Kit or Google Cloud Vision API) to extract text and dates automatically from captured receipt images.
- Populate extracted text directly into the notes field or dedicated metadata columns.

### 3. Tagging System & Multi-Select Operations
- Create a normalized `tags` and `record_tags` table structure.
- Add multi-tag filtering on the home screen alongside primary categories.
- Introduce bulk selection mode in the list view for batch deletion, bulk categorization, and batch export.
