# Dineezy Trak

A project management dashboard for teams. Built as a single-page app with real-time workspace switching, task boards, and team collaboration — inspired by Linear and Notion.

## Features

- **Workspaces** — Create and switch between multiple workspaces. Edit name, emoji, slug, or delete.
- **Projects** — Organize work into projects with custom colors, emoji, and status (active/archived/completed).
- **Collections (Modules)** — Group tasks into collections within a project. Assign team members to collections.
- **Tasks** — Create, edit, delete tasks with priority levels, due dates, status tracking, and assignees.
- **Team Management** — Invite members by email, assign roles (admin/member/guest), remove members.
- **Dark Mode** — Full light/dark theme support with system preference detection.
- **Responsive** — Works on desktop with a collapsible sidebar drawer for mobile.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| State | React hooks with optimistic updates |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo:

```bash
git clone https://github.com/your-username/dineezy-trak.git
cd dineezy-trak
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Apply database migrations:

```bash
supabase db push
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
├── (auth)/           # Login & signup pages
├── api/              # API routes (invite member)
├── components/       # UI components & modals
├── dashboard/        # Main dashboard page
├── hooks/            # Data hooks (workspaces, projects, collections, tasks, members)
utils/
├── supabase_client.ts
supabase/
├── migrations/       # SQL migrations
```

## Database Schema

- `profiles` — User profiles (synced from Supabase Auth)
- `workspaces` — Team workspaces
- `workspace_members` — Membership with roles (owner/admin/member/guest)
- `projects` — Projects within a workspace
- `collections` — Task groups within a project
- `collection_assignees` — Members assigned to a collection
- `tasks` — Individual tasks with priority, status, due date
- `task_assignees` — Members assigned to a task
- `attachments` — File attachments on tasks

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Roadmap

- [ ] My Tasks — personal task view across all projects
- [ ] Analytics — project progress charts and stats
- [ ] Task comments and activity log
- [ ] Drag-to-reorder tasks and modules
- [ ] Row-level security policies
- [ ] Onboarding flow for new users

## License

MIT
