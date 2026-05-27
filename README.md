# AI Incident Review System

AI Incident Review System is a Next.js application for tracking project issues and incident reports across engineering teams. The app has two main user roles: Team Lead and Employee.

Team Leads create projects and assign employees to those projects. Employees can view the projects they have been added to, post issues inside those projects, attach images, generate AI summaries, and collaborate through comments.

## Main Roles

### Team Lead

- Register or log in as a team lead.
- Create a new project with a title, description, status, and members.
- Add employees to a project.
- View all projects created by the logged-in team lead.
- Open a project to see project details, assigned members, and issue posts.

### Employee

- Register or log in as an employee.
- View the list of projects where the employee has been added.
- Open an assigned project and see all issue posts.
- Create a new issue post with a description and optional image attachment.
- Generate an AI summary for the issue before posting.
- Open issue details and read the AI summary.
- Add comments to an issue post.
- Edit and delete comments.

## Core Workflow

1. A Team Lead creates a project.
2. The Team Lead adds employees as project members.
3. An Employee logs in and sees only the projects assigned to them.
4. The Employee opens a project and creates an issue post.
5. The issue post can include a description, screenshot, and AI-generated summary.
6. Team members can open the post and discuss it using comments.
7. Comments can be added, edited, and deleted.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Redux Toolkit and React Redux
- Tailwind CSS 4
- External REST API for authentication, projects, posts, uploads, and comments
- External AI API for issue summarization

## Project Structure

```text
ai-incident/
+-- public/
|   +-- Static assets served by Next.js
+-- src/
|   +-- app/
|   |   +-- (auth)/
|   |   |   +-- login/
|   |   |   |   +-- page.tsx
|   |   |   +-- register/
|   |   |       +-- page.tsx
|   |   +-- (dashboard)/
|   |   |   +-- employee/
|   |   |   |   +-- page.tsx
|   |   |   +-- tl/
|   |   |   |   +-- page.tsx
|   |   |   |   +-- create-project/
|   |   |   |       +-- page.tsx
|   |   |   +-- projects/
|   |   |       +-- [projectId]/
|   |   |           +-- page.tsx
|   |   |           +-- posts/
|   |   |               +-- page.tsx
|   |   |               +-- [postId]/
|   |   |                   +-- page.tsx
|   |   +-- components/
|   |   |   +-- BackgroundBoxes.tsx
|   |   |   +-- DashboardAuthGuard.tsx
|   |   |   +-- Footer.tsx
|   |   |   +-- KineticGrid.tsx
|   |   |   +-- Nav.tsx
|   |   +-- globals.css
|   |   +-- layout.tsx
|   |   +-- page.tsx
|   |   +-- ReduxProvider.tsx
|   +-- lib/
|   |   +-- api.ts
|   |   +-- auth.ts
|   |   +-- comments.ts
|   |   +-- employees.ts
|   |   +-- post.ts
|   |   +-- project.ts
|   +-- store/
|       +-- authSlice.ts
|       +-- store.ts
+-- package.json
+-- next.config.ts
+-- tsconfig.json
+-- README.md
```

## Important Folders

### `src/app`

Contains the Next.js App Router pages, layouts, route groups, global styles, and shared UI components.

- `(auth)` keeps login and registration pages grouped without adding `auth` to the URL.
- `(dashboard)` keeps authenticated dashboard routes grouped without adding `dashboard` to the URL.
- `projects/[projectId]` is the dynamic project detail route.
- `projects/[projectId]/posts` is used to create a new post for a project.
- `projects/[projectId]/posts/[postId]` is the post detail route with image, AI summary, and comments.

### `src/lib`

Contains frontend API helpers for the backend services.

- `api.ts` builds backend and AI API URLs from environment variables.
- `auth.ts` handles login and registration requests.
- `project.ts` handles project creation and project fetching for team leads and employees.
- `post.ts` handles post creation, image upload, and fetching project posts.
- `comments.ts` handles creating, fetching, editing, and deleting comments.
- `employees.ts` handles employee-related API calls.

### `src/store`

Contains Redux state management.

- `store.ts` configures the Redux store.
- `authSlice.ts` stores authentication and user role state.

### `src/app/components`

Contains reusable UI components used across pages, such as navigation, footer, animated background, and dashboard auth guard.

## Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_AI_API_BASE_URL=http://localhost:8000
```

`NEXT_PUBLIC_API_BASE_URL` points to the main backend API for auth, projects, posts, uploads, and comments.

`NEXT_PUBLIC_AI_API_BASE_URL` points to the AI summarization API used by the issue post form.

## Available Scripts

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the production build:

```bash
npm run start
```

Run linting:

```bash
npm run lint
```

## Route Summary

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` | User login |
| `/register` | User registration |
| `/tl` | Team Lead dashboard |
| `/tl/create-project` | Create project form |
| `/employee` | Employee dashboard |
| `/projects/[projectId]` | Project detail and issue list |
| `/projects/[projectId]/posts` | Create issue post |
| `/projects/[projectId]/posts/[postId]` | Issue detail, AI summary, and comments |

## Notes

- Authentication data is read from browser `localStorage`.
- API requests include a bearer token when a token is available.
- Issue images are uploaded first, then the returned image URL is saved with the issue post.
- AI summaries are generated from the issue description and optional image before the issue is submitted.
