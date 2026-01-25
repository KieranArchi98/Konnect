# Konnect

> **An internal, AI‑powered admin dashboard for managing personal knowledge, agentic workflows, and self‑improvement systems in one unified interface.**

Konnect is a private productivity and AI‑agent control center built for personal use and trusted collaborators. It acts as a single place to manage AI agents, interact with external systems, store and query personal knowledge, and track long‑term growth through data‑driven productivity and gamification.

This repository is intentionally designed as an **internal tool**, not a consumer SaaS product. The emphasis is on extensibility, clarity, and experimentation with modern AI and agentic patterns.

---

![Konnect Landing Page](assets/images/landingpage.PNG)

## ✨ Core Philosophy

Konnect was created to solve a simple problem:

> *“I want one place where I can manage my AI agents, personal knowledge, and self‑improvement systems without context‑switching.”*

The platform combines:
- **AI‑augmented knowledge retrieval (RAG)**
- **Agentic task execution**
- **Productivity tracking**
- **Gamified self‑improvement**

All wrapped in a clean internal admin dashboard.

---

## 🧠 Key Features

### 🔐 Authentication & User Access
- Secure signup and login flow
- JWT‑based authentication
- Designed for personal use and trusted users only

---

### 🏠 AI Knowledge Home (RAG‑Powered)

The home page acts as a **personal AI knowledge base**.

![AI Knowledge Home](assets/images/dashboard.PNG)

**Capabilities:**
- Upload daily notes, journals, and personal documents
- All content is embedded and indexed using **LangChain + Pinecone**
- Query *everything you’ve ever written* using natural language
- AI responses go beyond search:
  - Summaries
  - Insights
  - Reformatting (plans, checklists, reflections, etc.)

This allows Konnect to function as a **second brain**, not just a document store.

---

### 📈 Productivity System

Built‑in productivity tooling provides structured self‑tracking:
- ✅ To‑do lists
- 🔁 Habit tracking
- 🗓 Monthly calendar views
- 📊 Dynamic productivity metrics and trends

All data feeds into profile‑level statistics for long‑term visibility.

---

### 🤖 AI Agent Hub

The **Agent Page** allows users to interact with predefined AI agents powered by **LangChain**.

![AI Agent Hub](assets/images/agents.PNG)

Agents can connect to external APIs and perform real actions.

**Examples include:**
- **Email Agent** – Sends emails or drafts responses
- **Brainstorming Agent** – Generates ideas and project directions
- **Coach Agent** – Provides actionable guidance and behavioral coaching
- *(Designed to be easily extended with new agents)*

This page acts as an **agent orchestration layer**, not just a chat interface.

---

### 🧩 Quest System (Gamified Self‑Improvement)

The Quest Page introduces a **game‑style progression system**.

![Quest System](assets/images/quests.PNG)

**How it works:**
- Accept AI‑generated self‑improvement quests
- Quests span multiple domains:
  - Fitness
  - Health
  - Learning
  - Creating
  - Reading
- Difficulty dynamically adapts using AI
- Performance feeds into an **ELO‑style rating system**
- ELO contributes to an overall **player level**

The result is a system that *scales with you* and stays challenging over time.

---

### 📁 Uploads & File Interaction

The Uploads Page allows users to:
- Upload journals, diaries, and notes
- Automatically ingest content into the RAG pipeline
- View, manage, and interact with stored files

This acts as the primary ingestion layer for the knowledge system.

---

### 👤 Profile & Analytics

The Profile Page provides a **high‑resolution view of progress**:

![Profile & Analytics](assets/images/profile.PNG)
- Productivity statistics
- Quest history
- Habit consistency
- Knowledge growth indicators

Designed to give a tangible sense of momentum and achievement.

---

## 🧱 Architecture Overview

### Frontend
- **React** (Vite)
- **Tailwind CSS** for UI styling
- Component‑driven admin dashboard layout

### Backend
- **Python + FastAPI**
- JWT authentication
- RESTful API design
- Integration with:
  - LangChain
  - Pinecone
  - External APIs (via agents)

### Data & AI
- **PostgreSQL** – Core application data
- **Pinecone** – Vector storage for RAG
- **LangChain** – Agent orchestration & retrieval pipelines

---

## 🚀 Getting Started

### Prerequisites
- Node.js **v22.10.0+**
- Python **3.10+**
- PostgreSQL

---

### Environment Configuration

Create a `.env` file at the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your_secret_key
LLM_API_KEY=your_llm_api_key
NEWS_API_KEY=your_news_api_key
```

---

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

---

### Running the Application

**Recommended (PowerShell):**

```powershell
powershell -File start-app.ps1
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

**Manual:**

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

---

## 🧪 Project Status

Konnect is an **actively evolving internal platform**.

Expect:
- Rapid iteration
- Experimental features
- Refactors as agentic patterns mature

The codebase prioritizes **clarity, extensibility, and learning** over polish for mass distribution.

---

## 📌 Intended Audience

This repository is best viewed as:
- A **personal R&D platform**
- A showcase of **modern AI‑first application design**
- A demonstration of **agentic workflows, RAG, and productivity systems**

It is **not** intended as a drop‑in SaaS product.

---

## 📄 License

Internal / personal use only. Adapt freely for learning and experimentation.

---

## 🙌 Final Note

Konnect represents an ongoing attempt to merge:
- AI agents
- Personal knowledge
- Discipline
- Long‑term growth

into a single, coherent system.

If you’re exploring this codebase as an employer or collaborator, view it as a **living system**, not a finished product.

