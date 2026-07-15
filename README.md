<div align="center">

# World.ING

**A private gallery for your Figma exports.**

Organize your screens into designs and projects, browse them in a slider,
and find anything by title or tag — all in a clean, minimal workspace.

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_·_Storage_·_Auth-3ECF8E?logo=supabase&logoColor=white)

</div>

---

## Overview

**World.ING** is a self-hosted design organizer. You export frames from Figma
(PNG, JPG, SVG or PDF), drop them in, and they become a browsable gallery.
Each card can hold a single screen or a whole flow; group cards into projects,
tag them, and reach anything in seconds.

Everything is private: files live in a private storage bucket and are served
only through short-lived signed URLs, scoped to your account.

## Features

- **Projects → Designs → Screens.** A clear three-level hierarchy that keeps large sets of work tidy.
- **Multi-screen designs.** A design can hold many screens; open a card to browse them in a slider with arrows, keyboard navigation and a thumbnail strip.
- **Search & filters.** Instant search by title, filter by tags, and a project filter — with the gallery grouped by project.
- **Drag-and-drop upload.** Add one or several screens at once. Thumbnails are generated in the browser (canvas for images, `pdf.js` for the first page of a PDF).
- **Full editing.** Change a design's title, description, tags and project, and add, remove or reorder its screens. The first screen is the cover.
- **Settings.** Create, rename and delete projects; move a design between projects; change your password; and see a storage overview.
- **Private by design.** Row-level security on every table and per-user storage folders. Nothing is public.
- **Responsive & modern.** Built mobile-first with a restrained, minimal aesthetic.

## Tech stack

| Layer     | Choice                                             |
| --------- | -------------------------------------------------- |
| Frontend  | React 18, TypeScript, Vite                         |
| Styling   | Tailwind CSS                                        |
| Backend   | Supabase — Postgres, Storage, Auth                 |
| PDF       | pdf.js (`pdfjs-dist`), lazy-loaded on demand       |

## How it works

The data model is a simple hierarchy:

```
Project ──< Design ──< Screen (file)
```

- A **Project** groups designs (optional).
- A **Design** is a gallery card; it groups one or more screens.
- A **Screen** is a single file exported from Figma.

Files are stored in a private `designs` bucket, one folder per screen:

```
{user_id}/{design_id}/{screen_id}/original.<ext>
{user_id}/{design_id}/{screen_id}/thumb.png
```

Storage and database policies check that the first folder equals your user id,
so you can only ever reach your own files. The gallery reads the database and
requests all thumbnail signed URLs in a single batched call.

## Getting started

### Prerequisites

- **Node.js 18+**
- A free **[Supabase](https://supabase.com)** project

### 1. Get the code

Clone the repository:

```bash
git clone https://github.com/your-username/worlding.git
cd worlding
```

Or download the ZIP from the GitHub **Code → Download ZIP** button and extract it.

### 2. Set up the database

In your Supabase dashboard, open **SQL Editor → New query**, then run:

- **`db/schema.sql`** — for a fresh install (creates tables, RLS, triggers and the private storage bucket).
- **`db/migration_v1_to_v2.sql`** — only if you are upgrading from an earlier single-file-per-design version.

> **Tip:** while developing, you can disable email confirmation under
> **Authentication → Settings** so new accounts can sign in immediately.

### 3. Configure environment variables

Copy the example file and fill in your project's credentials
(**Project Settings → API**):

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open the URL shown in your terminal (default: `http://localhost:5173`),
create an account, and start adding designs.

### Build for production

```bash
npm run build     # type-check + production build into dist/
npm run preview   # preview the production build locally
```

## Project structure

```
db/
├── schema.sql                Full schema (fresh install)
└── migration_v1_to_v2.sql    Upgrade from the earlier version
src/
├── lib/
│   ├── supabase.ts           Supabase client (reads .env)
│   ├── storage.ts            Paths, uploads, signed URLs
│   ├── thumbnails.ts         Thumbnail generation (images & PDF)
│   ├── designs.ts            Create / edit / delete designs and screens
│   └── projects.ts           Create / rename / delete projects
├── types/database.ts         Types mirroring the SQL schema
├── context/AuthContext.tsx   Session + sign in / up / out
├── hooks/
│   ├── useGallery.ts         Projects + designs + screens + signed URLs
│   └── useProjectStats.ts    Projects, counts and storage totals
├── components/
│   ├── ProtectedRoute.tsx
│   ├── Wordmark.tsx
│   ├── GalleryToolbar.tsx    Search, project filter, tag chips
│   ├── DesignCard.tsx        Gallery card with cover + screen count
│   ├── UploadDialog.tsx      Multi-screen upload
│   ├── EditDesignDialog.tsx  Edit fields, project and screens
│   └── DesignViewer.tsx      Screen-by-screen slider
├── pages/
│   ├── Login.tsx
│   ├── Home.tsx              Gallery (toolbar + groups + dialogs)
│   └── Settings.tsx          Projects, designs, account, storage
├── App.tsx                   Routes
└── main.tsx                  Entry (Router + AuthProvider)
```

## Roadmap

Some directions this project could grow in:

- Drag-and-drop reordering of screens (instead of arrow buttons)
- Bulk actions in the gallery
- Display preferences (default sort, grouping) persisted per user
- Account deletion via a Supabase Edge Function

## License

Released under the [MIT License](LICENSE). Use it, fork it, make it yours.

---

<div align="center">
<sub>Built with React, Tailwind and Supabase.</sub>
</div>