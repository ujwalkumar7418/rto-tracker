# RTO Tracker

A Progressive Web App (PWA) for tracking Return-To-Office attendance. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 📅 Monthly calendar view with color-coded attendance
- ✅ One-tap daily check-in (Office, WFH, PTO, Sick, Holiday)
- 🔔 Push notification reminders at configurable time
- 📊 Monthly compliance dashboard with weekly breakdowns
- ⚙️ Configurable required office days (per week or month)
- 🏝 PTO and sick leave excluded from compliance
- 🎉 Holiday management
- 📈 Monthly and yearly reports
- 📤 Export to CSV and PDF
- 📱 Mobile-first responsive design
- ✈️ Offline functionality via Service Worker

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd rto-tracker
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the SQL Editor and run the entire contents of `supabase-schema.sql`
3. Copy your **Project URL** and **anon public key** from Settings → API

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
rto-tracker/
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx     # Main calendar with navigation
│   │   │   ├── DayCell.tsx          # Individual day cell
│   │   │   └── StatusPicker.tsx     # Bottom sheet status picker
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx    # Compliance metrics
│   │   │   └── ComplianceRing.tsx   # Animated ring chart
│   │   ├── reports/
│   │   │   └── ReportsView.tsx      # Yearly reports + export
│   │   ├── settings/
│   │   │   └── SettingsView.tsx     # Settings + holiday mgmt
│   │   └── shared/
│   │       └── BottomNav.tsx        # Mobile navigation
│   ├── lib/
│   │   ├── api.ts                   # Supabase API layer
│   │   ├── compliance.ts            # Compliance calculations
│   │   ├── exports.ts               # CSV + PDF export
│   │   ├── notifications.ts         # Push notification logic
│   │   └── supabase.ts              # Supabase client
│   ├── pages/
│   │   └── AuthPage.tsx             # Sign in / sign up
│   ├── store/
│   │   └── index.ts                 # Zustand global state
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── public/
│   └── favicon.svg
├── supabase-schema.sql              # Database schema
├── vite.config.ts                   # Vite + PWA config
└── .env.example
```

---

## Database Schema

The app uses three tables:

| Table | Purpose |
|-------|---------|
| `attendance_records` | Daily attendance entries per user |
| `holidays` | User-defined holidays |
| `user_settings` | Compliance requirements + notification prefs |

All tables use Row Level Security — users can only access their own data.

### Compliance Logic

- **Weekly mode**: Counts office days per calendar week, requires `required_days_per_week`
- **Monthly mode**: Counts office days for the month, requires `required_days_per_month`
- **PTO and sick days**: Never counted against compliance
- **Holidays**: Excluded from working day count entirely

---

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
# Or: netlify deploy --prod --dir=dist
```

Add environment variables in Netlify → Site Settings → Environment Variables.

### Self-hosted (Nginx)

```bash
npm run build

# Copy dist/ to your web root
cp -r dist/* /var/www/rto-tracker/

# Nginx config
server {
    listen 80;
    server_name rto.yourdomain.com;
    root /var/www/rto-tracker;
    index index.html;

    # PWA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache HTML or service worker
    location ~* \.(html|json)$ {
        add_header Cache-Control "no-cache";
    }
}
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## PWA Installation

Users can install the app on their device:

- **iOS Safari**: Share → Add to Home Screen
- **Android Chrome**: Three dots menu → Add to Home Screen
- **Desktop Chrome**: Click the install icon in the address bar

The app works fully offline after first load — attendance data syncs when reconnected.

---

## Push Notifications

Notifications are browser-based (not server push). They're scheduled via `setTimeout` when the app is open. For background notifications (when app is closed), you would need to add:

1. A Web Push server (e.g., using `web-push` npm package)
2. A Supabase Edge Function as the push sender
3. Service worker `push` event handler

See `src/lib/notifications.ts` for the current implementation.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Vite | Build tool |
| vite-plugin-pwa | PWA + Service Worker |
| Zustand | Global state |
| Supabase | Auth + Database |
| date-fns | Date utilities |
| jsPDF | PDF generation |
| Lucide React | Icons |

---

## License

MIT
