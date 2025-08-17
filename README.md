# ChatMan

ChatMan is an AI-powered web application that generates mathematical animations using [Manim](https://www.manim.community/). Users can interact with an AI assistant to describe the animation they want, and ChatMan will generate Python code and render the animation as a video.

## Features

- Conversational AI interface for describing animations
- Supports multiple AI models (Claude Sonnet 4, Deepseek R1)
- Generates Manim code and renders videos on the backend
- Streams responses and video previews in real-time
- Modern React + TypeScript frontend with Tailwind CSS

---

## Project Structure

```
.
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

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Python 3.10+ (for Manim)
- [Manim Community Edition](https://docs.manim.community/en/stable/installation.html)
- (Optional) [pnpm](https://pnpm.io/), [yarn](https://yarnpkg.com/), or npm

### 1. Clone the Repository

```sh
git clone https://github.com/your-username/ChatMan.git
cd ChatMan
```

### 2. Backend Setup

```sh
cd backend
cp .env.example .env
# Fill in your API keys in .env (Anthropic, Deepseek, etc.)

# Install dependencies
npm install

# (Optional) Set up Python virtual environment and install Manim
# python -m venv manim_env
# source manim_env/bin/activate
# pip install manim

# Build TypeScript
npm run build

# Start the backend server
npm run dev
```

The backend will run on [http://localhost:8080](http://localhost:8080).

### 3. Frontend Setup

```sh
cd frontend
cp .env.example .env
# (Edit .env if needed)

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

The frontend will run on [http://localhost:5173](http://localhost:5173).

---

## Usage

1. Open [http://localhost:5173](http://localhost:5173) in your browser.
2. Enter a prompt describing the animation you want (e.g., "Show three boxes labeled frontend, backend, and database, connected by arrows").
3. The AI will respond with explanations, code, and a rendered video preview.

---

## Technologies Used

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn, **ai-sdk** by Vercel
- **Backend:** Node.js, Express, TypeScript, Manim (Python), Anthropic/Deepseek APIs
- **Streaming:** Server-Sent Events (SSE) for real-time updates

---

## Development

- Build: `npm run build` (both frontend and backend)
- Development Server: `npm run dev` (both frontend and backend)

---

## License

MIT

---

## Acknowledgements

- [Manim Community](https://www.manim.community/)
- [Anthropic](https://www.anthropic.com/)
- [Deepseek](https://deepseek.com/)
- [Vite](https://vitejs.dev/)
- [Radix UI](https://www.radix-ui.com/)


---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
