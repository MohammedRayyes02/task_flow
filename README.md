# TaskFlow - Project & Task Management System

TaskFlow is a responsive, modern web application designed for software teams to organize projects, manage task workflows, track progress, and monitor deadlines.

Built as part of the **7-Day Full-Stack Development Challenge** (TAQAT / CodeMap trainees) based on the official Software Requirements Specification (SRS v1.0).

---

## 🚀 Features

- **Authentication & User Profiles:**
  - Secure email/password registration and sign-in using Firebase Authentication.
  - User session persistence across page reloads.
  - Automatic Firestore user profile initialization (`users/{uid}`) with fields: `fullName`, `email`, `role`, and `createdAt`.
  - Route protection redirecting unauthenticated visitors to `/login` and authenticated users to `/dashboard`.

- **Project Management (CRUD):**
  - Create projects with validated name (3–80 characters) and optional description.
  - List projects accessible to the authenticated user (owned or shared membership).
  - Project details view with member badges and role indication (Owner vs. Member).
  - Edit project information (restricted to Project Owner).
  - Safe project deletion with automatic cleanup of tasks in subcollections.

- **Task Management (CRUD & Workflow):**
  - Subcollection storage pattern (`projects/{projectId}/tasks/{taskId}`).
  - Validated task title (3–120 characters), description, due date, status, and priority.
  - Three distinct statuses: `To Do`, `In Progress`, and `Done`.
  - Three priority levels: `Low`, `Medium`, and `High`.
  - Dynamic **Overdue** calculation and visual badge when a due date is in the past and status is not `Done`.
  - Quick status dropdown for frictionless workflow progression.
  - Task deletion and editing permissions aligned with the SRS specification.

- **Team Collaboration & Membership (FR-07, FR-12):**
  - Project Owner can invite/add registered users by email address.
  - Duplicate membership prevention and validation against existing registered users.
  - Member removal with automatic unassignment of their associated tasks.
  - Task assignment exclusively to active project members.

- **Discovery, Search & Filters (FR-13):**
  - Instant client-side search across task titles.
  - Multi-criteria filtering by Status, Priority, and Assignee (including "Assigned to Me" and "Unassigned").
  - Responsive empty states with one-click filter reset.

- **Real-Time Live Dashboard (FR-14):**
  - 100% dynamic statistics computed directly from Firestore data: Total Projects, In Progress Tasks, Completed Tasks, and Overdue Tasks.
  - Recent tasks overview table with quick links to respective project boards.

---

## 🛠️ Tech Stack

- **Frontend:** React.js 19, Vite 8, JavaScript (ESM, JSX)
- **Styling:** Tailwind CSS v4, Lucide React icons
- **UI Components:** shadcn/ui (`base-nova` style with `@base-ui/react`)
- **Routing:** React Router v7/v8
- **Backend & Database:** Firebase Authentication, Cloud Firestore
- **Forms & Validation:** React Hook Form, Zod

---

## 📁 Firestore Data Model

```
users/{uid}
  ├── fullName: string
  ├── email: string
  ├── role: string ("User" | "Admin")
  └── createdAt: timestamp

projects/{projectId}
  ├── name: string (3-80 chars)
  ├── description: string (max 1000 chars)
  ├── ownerId: string (UID of creator)
  ├── memberIds: array of strings [UIDs, includes ownerId]
  ├── createdAt: timestamp
  └── updatedAt: timestamp
      │
      └── tasks/{taskId} (Subcollection)
            ├── title: string (3-120 chars)
            ├── description: string (max 1000 chars)
            ├── status: "todo" | "in_progress" | "done"
            ├── priority: "low" | "medium" | "high"
            ├── assigneeId: string | null (UID of project member)
            ├── createdBy: string (UID of creator)
            ├── dueDate: string | null (YYYY-MM-DD)
            ├── createdAt: timestamp
            └── updatedAt: timestamp
```

---

## 🔒 Firestore Security Rules

The security rules are defined in `firestore.rules`. Key highlights:
- Access denied by default to unauthenticated users.
- `users`: Authenticated users can search and view profiles; users can only modify their own profile.
- `projects`: Read access is granted only to the owner and members in `memberIds`. Only the owner can update or delete projects.
- `tasks`: Only members of the parent project can read or create tasks. Task updates and deletions enforce role-specific permissions per SRS Section 4.

To deploy or apply rules to your Firebase console:
1. Navigate to the **Firebase Console** -> **Firestore Database** -> **Rules**.
2. Copy the contents of [`firestore.rules`](./firestore.rules) and publish.

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd task-flow/task-flow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase project configuration keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

6. **Run Linter:**
   ```bash
   npm run lint
   ```

---

## 📱 Responsive Support

TaskFlow has been designed and tested for standard viewport sizes:
- **Mobile (375px):** Stacked layouts, touch-friendly controls, collapsible sidebar drawer.
- **Tablet (768px):** Multi-column dashboard grid, optimized filter bars.
- **Desktop (1280px+):** Full workspace view with persistent sidebar and table layouts.
