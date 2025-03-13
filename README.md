# SE ToolBox – Comprehensive README

SE ToolBox is a cross-platform desktop application designed for engineers to efficiently filter and process data using custom scripts and automation. It integrates a FastAPI backend (packaged via PyInstaller), a React + Vite frontend, and Electron to deliver a unified desktop experience for both Windows and macOS.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup (For Local Deployment)](#installation--setup-for-local-deployment)
   - [Python Backend Setup](#python-backend-setup)
   - [Frontend Setup](#frontend-setup)
   - [Electron Setup](#electron-setup)
4. [Development Workflow](#development-workflow)
5. [Building a Release (Making an Executable File)](#building-a-release-making-an-executable-file)
6. [Application Features](#application-features)
7. [Troubleshooting](#troubleshooting)
8. [License](#license)

---

## Overview

SE ToolBox is built to help engineers automate data filtering tasks by combining the power of:
- **FastAPI** for backend processing,
- **React + Vite** for a responsive frontend,
- **Electron** for packaging the whole stack into a standalone desktop app.

Using dual filter sets (A & B) and logic operations (difference, intersection, union, etc.), users can upload Excel files, process data, and export detailed reports.

---

## Prerequisites

Before you start, ensure you have the following installed:

- **Python 3.8+**  
  Download from [python.org](https://www.python.org/downloads/)

- **Node.js (v14+ recommended)**  
  Download from [nodejs.org](https://nodejs.org/)

- **Visual Studio Code (optional, but recommended for development)**  
  Download from [code.visualstudio.com](https://code.visualstudio.com/)

- **Git**  
  Download from [git-scm.com](https://git-scm.com/downloads/)

---

## Installation & Setup (For Local Deployment)

### Python Backend Setup

1. **Install Python Dependencies:**

   Open a terminal and run:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. **Test the FastAPI Server:**

   Run:
   ```bash
   python main.py
   ```
   You should see the FastAPI server running at [http://127.0.0.1:8000](http://127.0.0.1:8000).

### Frontend Setup

1. **Install Node.js Dependencies:**

   In another terminal, navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```
2. **Run the React App in Development Mode:**

   Launch the development server:
   ```bash
   npm run dev
   ```
   By default, the React app will be served at [http://localhost:5173](http://localhost:5173).

### Electron Setup

1. **Install Electron Dependencies:**

   In the project root (if not already done):
   ```bash
   cd ..
   npm install
   ```
   This will install Electron and electron-builder as defined in the root `package.json`.

---

## Development Workflow

For day-to-day development, follow these steps:

1. **Run the FastAPI Server** (Backend):
   ```bash
   cd backend
   python main.py
   ```

2. **Run the React Dev Server** (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Run the Electron App in Dev Mode:**
   ```bash
   cd ..
   npm run start
   ```
   This command launches Electron and loads the React app (either from the dev server or from the built assets).

---

## Building a Release (Making an Executable File)

After completing your coding session and making changes, follow these steps to update and package your release:

1. **Rebuild the Python Backend:**

   If your Python code has changed, regenerate the backend executable using PyInstaller:
   ```bash
   cd backend
   pyinstaller --onefile main.py
   ```
   This creates your executable in the `backend/dist` folder.

2. **Create Platform-Specific Folders in `backend/dist`:**

   Based on the package file configuration, Electron Builder expects the backend executable to reside in separate folders:
   
   - **For Windows:**
     - Create a folder `win` inside `backend/dist` if it doesn't exist:
       ```bash
       mkdir -p backend/dist/win
       ```
     - Move your Windows executable (`main.exe`) into this folder:
       ```bash
       mv backend/dist/main.exe backend/dist/win/
       ```
       
   - **For macOS:**
     - Create a folder `mac` inside `backend/dist` if it doesn't exist:
       ```bash
       mkdir -p backend/dist/mac
       ```
     - Move your macOS executable (`main`) into this folder:
       ```bash
       mv backend/dist/main backend/dist/mac/
       ```

3. **Rebuild the Frontend (React App):**

   Regenerate the optimized frontend assets:
   ```bash
   cd ../frontend
   npm run build
   ```
   This generates a `frontend/dist/` folder with production-ready React assets.

4. **Package the Electron App:**

   From the project root, run the packaging script for your target platform:
   - **For Windows:**
     ```bash
     npm run build-electron-win
     ```
   - **For macOS:**
     ```bash
     npm run build-electron-mac
     ```
   These commands bundle the backend executable (sourced from `backend/dist/win` or `backend/dist/mac`) along with the frontend assets into a final standalone application. The final packaged app is typically output in a subfolder within `release/` (for example, `release/win` or `release/mac`, depending on your configuration).

By following these steps, you ensure that your latest code is compiled, built, and packaged into a self-contained release for your target platform.

---

## Application Features

SE ToolBox is designed to streamline data processing tasks with features such as:

- **Dual Filter Sets:**  
  Users can define two sets of filters (Set A and Set B) to narrow down data from an uploaded Excel file. The app supports various logic types (difference, intersection, union, etc.) to combine these filters.

- **FastAPI Backend:**  
  Manages file uploads, data processing, and dynamic filtering, while offering endpoints for unique value retrieval and exporting filtered data.

- **React Frontend:**  
  Provides an intuitive UI built with Vite and Material UI. Users can upload files, select filters, preview results, and trigger exports directly from the interface.

- **Excel Export:**  
  Generates a comprehensive Excel report that includes:
  - A **Summary** sheet showing the applied filters and final results.
  - Sheets for **Set A**, **Set B Overlap**, a **Full Report** of all data, and an optional **Pivot Summary** for quick insights.

- **Electron Integration:**  
  Packages the backend and frontend together into a seamless, cross-platform desktop application.

---

## Troubleshooting

- **Server Issues:**  
  If the FastAPI server doesn’t start, verify that port 8000 is free or change the port in `main.py`.

- **Dependency Errors:**  
  Ensure all Python and Node dependencies are installed. Re-run `pip install -r requirements.txt` or `npm install` as needed.

- **Build Failures:**  
  Check the terminal output for errors during the PyInstaller, React build, or Electron packaging steps. Ensure that your environment variables and configurations are correct.

- **Session Errors:**  
  If you encounter issues with session IDs when uploading Excel files, double-check that the file contains the required sheet ("Powered by Cisco Ready") and that all necessary columns are present.

---