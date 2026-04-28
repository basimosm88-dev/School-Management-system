# Full School Management System

A comprehensive SaaS-style school management platform built with React, Vite, Tailwind CSS, and Supabase.

## 🚀 Features
- **Dynamic Settings**: Control branding, academic rules, and permissions globally.
- **Role-Based Dashboards**: Customized interfaces for Admins, Teachers, and Students.
- **Communication Hub**: Integrated Announcements, Events, and Messaging.
- **Academic Engine**: Flexible grading systems, automated rankings, and promotion logic.
- **PDF Reporting**: Custom report cards with dynamic school branding.

## 🛠️ Deployment to Vercel

To deploy this project to Vercel, follow these steps:

### 1. Connect to GitHub
If you haven't already, push this project to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit: Settings & Communication modules"
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. **Environment Variables**: Add the following variables from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

## 💻 Local Development
```bash
npm install
npm run dev
```

---
*Built with Antigravity AI.*
