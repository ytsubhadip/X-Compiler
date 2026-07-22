# X -compiler
X -compiler is an online code IDE prototype that combines a frontend editor with a backend API to analyze code. It uses:



## Folder Structure
```
ML-compiler/
├─ frontend/
│  ├─ package.json
│  ├─ server.js
│  ├─ modules/
│  │  ├─ complexity.js
│  │  ├─ judje0_api.js
│  │  └─ User.js
│  ├─ routes/
│  │  ├─ compile.js
│  │  └─ auth/
│  ├─ public/
│  │  ├─ index.html
│  │  ├─ asset/
│  │  ├─ codemirror-5.65.21/
│  │  ├─ css/
│  │  ├─ js/
│  │  └─ pages/
│  └─ src/
└─ README.md
```

## Tech Stack
- Backend: Node, Express.js
- Frontend: HTML, CSS, JS, CodeMirror editor 

## Installation
1. Backend setup
   - Open a terminal in the project root
   - `cd backend`
   - `pip install -r requirements.txt`
2. Frontend setup
   - `cd ../frontend`
   - `npm install`

## Run locally
1. Start the backend
   - `cd backend`

   - `uvicorn app:app --reload --host 127.0.0.1 --port 8001`
2. Start the frontend
   - `cd frontend`
   - `node server.js`
3. Open the app in the browser
   - `http://localhost:8000`

## Implementation
- FastAPI backend serving API routes
- Node.js + Express frontend server
- Code editor UI built with CodeMirror
- Example question endpoint available at `/question`

## Upcoming Features
- AI code suggestions
- ML complexity analysis
- Bug detection guidance
- Multi-language execution support


