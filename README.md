# Student Query Routing & Resolution System (SQRRS)

A production-grade, university-focused internal ticketing system designed for high-efficiency query resolution. Built with a "Modern Brutalist" technical aesthetic, the system features automated department routing, real-time SLA tracking, and robust role-based security.

## 🚀 Key Features

### 🎓 Student Experience
- **Smart Query Submission**: Institutional-grade forms with department auto-detection.
- **Progress Tracking**: Real-time status updates and chronological ticket timelines.
- **Collaborative Threads**: Integrated chat interface for direct communication with university staff.
- **Notifications**: Instant unread badge alerts for replies and status changes.

### 💼 Staff Experience
- **Queue Management**: Specialized dashboards for IT, Finance, and Academic departments.
- **SLA Prioritization**: Automated visual indicators for tickets approaching or exceeding the 24-hour resolution threshold.
- **Resolution Control**: Dynamic status mutations (Open → In Progress → Closed) directly within the thread.

### 🛡️ Admin Experience
- **Global Overview**: High-level metrics for system load, resolution rates, and staff performance.
- **Category Management**: Full CRUD controls for categories and department routing rules.
- **Analytics Engine**: Live data visualization using Recharts for volume and performance tracking.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Custom Industrial Theme)
- **State Management**: React Context API (Auth + Session)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend (Supabase)
- **Database**: PostgreSQL (Relational)
- **Authentication**: Supabase Auth (JWT based)
- **Security**: Strict Row-Level Security (RLS) policies.
- **Business Logic**: PostgreSQL Triggers & Functions for auto-routing and user synchronization.

## 📂 Project Structure

```text
sepm_project/
├── frontend/             # React source code
│   ├── src/
│   │   ├── components/   # Atomic UI primitives (Button, Input, Table)
│   │   ├── context/      # AuthContext + Session logic
│   │   ├── layouts/      # AppShell, Topbar, Sidebar
│   │   ├── pages/        # Dashboard & Management views
│   │   ├── services/     # Supabase client initialization
│   │   └── utils/        # SLA Engine, cn() utility, formatting
│   └── seedData.js       # Demo data ingestion script
├── supabase/
│   └── schema.sql        # Database definitions, RLS, and triggers
└── README.md             # Project documentation
```

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- A Supabase Project

### 2. Environment Variables
Create a `.env` file in the `frontend/` directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation
```bash
cd frontend
npm install
```

### 4. Database Initialization
Run the contents of `supabase/schema.sql` in your Supabase SQL Editor to initialize tables, RLS policies, and triggers.

### 5. Running the App
```bash
npm run dev
```

## 🔒 Security Model (RLS)
The system operates on a zero-trust model:
- **Students**: Can only view/edit their own tickets and replies.
- **Staff**: Can only view/manage tickets assigned to their department.
- **Admins**: Have global read/write access to metadata and system-wide tickets.

## 📊 Business Logic: SLA Engine
The system enforces a **24-hour resolution target**:
- Tickets remaining "Open" for >24 hours are automatically flagged as **Escalated**.
- Escalation logic runs on every session hydration and dashboard mount to ensure real-time accuracy.

---
Created with precision for university internal operations.
