# Electron + FastAPI + React (Vite) App

This is a **desktop application** built with:

- **React + Vite** for the frontend,  
- **FastAPI** (packaged via PyInstaller) for the backend,  
- **Electron** to bundle everything into a cross-platform desktop app.

## Table of Contents

- [Overview](#overview)  
- [Project Structure](#project-structure)  
- [Setup & Installation](#setup--installation)  
  - [Python Backend Setup](#python-backend-setup)  
  - [Frontend Setup](#frontend-setup)  
  - [Electron Setup](#electron-setup)  
- [Development](#development)  
  - [Starting the App in Dev Mode](#starting-the-app-in-dev-mode)  
- [Building Releases](#building-releases)  
  - [After a Coding Session](#after-a-coding-session)  
- [License](#license)

---

## Overview

- **Frontend**: A React application bootstrapped by [Vite](https://vitejs.dev/).  
- **Backend**: A [FastAPI](https://fastapi.tiangolo.com/) server packaged into a single executable (`main.exe`) using [PyInstaller](https://pyinstaller.org/).  
- **Desktop**: [Electron](https://www.electronjs.org/) ties everything together into a single `.exe` (or corresponding binary on macOS/Linux).

When the Electron app launches, it **spawns** the Python backend in the background, then displays the React UI. The UI makes HTTP requests to `localhost:8000` (or whichever port you configure) to communicate with the backend.

---

## Project Structure

A possible layout:


```
my-electron-fastapi-app/
├── backend/                     # Backend directory containing FastAPI server code
│   ├── core/                    # Core functionalities and routes for the backend
│   │   ├── __pycache__/         # Python cache files
│   │   ├── logger.py            # Logger setup (currently empty)
│   │   ├── routes.py            # Core routes for the backend
│   │   └── server.py            # Server setup (currently empty)
│   ├── projects/                # Project-specific logic and routes
│   │   ├── filters/             # Filtering logic and routes
│   │   │   ├── logic.py         # Logic for filtering data
│   │   │   ├── routes.py        # Routes for filtering operations
│   │   │   └── schemas.py       # Schemas for filtering requests
│   ├── build/                   # Build artifacts (ignored by .gitignore)
│   ├── dist/                    # PyInstaller output (ignored by .gitignore)
│   ├── main.py                  # Main entry point for the FastAPI server
│   ├── main.spec                # PyInstaller spec file for building the backend
│   ├── requirements.txt         # Python dependencies
├── electron/                    # Electron main process code
│   └── main.js                  # Main entry point for Electron
├── frontend/                    # Frontend directory containing React application
│   ├── public/                  # Public assets
│   ├── src/                     # Source code for the React application
│   │   ├── assets/              # Static assets like images and fonts
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # React components for different pages
│   │   ├── App.css              # Global CSS for the application
│   │   ├── App.jsx              # Main App component
│   │   ├── index.css            # Global CSS styles
│   │   └── main.jsx             # Entry point for the React application
│   ├── .gitignore               # Git ignore file for the frontend
│   ├── eslint.config.js         # ESLint configuration
│   ├── index.html               # HTML template for the React application
│   ├── package.json             # Node.js dependencies and scripts
│   ├── README.md                # README for the frontend
│   └── vite.config.js           # Vite configuration
├── .gitattributes               # Git attributes file
├── .gitignore                   # Git ignore file
├── package.json                 # Node.js dependencies and scripts for Electron
├── README.md                    # Project README file
└── release/                     # Release artifacts for Electron builds (ignored by .gitignore)
    ├── win/                     # Windows-specific release artifacts
    ├── builder-debug.yml        # Electron builder debug configuration
    ├── builder-effective-config.yaml # Effective configuration for Electron builder
    └── latest.yml               # Latest release metadata
```


---

## Setup & Installation

### Python Backend Setup

1. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Test FastAPI** (optional):
   ```bash
   python main.py
   ```
   - You should see FastAPI running at `http://127.0.0.1:8000`.

### Frontend Setup

1. **Install Node dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```
2. **Run the React app (dev mode)**:
   ```bash
   npm run dev
   ```
   - By default, it’s served at `http://localhost:5173`.

### Electron Setup

1. **Install electron & electron-builder** (in the project root, if not already):
   ```bash
   cd ..
   npm install
   ```

---

## Development

### Starting the App in Dev Mode

For local development, you typically:
1. **Run the FastAPI server** in one terminal:
   ```bash
   cd backend
   python main.py
   ```
2. **Run the React dev server** in another terminal:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Run Electron** in a third terminal:
   ```bash
   cd ..
   npm run start
   ```
   - This spawns Electron pointing to your `frontend/dist` or the dev URL, depending on your setup.  
   - Alternatively, you might tweak `electron/main.js` to load `http://localhost:5173` in dev mode.

> **Note**: For quick prototyping, you don’t *need* to run PyInstaller each time in dev mode. You can just run the Python server directly.

---

## Building Releases

### 1. PyInstaller (Backend)

```bash
cd backend
pyinstaller --onefile main.py
move dist into win/mac folder
```
- This creates `dist/main.exe`.  
- **Note**: If you prefer a custom `.spec` file, use that instead.

### 2. Frontend (Vite Build)

```bash
cd ../frontend
npm run build
```
- This creates `dist/` with optimized JS/CSS.

### 3. Electron (Final `.exe`)

```bash
cd ..
npm run build-electron
```
- This will:
  - Possibly bump the version (if using automatic version scripts).  
  - Package your Electron app, pulling in `frontend/dist` (React) and `backend/dist/main.exe` (FastAPI).  
  - Output to something like `release/2.0.1/` (depending on your config).

---

### After a Coding Session

To **rebuild** everything in a typical workflow:

1. **Update backend code**, if any  
   - Re-run PyInstaller if your Python code changed significantly:
     ```bash
     cd backend
     pyinstaller --onefile main.py
     move dist into win/mac folder
     ```
2. **Update frontend code**  
   - Re-build your React app:
     ```bash
     cd ../frontend
     npm run build
     ```
3. **Build Electron** (optional if you want a new `.exe`)  
   ```bash
   cd ..
   npm run build-electron-win
   npm run build-electron-mac
   ```
   - Creates the final release folder (e.g. `release/2.0.1/`).

Now you have an updated, self-contained desktop app with the latest code.

---
