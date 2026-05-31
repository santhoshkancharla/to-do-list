# LifeFlow - Premium Productivity Flow System

LifeFlow is an advanced, full-stack productivity web app designed for students and personal productivity. It features a modern glassmorphic dashboard, daily planner workspace, goals and milestones tracker, calendar agenda, notepad manager, habits tracker, and a Pomodoro focus timer.

---

## Project Structure

```
to do list/
├── lifeflow-backend/           # Node.js + Express API Server
│   ├── data/
│   │   └── db.json             # Local JSON file database fallback
│   ├── routes/
│   │   ├── auth.js             # Auth JWT endpoints
│   │   ├── tasks.js            # Task CRUD endpoints
│   │   ├── goals.js            # Goals CRUD endpoints
│   │   ├── events.js           # Calendar CRUD endpoints
│   │   ├── notes.js            # Notes CRUD endpoints
│   │   └── habits.js           # Habits CRUD endpoints
│   ├── .env                    # Server port and secret settings
│   ├── db.js                   # Mongoose / Local DB driver
│   ├── models.js               # Database model structures
│   ├── server.js               # Server bootstrapper entry point
│   └── package.json
│
├── lifeflow-frontend/          # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Pomodoro.jsx    # Circular Pomodoro timer widget
│   │   ├── pages/
│   │   │   ├── Auth.jsx        # Login / Register cards
│   │   │   ├── Dashboard.jsx   # Metrics home welcome page
│   │   │   ├── Planner.jsx     # Kanban Board & List task tracker
│   │   │   ├── Goals.jsx       # Objectives milestones tree
│   │   │   ├── CalendarView.jsx# Date grid agenda view
│   │   │   ├── Notes.jsx       # Rich text notepad editor
│   │   │   ├── Analytics.jsx   # Weekly rates & GitHub-like habit grid
│   │   │   └── Settings.jsx    # User configuration, data export & import
│   │   ├── api.js              # Network request wrapper with LocalStorage local backup
│   │   ├── App.jsx             # Main routing framework and sidebar nav
│   │   ├── index.css           # Frosted glass css classes
│   │   └── main.jsx
│   ├── index.html              # Custom Fonts load template
│   ├── tailwind.config.js      # Glassmorphic style customization extensions
│   ├── vite.config.js          # Development server and proxy configurations
│   └── package.json
```

---

## How to Run LifeFlow

To run the application locally, you will start the backend API server and the frontend Vite web server.

### Step 1: Run the Backend API Server

1. Navigate to the backend directory:
   ```bash
   cd lifeflow-backend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   *The backend will boot up at `http://localhost:5000`. By default, it runs using the local JSON database file in `data/db.json` since no MongoDB URI is set. This means the app works immediately out-of-the-box!*

### Step 2: Run the Frontend React Server

1. Navigate to the frontend directory:
   ```bash
   cd ../lifeflow-frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser to access the app!

---

## Connect to a Live MongoDB Database

To connect standard MongoDB Cloud or Local services:
1. Open the backend configuration file `lifeflow-backend/.env`.
2. Add your cluster URI string to the variable:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/lifeflow
   ```
3. Restart the backend API server. It will print: `🚀 Connected to MongoDB successfully!`

---

## Core Features Tour

1. **Interactive Glass Dashboard**: Review today's task percentages, upcoming milestones, streak flame metrics, and view a randomized motivational quote.
2. **Daily Planner & Kanban**: Switch between standard list views or a draggable Kanban board. Double-click tasks to review checklist subtasks, and complete tasks to trigger confetti bursts.
3. **Objectives Goals**: Create long-term study or health goals, list specific milestones, and review progress gauges.
4. **Alarms Calendar**: View monthly grids, color-code exams (violet), birthdays (green), deadlines (red), and toggle recurring events.
5. **Rich Text Notebook**: Pin important study notes, search keywords, write rich text using custom formats (bold, headings, bullet lists), and export notes directly to text files.
6. **Habits Heatmap**: Track habits over 30 days in a visual contribution tracker grid (inspired by GitHub).
7. **Pomodoro focus**: Access the focus slide-out drawer to count down sessions using web audio synthesized chime alerts.
8. **Export & Restore**: Back up your full workspace to a local JSON file inside Settings, or upload data to cloud-sync when server connection recovers.
