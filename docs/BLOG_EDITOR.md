# BizilCore Blog Editor

Premium Gutenberg-style block editor integrated at `/admin/blog`.

## Setup

1. Run database migration:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. Ensure Cloudinary env vars are set (see `.env.example`).

3. Optional blog env vars:
   - `BLOG_AUTOSAVE_INTERVAL_MS` (default: 30000)
   - `BLOG_MAX_REVISIONS` (default: 50)
   - `BLOG_MEDIA_FOLDER` (default: bizilcore/blog)

## Routes

| Route | Description |
|-------|-------------|
| `/admin/blog` | Post list |
| `/admin/blog/[id]/edit` | Block editor |
| `/admin/blog/[id]/preview` | Preview |
| `/blog` | Public blog listing |
| `/blog/[slug]` | Public post |
| `/blog/feed.xml` | RSS feed |

## API

Admin routes require `content` or `super` admin role:

- `GET/POST /api/admin/blog`
- `GET/PATCH/DELETE /api/admin/blog/[id]`
- `PUT /api/admin/blog/[id]/autosave`
- `GET/POST/PUT /api/admin/blog/[id]/revisions`
- `POST /api/admin/blog/[id]/lock`
- `GET/POST/PATCH/DELETE /api/admin/blog/[id]/comments`
- `GET/POST /api/admin/blog/media`
- `GET/POST/DELETE /api/admin/blog/categories`
- `GET/POST /api/admin/blog/tags`
- `POST /api/admin/blog/import`
- `GET /api/admin/blog/[id]/export?format=html|markdown|json`

Public:

- `GET /api/blog`
- `GET /api/blog/[slug]`

## Block Schema

```ts
type BlockNode = {
  id: string;
  type: BlockType;
  attrs?: Record<string, unknown>;
  innerBlocks?: BlockNode[];
  content?: string; // TipTap JSON
  design?: BlockDesign;
};
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save |
| Ctrl+Z / Ctrl+Shift+Z | Undo / Redo |
| Ctrl+Shift+P | Preview |
| `/` | Slash command menu |
| F11 | Fullscreen |
| Ctrl+Shift+F | Focus mode |

## Module Structure

```
components/blog-editor/   # UI components
lib/blog-editor/          # Types, store, utils, SEO, export
hooks/blog-editor/          # React Query hooks
app/api/admin/blog/         # Admin API
app/api/blog/               # Public API
```
