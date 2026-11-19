========================================================================
TASTORY — Where Taste Meets Story
Web Programming 2026 Assignment Submission
========================================================================

Student Name : [Your Name]
Student ID   : [Your Student ID]
Reference    : #26 (My 5-Year Taste Archive)

------------------------------------------------------------------------
1. LIVE DEMO URL (Recommended for Grading)
------------------------------------------------------------------------
You can immediately test the full deployed application online without
any local setup or API key configuration:

  >> https://tastory-kappa.vercel.app/

------------------------------------------------------------------------
2. PROJECT OVERVIEW
------------------------------------------------------------------------
TASTORY ("Taste + Story") is a location-based 5-year cultural timeline
SNS where users curate their favorite movies, TV series, anime, music,
books, and video games from 2021 to 2025 into a 5x4 visual board and
share their stories with a global community.

Key Features:
- Global Feed (/): Browse taste stories by city, search by keyword,
  sort by Latest or Most Liked, and filter by closest region using
  the "Near Me" Haversine distance button.
- Social Interactions: Like stories, write/delete real-time comments,
  and Remix any board into your own studio (remix count increments
  only when the remixed story is actually published).
- TASTORY Studio (/archive): Search 4 external Open APIs (with a
  year-by-category Top 5 Chart and quick X clear button), upload and
  crop custom images via HTML5 Canvas, reorder slots via drag-and-drop
  or tap-to-swap, customize 12 background presets with automatic YIQ
  text contrast, and export 1080p PNG cards (4:5, 9:16, 1:1).
- Guest Curator Access & Profile (/profile): Instant guest access with
  editable display name (HMAC-SHA256 signed session cookie), story
  management (edit/delete), and liked stories view.

------------------------------------------------------------------------
3. TECH STACK & INTEGRATIONS
------------------------------------------------------------------------
- Framework      : Next.js 16 (App Router, React 19, TypeScript)
- Styling        : Tailwind CSS v4 (Custom Light-Olive Theme & SVG Logo)
- Database       : Supabase (PostgreSQL) with Prisma ORM
- Deployment     : Vercel (Frontend + Serverless API Routes)
- Canvas         : HTML5 Canvas 2D (ImageCropModal) & DOM-to-Canvas PNG
                   Export (html-to-image + /api/proxy CORS bypass)
- Open APIs      : TMDB (Media), iTunes Search (Music), Kakao Books &
                   Open Library (Books), RAWG (Games), BigDataCloud &
                   OpenStreetMap Nominatim (Reverse Geocoding)

------------------------------------------------------------------------
4. DIRECTORY STRUCTURE
------------------------------------------------------------------------
├── prisma/
│   └── schema.prisma         # PostgreSQL schema (User, Post, ArchiveItem, Like, Comment)
├── public/
│   └── seed-images/          # Local cover assets for initial community posts
├── data/
│   ├── games.json            # Korean-to-English game title dictionary
│   └── mockFallback.ts       # Fallback demo search data
├── src/
│   ├── app/
│   │   ├── page.tsx          # Global Feed & Near Me location filter
│   │   ├── archive/page.tsx  # TASTORY Studio (5x4 board builder)
│   │   ├── post/[id]/page.tsx# Story detail view & comment thread
│   │   ├── profile/page.tsx  # Guest Curator profile & liked stories
│   │   └── api/              # Next.js Server API routes (posts, search, geocode, proxy)
│   ├── components/           # UI components (ArchiveBoard, SearchModal, ImageCropModal, etc.)
│   ├── lib/                  # Utilities (canvasExport, colorUtils, auth, prisma, seed)
│   └── types/                # TypeScript definitions & theme/font/city presets
└── package.json

------------------------------------------------------------------------
5. HOW TO RUN LOCALLY
------------------------------------------------------------------------
Prerequisites: Node.js (v20 or higher) and npm installed.

* Note for Grading: For convenience, the `.env` file containing the
  configured database and Open API keys is already included in this
  submission zip package (excluded from the public GitHub repository
  for security). No manual API key registration is required.

1) Install dependencies:
   $ npm install

2) Generate Prisma Client & start the development server:
   $ npx prisma generate
   $ npm run dev

3) Open http://localhost:3000 in your browser.

   (If running from a clone without `.env`, create a `.env` file with
    DATABASE_URL, DIRECT_URL, TMDB_ACCESS_TOKEN, KAKAO_REST_API_KEY,
    RAWG_API_KEY, and SESSION_SECRET.)

------------------------------------------------------------------------
6. QUICK TESTING GUIDE FOR GRADING
------------------------------------------------------------------------
1. Visit https://tastory-kappa.vercel.app/
2. Click "Start as Guest" in the top-right corner (no sign-up needed).
3. On the Feed, click "Near Me" to test Geolocation + Haversine nearest
   city filtering, and test liking/commenting on any story.
4. Click "Studio" (or "Create My Story"), click any year slot, and try
   the Top 5 Chart quick search or Custom Image Upload (Canvas Cropper).
5. Click "Export PNG" to download a 1080p story card, or "Publish" to
   post your story to the live Feed.
========================================================================
