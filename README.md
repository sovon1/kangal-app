<div align="center">

# 🍛 KANGAL

### মেস ম্যানেজমেন্ট, কিন্তু ঝামেলা ছাড়া।

A production-grade mess management system built for university students in Bangladesh.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-kangal--app.vercel.app-16a34a?style=for-the-badge)](https://kangal-app.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## 💡 The Problem

Every university mess in Bangladesh runs on **WhatsApp groups, paper khatas, and mental math**. Managers get accused of stealing money, members forget which meals they ate, and month-end calculations take hours with a calculator.

**KANGAL fixes all of this.**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🍽️ **Meal Tracking** | Toggle breakfast/lunch/dinner with one tap. Real-time meal counts. |
| 🛒 **Bazaar Logs** | Record every shopping trip with items, amounts, and who bought what. |
| 📊 **Auto-Math** | Daily meal rate calculated instantly. Cost-per-meal updated in real-time. |
| 💰 **Deposit Management** | Track member deposits with full transaction history. |
| 👥 **Manager Tools** | One-click month closing, member management, role transfers. |
| 📄 **PDF Reports** | Generate detailed individual or full-mess reports instantly. |
| 📈 **Spending Charts** | Visualize daily bazaar spending trends with interactive charts. |
| 🔐 **Auth System** | Email/password + Google OAuth + Forgot Password flow. |
| 📱 **PWA Ready** | Install on your phone's home screen for a native app-like experience. |
| 🏠 **Landing Page** | Beautiful marketing page with scroll animations and Bangla copy. |

---

## 🛠️ Tech Stack

```
Frontend       → Next.js 15 (App Router) + React 19
Styling        → Tailwind CSS + shadcn/ui
Database       → Supabase (PostgreSQL + Row Level Security)
Auth           → Supabase Auth (Email + Google OAuth)
Charts         → Recharts
PDF            → jsPDF + jsPDF-AutoTable
Deployment     → Vercel
PWA            → Web App Manifest + Service Worker ready
Language       → TypeScript (strict mode, zero errors)
```

---

## 📁 Project Structure

```
kangal-app/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Signup, Forgot/Reset Password
│   │   ├── auth/callback/     # OAuth callback handler
│   │   ├── dashboard/         # Main app pages
│   │   │   ├── meals/         # Meal toggle grid
│   │   │   ├── bazaar/        # Bazaar expense logs
│   │   │   ├── deposits/      # Deposit management
│   │   │   ├── settings/      # User & mess settings
│   │   │   └── admin/         # Manager-only pages
│   │   │       ├── costs/     # Shared cost management
│   │   │       ├── members/   # Member management
│   │   │       └── month-close/ # Monthly settlement
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── dashboard/         # Stats cards, charts, meal toggles
│   │   ├── landing/           # Animated feature cards
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── actions/           # Server actions (meals, bazaar, finance, mess)
│   │   ├── supabase/          # Supabase client & middleware
│   │   ├── pdf-export.ts      # PDF generation logic
│   │   └── validations.ts     # Zod schemas
│   └── types/                 # TypeScript type definitions
└── supabase/
    └── schema.sql             # Complete database schema with RLS
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Clone the repo
git clone https://github.com/sovon1/kangal-app.git
cd kangal-app

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Run the database schema
# Copy supabase/schema.sql into your Supabase SQL editor and run it

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're live! 🎉

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

---

## 🔒 Security

- **Row Level Security (RLS)** on all Supabase tables — users can only access their own mess data
- **Server-side auth** with Supabase SSR middleware
- **No secrets in client code** — all sensitive operations happen server-side
- **Protected routes** via Next.js middleware

---

## 📱 PWA Installation

1. Open [kangal-app.vercel.app](https://kangal-app.vercel.app) on your phone
2. Tap **"Add to Home Screen"** (or the install prompt)
3. Done! KANGAL works like a native app 🚀

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a PR.

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ for mess-er ভাইরা everywhere.**

*"ম্যানেজার তুমি টাকা মারছো — এই কথা শুনতে হবে না আর।"*

</div>
