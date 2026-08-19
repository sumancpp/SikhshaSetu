# 🎓 EduKollab — Academic Collaboration & Gamified Learning Platform
> **Smart India Hackathon (SIH) — Production-Grade Full-Stack Application**

EduKollab is a secure, modern academic collaboration platform built on the MERN stack (TypeScript, React 18, Tailwind CSS, Express, MongoDB, Socket.IO). It combines the hierarchy and workflow of Google Classroom with real-time gamification, points ledger, daily/weekly challenges, interactive MCQ quizzes, and community Q&A forums.

---

## 🌟 Key Features & Architecture

```
👑 ADMIN → 🏫 CLASS → 🎓 FACULTY → 📚 SUBJECT → 🧑 STUDENT
                                          │
    ┌──────────────┬──────────────────────┼──────────────────────┬──────────────────────┐
    ▼              ▼                      ▼                      ▼                      ▼
📄 Materials    📝 Assignments         ⚡ Quizzes              🎯 Challenges         💬 Q&A Forum
  (Notes/Books)   (Submissions/Grades)   (Auto-Graded MCQ / GF)   (Daily/Weekly Puzzles) (Voting/Solutions)
```

### 1. 🏫 Academic Hierarchy & Collaboration
- **Classes & Cohorts**: Departmental groupings with auto-generated 6-character unique join codes (e.g. `CS626A`).
- **Subject Workspace Hub**: Tabbed Google Classroom-style center for each subject:
  - **Study Materials**: Filter by Notes, Slides, Books, Syllabus with view & download counters.
  - **Assignments**: Upload submissions, deadline countdowns, faculty grading & feedback.
  - **Quizzes**: Native auto-graded MCQ quizzes and Google Form embed integration.
  - **Subject Forum**: Scoped technical discussions with upvote/downvote and accepted answer verification.
  - **Subject Leaderboard**: Local points and rankings for classmates.
  - **People**: Lead instructors, Co-Faculties, and student roster.

### 2. 🎮 Real-Time Gamification & Points Ledger
- **Atomic Ledger**: Every point award is recorded in an immutable ledger with anti-abuse idempotency.
- **Milestone Badges**: 7 system achievements (Pioneer, First Turn-In, Quiz Ace, Problem Hunter, Weekly Scholar, Academic Mentor, Centurion).
- **Celebration Feedback**: Real-time Socket.IO event synchronization, toast popups (`+50 pts`), and confetti animations.
- **Leaderboards**: Top-3 visual podium, rank tables, and continuous learning streak counters (`🔥 7d`).

### 3. 🛡️ Enterprise Security & Anti-IDOR RBAC
- **Strict Role-Based Access Control**: `ADMIN`, `FACULTY`, `STUDENT` with resource-level verification (e.g., verifying subject faculty before allowing material uploads or grading).
- **Authentication**: JWT access tokens + HTTP-only refresh tokens with bcrypt password hashing and Google OAuth integration.
- **Safety & Moderation**: Rate limiting, Helmet HTTP headers, and moderation reporting queue with admin resolution actions.
- **Audit Logs**: Full logging of security-critical actions and administrative modifications.

### 4. ⚡ Evaluator Experience
- **1-Click Demo Persona Switcher**: Top banner allows instantaneous switching between **Dr. Suresh (Admin)**, **Prof. Sharma (Faculty)**, and **Suman (Student)** without manual re-login.
- **Zero-Config Local Database**: Automatically boots an in-memory MongoDB server (`mongodb-memory-server`) if no external MongoDB URI is provided, and auto-seeds demonstration classes, subjects, materials, and challenges on first start.
- **Global Command Palette (`Ctrl+K` / `Cmd+K`)**: Rapid navigation across classes, subjects, assignments, and discussions.

---

## 👥 Demo Accounts & Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | Dr. Suresh Mehta | `admin@edukollab.dev` | `Admin@123456` |
| 🎓 **Faculty** | Prof. Rakesh Sharma | `prof.sharma@edukollab.dev` | `Faculty@123` |
| 🎓 **Faculty** | Prof. Anjali Verma | `prof.verma@edukollab.dev` | `Faculty@123` |
| 🧑 **Student** | Suman Sengupta | `student1@edukollab.dev` | `Student@123` |
| 🧑 **Student** | Aarav Sharma | `student2@edukollab.dev` | `Student@123` |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed     # (Optional: Seeds full realistic academic dataset)
npm run dev      # Starts server on http://localhost:5000
```
> *Note: If `MONGODB_URI` is not set in `.env`, the backend automatically provisions a local in-memory MongoDB instance with preloaded demo data.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Starts Vite development server on http://localhost:5173
```

### 3. Run Automated Tests
```bash
cd backend
npm test         # Executes full Jest test suite across Auth, RBAC, Points & Forum
```

---

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Environment, MongoDB connection, Socket.IO rooms
│   │   ├── constants/       # Points values & Badge criteria
│   │   ├── controllers/     # API controllers (Auth, Class, Subject, Assignment, Quiz, Challenge, Forum...)
│   │   ├── middleware/      # Auth, Anti-IDOR RBAC, RateLimit, Upload, ErrorHandler
│   │   ├── models/          # 18 Typed Mongoose Models
│   │   ├── routes/          # Express REST API routes
│   │   ├── scripts/seed.ts  # Turnkey realistic demonstration seed script
│   │   ├── services/        # Business logic & atomic points ledger
│   │   ├── tests/           # Jest unit & integration test suites
│   │   └── server.ts        # Server entrypoint
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client & typed endpoints
│   │   ├── components/      # Common UI, Layout, Search, Workspace tabs
│   │   ├── context/         # Auth, Socket.IO, Theme (Dark/Light), Toast
│   │   ├── pages/           # Admin, Faculty, Student Dashboards, Subjects, Quizzes, Challenges, Forum
│   │   ├── routes/          # Protected & role-guarded routes
│   │   └── types/           # Full TypeScript data definitions
```

---

## 🏆 Smart India Hackathon Submission Notes
- **Zero Mockups**: Built as an actual end-to-end full-stack application with real API responses, database persistence, and WebSocket push notifications.
- **Production Polish**: Features clean dark/light mode, smooth animations, empty/loading skeletons, responsive mobile navigation, and celebration feedback.
