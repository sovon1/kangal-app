<div align="center">

<!-- Animated Header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:FF6B6B,50:FFA94D,100:FFD43B&height=220&section=header&text=🍛%20KANGAL&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=মেস%20ম্যানেজমেন্ট,%20কিন্তু%20ঝামেলা%20ছাড়া।&descSize=18&descAlignY=55" width="100%" />

<!-- Typing SVG -->
<a href="https://kangal.software">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=3000&pause=1000&color=FF6B6B&center=true&vCenter=true&multiline=true&repeat=true&random=false&width=600&height=80&lines=Meal+tracking+with+one+tap+🍽️;Auto-calculated+meal+rates+📊;Zero+more+%22manager+tumi+taka+marcho%22+🤫" alt="Typing SVG" />
</a>

<br/>

<!-- Badges -->
[![Live Demo](https://img.shields.io/badge/🌐_Live-kangal.software-FF6B6B?style=for-the-badge&labelColor=1a1a2e)](https://kangal.software)
[![Next.js](https://img.shields.io/badge/Next.js_16-000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

<br/>

<!-- GitHub Stats Badges -->
![GitHub stars](https://img.shields.io/github/stars/sovon1/kangal-app?style=social)
![GitHub forks](https://img.shields.io/github/forks/sovon1/kangal-app?style=social)
![GitHub issues](https://img.shields.io/github/issues/sovon1/kangal-app?color=FF6B6B)
![License](https://img.shields.io/badge/license-MIT-FFA94D)

</div>

---

## 💡 The Problem

> Every university mess in Bangladesh runs on **WhatsApp groups**, **paper khatas**, and **mental math**. Managers get accused of stealing money, members forget which meals they ate, and month-end calculations take hours with a calculator.

<div align="center">

```
     📱 WhatsApp Groups          📓 Paper Khatas           🧮 Mental Math
     ─────────────────          ──────────────           ──────────────
     "ভাই আজকে খাবো না"        *হারিয়ে গেছে*            "মনে নাই ভাই"
     "কে বাজার করবে?"           *ভুল হিসাব*              "তোমার ৫০ টাকা বাকি"
     "ম্যানেজার টাকা মারছে!"    *ছেঁড়া পেজ*             "আমি ২ বেলাই খাইনি!"
```

</div>

### ✅ KANGAL fixes all of this. Permanently.

---

## ✨ Features at a Glance

<div align="center">

| | Feature | What it does | Vibe |
|---|---------|-------------|------|
| 🍽️ | **Meal Tracking** | Toggle breakfast/lunch/dinner with one tap | *"আজকে লাঞ্চ অফ"* |
| 🛒 | **Bazaar Logs** | Record every shopping trip item-by-item | *"আজ পেঁয়াজ ১ কেজি, ৪০ টাকা"* |
| 📊 | **Auto Meal Rate** | `Total Bazaar ÷ Total Meals = Rate` — live | *"আজকের রেট ৩৮.৫০"* |
| 💰 | **Deposits** | Track every taka deposited, with approval | *"১৫০০ বিকাশে দিলাম"* |
| 📄 | **PDF Reports** | One-click export for any member or full mess | *"এই নাও PDF"* |
| 📈 | **Spending Charts** | Visualize who ate how much with bar charts | *"সবচেয়ে বেশি তুমি খাও ভাই"* |
| 👥 | **Manager Tools** | Month closing, member management, role transfer | *"নতুন ম্যানেজার নিযুক্ত"* |
| ⏰ | **Cutoff Locking** | Auto-lock meals after configurable cutoff times | *"রাত ৯টার পর বন্ধ"* |
| 🔐 | **Full Auth** | Email/password + Google OAuth + password reset | *"ভুলে গেছি? Reset!"* |
| 📱 | **PWA Ready** | Install on home screen, works like native app | *"অ্যাপ এর মতোই!"* |

</div>

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Client ["🖥️ Client Layer"]
        A["⚛️ React 19 + Next.js 16<br/><i>App Router + Turbopack</i>"]
        B["🎨 Tailwind CSS v4 + shadcn/ui"]
        C["📊 Recharts + jsPDF"]
    end

    subgraph Server ["⚙️ Server Layer"]
        D["🔄 Server Actions<br/><i>Type-safe RPC</i>"]
        E["🛡️ Auth Middleware<br/><i>Protected Routes</i>"]
        F["🗂️ React Query<br/><i>Smart Caching</i>"]
    end

    subgraph Database ["🗄️ Supabase (PostgreSQL)"]
        G["📋 14 Tables<br/><i>3NF Normalized</i>"]
        H["🔒 Row Level Security<br/><i>Per-mess isolation</i>"]
        I["⚡ Triggers & RPCs<br/><i>Atomic operations</i>"]
    end

    A --> D
    B --> A
    C --> A
    D --> E
    E --> G
    F --> D
    G --> H
    G --> I

    style Client fill:#1a1a2e,stroke:#FF6B6B,color:#fff
    style Server fill:#16213e,stroke:#FFA94D,color:#fff
    style Database fill:#0f3460,stroke:#3FCF8E,color:#fff
```

---

## 🗄️ Database Schema

<details>
<summary><b>📐 Click to expand Entity Relationship Diagram</b></summary>

<br/>

```mermaid
erDiagram
    profiles ||--o{ mess_members : "has membership"
    profiles ||--o{ messes : "creates"
    messes ||--o{ mess_members : "has"
    messes ||--o{ mess_cycles : "has"
    messes ||--o{ bazaar_expenses : "has"
    messes ||--o{ fixed_costs : "has"
    messes ||--o{ individual_costs : "has"
    messes ||--o{ inventory : "tracks"
    messes ||--o{ meal_cutoff_config : "configures"
    messes ||--o{ activity_log : "logs"
    messes ||--o{ announcements : "posts"
    mess_cycles ||--o{ daily_meals : "contains"
    mess_cycles ||--o{ transactions : "records"
    mess_cycles ||--o{ bazaar_expenses : "tracks"
    mess_cycles ||--o{ fixed_costs : "includes"
    mess_cycles ||--o{ individual_costs : "includes"
    mess_cycles ||--o{ month_snapshots : "archives"
    mess_members ||--o{ daily_meals : "logs"
    mess_members ||--o{ transactions : "makes"
    mess_members ||--o{ individual_costs : "incurs"
    bazaar_expenses ||--o{ bazaar_items : "contains"

    profiles {
        uuid id PK
        text full_name
        text email
        text phone
        text avatar_url
    }

    messes {
        uuid id PK
        text name
        text address
        uuid created_by FK
        text invite_code
        int max_members
    }

    mess_members {
        uuid id PK
        uuid mess_id FK
        uuid user_id FK
        user_role role
        user_status status
        date join_date
        date leave_date
    }

    mess_cycles {
        uuid id PK
        uuid mess_id FK
        text name
        date start_date
        date end_date
        cycle_status status
        numeric final_meal_rate
    }

    daily_meals {
        uuid id PK
        uuid mess_id FK
        uuid cycle_id FK
        uuid member_id FK
        date meal_date
        boolean breakfast
        boolean lunch
        boolean dinner
        int guest_breakfast
        int guest_lunch
        int guest_dinner
    }

    transactions {
        uuid id PK
        uuid mess_id FK
        uuid cycle_id FK
        uuid member_id FK
        numeric amount
        payment_method method
        text reference_no
    }

    bazaar_expenses {
        uuid id PK
        uuid mess_id FK
        uuid cycle_id FK
        uuid shopper_id FK
        date expense_date
        numeric total_amount
    }

    bazaar_items {
        uuid id PK
        uuid expense_id FK
        text item_name
        numeric quantity
        text unit
        numeric unit_price
        numeric total_price
    }

    fixed_costs {
        uuid id PK
        uuid mess_id FK
        uuid cycle_id FK
        fixed_cost_type cost_type
        numeric amount
    }

    individual_costs {
        uuid id PK
        uuid mess_id FK
        uuid cycle_id FK
        uuid member_id FK
        text description
        numeric amount
        approval_status status
    }

    inventory {
        uuid id PK
        uuid mess_id FK
        text item_name
        numeric current_qty
        text unit
    }

    month_snapshots {
        uuid id PK
        uuid cycle_id FK
        uuid member_id FK
        int total_meals
        numeric meal_rate
        numeric closing_balance
    }

    meal_cutoff_config {
        uuid id PK
        uuid mess_id FK
        time breakfast_cutoff
        time lunch_cutoff
        time dinner_cutoff
    }

    activity_log {
        uuid id PK
        uuid mess_id FK
        uuid actor_id FK
        text action
        jsonb details
    }

    announcements {
        uuid id PK
        uuid mess_id FK
        text title
        text content
        text priority
    }
```

</details>

---

## 💸 The Balance Formula

```mermaid
graph LR
    A["💵 Opening Balance<br/><i>from previous month</i>"] --> E
    B["➕ Deposits<br/><i>cash, bKash, Nagad</i>"] --> E
    E["📊 Credits"] --> F

    C1["🍽️ Meals × Rate"] --> G
    C2["🏠 Prorated Fixed Costs<br/><i>rent, gas, wifi...</i>"] --> G
    C3["👤 Individual Costs"] --> G
    G["📉 Debits"] --> F

    F["💰 Current Balance<br/><i>=  Credits - Debits</i>"]

    style A fill:#22c55e,stroke:#16a34a,color:#fff
    style B fill:#22c55e,stroke:#16a34a,color:#fff
    style E fill:#3b82f6,stroke:#2563eb,color:#fff
    style C1 fill:#ef4444,stroke:#dc2626,color:#fff
    style C2 fill:#ef4444,stroke:#dc2626,color:#fff
    style C3 fill:#ef4444,stroke:#dc2626,color:#fff
    style G fill:#f97316,stroke:#ea580c,color:#fff
    style F fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

```
Balance = (Opening + Deposits) − (Meals × Rate + Fixed Costs + Individual Costs)
```

---

## ⚡ Month Close Flow

```mermaid
sequenceDiagram
    participant M as 👤 Manager
    participant S as ⚙️ Server Action
    participant DB as 🗄️ PostgreSQL

    M->>S: Click "Close Month"
    S->>DB: BEGIN TRANSACTION
    
    Note over DB: 🔒 Lock cycle row (FOR UPDATE)
    
    DB->>DB: Calculate final meal rate
    DB->>DB: Snapshot every member's balance
    DB->>DB: Archive current cycle → 'closed'
    DB->>DB: Create next month's cycle
    DB->>DB: Log activity
    
    DB->>S: COMMIT → Return new_cycle_id
    S->>M: ✅ "Month closed successfully!"
    
    Note over M,DB: 🎉 All atomic — if anything<br/>fails, everything rolls back!
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Why |
|-------|-----------|-----|
| ⚛️ **Frontend** | Next.js 16 + React 19 | App Router, Server Actions, Turbopack |
| 🎨 **Styling** | Tailwind CSS v4 + shadcn/ui | Beautiful, consistent, accessible |
| 🗄️ **Database** | Supabase (PostgreSQL) | RLS, Triggers, RPCs, Realtime |
| 🔐 **Auth** | Supabase Auth | Email/Password + Google OAuth |
| 📊 **Charts** | Recharts | Interactive, responsive visualizations |
| 📄 **PDF** | jsPDF + AutoTable | Generate reports client-side |
| 📦 **State** | React Query (TanStack) | Smart caching, auto-refetch |
| ✅ **Validation** | Zod | Runtime type safety |
| 🚀 **Deploy** | Vercel | Zero-config, edge-optimized |
| 📱 **PWA** | Web Manifest | Installable, native-like |

</div>

---

## 📁 Project Structure

```
kangal-app/
├── 🌐 public/
│   ├── manifest.json              # PWA configuration
│   └── icons/                     # App icons (192×192, 512×512)
│
├── 📦 src/
│   ├── 🗂️ app/
│   │   ├── (auth)/                # 🔑 Login, Signup, Forgot Password
│   │   ├── auth/callback/         # 🔄 OAuth callback handler
│   │   ├── dashboard/             # 📊 Main app
│   │   │   ├── page.tsx           # 🏠 Dashboard overview
│   │   │   ├── meals/             # 🍽️ Meal toggles + chart + manage
│   │   │   ├── bazaar/            # 🛒 Bazaar expense logs
│   │   │   ├── deposits/          # 💰 Deposit management
│   │   │   ├── options/           # ⚙️ Cycle & mess settings
│   │   │   ├── settings/          # 👤 User profile settings
│   │   │   └── admin/             # 👑 Manager-only
│   │   │       ├── costs/         # 💸 Fixed & individual costs
│   │   │       ├── members/       # 👥 Member management
│   │   │       └── month-close/   # 📋 Monthly settlement
│   │   └── page.tsx               # 🏠 Landing page (marketing)
│   │
│   ├── 🧩 components/
│   │   ├── dashboard/             # Stats cards, charts, meal toggles
│   │   ├── landing/               # Animated hero, feature cards
│   │   ├── mess-context.tsx       # 🔗 Shared context (perf optimization)
│   │   └── ui/                    # shadcn/ui primitives
│   │
│   ├── 📚 lib/
│   │   ├── actions/               # Server actions (meals, bazaar, finance)
│   │   ├── supabase/              # Client & middleware setup
│   │   ├── pdf-export.ts          # PDF generation logic
│   │   └── validations.ts         # Zod schemas
│   │
│   └── 📝 types/                  # TypeScript type definitions
│
└── 🗄️ supabase/
    ├── schema.sql                 # Complete DB schema (14 tables, RLS, triggers)
    ├── migration_fixes.sql        # Post-deploy fixes
    └── migration_approval_system.sql  # Approval workflow
```

---

## 🔒 Security Model

```mermaid
graph TD
    subgraph Auth ["🔐 Authentication"]
        A1["Supabase Auth<br/><i>JWT Tokens</i>"]
        A2["Next.js Middleware<br/><i>Route Protection</i>"]
    end

    subgraph RLS ["🛡️ Row Level Security"]
        R1["is_mess_member()"]
        R2["is_mess_manager()"]
    end

    subgraph Policies ["📜 Access Policies"]
        P1["Members → own mess data only"]
        P2["Managers → full CRUD"]
        P3["Cross-mess → impossible"]
    end

    A1 --> A2
    A2 --> R1
    A2 --> R2
    R1 --> P1
    R2 --> P2
    R1 --> P3

    style Auth fill:#1a1a2e,stroke:#FF6B6B,color:#fff
    style RLS fill:#16213e,stroke:#FFA94D,color:#fff
    style Policies fill:#0f3460,stroke:#3FCF8E,color:#fff
```

- **Every table** has RLS enabled — no data leaks between messes
- **Server-side auth** via Supabase SSR middleware
- **No secrets in client** — all sensitive operations are Server Actions
- **Atomic transactions** — month closing uses `SECURITY DEFINER` RPCs

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **npm**
- A [Supabase](https://supabase.com) project (free tier works!)

### Quick Setup

```bash
# 1️⃣ Clone the repo
git clone https://github.com/sovon1/kangal-app.git
cd kangal-app

# 2️⃣ Install dependencies
npm install

# 3️⃣ Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# 4️⃣ Set up the database
# Copy supabase/schema.sql → Supabase SQL Editor → Run

# 5️⃣ Start the dev server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and you're live! 🎉

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

---

## 📱 Install as App (PWA)

<div align="center">

```
📱 Open kangal.software on your phone
     ↓
📥 Tap "Add to Home Screen"
     ↓
🚀 Done! Works like a native app!
```

</div>

---

## 🧮 Database Stored Procedures

| Function | Purpose |
|----------|---------|
| `calculate_meal_rate(cycle_id)` | `Σ Bazaar ÷ Σ Meals` — the core formula |
| `prorate_fixed_costs(member_id, cycle_id)` | Fair share based on days present |
| `calculate_member_balance(member_id, cycle_id)` | Full financial breakdown |
| `close_mess_month(cycle_id)` | Atomic month close (snapshot → archive → new cycle) |
| `enforce_meal_cutoff()` | Trigger: blocks meal changes after cutoff (managers bypass) |
| `deduct_inventory_on_bazaar()` | Auto-updates inventory on bazaar entry |
| `update_bazaar_total()` | Auto-recalculates expense totals |

---

## 📊 Enum Types

```sql
user_role         → 'manager' | 'member' | 'cook'
user_status       → 'active' | 'inactive' | 'on_leave'
payment_method    → 'cash' | 'bkash' | 'nagad' | 'bank_transfer' | 'other'
approval_status   → 'pending' | 'approved' | 'rejected'
cycle_status      → 'open' | 'closed' | 'archived'
fixed_cost_type   → 'cook_salary' | 'wifi' | 'gas' | 'electricity' | 'water' | 'rent' | ...
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. 🍴 Fork the repo
2. 🌿 Create a branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

---

## 📝 License

This project is open source under the **[MIT License](LICENSE)**.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:FF6B6B,50:FFA94D,100:FFD43B&height=120&section=footer" width="100%" />

**Built with ❤️ for mess-er ভাইরা everywhere.**

*"ম্যানেজার তুমি টাকা মারছো — এই কথা শুনতে হবে না আর।"* 🐕

<br/>

<a href="https://kangal.software">
  <img src="https://img.shields.io/badge/Try_KANGAL_Now-FF6B6B?style=for-the-badge&logo=firefoxbrowser&logoColor=white" alt="Try KANGAL" />
</a>

</div>
