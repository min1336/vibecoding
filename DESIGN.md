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

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| Gallery Home | Skeleton cards (8) | "아직 프로젝트가 없습니다" + Upload CTA | "프로젝트를 불러오지 못했습니다" |
| Project Detail | Skeleton (preview + meta) | 404 page | "프로젝트를 불러오지 못했습니다" |
| Search Results | Skeleton cards | "'{query}'에 대한 결과가 없습니다" | "검색에 실패했습니다" |
| Comments | Skeleton (3 lines) | "첫 댓글을 남겨보세요!" | "댓글을 불러오지 못했습니다" |
| Profile | Skeleton | "이 사용자의 프로젝트가 없습니다" | "프로필을 불러오지 못했습니다" |
| Image Load Fail | - | - | Gray placeholder + broken icon |
