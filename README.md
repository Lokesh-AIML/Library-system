# 🏛️ Athenaeum Library Management System

A full-stack, modern academic library web application featuring:
- **Supabase Backend & PostgreSQL Integration**: Complete support for Supabase Auth, PostgreSQL tables, Row Level Security (RLS), and atomic stored procedures.
- **Multi-User Authentication & Separate Accounts**: Separate accounts for students, faculty, and administrators.
- **Real-Time Catalog & Borrowing**: Curated catalog of books with live availability tracking and 1-click borrow/return.
- **Integrated AI Assistant ("Libby")**: Chatbot to answer user doubts, library rules, and provide book recommendations.
- **Head Librarian Admin Console**: Oversight of campus loans, member statistics, and catalog updates.

---

## ⚡ Supabase Setup & Migration Guide

The project is fully integrated with **Supabase**. To connect your own Supabase project:

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account or sign in.
2. Click **"New Project"**, name it (e.g., `athenaeum-library`), set a database password, and choose your region.

### Step 2: Run the Database Migration Script
1. In your Supabase dashboard, navigate to the **SQL Editor** tab (left sidebar).
2. Click **"New Query"**.
3. Open [`supabase-schema.sql`](./supabase-schema.sql) in this repository and copy all its contents.
4. Paste it into the Supabase SQL Editor and click **Run**.
   - This creates:
     - `public.books` table (pre-seeded with 16 curated titles).
     - `public.profiles` table (linked to `auth.users`).
     - `public.borrow_records` table for tracking loans.
     - Row Level Security (RLS) policies.
     - Atomic stored procedures `borrow_book` and `return_book`.
     - Automatic user profile trigger on sign-up.

### Step 3: Configure Environment Variables
1. In your Supabase dashboard, navigate to **Project Settings** -> **API**.
2. Copy your **Project URL** and **API Keys** (`anon` public key and `service_role` key).
3. Open [`.env`](./.env) in your project directory and paste your values:

```env
PORT=3000
JWT_SECRET=library_app_secure_secret_token_2026

# Supabase Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

### Step 4: Restart the Application
Double-click the **`Start Library System.bat`** file on your Desktop, or run:
```bash
npm start
```
The server will output:
```
⚡ Supabase Client initialized successfully with URL: https://your-project-id.supabase.co
📡 Database Engine: Supabase (PostgreSQL / Auth)
```

---

## 🚀 Quick Start

If Supabase credentials are not yet entered in `.env`, the system automatically runs with local SQLite so you can use all features right away with zero setup!

1. Double-click **`Start Library System.bat`** on your Desktop.
2. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
3. Click **Sign In / Join** to register your own account or sign in with your credentials. Each user gets their own digital library card, loan history, and digital wallet balance.
