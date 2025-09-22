# 🎥 ChatMan – AI-Powered Mathematical Animation Generator

**ChatMan** is an **AI-powered web application** that generates **beautiful mathematical animations** using [Manim](https://www.manim.community/).

Describe what you want to see, and ChatMan will:

✅ Understand your request (thanks to AI)  
✅ Generate **Python Manim code**  
✅ Render the animation **as a video**  
✅ Show you the result **in real time**

---

## 🚀 Demo

[▶ Watch the Demo Video](frontend/public/demo.mp4)

---

## ✨ Features

- 🤖 **Conversational AI Interface** – Describe animations in plain English
- 🧮 **Manim-Powered Rendering** – Generates real Python code and renders it
- 🔐 **Authentication** – Sign up or log in to use the app
- ⚡ **Real-Time Streaming** – See code and video output as they're generated
- 🌐 **Modern Tech Stack** – React + TypeScript + Tailwind on frontend, Node.js + Express on backend
- 🔄 **Multiple AI Models** – Supports Claude Sonnet 4, Deepseek R1

---

## 📂 Project Structure

```
ChatMan/
├── backend/         # Node.js/Express backend (TypeScript)
│   ├── src/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── helpers/
│   │   ├── routes/
│   │   └── types/
│   ├── manim_env/   # Python virtual environment for Manim
│   ├── package.json
│   └── tsconfig.json
└── frontend/        # React frontend (Vite + TypeScript)
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── index.css
    ├── public/
    ├── package.json
    └── tsconfig.json
```

---

## 🛠️ Getting Started

### ✅ Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) 3.10+ (for Manim)
- [Manim Community Edition](https://docs.manim.community/en/stable/installation.html)
- npm

---

### 1️⃣ Clone the Repository

```sh
git clone https://github.com/your-username/ChatMan.git
cd ChatMan
```

---

### 2️⃣ Backend Setup

```sh
cd backend
cp .env.example .env
# Fill in your API keys in .env (Anthropic, Deepseek, etc.)

# Install dependencies
npm install

# Create and activate Python virtual environment
python -m venv manim_env
source manim_env/bin/activate
pip install manim

# Build TypeScript
npm run build

# Start backend server
npm run dev
```

The backend will be available at **[http://localhost:8080](http://localhost:8080)**

---

### 3️⃣ Frontend Setup

```sh
cd frontend
cp .env.example .env
# (Edit .env if needed)

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

The frontend will run at **[http://localhost:5173](http://localhost:5173)**

---

## 🎯 Usage

1. Open **[http://localhost:5173](http://localhost:5173)** in your browser
2. **Sign up or log in** to start using ChatMan
3. Enter a prompt (e.g., `"Show three boxes labeled frontend, backend, and database, connected by arrows"`)
4. ChatMan will generate **code + video preview** in real-time

---

## 🧰 Technologies Used

| Layer              | Tech                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| **Frontend**       | React, TypeScript, Redux ToolKit, Vite, Tailwind CSS, Shadcn, Vercel AI SDK |
| **Backend**        | Node.js, Express, TypeScript, Manim (Python), Anthropic API, Deepseek API   |
| **Streaming**      | Server-Sent Events (SSE)                                                    |
| **Database**       | PostgresDB for saving user info and chats                                   |
| **Authentication** | Secure signup/login with JWT                                                |

---

## 🛠️ Development

- **Build All:** `npm run build` (frontend + backend)
- **Run Dev Mode:** `npm run dev` (frontend + backend in parallel)

---

## 🙌 Acknowledgements

- 🎥 [Manim Community](https://www.manim.community/)
- 🤖 [Anthropic](https://www.anthropic.com/) & [Deepseek](https://deepseek.com/)
- ⚡ [Vite](https://vitejs.dev/) & [Shadcn UI](https://ui.shadcn.com/)

---

## 🤝 Contributing

Pull requests are welcome!  
For major changes, open an **issue** first to discuss what you’d like to add.
