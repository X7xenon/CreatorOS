<div align="center">
  
# 🚀 CreatorOS
**The Ultimate Local-First Operating System for Content Creators**

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

*CreatorOS is a highly modular, Domain-Driven Design (DDD) based analytics and automation dashboard built to help creators manage their digital empire. Stop juggling 10 different tabs—control your YouTube, Instagram, and TikTok presence from a single, beautiful dashboard.*

</div>

---

## ✨ Features

- **📊 Unified Dashboard:** Track Views, Followers, and Revenue across all platforms in real-time.
- **📅 Smart Calendar & Scheduler:** Schedule posts and never miss an upload.
- **📱 WhatsApp Notification Bridge:** Built-in Baileys Node.js microservice. Get notified on WhatsApp exactly when it's time to publish a video!
- **⚡ Local-First & Blazing Fast:** Built entirely on SQLite. Your data stays on your machine. Zero cloud dependency.
- **🧩 Plugin Architecture:** Easily extendable. Designed with a strict Feature-First frontend and Domain-Driven backend.
- **🎨 Stunning Aesthetics:** Powered by Vite + React + Vanilla CSS with dynamic themes and glassmorphism.

---

## 🏗️ Architecture

CreatorOS uses a **Micro-monolith** structure combining the best of Python and Node.js:

```mermaid
graph TD;
    A[React Dashboard (Vite)] -->|REST API & WebSockets| B[FastAPI Backend]
    B -->|Event Bus| C[Services & Repositories]
    C --> D[(SQLite DB)]
    B -->|HTTP Requests| E[WhatsApp Bridge (Node.js)]
    E -->|Baileys| F[WhatsApp Servers]
```

## 🚀 Quick Start (Windows)

We have created an ultra-convenient runner script that launches everything in the background for you!

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TheLucifer007/CreatorOS.git
   cd CreatorOS
   ```

2. **Launch CreatorOS:**
   Simply run the batch file (or type `creatoros` in your terminal if you added it to your PATH):
   ```cmd
   CreatorOs.bat
   ```
   *This automatically starts the FastAPI Backend (Port 8888), the Vite Frontend (Port 7070), and the WhatsApp Node Bridge (Port 3001).*

3. **Open your browser:**
   Navigate to `http://localhost:7070` to view your dashboard!

4. **Connect WhatsApp:**
   Go to the **Settings** page in CreatorOS, click **Show Login QR Code**, and scan it using your WhatsApp app to start receiving instant upload reminders.

---

## 📂 Project Structure

```text
CreatorOS/
├── backend/                   # Python FastAPI Application
│   ├── api/                   # REST Endpoints
│   ├── core/                  # Event Bus, Scheduler, Security
│   ├── database/              # SQLite Repositories
│   ├── domains/               # Domain-Driven Business Logic
│   ├── plugins/               # Extensible modules
│   │   └── whatsapp-bridge/   # Node.js Baileys microservice
│   └── main.py                # App Entrypoint
├── frontend/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI Primitives (GlassCard)
│   │   ├── pages/             # Dashboard, Calendar, Settings
│   │   ├── store/             # Zustand State Management
│   │   └── themes/            # Dynamic Theme JSONs
├── CreatorOs.bat              # One-click startup script
└── .gitignore                 
```

---

<div align="center">
  <i>Built with ❤️ for Creators.</i>
</div>
