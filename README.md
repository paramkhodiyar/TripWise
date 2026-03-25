# TripWise ✈️ (Featuring Saarthi AI)

**TripWise** is an intelligent, collaborative travel planning platform designed to turn the chaos of group decisions into structured itineraries.

**Live Links:**
- **Web App**: [https://tripwise-app.vercel.app](https://tripwise-app.vercel.app)
- **Real-time Engine**: [https://tripwise-nxhy.onrender.com](https://tripwise-nxhy.onrender.com) (Used for Socket.IO & background AI)

Built with **Next.js 15**, **Prisma**, **Neon (PostgreSQL)**, and **Upstash Redis**, TripWise leverages **Saarthi**, a cutting-edge AI (Llama 3.3 via Groq), to act as your personal "Head Trip Planner" within group chats.

---

## ✨ Key Features

### 🤝 Collaborative "Argue & Plan" Chat
*   **Real-time Communication**: Built on **Socket.io** for low-latency group messaging.
*   **Presence Indicators**: See who's typing in real-time within your trip groups.
*   **Saarthi AI**: Mention `@ai` to invoke **Saarthi**, which analyzes recent chat history to suggest itineraries, budgets, and destinations.

### 🤖 AI Travel Expert & Planner
*   **Itinerary Structuring**: Automatically extracts decisions from chaotic chats into a clean, visual timeline.
*   **Standalone Consultant**: A dedicated AI Consultant section (`/consultant`) for deep exploration, restricted purely to travel topics.
*   **Indian Context**: Native support for **Indian Rupees (₹)** and localization considerations.

### 📊 Expense Split Calculator
*   **Automatic Settlements**: Logs group expenses and calculates who owes whom.
*   **Ditch the Spreadsheet**: Real-time balance tracking for all group members.

### 🖼️ Rich Profile Management
*   **Cloudinary Integration**: High-resolution profile picture uploads.
*   **Persisted Traveler Bios**: Save your travel preferences and hacks.

### 🔒 Privacy & Public Explorer
*   **Private Sessions**: Trips are private by default. Invite members via email for confidential planning.
*   **Public Explorer**: Optionally switch to Public to let the community browse and join your trips.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 15 (App Router), Tailwind CSS 4.
*   **Database**: PostgreSQL via [Neon](https://neon.tech), Prisma ORM.
*   **Real-time**: Custom Socket.io server (Render) integrated with Next.js.
*   **AI**: Llama 3.3 (70B) via [Groq SDK](https://groq.com).
*   **State/Queue**: Upstash Redis (REST) for rate limiting and AI processing locks.
*   **Media**: [Cloudinary](https://cloudinary.com) for profile image hosting.

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js 18+
*   A Neon PostgreSQL connection string
*   A Groq API Key
*   Upstash Redis REST URL & Token
*   Cloudinary Upload Preset

### 2. Installation
```bash
git clone https://github.com/paramkhodiyar/TripWise.git
cd TripWise/frontend
npm install
```

### 3. Environment Setup
Create a `.env` file in the `frontend` directory:
```env
DATABASE_URL="your-neon-url"
GROQ_API_KEY="your-groq-key"
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
AUTH_SECRET="your-next-auth-secret"
NEXT_PUBLIC_SOCKET_URL="https://your-render-url.com"
NEXT_PUBLIC_BASE_URL="https://your-vercel-url.com"
```

### 4. Database Setup
```bash
npx prisma db push
```

### 5. Start Development
```bash
npm run dev
```

---

## 📱 Mobile Optimization
TripWise is fully optimized for mobile devices, featuring specialized tab-based navigation for group planning and responsive design across all screens.

---
