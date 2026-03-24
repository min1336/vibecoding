# VibeCoding Gallery v2 — Experience Gallery Rebuild Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** VibeCoding Gallery를 Dribbble급 비주얼 + 프로그레시브 프리뷰 + 커뮤니티 기능(좋아요/댓글/태그)을 갖춘 플랫폼으로 전면 리빌딩

**Architecture:** Next.js 15 App Router + Supabase (Auth, DB, Storage) + Tailwind CSS v4. 기존 인프라(auth, supabase clients, preview-extractor, middleware) 위에 UI 전면 재작성 + DB 스키마 확장 + 새 API routes 추가. CSS columns masonry, iframe sandbox preview, denormalized counts with triggers.

**Tech Stack:** Next.js 15.3, React 19, Supabase, Tailwind CSS v4, TypeScript, Vitest (new), Playwright (new)

**Design Doc:** `~/.gstack/projects/min1336-vibecoding/teamo2-main-design-20260324-095249.md`
**Test Plan:** `~/.gstack/projects/min1336-vibecoding/teamo2-main-test-plan-20260324-101200.md`

---

## File Structure

### New Files
- `supabase/migrations/001_v2_schema.sql` — DB migration (tables, RLS, triggers, indexes)
- `DESIGN.md` — Design system tokens
- `lib/types.ts` — Extended type definitions (modify)
- `lib/constants.ts` — Extended constants (modify)
- `app/page.tsx` — Gallery home (rebuild)
- `app/project/[id]/page.tsx` — Project detail (rebuild)
- `app/project/[id]/like-button.tsx` — Like toggle (new)
- `app/project/[id]/comment-section.tsx` — Comment list + form (new)
- `app/project/[id]/project-sidebar.tsx` — Detail sidebar (new)
- `app/profile/[id]/page.tsx` — Profile page (new)
- `app/api/likes/route.ts` — Like toggle API (new)
- `app/api/comments/route.ts` — Comment list + create API (new)
- `app/api/comments/[id]/route.ts` — Comment delete API (new)
- `app/api/views/route.ts` — View increment API (new)
- `app/api/upload/route.ts` — Upload API (modify: tags, category)
- `components/gallery/project-card.tsx` — Card (rebuild)
- `components/gallery/project-grid.tsx` — Grid (rebuild)
- `components/gallery/gallery-filters.tsx` — Filter bar (new)
- `components/gallery/search-bar.tsx` — Search input (new)
- `components/upload/upload-form.tsx` — Upload form (rebuild)
- `components/upload/tag-input.tsx` — Tag input (new)
- `components/layout/header.tsx` — Header (rebuild)

### Kept Unchanged
- `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/supabase/client.ts`
- `lib/preview-extractor.ts`
- `middleware.ts`
- `app/auth/callback/route.ts`, `app/auth/signout/route.ts`
- `app/api/download/[id]/route.ts`
- `components/preview/iframe-preview.tsx`
- `components/auth/auth-button.tsx`

---

## Chunk 1: Foundation — DB Migration + Types + Constants

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/001_v2_schema.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- ============================================
-- VibeCoding Gallery v2 Schema Migration
-- ============================================

-- 1. New tables
CREATE TABLE likes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (char_length(name) <= 30 AND name = lower(trim(name)))
);

CREATE TABLE project_tags (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

-- 2. Extend existing tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IS NULL OR category IN ('Game','Dashboard','Landing Page','Portfolio','E-commerce','Utility','Other'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 300);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- 3. RLS policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_read" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON comments FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_read" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_tags_read" ON project_tags FOR SELECT USING (true);
CREATE POLICY "project_tags_insert" ON project_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "project_tags_delete" ON project_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()));

-- 4. Triggers
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET likes_count = likes_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET likes_count = likes_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 5. RPC
CREATE OR REPLACE FUNCTION increment_view(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects SET views_count = views_count + 1 WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Indexes
CREATE INDEX idx_comments_project ON comments (project_id, created_at);
CREATE INDEX idx_projects_popular ON projects (created_at DESC, likes_count DESC);
CREATE INDEX idx_projects_category ON projects (category) WHERE category IS NOT NULL;
CREATE INDEX idx_project_tags_tag ON project_tags (tag_id);
```

- [ ] **Step 2: Apply migration via Supabase MCP or SQL editor**

Run the migration against the Supabase project. Verify all tables, policies, triggers, and indexes are created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/001_v2_schema.sql
git commit -m "feat: add v2 schema - likes, comments, tags, triggers, RLS"
```

---

### Task 2: Extend Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Update type definitions**

```typescript
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
  social_links: Record<string, string>;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  screenshot_url: string;
  file_url: string;
  preview_url: string | null;
  tool_used: string | null;
  category: string | null;
  views_count: number;
  likes_count: number;
  user_id: string;
  created_at: string;
  profiles?: Profile;
  tags?: Tag[];
  user_has_liked?: boolean;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  user_id: string;
  project_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: extend types for v2 - Comment, Tag, extended Project/Profile"
```

---

### Task 3: Extend Constants

**Files:**
- Modify: `lib/constants.ts`

- [ ] **Step 1: Add categories, tag limits**

Add after the existing `TOOLS` array:

```typescript
export const CATEGORIES = [
  "Game",
  "Dashboard",
  "Landing Page",
  "Portfolio",
  "E-commerce",
  "Utility",
  "Other",
] as const;

export type CategoryType = (typeof CATEGORIES)[number];

export const MAX_TAGS_PER_PROJECT = 5;
export const MAX_TAG_LENGTH = 30;
export const MAX_COMMENT_LENGTH = 1000;
export const COMMENT_RATE_LIMIT = 10; // per minute per user
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add categories, tag limits, comment rate limit constants"
```

---

## Chunk 2: Design System + Core Layout

### Task 4: Create DESIGN.md

**Files:**
- Create: `DESIGN.md`

- [ ] **Step 1: Write design system**

```markdown
# VibeCoding Gallery Design System

## Colors
- **Background:** zinc-950 (body), zinc-900 (cards/surfaces), zinc-800 (borders)
- **Text:** zinc-100 (primary), zinc-300 (secondary), zinc-400 (tertiary), zinc-600 (muted)
- **Accent:** violet-600 (primary), violet-500 (hover)
- **Error:** red-400 (text), red-500/10 (bg)
- **Success:** emerald-400 (text), emerald-500/10 (bg)

## Typography (Geist + Geist Mono)
- H1: text-3xl font-bold (gallery), text-2xl font-bold (sub-pages)
- H2: text-xl font-semibold
- Body: text-sm / text-base
- Caption: text-xs
- Mono: font-mono for code/technical

## Spacing
- Container: max-w-7xl px-4 sm:px-6 lg:px-8
- Section: py-8
- Card gap: gap-4 (masonry column-gap)
- Card padding: p-4
- Component spacing: space-y-6

## Border Radius
- Cards/previews: rounded-xl
- Buttons/inputs: rounded-lg
- Avatars/badges: rounded-full

## Shadows
- Card hover: shadow-lg shadow-violet-500/5

## Animation Tokens
- Hover transitions: 300ms ease-out (scale, shadow)
- Button state: 150ms ease
- Content reveal: 200ms ease-in-out
- Skeleton: animate-pulse (Tailwind default)
- Like toggle: 300ms cubic-bezier(0.4, 0, 0.2, 1)

## Breakpoints (Tailwind defaults)
- sm: 640px (2-col grid)
- md: 768px (mobile iframe threshold)
- lg: 1024px (3-col grid, sidebar visible)
- xl: 1280px
- 2xl: 1536px (4-col grid)

## Interaction States
Every component must define: Loading, Empty, Error, Success states.
See design doc "Interaction States" section for per-screen specifications.
```

- [ ] **Step 2: Commit**

```bash
git add DESIGN.md
git commit -m "feat: add design system tokens (colors, typography, spacing, animations)"
```

---

### Task 5: Rebuild Header

**Files:**
- Modify: `components/layout/header.tsx`

- [ ] **Step 1: Rebuild header with nav tabs + mobile upload**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const AuthButton = dynamic(
  () => import("@/components/auth/auth-button").then((m) => m.AuthButton),
  { ssr: false, loading: () => <div className="h-9 w-20 bg-zinc-800 animate-pulse rounded-lg" /> }
);

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            <span className="text-violet-500">V</span>ibeCoding
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="text-sm px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors duration-150"
            >
              + Upload
            </Link>
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}
```

Key changes: removed emoji logo, replaced with text wordmark. Upload button now visible on all screen sizes. Clean typography.

- [ ] **Step 2: Commit**

```bash
git add components/layout/header.tsx
git commit -m "feat: rebuild header - text wordmark, visible upload on all screens"
```

---

## Chunk 3: API Routes

### Task 6: Like Toggle API

**Files:**
- Create: `app/api/likes/route.ts`

- [ ] **Step 1: Implement like toggle**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { project_id } = await request.json();
  if (!project_id) {
    return NextResponse.json({ error: "project_id가 필요합니다" }, { status: 400 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("project_id", project_id)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", project_id);

    if (error) {
      return NextResponse.json({ error: "좋아요 취소 실패" }, { status: 500 });
    }
    return NextResponse.json({ liked: false });
  } else {
    // Like
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: user.id, project_id });

    if (error) {
      return NextResponse.json({ error: "좋아요 실패" }, { status: 500 });
    }
    return NextResponse.json({ liked: true });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/likes/route.ts
git commit -m "feat: add like toggle API with auth check"
```

---

### Task 7: Comments API

**Files:**
- Create: `app/api/comments/route.ts`
- Create: `app/api/comments/[id]/route.ts`

- [ ] **Step 1: Implement comment list + create**

```typescript
// app/api/comments/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { MAX_COMMENT_LENGTH, COMMENT_RATE_LIMIT } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json({ error: "project_id가 필요합니다" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "댓글 조회 실패" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { project_id, content } = await request.json();

  if (!project_id || !content?.trim()) {
    return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 });
  }

  if (content.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `댓글은 ${MAX_COMMENT_LENGTH}자 이내로 입력해주세요` }, { status: 400 });
  }

  // Rate limit check
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneMinuteAgo);

  if ((count ?? 0) >= COMMENT_RATE_LIMIT) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요" }, { status: 429 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: user.id, project_id, content: content.trim() })
    .select("*, profiles(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: "댓글 작성 실패" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Implement comment delete**

```typescript
// app/api/comments/[id]/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "댓글 삭제 실패" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/comments/route.ts app/api/comments/[id]/route.ts
git commit -m "feat: add comments API - list, create with rate limit, delete"
```

---

### Task 8: Views API

**Files:**
- Create: `app/api/views/route.ts`

- [ ] **Step 1: Implement view increment**

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { project_id } = await request.json();
  if (!project_id) {
    return NextResponse.json({ error: "project_id가 필요합니다" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_view", { p_project_id: project_id });

  if (error) {
    // Silent fail — view count is non-critical
    console.error("View increment failed:", error);
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/views/route.ts
git commit -m "feat: add views increment API"
```

---

### Task 9: Extend Upload API

**Files:**
- Modify: `app/api/upload/route.ts`

- [ ] **Step 1: Add tags and category to upload**

After the existing DB insert (line ~109), add tag processing. Before the insert, add category validation. Key changes:

1. Add `category` to the form data parsing and validation
2. Add `tags` (JSON string) parsing with max 5 tags validation
3. After project insert, upsert tags and create project_tags junctions

Add after `const toolUsed = ...`:
```typescript
const category = (formData.get("category") as string) || null;
const tagsRaw = formData.get("tags") as string;
const tagNames: string[] = tagsRaw ? JSON.parse(tagsRaw) : [];

// Validate
if (category && !CATEGORIES.includes(category as CategoryType)) {
  return NextResponse.json({ error: "유효하지 않은 카테고리입니다" }, { status: 400 });
}
if (tagNames.length > MAX_TAGS_PER_PROJECT) {
  return NextResponse.json({ error: `태그는 ${MAX_TAGS_PER_PROJECT}개까지 가능합니다` }, { status: 400 });
}
```

Add `category` to the DB insert object. After the insert, process tags:
```typescript
// Tag upsert
for (const tagName of tagNames) {
  const normalized = tagName.toLowerCase().trim();
  if (!normalized || normalized.length > MAX_TAG_LENGTH) continue;

  // Upsert tag
  const { data: tag } = await supabase
    .from("tags")
    .upsert({ name: normalized }, { onConflict: "name" })
    .select("id")
    .single();

  if (tag) {
    await supabase
      .from("project_tags")
      .insert({ project_id: projectId, tag_id: tag.id });
  }
}
```

- [ ] **Step 2: Add imports for new constants**

Add to import: `CATEGORIES, CategoryType, MAX_TAGS_PER_PROJECT, MAX_TAG_LENGTH`

- [ ] **Step 3: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat: extend upload API with tags and category support"
```

---

## Chunk 4: Gallery Home

### Task 10: Gallery Filters Component

**Files:**
- Create: `components/gallery/gallery-filters.tsx`

- [ ] **Step 1: Build filter bar**

```tsx
"use client";

import { TOOLS, CATEGORIES } from "@/lib/constants";

interface GalleryFiltersProps {
  selectedTool: string | null;
  selectedCategory: string | null;
  onToolChange: (tool: string | null) => void;
  onCategoryChange: (category: string | null) => void;
}

export function GalleryFilters({
  selectedTool, selectedCategory, onToolChange, onCategoryChange,
}: GalleryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Tool filters */}
      {TOOLS.map((tool) => (
        <button
          key={tool}
          onClick={() => onToolChange(selectedTool === tool ? null : tool)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150
            ${selectedTool === tool
              ? "bg-violet-600 text-white border border-violet-600"
              : "bg-transparent text-zinc-400 border border-zinc-700 hover:border-zinc-500"}`}
        >
          {tool}
        </button>
      ))}
      <span className="w-px h-6 bg-zinc-700 self-center mx-1" />
      {/* Category filters */}
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150
            ${selectedCategory === cat
              ? "bg-violet-600 text-white border border-violet-600"
              : "bg-transparent text-zinc-400 border border-zinc-700 hover:border-zinc-500"}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/gallery/gallery-filters.tsx
git commit -m "feat: add gallery filter bar for tools and categories"
```

---

### Task 11: Search Bar Component

**Files:**
- Create: `components/gallery/search-bar.tsx`

- [ ] **Step 1: Build search input with debounce**

```tsx
"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search projects..."
      className="w-full sm:w-64 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors duration-150"
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/gallery/search-bar.tsx
git commit -m "feat: add search bar with 300ms debounce"
```

---

### Task 12: Rebuild Project Card

**Files:**
- Modify: `components/gallery/project-card.tsx`

- [ ] **Step 1: Rebuild card with likes/comments count**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const profile = project.profiles;

  return (
    <Link href={`/project/${project.id}`} className="group block break-inside-avoid mb-4">
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-zinc-600 hover:shadow-lg hover:shadow-violet-500/5">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={project.screenshot_url}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-zinc-100 truncate">{project.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full" />
            )}
            <span className="text-xs text-zinc-400 truncate max-w-[120px]">
              {profile?.display_name || "Anonymous"}
            </span>
            {project.tool_used && (
              <>
                <span className="text-zinc-600">&middot;</span>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                  {project.tool_used}
                </span>
              </>
            )}
            <span className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
              <span>{project.likes_count ?? 0}</span>
              <span>{project.views_count ?? 0}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/gallery/project-card.tsx
git commit -m "feat: rebuild project card with likes/views count"
```

---

### Task 13: Rebuild Project Grid

**Files:**
- Modify: `components/gallery/project-grid.tsx`

- [ ] **Step 1: Rebuild grid with 4-breakpoint masonry**

```tsx
import type { Project } from "@/lib/types";
import { ProjectCard } from "./project-card";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400 text-lg">아직 프로젝트가 없습니다</p>
        <p className="text-zinc-500 text-sm mt-2">첫 번째로 업로드해보세요!</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/gallery/project-grid.tsx
git commit -m "feat: rebuild grid with 4-breakpoint masonry, no emoji empty state"
```

---

### Task 14: Rebuild Gallery Home Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Full gallery home with sort, filter, search, unified grid**

This is the main page. It needs:
- Sort tabs (New / Popular)
- Filter chips (tools + categories)
- Search bar
- Masonry grid with unified LoadMore (fix dual-grid bug)
- Server component with client interactive wrapper

Create `app/gallery-client.tsx` for the client-side interactive shell, and keep `app/page.tsx` as the server component that fetches initial data.

```tsx
// app/page.tsx
import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import { GalleryClient } from "./gallery-client";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tool?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sort = params.sort || "new";
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("*, profiles(*)");

  // Filters
  if (params.tool) query = query.eq("tool_used", params.tool);
  if (params.category) query = query.eq("category", params.category);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  // Sort
  if (sort === "popular") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", sevenDaysAgo).order("likes_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: projects } = await query.range(0, PAGE_SIZE - 1);

  return <GalleryClient initialProjects={projects ?? []} initialSort={sort} />;
}
```

```tsx
// app/gallery-client.tsx
"use client";

import { useState, useCallback } from "react";
import { ProjectGrid } from "@/components/gallery/project-grid";
import { GalleryFilters } from "@/components/gallery/gallery-filters";
import { SearchBar } from "@/components/gallery/search-bar";
import { useRouter, useSearchParams } from "next/navigation";
import type { Project } from "@/lib/types";

export function GalleryClient({
  initialProjects,
  initialSort,
}: {
  initialProjects: Project[];
  initialSort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState(initialSort);
  const selectedTool = searchParams.get("tool");
  const selectedCategory = searchParams.get("category");

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Discover Projects</h1>
        <p className="mt-1 text-zinc-400 text-sm">
          AI로 만든 프로젝트들을 탐색하고, 체험하고, 영감을 받으세요
        </p>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-6 mb-4">
        {["new", "popular"].map((s) => (
          <button
            key={s}
            onClick={() => { setSort(s); updateParams({ sort: s === "new" ? null : s }); }}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors duration-150
              ${sort === s ? "text-white border-violet-500" : "text-zinc-400 border-transparent hover:text-zinc-200"}`}
          >
            {s === "new" ? "New" : "Popular"}
          </button>
        ))}
        <div className="ml-auto">
          <SearchBar onSearch={(q) => updateParams({ q: q || null })} />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <GalleryFilters
          selectedTool={selectedTool}
          selectedCategory={selectedCategory}
          onToolChange={(tool) => updateParams({ tool })}
          onCategoryChange={(category) => updateParams({ category })}
        />
      </div>

      {/* Grid */}
      <ProjectGrid projects={initialProjects} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx app/gallery-client.tsx
git commit -m "feat: rebuild gallery home - sort tabs, filters, search, unified masonry"
```

---

## Chunk 5: Project Detail

### Task 15: Like Button Component

**Files:**
- Create: `app/project/[id]/like-button.tsx`

- [ ] **Step 1: Implement optimistic like toggle**

```tsx
"use client";

import { useState } from "react";

export function LikeButton({
  projectId, initialLiked, initialCount, isAuthenticated,
}: {
  projectId: string;
  initialLiked: boolean;
  initialCount: number;
  isAuthenticated: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (!isAuthenticated) {
      window.location.href = "/?login=required";
      return;
    }
    if (pending) return;

    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setPending(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!res.ok) {
        // Rollback
        setLiked(liked);
        setCount(count);
      }
    } catch {
      // Rollback
      setLiked(liked);
      setCount(count);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300
        ${liked
          ? "bg-violet-600/10 border-violet-500 text-violet-400"
          : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500"}`}
      style={{ transform: pending ? "scale(0.95)" : "scale(1)" }}
    >
      <span className={liked ? "text-violet-400" : "text-zinc-500"}>
        {liked ? "♥" : "♡"}
      </span>
      {count}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/project/[id]/like-button.tsx
git commit -m "feat: add like button with optimistic UI and auth gate"
```

---

### Task 16: Comment Section Component

**Files:**
- Create: `app/project/[id]/comment-section.tsx`

- [ ] **Step 1: Implement comment list + form**

```tsx
"use client";

import { useState, useEffect } from "react";
import type { Comment } from "@/lib/types";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";

export function CommentSection({
  projectId, userId,
}: {
  projectId: string;
  userId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/comments?project_id=${projectId}`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => setError("댓글을 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const submit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "댓글 작성 실패");
        return;
      }

      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setContent("");
    } catch {
      setError("댓글 작성 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (id: string) => {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-zinc-800 rounded" />
              <div className="h-3 w-full bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold mb-4">Comments ({comments.length})</h3>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {comments.length === 0 && (
        <p className="text-zinc-500 text-sm mb-4">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 py-3 border-b border-zinc-800/50">
            {comment.profiles?.avatar_url && (
              <img src={comment.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.profiles?.display_name || "Anonymous"}</span>
                <span className="text-xs text-zinc-600">
                  {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                </span>
                {userId === comment.user_id && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="ml-auto text-xs text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment form */}
      {userId ? (
        <div className="mt-6 flex gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 남겨보세요"
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none resize-none"
          />
          <button
            onClick={submit}
            disabled={!content.trim() || submitting}
            className="self-end px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? "..." : "작성"}
          </button>
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">
          댓글을 남기려면 <a href="/?login=required" className="text-violet-400 hover:underline">로그인</a>해주세요
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/project/[id]/comment-section.tsx
git commit -m "feat: add comment section with CRUD, loading/empty/error states"
```

---

### Task 17: Project Sidebar Component

**Files:**
- Create: `app/project/[id]/project-sidebar.tsx`

- [ ] **Step 1: Build sidebar with creator, tool, tags, stats**

```tsx
import Link from "next/link";
import type { Project } from "@/lib/types";

export function ProjectSidebar({ project }: { project: Project }) {
  return (
    <div className="space-y-4 w-full lg:w-72 flex-shrink-0">
      {/* Creator */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Creator</p>
        <Link href={`/profile/${project.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {project.profiles?.avatar_url && (
            <img src={project.profiles.avatar_url} alt="" className="w-10 h-10 rounded-full" />
          )}
          <span className="text-sm font-medium">{project.profiles?.display_name || "Anonymous"}</span>
        </Link>
      </div>

      {/* Tool */}
      {project.tool_used && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Tool</p>
          <p className="text-sm">{project.tool_used}</p>
        </div>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag.id} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Stats</p>
        <div className="flex gap-6">
          <div>
            <p className="text-lg font-semibold">{project.likes_count ?? 0}</p>
            <p className="text-xs text-zinc-500">Likes</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{project.views_count ?? 0}</p>
            <p className="text-xs text-zinc-500">Views</p>
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Published</p>
        <p className="text-sm">{new Date(project.created_at).toLocaleDateString("ko-KR")}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/project/[id]/project-sidebar.tsx
git commit -m "feat: add project sidebar with creator, tool, tags, stats"
```

---

### Task 18: Rebuild Project Detail Page

**Files:**
- Modify: `app/project/[id]/page.tsx`

- [ ] **Step 1: Rebuild with iframe, likes, comments, sidebar**

```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { IframePreview } from "@/components/preview/iframe-preview";
import Image from "next/image";
import { DownloadButton } from "./download-button";
import { DeleteButton } from "./delete-button";
import { LikeButton } from "./like-button";
import { CommentSection } from "./comment-section";
import { ProjectSidebar } from "./project-sidebar";
import { ViewTracker } from "./view-tracker";

export const revalidate = 60;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project with tags
  const { data: project } = await supabase
    .from("projects")
    .select("*, profiles(*), project_tags(tags(*))")
    .eq("id", id)
    .single();

  if (!project) notFound();

  // Transform tags from junction table
  const tags = project.project_tags?.map((pt: { tags: { id: string; name: string } }) => pt.tags).filter(Boolean) ?? [];
  const projectWithTags = { ...project, tags };

  // Check auth + liked status
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === project.user_id;

  let userHasLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from("likes")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("project_id", id)
      .single();
    userHasLiked = !!like;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <ViewTracker projectId={id} />

      {/* Preview */}
      {project.preview_url ? (
        <IframePreview previewUrl={project.preview_url} />
      ) : (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800">
          <Image src={project.screenshot_url} alt={project.title} fill className="object-cover" priority />
        </div>
      )}

      {/* Content + Sidebar */}
      <div className="mt-6 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold break-words">{project.title}</h1>

          {project.description && (
            <p className="mt-3 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {project.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <LikeButton
              projectId={id}
              initialLiked={userHasLiked}
              initialCount={project.likes_count ?? 0}
              isAuthenticated={!!user}
            />
            <DownloadButton projectId={id} />
            {isOwner && <DeleteButton projectId={id} />}
          </div>

          {/* Comments */}
          <CommentSection projectId={id} userId={user?.id ?? null} />
        </div>

        {/* Sidebar */}
        <ProjectSidebar project={projectWithTags} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ViewTracker client component**

```tsx
// app/project/[id]/view-tracker.tsx
"use client";

import { useEffect } from "react";

export function ViewTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    const key = `viewed_${projectId}`;
    if (sessionStorage.getItem(key)) return;

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });

    sessionStorage.setItem(key, "1");
  }, [projectId]);

  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/project/[id]/page.tsx app/project/[id]/view-tracker.tsx
git commit -m "feat: rebuild project detail - preview, likes, comments, sidebar, views"
```

---

## Chunk 6: Upload + Profile + Tag Input

### Task 19: Tag Input Component

**Files:**
- Create: `components/upload/tag-input.tsx`

- [ ] **Step 1: Build tag input with max 5 limit**

```tsx
"use client";

import { useState } from "react";
import { MAX_TAGS_PER_PROJECT, MAX_TAG_LENGTH } from "@/lib/constants";

export function TagInput({ name }: { name: string }) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addTag = () => {
    const normalized = input.toLowerCase().trim();
    if (!normalized || normalized.length > MAX_TAG_LENGTH) return;
    if (tags.includes(normalized) || tags.length >= MAX_TAGS_PER_PROJECT) return;
    setTags([...tags, normalized]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-zinc-500 hover:text-zinc-300">&times;</button>
          </span>
        ))}
      </div>
      {tags.length < MAX_TAGS_PER_PROJECT && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={`태그 추가 (${tags.length}/${MAX_TAGS_PER_PROJECT})`}
          maxLength={MAX_TAG_LENGTH}
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/upload/tag-input.tsx
git commit -m "feat: add tag input with max 5 tags, normalize to lowercase"
```

---

### Task 20: Rebuild Upload Form

**Files:**
- Modify: `components/upload/upload-form.tsx`

- [ ] **Step 1: Add tags, category, improve layout**

Key changes to existing upload-form.tsx:
1. Add `<TagInput name="tags" />` field
2. Add category `<select>` using CATEGORIES constant
3. Keep existing file validation logic
4. Import and use TagInput component

Add before the submit button:

```tsx
// Tag input
<div>
  <label className="block text-sm font-medium text-zinc-300 mb-2">태그</label>
  <TagInput name="tags" />
</div>

// Category select
<div>
  <label className="block text-sm font-medium text-zinc-300 mb-2">카테고리</label>
  <select
    name="category"
    className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
  >
    <option value="">선택 안함</option>
    {CATEGORIES.map((cat) => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
</div>
```

Add imports: `CATEGORIES` from constants, `TagInput` from tag-input.

- [ ] **Step 2: Commit**

```bash
git add components/upload/upload-form.tsx
git commit -m "feat: extend upload form with tags and category"
```

---

### Task 21: Profile Page

**Files:**
- Create: `app/profile/[id]/page.tsx`

- [ ] **Step 1: Build profile page with user projects**

```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectGrid } from "@/components/gallery/project-grid";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, profiles(*)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        {profile.avatar_url && (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          {profile.bio && <p className="text-zinc-400 text-sm mt-1">{profile.bio}</p>}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Projects ({projects?.length ?? 0})</h2>
      <ProjectGrid projects={projects ?? []} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/profile/[id]/page.tsx
git commit -m "feat: add profile page with user projects"
```

---

## Chunk 7: Final Polish

### Task 22: Update Error & Not Found Pages

**Files:**
- Modify: `app/error.tsx`
- Modify: `app/not-found.tsx`

- [ ] **Step 1: Remove emoji, use clean design**

Replace emoji in both files with clean text. In `error.tsx`, replace `😵` with a text heading. In `not-found.tsx`, replace `🔍` with text.

- [ ] **Step 2: Commit**

```bash
git add app/error.tsx app/not-found.tsx
git commit -m "fix: remove emoji from error/404 pages, use clean text design"
```

---

### Task 23: Update next.config.ts for Remote Images

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add remotePatterns for Supabase storage and Google avatars**

Ensure `images.remotePatterns` includes Supabase storage URL and Google user avatar domains.

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "fix: add remote image patterns for Supabase storage and Google avatars"
```

---

### Task 24: Build & Verify

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Run dev and manually verify**

```bash
npm run dev
```

Verify:
1. Gallery home loads with sort tabs and filter chips
2. Upload form shows tags and category fields
3. Project detail shows iframe preview, likes button, comments, sidebar
4. Profile page shows user's projects
5. Mobile responsive: upload button visible, preview button on mobile detail

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: VibeCoding Gallery v2 - Experience Gallery rebuild complete"
```

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Foundation: DB migration, types, constants |
| 2 | 4-5 | Design system + header rebuild |
| 3 | 6-9 | API routes: likes, comments, views, upload extension |
| 4 | 10-14 | Gallery home: filters, search, cards, grid, page |
| 5 | 15-18 | Project detail: likes, comments, sidebar, page |
| 6 | 19-21 | Upload improvements, tag input, profile page |
| 7 | 22-24 | Polish: error pages, image config, build verify |

**Total: 24 tasks, 7 chunks**
